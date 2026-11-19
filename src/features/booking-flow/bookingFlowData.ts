import type {
  Booking,
  BookingVisit,
  Participant,
  Slot,
  Study,
} from "../../domain/models.ts";
import type { DemoFixtures } from "../../fixtures/demoFixtures.ts";
import { evaluateBookingQuota } from "../quota-configuration/quotaConfigurationData.ts";
import { evaluateSlotBooking } from "../slot-management/slotManagementData.ts";

export type BookingRuleFailure =
  | "study-not-open"
  | "participant-not-eligible"
  | "profile-incomplete"
  | "backup-slot"
  | "slot-full"
  | "quota-reached"
  | "eligibility-rule"
  | "interval-rule"
  | "slot-not-found";

export interface BookingPlanEvaluation {
  allowed: boolean;
  failures: Array<{ visitId: string; reason: BookingRuleFailure }>;
}

function hasCompleteProfile(participant: Participant): boolean {
  return Object.values(participant.profile).every(
    (value) => value.trim() !== "",
  );
}

function matchesSlotRules(slot: Slot, participant: Participant): boolean {
  const requiredLanguage = slot.eligibilityRules.language;
  if (
    typeof requiredLanguage === "string" &&
    participant.language !== requiredLanguage
  ) {
    return false;
  }

  const minimumAge = slot.eligibilityRules.minimumAge;
  if (typeof minimumAge === "number") {
    const ageRangeStart = Number(
      participant.profile.ageRange.match(/\d+/)?.[0],
    );
    if (!Number.isFinite(ageRangeStart) || ageRangeStart < minimumAge)
      return false;
  }

  return true;
}

