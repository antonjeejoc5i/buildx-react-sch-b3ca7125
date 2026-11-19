import type {
  Booking,
  BookingVisit,
  Participant,
  Quota,
  Slot,
  Study,
} from "../../domain/models.ts";
import { calculateQuotaStatus } from "../quota-configuration/quotaConfigurationData.ts";
import { calculateSlotCapacity } from "../slot-management/slotManagementData.ts";

export interface RecruitmentDashboardData {
  scheduledParticipants: number;
  scheduledSlots: number;
  cancellations: number;
  noShows: number;
  quotas: Array<{
    id: string;
    label: string;
    filled: number;
    target: number;
    maximum: number;
  }>;
  slots: Array<{
    id: string;
    startsAtUtc: string;
    status: Slot["status"];
    segment: string;
    booked: number;
    capacity: number;
  }>;
  participants: Array<{
    id: string;
    name: string;
    status: "scheduled" | "cancelled" | "no-show";
    startsAtUtc: string;
  }>;
  segmentFill: Array<{
    segment: string;
    booked: number;
    capacity: number;
  }>;
}

function quotaLabel(quota: Quota): string {
  return quota.dimensions
    .map(
      (dimension) =>
        `${dimension}: ${String(quota.attributeConditions[dimension])}`,
    )
    .join(" · ");
}

function isActiveBooking(booking: Booking | undefined): boolean {
  return booking?.status === "confirmed" || booking?.status === "completed";
}

export function buildRecruitmentDashboardData(
  study: Study,
  quotas: Quota[],
  slots: Slot[],
  bookings: Booking[],
  bookingVisits: BookingVisit[],
  participants: Participant[],
): RecruitmentDashboardData {
  const studyBookings = bookings.filter(
    (booking) => booking.studyId === study.id,
  );
  const bookingsById = new Map(
    studyBookings.map((booking) => [booking.id, booking]),
  );
  const participantsById = new Map(
    participants.map((participant) => [participant.id, participant]),
  );
  const studyVisits = bookingVisits.filter((visit) =>
    bookingsById.has(visit.bookingId),
  );
  const scheduledVisits = studyVisits.filter(
    (visit) =>
      (visit.status === "scheduled" || visit.status === "checked-in") &&
      isActiveBooking(bookingsById.get(visit.bookingId)),
  );
  const scheduledParticipantIds = new Set(
    scheduledVisits.flatMap((visit) => {
      const participantId = bookingsById.get(visit.bookingId)?.participantId;
      return participantId === undefined ? [] : [participantId];
    }),
  );
  const cancelledVisits = studyVisits.filter(
    (visit) =>
      visit.status === "cancelled" ||
      bookingsById.get(visit.bookingId)?.status === "cancelled",
  );
  const noShowVisits = studyVisits.filter((visit) => visit.noShow);
  const studySlots = slots.filter((slot) => slot.studyId === study.id);
  const slotData = studySlots.map((slot) => {
    const capacity = calculateSlotCapacity(slot, bookingVisits, bookings);
    return {
      id: slot.id,
      startsAtUtc: slot.startsAtUtc,
      status: slot.status,
      segment: slot.segmentAssignment ?? "Unassigned",
      booked: capacity.booked,
      capacity: slot.capacity,
    };
  });
  const segmentFill = Array.from(
    slotData
      .reduce((segments, slot) => {
        const fill = segments.get(slot.segment) ?? {
          segment: slot.segment,
          booked: 0,
          capacity: 0,
        };
        fill.booked += slot.booked;
        fill.capacity += slot.capacity;
        segments.set(slot.segment, fill);
        return segments;
      }, new Map<string, { segment: string; booked: number; capacity: number }>())
      .values(),
  );
  const participantRecords = [
    ...scheduledVisits.map((visit) => ({
      visit,
      status: "scheduled" as const,
    })),
    ...cancelledVisits.map((visit) => ({
      visit,
      status: "cancelled" as const,
    })),
    ...noShowVisits.map((visit) => ({ visit, status: "no-show" as const })),
  ].flatMap(({ visit, status }) => {
    const participantId = bookingsById.get(visit.bookingId)?.participantId;
    const participant =
      participantId === undefined
        ? undefined
        : participantsById.get(participantId);
    return participant === undefined
      ? []
      : [
          {
            id: `${visit.id}-${status}`,
            name: participant.name,
            status,
            startsAtUtc: visit.startsAtUtc,
          },
        ];
  });

  return {
    scheduledParticipants: scheduledParticipantIds.size,
    scheduledSlots: scheduledVisits.length,
    cancellations: cancelledVisits.length,
    noShows: noShowVisits.length,
    quotas: quotas
      .filter((quota) => quota.studyId === study.id)
      .map((quota) => {
        const status = calculateQuotaStatus(quota, participants, bookings);
        return {
          id: quota.id,
          label: quotaLabel(quota),
          filled: status.filled,
          target: quota.target,
          maximum: status.maximum,
        };
      }),
    slots: slotData,
    participants: participantRecords,
    segmentFill,
  };
}
