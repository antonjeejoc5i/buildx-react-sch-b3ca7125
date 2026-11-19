import type {
  AuditEvent,
  Booking,
  BookingVisit,
  DemoUser,
  NotificationEvent,
  Study,
} from "../../domain/models.ts";
import type { DemoFixtures } from "../../fixtures/demoFixtures.ts";
import { buildCancelledParticipation } from "../appointment-management/appointmentManagementData.ts";
import { evaluateBookingPlan } from "../booking-flow/bookingFlowData.ts";

export type BulkBookingAction = "reschedule" | "cancel" | "notify";

export interface BulkBookingOperationInput {
  action: BulkBookingAction;
  actor: DemoUser;
  study: Study;
  bookingIds: string[];
  replacementSlotByVisit: Record<string, string>;
  confirmed: boolean;
  now: string;
}

export interface BulkBookingPreview {
  affectedBookings: Booking[];
  conflicts: string[];
}

export interface BulkBookingOperationResult {
  bookings: Booking[];
  bookingVisits: BookingVisit[];
  notificationEvents: NotificationEvent[];
  auditEvents: AuditEvent[];
  bulkAuditId: string;
}

function isAuthorised(actor: DemoUser, study: Study): boolean {
  return (
    actor.authorisedFacilityIds.includes(study.facilityId) &&
    actor.authorisedStudyIds.includes(study.id) &&
    (actor.role === "coordinator" || actor.role === "researcher")
  );
}

function uniqueBookingIds(bookingIds: string[]): string[] {
  return [...new Set(bookingIds)];
}

function activeStudyBookings(
  data: DemoFixtures,
  study: Study,
  bookingIds: string[],
): Booking[] {
  const selectedIds = new Set(uniqueBookingIds(bookingIds));
  return data.bookings.filter(
    (booking) =>
      booking.studyId === study.id &&
      booking.status === "confirmed" &&
      selectedIds.has(booking.id),
  );
}

function conflictsForReschedule(
  data: DemoFixtures,
  study: Study,
  bookings: Booking[],
  replacementSlotByVisit: Record<string, string>,
): string[] {
  const conflicts: string[] = [];
  const selectedBookingIds = new Set(bookings.map((booking) => booking.id));
  const dataWithoutAffectedBookings: DemoFixtures = {
    ...data,
    bookings: data.bookings.filter(
      (booking) => !selectedBookingIds.has(booking.id),
    ),
    bookingVisits: data.bookingVisits.filter(
      (visit) => !selectedBookingIds.has(visit.bookingId),
    ),
  };

  for (const visit of study.visits) {
    const slotId = replacementSlotByVisit[visit.id];
    const slot = data.slots.find(
      (item) =>
        item.id === slotId &&
        item.studyId === study.id &&
        item.visitId === visit.id &&
        item.status === "primary",
    );
    if (slotId === undefined || slot === undefined) {
      conflicts.push(`Select an available replacement slot for ${visit.name}.`);
      continue;
    }
    if (bookings.length > slot.capacity) {
      conflicts.push(
        `${visit.name} has ${bookings.length} affected bookings but the selected slot has capacity for ${slot.capacity}.`,
      );
    }
  }

  for (const booking of bookings) {
    const participant = data.participants.find(
      (item) => item.id === booking.participantId,
    );
    if (participant === undefined) {
      conflicts.push(`${booking.id} has no participant record.`);
      continue;
    }
    const evaluation = evaluateBookingPlan(
      dataWithoutAffectedBookings,
      study,
      participant,
      replacementSlotByVisit,
    );
    for (const failure of evaluation.failures) {
      conflicts.push(`${booking.id}: ${failure.reason}`);
    }
  }

  return [...new Set(conflicts)];
}

export function previewBulkBookingOperation(
  input: Omit<BulkBookingOperationInput, "confirmed" | "now">,
  data: DemoFixtures,
): BulkBookingPreview {
  const affectedBookings = activeStudyBookings(
    data,
    input.study,
    input.bookingIds,
  );
  const requestedBookingIds = uniqueBookingIds(input.bookingIds);
  const conflicts: string[] = [];

  if (!isAuthorised(input.actor, input.study)) {
    conflicts.push("The selected actor is outside the simulated study scope.");
  }
  if (requestedBookingIds.length === 0) {
    conflicts.push("Select at least one confirmed booking.");
  }
  if (affectedBookings.length !== requestedBookingIds.length) {
    conflicts.push(
      "One or more selected bookings are no longer active in this study.",
    );
  }
  if (input.action === "reschedule") {
    conflicts.push(
      ...conflictsForReschedule(
        data,
        input.study,
        affectedBookings,
        input.replacementSlotByVisit,
      ),
    );
  }

  return { affectedBookings, conflicts: [...new Set(conflicts)] };
}