function dayNumber(timestamp: string): number {
  const date = new Date(timestamp);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function meetsVisitInterval(
  previousSlot: Slot | undefined,
  slot: Slot,
  interval: Study["visits"][number]["intervalFromPrevious"],
): boolean {
  if (previousSlot === undefined || interval === undefined) return true;

  const daysBetween =
    (dayNumber(slot.startsAtUtc) - dayNumber(previousSlot.startsAtUtc)) /
    86400000;

  if (interval.kind === "same-day") return daysBetween === 0;
  if (interval.kind === "exact-day") return daysBetween === interval.day;
  return (
    daysBetween >= interval.minimumDay && daysBetween <= interval.maximumDay
  );
}

export function evaluateBookingSlot(
  data: DemoFixtures,
  study: Study,
  participant: Participant,
  visitId: string,
  slot: Slot,
  selectedSlotByVisit: Record<string, string>,
): { allowed: boolean; reason?: BookingRuleFailure } {
  if (study.lifecycleStatus !== "open") {
    return { allowed: false, reason: "study-not-open" };
  }
  if (participant.qualificationState !== "eligible") {
    return { allowed: false, reason: "participant-not-eligible" };
  }
  if (!hasCompleteProfile(participant)) {
    return { allowed: false, reason: "profile-incomplete" };
  }
  if (slot.studyId !== study.id || slot.visitId !== visitId) {
    return { allowed: false, reason: "slot-not-found" };
  }
  if (slot.status !== "primary") {
    return { allowed: false, reason: "backup-slot" };
  }
  if (!matchesSlotRules(slot, participant)) {
    return { allowed: false, reason: "eligibility-rule" };
  }

  const capacity = evaluateSlotBooking(
    slot.id,
    data.slots,
    data.bookingVisits,
    data.bookings,
  );
  if (!capacity.allowed) {
    return {
      allowed: false,
      reason: capacity.reason === "slot-full" ? "slot-full" : "slot-not-found",
    };
  }

  const quota = evaluateBookingQuota(
    participant,
    study.id,
    data.quotas,
    data.participants,
    data.bookings,
  );
  if (!quota.allowed) return { allowed: false, reason: "quota-reached" };

  const visitIndex = study.visits.findIndex((visit) => visit.id === visitId);
  const visit = study.visits[visitIndex];
  const previousVisit = study.visits[visitIndex - 1];
  const previousSlot = data.slots.find(
    (item) => item.id === selectedSlotByVisit[previousVisit?.id ?? ""],
  );

  if (!meetsVisitInterval(previousSlot, slot, visit?.intervalFromPrevious)) {
    return { allowed: false, reason: "interval-rule" };
  }

  return { allowed: true };
}

export function availablePrimarySlots(
  data: DemoFixtures,
  study: Study,
  participant: Participant,
  visitId: string,
  selectedSlotByVisit: Record<string, string>,
): Slot[] {
  return data.slots.filter(
    (slot) =>
      evaluateBookingSlot(
        data,
        study,
        participant,
        visitId,
        slot,
        selectedSlotByVisit,
      ).allowed,
  );
}

export function evaluateBookingPlan(
  data: DemoFixtures,
  study: Study,
  participant: Participant,
  selectedSlotByVisit: Record<string, string>,
): BookingPlanEvaluation {
  const failures: BookingPlanEvaluation["failures"] = [];

  for (const visit of study.visits) {
    const slot = data.slots.find(
      (item) => item.id === selectedSlotByVisit[visit.id],
    );
    if (slot === undefined) {
      failures.push({ visitId: visit.id, reason: "slot-not-found" });
      continue;
    }

    const evaluation = evaluateBookingSlot(
      data,
      study,
      participant,
      visit.id,
      slot,
      selectedSlotByVisit,
    );
    if (!evaluation.allowed && evaluation.reason !== undefined) {
      failures.push({ visitId: visit.id, reason: evaluation.reason });
    }
  }

  return { allowed: failures.length === 0, failures };
}

export function bookingRuleMessage(reason: BookingRuleFailure): string {
  const messages: Record<BookingRuleFailure, string> = {
    "study-not-open": "This study is no longer accepting bookings.",
    "participant-not-eligible":
      "Your eligibility no longer permits this booking.",
    "profile-incomplete": "Your profile needs complete details before booking.",
    "backup-slot": "Backup slots are not available for participant booking.",
    "slot-full": "This slot has just reached capacity.",
    "quota-reached":
      "The applicable quota or overbooking maximum has been reached.",
    "eligibility-rule":
      "This slot no longer matches your eligibility requirements.",
    "interval-rule": "This slot no longer meets the required visit interval.",
    "slot-not-found": "This selected slot is no longer available.",
  };
  return messages[reason];
}

/**
 * The confirmed booking and its visits for a revalidated plan, ready to save. `id` and `now` are
 * passed in so the result is deterministic in tests.
 */
export function buildConfirmedBooking(
  data: DemoFixtures,
  study: Study,
  participant: Participant,
  selectedSlotByVisit: Record<string, string>,
  id: string,
  now: string,
): { booking: Booking; bookingVisits: BookingVisit[] } {
  const slots = study.visits.map((visit) => {
    const slot = data.slots.find(
      (item) => item.id === selectedSlotByVisit[visit.id],
    );
    if (slot === undefined)
      throw new Error(`No slot is selected for ${visit.name}.`);
    return { visit, slot };
  });
  return {
    booking: {
      id,
      studyId: study.id,
      participantId: participant.id,
      status: "confirmed",
      selectedVisitIds: slots.map(({ visit }) => visit.id),
      selectedSlotIds: slots.map(({ slot }) => slot.id),
      reminderPreference: [...participant.reminderDefault],
      selfServiceRescheduleCount: 0,
      source: "participant-handoff",
      createdAt: now,
      updatedAt: now,
    },
    bookingVisits: slots.map(({ visit, slot }) => ({
      id: `${id}-${visit.id}`,
      bookingId: id,
      visitId: visit.id,
      slotId: slot.id,
      startsAtUtc: slot.startsAtUtc,
      status: "scheduled",
      noShow: false,
      affectsStanding: false,
    })),
  };
}
