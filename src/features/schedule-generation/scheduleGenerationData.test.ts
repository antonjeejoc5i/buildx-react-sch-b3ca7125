import { expect, test } from "vitest";
import {
  buildSchedulePattern,
  generateSlots,
  ScheduleGenerationError,
} from "./scheduleGenerationData.ts";

test("generates slots for separate weekday groups using duration and buffer rules", () => {
  const pattern = buildSchedulePattern(
    "pattern-weekdays",
    "study-1",
    "visit-1",
    "America/New_York",
    {
      startsOn: "2026-06-01",
      endsOn: "2026-06-03",
      weekdays: [1, 3],
      startsAt: "09:00",
      endsAt: "11:00",
      slotLengthMinutes: "45",
      bufferMinutes: "15",
    },
  );

  expect(generateSlots(pattern).map((slot) => slot.startsAtUtc)).toEqual([
    "2026-06-01T13:00:00.000Z",
    "2026-06-01T14:00:00.000Z",
    "2026-06-03T13:00:00.000Z",
    "2026-06-03T14:00:00.000Z",
  ]);
});

test("preserves facility-local operating time across daylight-saving changes", () => {
  const pattern = buildSchedulePattern(
    "pattern-dst",
    "study-1",
    "visit-1",
    "America/New_York",
    {
      startsOn: "2026-10-30",
      endsOn: "2026-11-02",
      weekdays: [1, 5],
      startsAt: "09:00",
      endsAt: "10:00",
      slotLengthMinutes: "60",
      bufferMinutes: "0",
    },
  );

  expect(generateSlots(pattern).map((slot) => slot.startsAtUtc)).toEqual([
    "2026-10-30T13:00:00.000Z",
    "2026-11-02T14:00:00.000Z",
  ]);
});

test("rejects invalid schedules before producing replacement data", () => {
  expect(() =>
    buildSchedulePattern(
      "pattern-invalid",
      "study-1",
      "visit-1",
      "America/New_York",
      {
        startsOn: "2026-06-10",
        endsOn: "2026-06-01",
        weekdays: [],
        startsAt: "12:00",
        endsAt: "09:00",
        slotLengthMinutes: "0",
        bufferMinutes: "-1",
      },
    ),
  ).toThrow(ScheduleGenerationError);
});
