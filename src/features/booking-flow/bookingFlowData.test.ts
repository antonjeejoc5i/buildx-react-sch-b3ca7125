import { expect, test } from "vitest";
import type { Slot, Study } from "../../domain/models.ts";
import { demoFixtures } from "../../fixtures/demoFixtures.ts";
import {
  availablePrimarySlots,
  evaluateBookingPlan,
} from "./bookingFlowData.ts";

test("shows only eligible primary slots with capacity", () => {
  const participant = demoFixtures.participants.find(
    (item) => item.id === "participant-quinn-patel",
  );
  const study = demoFixtures.studies[0];
  if (participant === undefined || study === undefined) {
    throw new Error("Missing fixture.");
  }

  expect(
    availablePrimarySlots(
      demoFixtures,
      study,
      participant,
      "visit-interview",
      {},
    ),
  ).toEqual([]);

  const availableSlot: Slot = {
    ...demoFixtures.slots[0]!,
    id: "available-slot",
    startsAtUtc: "2026-06-16T13:00:00.000Z",
    endsAtUtc: "2026-06-16T13:45:00.000Z",
    capacity: 2,
  };
  const backupSlot: Slot = {
    ...availableSlot,
    id: "backup-slot",
    status: "backup",
  };
  const data = { ...demoFixtures, slots: [availableSlot, backupSlot] };

  expect(
    availablePrimarySlots(data, study, participant, "visit-interview", {}).map(
      (slot) => slot.id,
    ),
  ).toEqual(["available-slot"]);
});

test("revalidates every selected visit against the required interval", () => {
  const participant = demoFixtures.participants.find(
    (item) => item.id === "participant-quinn-patel",
  );
  if (participant === undefined) throw new Error("Missing fixture.");

  const study: Study = {
    ...demoFixtures.studies[0]!,
    visits: [
      { id: "visit-one", name: "Visit one", durationMinutes: 30 },
      {
        id: "visit-two",
        name: "Visit two",
        durationMinutes: 30,
        intervalFromPrevious: { kind: "exact-day", day: 2 },
      },
    ],
  };
  const first: Slot = {
    ...demoFixtures.slots[0]!,
    id: "first",
    visitId: "visit-one",
    startsAtUtc: "2026-06-16T13:00:00.000Z",
    endsAtUtc: "2026-06-16T13:30:00.000Z",
    capacity: 2,
  };
  const second: Slot = {
    ...first,
    id: "second",
    visitId: "visit-two",
    startsAtUtc: "2026-06-17T13:00:00.000Z",
    endsAtUtc: "2026-06-17T13:30:00.000Z",
  };
  const data = {
    ...demoFixtures,
    studies: [study],
    slots: [first, second],
    bookings: [],
    bookingVisits: [],
  };

  expect(
    evaluateBookingPlan(data, study, participant, {
      "visit-one": first.id,
      "visit-two": second.id,
    }),
  ).toMatchObject({
    allowed: false,
    failures: [{ visitId: "visit-two", reason: "interval-rule" }],
  });
});
