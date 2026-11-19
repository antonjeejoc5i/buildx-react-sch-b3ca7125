import type {
  Booking,
  BookingVisit,
  Participant,
  Study,
} from "../../domain/models.ts";
import type { DemoFixtures } from "../../fixtures/demoFixtures.ts";
import {
  availablePrimarySlots,
  evaluateBookingPlan,
  type BookingPlanEvaluation,
} from "../booking-flow/bookingFlowData.ts";

export type AppointmentManagementAction = "reschedule" | "cancel";

export interface AppointmentManagementEvaluation {
  allowed: boolean;
  message?: string;
}

function getBooleanControl(
  study: Study,
  name: string,
  fallback: boolean,
): boolean {
  const value = study.bookingControls[name];
  return typeof value === "boolean" ? value : fallback;
}

function getNumberControl(
  study: Study,
  name: string,
  fallback: number,
): number {
  const value = study.bookingControls[name];
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : fallback;
}

function getCutoffHours(
  study: Study,
  action: AppointmentManagementAction,
): number {
  return getNumberControl(
    study,
    action === "reschedule"
      ? "rescheduleCutoffHours"
      : "cancellationCutoffHours",
    0,
  );
}

function isInsideCutoff(
  bookingVisits: BookingVisit[],
  cutoffHours: number,
  now: Date,
): boolean {
  const cutoffTime = now.getTime() + cutoffHours * 60 * 60 * 1000;
  return bookingVisits.some(
    (bookingVisit) =>
      new Date(bookingVisit.startsAtUtc).getTime() <= cutoffTime,
  );
}

export function evaluateAppointmentManagement(
  action: AppointmentManagementAction,
  study: Study,
  booking: Booking,
  bookingVisits: BookingVisit[],
  now = new Date(),
): AppointmentManagementEvaluation {
  if (booking.status !== "confirmed") {
    return { allowed: false, message: "This appointment is no longer active." };
  }

  if (study.lifecycleStatus !== "open") {
    return {
      allowed: false,
      message:
        "This study is not available for self-service appointment changes.",
    };
  }

  const enabled = getBooleanControl(
    study,
    action === "reschedule"
      ? "allowSelfServiceReschedule"
      : "allowSelfServiceCancellation",
    action === "cancel",
  );
  if (!enabled) {
    return {
      allowed: false,
      message:
        action === "reschedule"
          ? "Self-service rescheduling is not enabled for this study."
          : "Self-service cancellation is not enabled for this study.",
    };
  }

  if (
    action === "reschedule" &&
    booking.selfServiceRescheduleCount >=
      getNumberControl(study, "maxReschedules", 2)
  ) {
    return {
      allowed: false,
      message:
        "You have reached the self-service reschedule limit for this study.",
    };
  }

  const cutoff = getCutoffHours(study, action);
  if (isInsideCutoff(bookingVisits, cutoff, now)) {
    return {
      allowed: false,
      message: `This change must be made more than ${cutoff} hours before your appointment.`,
    };
  }

  return { allowed: true };
}

function withoutCurrentParticipation(
  data: DemoFixtures,
  bookingId: string,
): DemoFixtures {
  return {
    ...data,
    bookings: data.bookings.filter((booking) => booking.id !== bookingId),
    bookingVisits: data.bookingVisits.filter(
      (bookingVisit) => bookingVisit.bookingId !== bookingId,
    ),
  };
}

function selectedSlotsFromBooking(
  study: Study,
  booking: Booking,
): Record<string, string> {
  return Object.fromEntries(
    study.visits.flatMap((visit, index) => {
      const slotId = booking.selectedSlotIds[index];
      return slotId === undefined ? [] : [[visit.id, slotId]];
    }),
  );
}

export function suggestDependentSlots(
  data: DemoFixtures,
  study: Study,
  participant: Participant,
  booking: Booking,
  changedVisitId: string,
  changedSlotId: string,
): Record<string, string> {
  const validationData = withoutCurrentParticipation(data, booking.id);
  const selectedSlotByVisit = {
    ...selectedSlotsFromBooking(study, booking),
    [changedVisitId]: changedSlotId,
  };
  const changedVisitIndex = study.visits.findIndex(
    (visit) => visit.id === changedVisitId,
  );

  for (
    let index = changedVisitIndex + 1;
    index < study.visits.length;
    index += 1
  ) {
    const dependentVisit = study.visits[index];
    if (dependentVisit === undefined) continue;

    const currentPlan = evaluateBookingPlan(
      validationData,
      study,
      participant,
      selectedSlotByVisit,
    );
    const dependentVisitIsValid = !currentPlan.failures.some(
      (failure) => failure.visitId === dependentVisit.id,
    );
    if (dependentVisitIsValid) continue;

    const replacement = availablePrimarySlots(
      validationData,
      study,
      participant,
      dependentVisit.id,
      selectedSlotByVisit,
    )[0];
    if (replacement !== undefined) {
      selectedSlotByVisit[dependentVisit.id] = replacement.id;
    }
  }

  return selectedSlotByVisit;
}

export function revalidateReschedule(
  data: DemoFixtures,
  study: Study,
  participant: Participant,
  booking: Booking,
  selectedSlotByVisit: Record<string, string>,
): BookingPlanEvaluation {
  return evaluateBookingPlan(
    withoutCurrentParticipation(data, booking.id),
    study,
    participant,
    selectedSlotByVisit,
  );
}

export function buildRescheduledParticipation(
  booking: Booking,
  bookingVisits: BookingVisit[],
  study: Study,
  data: DemoFixtures,
  selectedSlotByVisit: Record<string, string>,
  updatedAt: string,
): { booking: Booking; bookingVisits: BookingVisit[] } {
  const selectedSlotIds = study.visits.map((visit) => {
    const slotId = selectedSlotByVisit[visit.id];
    if (slotId === undefined) {
      throw new Error(`A replacement slot is required for ${visit.name}.`);
    }
    return slotId;
  });

  return {
    booking: {
      ...booking,
      selectedVisitIds: study.visits.map((visit) => visit.id),
      selectedSlotIds,
      selfServiceRescheduleCount: booking.selfServiceRescheduleCount + 1,
      updatedAt,
    },
    bookingVisits: bookingVisits.map((bookingVisit) => {
      const slotId = selectedSlotByVisit[bookingVisit.visitId];
      const slot = data.slots.find((item) => item.id === slotId);
      if (slot === undefined) {
        throw new Error("A selected replacement slot is unavailable.");
      }
      return {
        ...bookingVisit,
        slotId: slot.id,
        startsAtUtc: slot.startsAtUtc,
      };
    }),
  };
}

export function buildCancelledParticipation(
  booking: Booking,
  bookingVisits: BookingVisit[],
  updatedAt: string,
): { booking: Booking; bookingVisits: BookingVisit[] } {
  return {
    booking: { ...booking, status: "cancelled", updatedAt },
    bookingVisits: bookingVisits.map((bookingVisit) => ({
      ...bookingVisit,
      status: "cancelled",
    })),
  };
}
