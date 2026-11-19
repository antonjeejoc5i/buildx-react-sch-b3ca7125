import type {
  Booking,
  Participant,
  Quota,
  Study,
} from "../../domain/models.ts";

export interface QuotaStatus {
  filled: number;
  remaining: number;
  maximum: number;
}

export interface BookingQuotaEvaluation {
  applicableQuota: Quota | undefined;
  allowed: boolean;
  reason?: "quota-target-reached" | "overbooking-maximum-reached";
}

export class QuotaConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QuotaConfigurationError";
  }
}

function isCountedBooking(booking: Booking): boolean {
  return booking.status === "confirmed" || booking.status === "completed";
}

function participantAttribute(
  participant: Participant,
  dimension: string,
): unknown {
  if (dimension in participant.profile) {
    return participant.profile[dimension as keyof typeof participant.profile];
  }

  return participant.screenerAttributes[dimension];
}

export function quotaMatchesParticipant(
  quota: Quota,
  participant: Participant,
): boolean {
  return quota.dimensions.every(
    (dimension) =>
      dimension in quota.attributeConditions &&
      participantAttribute(participant, dimension) ===
        quota.attributeConditions[dimension],
  );
}

export function calculateMaximum(
  target: number,
  overbookingPercentage: number,
): number {
  return target + Math.ceil((target * overbookingPercentage) / 100);
}

export function calculateQuotaStatus(
  quota: Quota,
  participants: Participant[],
  bookings: Booking[],
): QuotaStatus {
  const participantsById = new Map(
    participants.map((participant) => [participant.id, participant]),
  );
  const filled = bookings.filter((booking) => {
    const participant = participantsById.get(booking.participantId);
    return (
      booking.studyId === quota.studyId &&
      isCountedBooking(booking) &&
      participant !== undefined &&
      quotaMatchesParticipant(quota, participant)
    );
  }).length;

  return {
    filled,
    remaining: Math.max(quota.target - filled, 0),
    maximum: quota.maximum,
  };
}

export function getDefaultOverbookingPercentage(study: Study): number {
  const configuredValue = study.bookingControls.defaultOverbookingPercentage;
  return typeof configuredValue === "number" ? configuredValue : 0;
}

export function setDefaultOverbookingPercentage(
  study: Study,
  value: string,
): Study {
  const overbookingPercentage = Number(value);

  if (
    !Number.isInteger(overbookingPercentage) ||
    overbookingPercentage < 0 ||
    overbookingPercentage > 100
  ) {
    throw new QuotaConfigurationError(
      "Default overbooking must be a whole percentage from 0 to 100.",
    );
  }

  return {
    ...study,
    bookingControls: {
      ...study.bookingControls,
      defaultOverbookingPercentage: overbookingPercentage,
    },
  };
}

export function buildQuota(
  quota: Quota,
  values: { target: string; overbookingPercentage: string },
): Quota {
  const target = Number(values.target);
  const overbookingPercentage = Number(values.overbookingPercentage);

  if (!Number.isInteger(target) || target < 1) {
    throw new QuotaConfigurationError(
      "Quota target must be a whole number above zero.",
    );
  }
  if (
    !Number.isInteger(overbookingPercentage) ||
    overbookingPercentage < 0 ||
    overbookingPercentage > 100
  ) {
    throw new QuotaConfigurationError(
      "Segment overbooking must be a whole percentage from 0 to 100.",
    );
  }

  return {
    ...quota,
    target,
    overbookingPercentage,
    maximum: calculateMaximum(target, overbookingPercentage),
  };
}

export function evaluateBookingQuota(
  participant: Participant,
  studyId: string,
  quotas: Quota[],
  participants: Participant[],
  bookings: Booking[],
): BookingQuotaEvaluation {
  const matchingQuotas = quotas
    .filter(
      (quota) =>
        quota.studyId === studyId &&
        quotaMatchesParticipant(quota, participant),
    )
    .sort(
      (first, second) => second.dimensions.length - first.dimensions.length,
    );
  const applicableQuota = matchingQuotas[0];

  for (const quota of matchingQuotas) {
    const status = calculateQuotaStatus(quota, participants, bookings);

    if (status.filled >= quota.target) {
      return {
        applicableQuota,
        allowed: false,
        reason: "quota-target-reached",
      };
    }

    if (status.filled >= status.maximum) {
      return {
        applicableQuota,
        allowed: false,
        reason: "overbooking-maximum-reached",
      };
    }
  }

  return { applicableQuota, allowed: true };
}