function rescheduledBooking(
  booking: Booking,
  study: Study,
  replacementSlotByVisit: Record<string, string>,
  now: string,
): Booking {
  return {
    ...booking,
    selectedVisitIds: study.visits.map((visit) => visit.id),
    selectedSlotIds: study.visits.map((visit) => {
      const slotId = replacementSlotByVisit[visit.id];
      if (slotId === undefined) {
        throw new Error(`A replacement slot is required for ${visit.name}.`);
      }
      return slotId;
    }),
    updatedAt: now,
  };
}

function rescheduledVisits(
  booking: Booking,
  visits: BookingVisit[],
  replacementSlotByVisit: Record<string, string>,
  data: DemoFixtures,
): BookingVisit[] {
  return visits.map((visit) => {
    const slotId = replacementSlotByVisit[visit.visitId];
    const slot = data.slots.find((item) => item.id === slotId);
    if (slot === undefined)
      throw new Error("A replacement slot is unavailable.");
    return {
      ...visit,
      bookingId: booking.id,
      slotId: slot.id,
      startsAtUtc: slot.startsAtUtc,
    };
  });
}

function bulkAuditEvents(
  input: BulkBookingOperationInput,
  affectedBookings: Booking[],
  resultingBookings: Booking[],
  bulkAuditId: string,
): AuditEvent[] {
  const bulkAudit: AuditEvent = {
    id: bulkAuditId,
    actorRole: input.actor.role,
    action: `bulk.booking.${input.action}`,
    entityReferences: { studyId: input.study.id },
    afterValues: { affectedBookingCount: affectedBookings.length },
    createdAt: input.now,
  };
  const bookingAudits = resultingBookings.map((booking, index) => {
    const before = affectedBookings[index];
    if (before === undefined)
      throw new Error("Missing original booking audit data.");
    return {
      id: `${bulkAuditId}-booking-${booking.id}`,
      actorRole: input.actor.role,
      action: `booking.${input.action === "notify" ? "notified" : `${input.action}d`}`,
      entityReferences: {
        bookingId: booking.id,
        participantId: booking.participantId,
        studyId: input.study.id,
      },
      beforeValues: {
        status: before.status,
        selectedSlotIds: before.selectedSlotIds,
      },
      afterValues: {
        status: booking.status,
        selectedSlotIds: booking.selectedSlotIds,
      },
      bulkActionId: bulkAuditId,
      createdAt: input.now,
    };
  });
  return [bulkAudit, ...bookingAudits];
}

export function buildBulkBookingOperation(
  input: BulkBookingOperationInput,
  data: DemoFixtures,
): BulkBookingOperationResult {
  const preview = previewBulkBookingOperation(input, data);
  if (preview.conflicts.length > 0) {
    throw new Error("Resolve all bulk operation conflicts before continuing.");
  }
  if (!input.confirmed) {
    throw new Error("Confirm the bulk operation before continuing.");
  }

  const affectedBookings = preview.affectedBookings;
  const affectedBookingIds = new Set(
    affectedBookings.map((booking) => booking.id),
  );
  const affectedVisits = data.bookingVisits.filter((visit) =>
    affectedBookingIds.has(visit.bookingId),
  );
  const bookings =
    input.action === "reschedule"
      ? affectedBookings.map((booking) =>
          rescheduledBooking(
            booking,
            input.study,
            input.replacementSlotByVisit,
            input.now,
          ),
        )
      : input.action === "cancel"
        ? affectedBookings.map(
            (booking) =>
              buildCancelledParticipation(
                booking,
                affectedVisits.filter(
                  (visit) => visit.bookingId === booking.id,
                ),
                input.now,
              ).booking,
          )
        : affectedBookings;
  const bookingVisits =
    input.action === "reschedule"
      ? bookings.flatMap((booking) =>
          rescheduledVisits(
            booking,
            affectedVisits.filter((visit) => visit.bookingId === booking.id),
            input.replacementSlotByVisit,
            data,
          ),
        )
      : input.action === "cancel"
        ? affectedBookings.flatMap(
            (booking) =>
              buildCancelledParticipation(
                booking,
                affectedVisits.filter(
                  (visit) => visit.bookingId === booking.id,
                ),
                input.now,
              ).bookingVisits,
          )
        : [];
  const bulkAuditId = `audit-bulk-${input.action}-${Date.parse(input.now)}`;
  const notificationEvents =
    input.action === "notify"
      ? affectedBookings.map((booking) => ({
          id: `notification-bulk-${Date.parse(input.now)}-${booking.id}`,
          bookingId: booking.id,
          eventType: "bulk-researcher-notification",
          channels: [...booking.reminderPreference],
          localizedPreview:
            "A study team update is available for your appointment.",
          deliveryStatus: "pending" as const,
          createdAt: input.now,
        }))
      : [];

  return {
    bookings,
    bookingVisits,
    notificationEvents,
    auditEvents: bulkAuditEvents(
      input,
      affectedBookings,
      bookings,
      bulkAuditId,
    ),
    bulkAuditId,
  };
}
