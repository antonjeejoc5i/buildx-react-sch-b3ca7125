import type {
  Booking,
  BookingVisit,
  NotificationEvent,
  Participant,
  Slot,
  Study,
  WaitlistEntry,
} from "../../domain/models.ts";
import type { DemoFixtures } from "../../fixtures/demoFixtures.ts";
import { evaluateBookingSlot } from "../booking-flow/bookingFlowData.ts";
import { calculateSlotCapacity } from "../slot-management/slotManagementData.ts";

export type WaitlistEnrollmentReason =
  | "waitlist-disabled"
  | "backup-slot"
  | "slot-not-full"
  | "already-waiting"
  | "booking-rule";

export interface WaitlistEnrollmentEvaluation {
  allowed: boolean;
  reason?: WaitlistEnrollmentReason;
}

export interface WaitlistPromotionResult {
  bookings: Booking[];
  bookingVisits: BookingVisit[];
  notificationEvents: NotificationEvent[];
  waitlistEntries: WaitlistEntry[];
  promotedEntryIds: string[];
}

function enrollmentRuleFailure(
  data: DemoFixtures,
  study: Study,
  participant: Participant,
  slot: Slot,
): boolean {
  const slotWithTemporaryCapacity: Slot = {
    ...slot,
    capacity: slot.capacity + 1,
  };
  const dataWithTemporaryCapacity: DemoFixtures = {
    ...data,
    slots: data.slots.map((item) =>
      item.id === slot.id ? slotWithTemporaryCapacity : item,
    ),
  };

  return !evaluateBookingSlot(
    dataWithTemporaryCapacity,
    study,
    participant,
    slot.visitId,
    slotWithTemporaryCapacity,
    {},
  ).allowed;
}

export function evaluateWaitlistEnrollment(
  data: DemoFixtures,
  study: Study,
  participant: Participant,
  slot: Slot,
): WaitlistEnrollmentEvaluation {
  if (study.bookingControls.waitlistEnabled !== true) {
    return { allowed: false, reason: "waitlist-disabled" };
  }
  if (slot.status !== "primary") {
    return { allowed: false, reason: "backup-slot" };
  }
  if (!calculateSlotCapacity(slot, data.bookingVisits, data.bookings).isFull) {
    return { allowed: false, reason: "slot-not-full" };
  }
  if (
    data.waitlistEntries.some(
      (entry) =>
        entry.slotId === slot.id &&
        entry.participantId === participant.id &&
        entry.status === "waiting",
    )
  ) {
    return { allowed: false, reason: "already-waiting" };
  }
  if (enrollmentRuleFailure(data, study, participant, slot)) {
    return { allowed: false, reason: "booking-rule" };
  }

  return { allowed: true };
}

export function buildWaitlistEntry(
  id: string,
  slotId: string,
  participantId: string,
  createdAt: string,
): WaitlistEntry {
  return {
    id,
    slotId,
    participantId,
    createdAt,
    status: "waiting",
  };
}

export function promoteWaitlistEntries(
  data: DemoFixtures,
  study: Study,
  slotId: string,
  promotedAt: string,
): WaitlistPromotionResult {
  const slot = data.slots.find((item) => item.id === slotId);
  if (slot === undefined || slot.status !== "primary") {
    return {
      bookings: data.bookings,
      bookingVisits: data.bookingVisits,
      notificationEvents: data.notificationEvents,
      waitlistEntries: data.waitlistEntries,
      promotedEntryIds: [],
    };
  }

  let bookings = [...data.bookings];
  let bookingVisits = [...data.bookingVisits];
  let notificationEvents = [...data.notificationEvents];
  let waitlistEntries = [...data.waitlistEntries];
  const promotedEntryIds: string[] = [];
  const waitingEntries = waitlistEntries
    .filter((entry) => entry.slotId === slotId && entry.status === "waiting")
    .sort((first, second) => first.createdAt.localeCompare(second.createdAt));

  for (const entry of waitingEntries) {
    if (calculateSlotCapacity(slot, bookingVisits, bookings).isFull) break;

    const participant = data.participants.find(
      (item) => item.id === entry.participantId,
    );
    const currentData: DemoFixtures = {
      ...data,
      bookings,
      bookingVisits,
      notificationEvents,
      waitlistEntries,
    };
    const canPromote =
      participant !== undefined &&
      evaluateBookingSlot(
        currentData,
        study,
        participant,
        slot.visitId,
        slot,
        {},
      ).allowed;

    if (!canPromote) {
      waitlistEntries = waitlistEntries.map((item) =>
        item.id === entry.id
          ? {
              ...item,
              status: "expired",
              promotionOutcome:
                "Promotion unavailable after eligibility, quota, or restriction revalidation.",
            }
          : item,
      );
      continue;
    }

    const bookingId = `booking-promotion-${entry.id}`;
    const bookingVisitId = `booking-visit-promotion-${entry.id}`;
    const booking: Booking = {
      id: bookingId,
      studyId: study.id,
      participantId: entry.participantId,
      status: "confirmed",
      selectedVisitIds: [slot.visitId],
      selectedSlotIds: [slot.id],
      reminderPreference: participant.reminderDefault,
      selfServiceRescheduleCount: 0,
      source: "waitlist-promotion",
      createdAt: promotedAt,
      updatedAt: promotedAt,
    };

    bookings = [...bookings, booking];
    bookingVisits = [
      ...bookingVisits,
      {
        id: bookingVisitId,
        bookingId,
        visitId: slot.visitId,
        slotId: slot.id,
        startsAtUtc: slot.startsAtUtc,
        status: "scheduled",
        noShow: false,
        affectsStanding: false,
      },
    ];
    notificationEvents = [
      ...notificationEvents,
      {
        id: `notification-promotion-${entry.id}`,
        bookingId,
        eventType: "waitlist-promoted",
        channels: participant.reminderDefault,
        localizedPreview: `A waitlist place has opened for ${study.name}.`,
        deliveryStatus: "pending",
        createdAt: promotedAt,
      },
    ];
    waitlistEntries = waitlistEntries.map((item) =>
      item.id === entry.id
        ? {
            ...item,
            status: "promoted",
            promotionOutcome: "Promoted to a confirmed booking.",
          }
        : item,
    );
    promotedEntryIds.push(entry.id);
  }

  return {
    bookings,
    bookingVisits,
    notificationEvents,
    waitlistEntries,
    promotedEntryIds,
  };
}

export function waitlistEnrollmentMessage(
  reason: WaitlistEnrollmentReason,
): string {
  const messages: Record<WaitlistEnrollmentReason, string> = {
    "waitlist-disabled": "The waitlist is not enabled for this study.",
    "backup-slot": "Backup slots are not waitlist entries.",
    "slot-not-full": "This slot is available and does not need a waitlist.",
    "already-waiting": "You are already waiting for this slot.",
    "booking-rule":
      "Your eligibility, quota, or slot restrictions do not permit this waitlist entry.",
  };
  return messages[reason];
}
