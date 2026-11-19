import type {
  Booking,
  BookingVisit,
  Participant,
  Quota,
  Slot,
  Study,
} from "../../domain/models.ts";
import {
  calculateQuotaStatus,
  quotaMatchesParticipant,
} from "../quota-configuration/quotaConfigurationData.ts";

export const LOCAL_DATA_DISCLOSURE =
  "Calculated from local demonstration data.";

export interface MetricValue<T> {
  disclosure: string;
  value: T;
}

export interface FillRate {
  booked: number;
  capacity: number;
  percentage: number;
}

export interface NoShowRate {
  eligibleAppointments: number;
  noShows: number;
  percentage: number;
}

export type RecruitmentStatus =
  "not-recruiting" | "recruiting" | "quota-targets-met" | "no-quota-targets";

export interface TimeToFill {
  achievedAt?: string;
  durationMilliseconds?: number;
  state: "not-applicable" | "in-progress" | "filled";
}

export interface ReportingMetrics {
  fillRate: MetricValue<FillRate>;
  noShowRate: MetricValue<NoShowRate>;
  recruitmentStatus: MetricValue<RecruitmentStatus>;
  timeToFill: MetricValue<TimeToFill>;
}

function isActiveBooking(booking: Booking | undefined): booking is Booking {
  return booking?.status === "confirmed" || booking?.status === "completed";
}

function isCurrentAppointment(
  bookingVisit: BookingVisit,
  booking: Booking | undefined,
): boolean {
  return (
    isActiveBooking(booking) &&
    bookingVisit.status !== "cancelled" &&
    booking.selectedSlotIds.includes(bookingVisit.slotId)
  );
}

function toTimestamp(value: string): number | undefined {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? undefined : timestamp;
}

function toPercentage(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : (numerator / denominator) * 100;
}

export function calculateFillRate(
  study: Study,
  slots: Slot[],
  bookings: Booking[],
  bookingVisits: BookingVisit[],
): MetricValue<FillRate> {
  const bookingsById = new Map(
    bookings.map((booking) => [booking.id, booking]),
  );
  const primarySlots = slots.filter(
    (slot) => slot.studyId === study.id && slot.status === "primary",
  );
  const primarySlotIds = new Set(primarySlots.map((slot) => slot.id));
  const booked = bookingVisits.filter(
    (bookingVisit) =>
      primarySlotIds.has(bookingVisit.slotId) &&
      isCurrentAppointment(
        bookingVisit,
        bookingsById.get(bookingVisit.bookingId),
      ),
  ).length;
  const capacity = primarySlots.reduce(
    (total, slot) => total + slot.capacity,
    0,
  );

  return {
    disclosure: LOCAL_DATA_DISCLOSURE,
    value: { booked, capacity, percentage: toPercentage(booked, capacity) },
  };
}

export function calculateNoShowRate(
  study: Study,
  slots: Slot[],
  bookings: Booking[],
  bookingVisits: BookingVisit[],
  now: Date,
): MetricValue<NoShowRate> {
  const studySlotIds = new Set(
    slots.filter((slot) => slot.studyId === study.id).map((slot) => slot.id),
  );
  const bookingsById = new Map(
    bookings.map((booking) => [booking.id, booking]),
  );
  const eligibleAppointments = bookingVisits.filter((bookingVisit) => {
    const startsAt = toTimestamp(bookingVisit.startsAtUtc);
    return (
      studySlotIds.has(bookingVisit.slotId) &&
      startsAt !== undefined &&
      startsAt <= now.getTime() &&
      isCurrentAppointment(
        bookingVisit,
        bookingsById.get(bookingVisit.bookingId),
      )
    );
  });
  const noShows = eligibleAppointments.filter((visit) => visit.noShow).length;

  return {
    disclosure: LOCAL_DATA_DISCLOSURE,
    value: {
      eligibleAppointments: eligibleAppointments.length,
      noShows,
      percentage: toPercentage(noShows, eligibleAppointments.length),
    },
  };
}

export function calculateRecruitmentStatus(
  study: Study,
  quotas: Quota[],
  participants: Participant[],
  bookings: Booking[],
): MetricValue<RecruitmentStatus> {
  const studyQuotas = quotas.filter((quota) => quota.studyId === study.id);
  let value: RecruitmentStatus;

  if (study.lifecycleStatus !== "open") value = "not-recruiting";
  else if (studyQuotas.length === 0) value = "no-quota-targets";
  else if (
    studyQuotas.every(
      (quota) =>
        calculateQuotaStatus(quota, participants, bookings).filled >=
        quota.target,
    )
  ) {
    value = "quota-targets-met";
  } else value = "recruiting";

  return { disclosure: LOCAL_DATA_DISCLOSURE, value };
}

export function calculateTimeToFill(
  study: Study,
  quotas: Quota[],
  participants: Participant[],
  bookings: Booking[],
): MetricValue<TimeToFill> {
  const studyQuotas = quotas.filter((quota) => quota.studyId === study.id);
  const openedAt = toTimestamp(study.openedAt);
  if (studyQuotas.length === 0 || openedAt === undefined) {
    return {
      disclosure: LOCAL_DATA_DISCLOSURE,
      value: { state: "not-applicable" },
    };
  }

  const participantsById = new Map(
    participants.map((participant) => [participant.id, participant]),
  );
  const countedBookings = bookings
    .flatMap((booking) => {
      const participant = participantsById.get(booking.participantId);
      const createdAt = toTimestamp(booking.createdAt);
      if (
        booking.studyId !== study.id ||
        !isActiveBooking(booking) ||
        participant === undefined ||
        createdAt === undefined ||
        createdAt < openedAt
      ) {
        return [];
      }
      return [{ booking, participant, createdAt }];
    })
    .sort((left, right) => left.createdAt - right.createdAt);
  const fills = new Map(studyQuotas.map((quota) => [quota.id, 0]));

  for (const { booking, participant, createdAt } of countedBookings) {
    for (const quota of studyQuotas) {
      if (quotaMatchesParticipant(quota, participant)) {
        fills.set(quota.id, (fills.get(quota.id) ?? 0) + 1);
      }
    }
    if (
      studyQuotas.every((quota) => (fills.get(quota.id) ?? 0) >= quota.target)
    ) {
      return {
        disclosure: LOCAL_DATA_DISCLOSURE,
        value: {
          state: "filled",
          achievedAt: booking.createdAt,
          durationMilliseconds: createdAt - openedAt,
        },
      };
    }
  }

  return {
    disclosure: LOCAL_DATA_DISCLOSURE,
    value: { state: "in-progress" },
  };
}

export function buildReportingMetrics(
  study: Study,
  quotas: Quota[],
  slots: Slot[],
  bookings: Booking[],
  bookingVisits: BookingVisit[],
  participants: Participant[],
  now: Date,
): ReportingMetrics {
  return {
    fillRate: calculateFillRate(study, slots, bookings, bookingVisits),
    noShowRate: calculateNoShowRate(study, slots, bookings, bookingVisits, now),
    recruitmentStatus: calculateRecruitmentStatus(
      study,
      quotas,
      participants,
      bookings,
    ),
    timeToFill: calculateTimeToFill(study, quotas, participants, bookings),
  };
}
