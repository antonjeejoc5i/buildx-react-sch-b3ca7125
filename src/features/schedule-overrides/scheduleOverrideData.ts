import type {
  BookingVisit,
  Facility,
  ScheduleOverride,
  SchedulePattern,
  Slot,
} from "../../domain/models.ts";

export interface OverrideValues {
  date: string;
  availability: "available" | "unavailable";
  startsAt: string;
  endsAt: string;
  slotLengthMinutes: string;
  bufferMinutes: string;
  addedSlots: string;
  removedSlotIds: string[];
}

export interface OverridePreview {
  override: ScheduleOverride;
  affectedBookingVisits: BookingVisit[];
}

export class ScheduleOverrideError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ScheduleOverrideError";
  }
}

function validDate(date: string): void {
  const parsed = new Date(`${date}T12:00:00.000Z`);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== date
  ) {
    throw new ScheduleOverrideError("Select a valid override date.");
  }
}

function validTime(value: string, label: string): void {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    throw new ScheduleOverrideError(`${label} must be a valid 24-hour time.`);
  }
}

function minutes(value: string, label: string, minimum: number): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < minimum) {
    throw new ScheduleOverrideError(
      `${label} must be a whole number of ${minimum} or greater.`,
    );
  }
  return parsed;
}

function parseAddedSlots(value: string): string[] {
  const slots = value
    .split(",")
    .map((slot) => slot.trim())
    .filter((slot) => slot !== "");
  slots.forEach((slot) => validTime(slot, "Added slot"));
  return [...new Set(slots)].sort();
}

export function getCalendarState(
  date: string,
  facility: Facility,
  overrides: ScheduleOverride[],
): "normal" | "override" | "blackout" {
  if (facility.blackoutDates.includes(date)) return "blackout";
  return overrides.some((override) => override.date === date)
    ? "override"
    : "normal";
}

export function buildOverridePreview(
  id: string,
  pattern: SchedulePattern,
  facility: Facility,
  values: OverrideValues,
  slots: Slot[],
  bookingVisits: BookingVisit[],
): OverridePreview {
  validDate(values.date);
  const isBlackout = facility.blackoutDates.includes(values.date);
  if (isBlackout && values.availability === "available") {
    throw new ScheduleOverrideError(
      "A facility blackout date cannot be made available.",
    );
  }

  const dateSlotIds = slots
    .filter(
      (slot) =>
        slot.studyId === pattern.studyId &&
        slot.visitId === pattern.visitId &&
        slot.startsAtUtc.slice(0, 10) === values.date,
    )
    .map((slot) => slot.id);
  const removedSlotIds = [
    ...new Set(
      values.availability === "unavailable"
        ? [...values.removedSlotIds, ...dateSlotIds]
        : values.removedSlotIds,
    ),
  ];

  const override: ScheduleOverride = {
    id,
    schedulePatternId: pattern.id,
    date: values.date,
    availability: isBlackout ? "unavailable" : values.availability,
    addedSlots: [],
    removedSlotIds,
  };

  if (override.availability === "available") {
    validTime(values.startsAt, "Operating window start");
    validTime(values.endsAt, "Operating window end");
    if (values.endsAt <= values.startsAt) {
      throw new ScheduleOverrideError(
        "Operating window end must be after its start.",
      );
    }
    override.operatingWindow = {
      startsAt: values.startsAt,
      endsAt: values.endsAt,
    };
    override.slotLengthMinutes = minutes(
      values.slotLengthMinutes,
      "Slot length",
      1,
    );
    override.bufferMinutes = minutes(values.bufferMinutes, "Buffer", 0);
    override.addedSlots = parseAddedSlots(values.addedSlots);
  }

  return {
    override,
    affectedBookingVisits: bookingVisits.filter((visit) =>
      removedSlotIds.includes(visit.slotId),
    ),
  };
}
