import type {
  Booking,
  BookingVisit,
  Slot,
  WaitlistEntry,
} from "../../domain/models.ts";

export interface SlotCapacityStatus {
  booked: number;
  remaining: number;
  isFull: boolean;
}

export interface SlotBookingEvaluation {
  allowed: boolean;
  reason?: "slot-not-found" | "backup-slot-unavailable" | "slot-full";
}

export interface BackupSlotValues {
  startsAtUtc: string;
  durationMinutes: string;
  capacity: string;
}

export class SlotManagementError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SlotManagementError";
  }
}

function isCapacityBooking(booking: Booking): boolean {
  return booking.status === "confirmed" || booking.status === "completed";
}

function isCapacityBookingVisit(bookingVisit: BookingVisit): boolean {
  return (
    bookingVisit.status === "scheduled" ||
    bookingVisit.status === "checked-in" ||
    bookingVisit.status === "completed"
  );
}

export function calculateSlotCapacity(
  slot: Slot,
  bookingVisits: BookingVisit[],
  bookings: Booking[],
): SlotCapacityStatus {
  const activeBookingIds = new Set(
    bookings.filter(isCapacityBooking).map((booking) => booking.id),
  );
  const booked = bookingVisits.filter(
    (bookingVisit) =>
      bookingVisit.slotId === slot.id &&
      activeBookingIds.has(bookingVisit.bookingId) &&
      isCapacityBookingVisit(bookingVisit),
  ).length;

  return {
    booked,
    remaining: Math.max(slot.capacity - booked, 0),
    isFull: booked >= slot.capacity,
  };
}

export function evaluateSlotBooking(
  slotId: string,
  slots: Slot[],
  bookingVisits: BookingVisit[],
  bookings: Booking[],
): SlotBookingEvaluation {
  const slot = slots.find((item) => item.id === slotId);
  if (slot === undefined) return { allowed: false, reason: "slot-not-found" };
  if (slot.status === "backup") {
    return { allowed: false, reason: "backup-slot-unavailable" };
  }
  if (calculateSlotCapacity(slot, bookingVisits, bookings).isFull) {
    return { allowed: false, reason: "slot-full" };
  }

  return { allowed: true };
}

export function buildBackupSlot(
  id: string,
  studyId: string,
  visitId: string,
  values: BackupSlotValues,
): Slot {
  const startsAt = new Date(values.startsAtUtc);
  const durationMinutes = Number(values.durationMinutes);
  const capacity = Number(values.capacity);

  if (Number.isNaN(startsAt.getTime())) {
    throw new SlotManagementError(
      "Backup slot start must be a valid date and time.",
    );
  }
  if (!Number.isInteger(durationMinutes) || durationMinutes < 1) {
    throw new SlotManagementError(
      "Backup slot duration must be a whole number above zero.",
    );
  }
  if (!Number.isInteger(capacity) || capacity < 1) {
    throw new SlotManagementError(
      "Backup slot capacity must be a whole number above zero.",
    );
  }

  return {
    id,
    studyId,
    visitId,
    startsAtUtc: startsAt.toISOString(),
    endsAtUtc: new Date(
      startsAt.getTime() + durationMinutes * 60 * 1000,
    ).toISOString(),
    capacity,
    status: "backup",
    eligibilityRules: {},
  };
}

export function promoteBackupSlot(slot: Slot): Slot {
  if (slot.status !== "backup") {
    throw new SlotManagementError("Only backup slots can be promoted.");
  }

  return { ...slot, status: "primary" };
}

export function getWaitlistCount(
  slotId: string,
  waitlistEntries: WaitlistEntry[],
): number {
  return waitlistEntries.filter(
    (entry) => entry.slotId === slotId && entry.status === "waiting",
  ).length;
}
