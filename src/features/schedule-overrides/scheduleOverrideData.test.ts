import { expect, test } from "vitest";
import { demoFixtures } from "../../fixtures/demoFixtures.ts";
import {
  buildOverridePreview,
  getCalendarState,
  ScheduleOverrideError,
} from "./scheduleOverrideData.ts";

const pattern = demoFixtures.schedulePatterns[0]!;
const facility = demoFixtures.facilities[0]!;

test("identifies normal, override, and blackout calendar dates", () => {
  expect(
    getCalendarState("2026-06-15", facility, demoFixtures.scheduleOverrides),
  ).toBe("normal");
  expect(
    getCalendarState("2026-06-19", facility, demoFixtures.scheduleOverrides),
  ).toBe("override");
  expect(
    getCalendarState("2026-07-04", facility, demoFixtures.scheduleOverrides),
  ).toBe("blackout");
});

test("blackout dates generate no availability", () => {
  const preview = buildOverridePreview(
    "override-blackout",
    pattern,
    facility,
    {
      date: "2026-07-04",
      availability: "unavailable",
      startsAt: "09:00",
      endsAt: "12:00",
      slotLengthMinutes: "45",
      bufferMinutes: "15",
      addedSlots: "",
      removedSlotIds: [],
    },
    demoFixtures.slots,
    demoFixtures.bookingVisits,
  );
  expect(preview.override.availability).toBe("unavailable");
  expect(preview.override.addedSlots).toEqual([]);
});

test("shows bookings affected by removed slots and rejects opening blackouts", () => {
  const preview = buildOverridePreview(
    "override-closed",
    pattern,
    facility,
    {
      date: "2026-06-15",
      availability: "unavailable",
      startsAt: "09:00",
      endsAt: "12:00",
      slotLengthMinutes: "45",
      bufferMinutes: "15",
      addedSlots: "",
      removedSlotIds: [],
    },
    demoFixtures.slots,
    demoFixtures.bookingVisits,
  );
  expect(preview.affectedBookingVisits.map((visit) => visit.id)).toEqual([
    "booking-visit-avery-001",
  ]);
  expect(() =>
    buildOverridePreview(
      "override-invalid",
      pattern,
      facility,
      {
        date: "2026-07-04",
        availability: "available",
        startsAt: "09:00",
        endsAt: "12:00",
        slotLengthMinutes: "45",
        bufferMinutes: "15",
        addedSlots: "",
        removedSlotIds: [],
      },
      demoFixtures.slots,
      demoFixtures.bookingVisits,
    ),
  ).toThrow(ScheduleOverrideError);
});
