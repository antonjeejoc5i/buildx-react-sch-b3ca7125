import type {
  AuditEvent,
  Booking,
  BookingVisit,
  DemoUser,
  Participant,
  Study,
} from "../../domain/models.ts";
import type { DemoFixtures } from "../../fixtures/demoFixtures.ts";
import { evaluateBookingPlan } from "../booking-flow/bookingFlowData.ts";
import {
  buildCancelledParticipation,
  buildRescheduledParticipation,
  evaluateAppointmentManagement,
  revalidateReschedule,
} from "../appointment-management/appointmentManagementData.ts";

export type ResearcherBookingAction =
  "booking.created" | "booking.rescheduled" | "booking.cancelled";

export interface ResearcherOperationInput {
  action: ResearcherBookingAction;
  actor: DemoUser;
  study: Study;
  participant: Participant;
  booking?: Booking;
  selectedSlotByVisit: Record<string, string>;
  overrideAcknowledged: boolean;
  overrideReason: string;
  now: string;
}

export interface ResearcherOperationEvaluation {
  authorised: boolean;
  normalRulesAllowed: boolean;
  failures: string[];
}

export interface ResearcherOperationResult {
  booking: Booking;
  bookingVisits: BookingVisit[];
  auditEvent: AuditEvent;
}

function isAuthorisedResearcher(actor: DemoUser, study: Study): boolean {
  return (
    actor.role === "researcher" &&
    actor.authorisedFacilityIds.includes(study.facilityId) &&
    actor.authorisedStudyIds.includes(study.id)
  );
}

function existingBookingVisits(
  data: DemoFixtures,
  booking: Booking | undefined,
): BookingVisit[] {
  return data.bookingVisits.filter((visit) => visit.bookingId === booking?.id);
}

function normalRuleFailures(
  input: ResearcherOperationInput,
  data: DemoFixtures,
): string[] {
  if (input.action === "booking.created") {
    return evaluateBookingPlan(
      data,
      input.study,
      input.participant,
      input.selectedSlotByVisit,
    ).failures.map((failure) => failure.reason);
  }

  if (input.booking === undefined) return ["booking-not-found"];

  const bookingVisits = existingBookingVisits(data, input.booking);
  if (input.action === "booking.cancelled") {
    const evaluation = evaluateAppointmentManagement(
      "cancel",
      input.study,
      input.booking,
      bookingVisits,
      new Date(input.now),
    );
    return evaluation.allowed
      ? []
      : [evaluation.message ?? "cancellation-not-permitted"];
  }

  const management = evaluateAppointmentManagement(
    "reschedule",
    input.study,
    input.booking,
    bookingVisits,
    new Date(input.now),
  );
  if (!management.allowed) {
    return [management.message ?? "rescheduling-not-permitted"];
  }

  return revalidateReschedule(
    data,
    input.study,
    input.participant,
    input.booking,
    input.selectedSlotByVisit,
  ).failures.map((failure) => failure.reason);
}

export function evaluateResearcherOperation(
  input: ResearcherOperationInput,
  data: DemoFixtures,
): ResearcherOperationEvaluation {
  const failures = normalRuleFailures(input, data);
  return {
    authorised: isAuthorisedResearcher(input.actor, input.study),
    normalRulesAllowed: failures.length === 0,
    failures,
  };
}

function requireOperationPermission(
  input: ResearcherOperationInput,
  evaluation: ResearcherOperationEvaluation,
): void {
  if (!evaluation.authorised) {
    throw new Error(
      "This researcher is outside the simulated study or facility scope.",
    );
  }
  if (evaluation.normalRulesAllowed) return;
  if (!input.overrideAcknowledged) {
    throw new Error(
      "Acknowledge the restriction warning before applying an override.",
    );
  }
  if (input.overrideReason.trim() === "") {
    throw new Error("Provide a reason for the restriction override.");
  }
}

function buildCreatedParticipation(
  input: ResearcherOperationInput,
  data: DemoFixtures,
): { booking: Booking; bookingVisits: BookingVisit[] } {
  const bookingId = `booking-researcher-${Date.parse(input.now)}`;
  const selectedSlotIds = input.study.visits.map((visit) => {
    const slotId = input.selectedSlotByVisit[visit.id];
    if (slotId === undefined) {
      throw new Error(`Select a slot for ${visit.name}.`);
    }
    return slotId;
  });

  const bookingVisits = input.study.visits.map((visit, index) => {
    const slotId = selectedSlotIds[index];
    const slot = data.slots.find((item) => item.id === slotId);
    if (slot === undefined) throw new Error("A selected slot is unavailable.");
    return {
      id: `booking-visit-researcher-${Date.parse(input.now)}-${visit.id}`,
      bookingId,
      visitId: visit.id,
      slotId: slot.id,
      startsAtUtc: slot.startsAtUtc,
      status: "scheduled" as const,
      noShow: false,
      affectsStanding: false,
    };
  });

  return {
    booking: {
      id: bookingId,
      studyId: input.study.id,
      participantId: input.participant.id,
      status: "confirmed",
      selectedVisitIds: input.study.visits.map((visit) => visit.id),
      selectedSlotIds,
      reminderPreference: input.participant.reminderDefault,
      selfServiceRescheduleCount: 0,
      source: "researcher-assisted",
      createdAt: input.now,
      updatedAt: input.now,
    },
    bookingVisits,
  };
}

function auditEventFor(
  input: ResearcherOperationInput,
  evaluation: ResearcherOperationEvaluation,
  booking: Booking,
): AuditEvent {
  return {
    id: `audit-researcher-${Date.parse(input.now)}`,
    actorRole: input.actor.role,
    action: input.action,
    entityReferences: {
      bookingId: booking.id,
      participantId: input.participant.id,
      studyId: input.study.id,
    },
    beforeValues:
      input.booking === undefined
        ? undefined
        : {
            status: input.booking.status,
            selectedSlotIds: input.booking.selectedSlotIds,
          },
    afterValues: {
      status: booking.status,
      selectedSlotIds: booking.selectedSlotIds,
    },
    overrideReason: evaluation.normalRulesAllowed
      ? undefined
      : input.overrideReason.trim(),
    createdAt: input.now,
  };
}

export function buildResearcherOperation(
  input: ResearcherOperationInput,
  data: DemoFixtures,
): ResearcherOperationResult {
  const evaluation = evaluateResearcherOperation(input, data);
  requireOperationPermission(input, evaluation);

  const participation =
    input.action === "booking.created"
      ? buildCreatedParticipation(input, data)
      : input.action === "booking.cancelled" && input.booking !== undefined
        ? buildCancelledParticipation(
            input.booking,
            existingBookingVisits(data, input.booking),
            input.now,
          )
        : input.booking !== undefined
          ? buildRescheduledParticipation(
              input.booking,
              existingBookingVisits(data, input.booking),
              input.study,
              data,
              input.selectedSlotByVisit,
              input.now,
            )
          : (() => {
              throw new Error("Choose an existing booking before changing it.");
            })();

  return {
    ...participation,
    auditEvent: auditEventFor(input, evaluation, participation.booking),
  };
}
