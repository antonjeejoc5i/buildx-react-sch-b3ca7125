import { expect, test } from "vitest";
import type { WaitlistEntry } from "../../domain/models.ts";
import { demoFixtures } from "../../fixtures/demoFixtures.ts";
import {
  evaluateWaitlistEnrollment,
  promoteWaitlistEntries,
} from "./waitlistData.ts";

test("permits eligible participants to wait only for enabled full primary slots", () => {
  const study = demoFixtures.studies[0]!;
  const slot = demoFixtures.slots[0]!;
  const participant = demoFixtures.participants.find(
    (item) => item.id === "participant-quinn-patel",
  );
  if (participant === undefined)
    throw new Error("Missing participant fixture.");

  expect(
    evaluateWaitlistEnrollment(demoFixtures, study, participant, slot),
  ).toEqual({
    allowed: true,
  });
  expect(
    evaluateWaitlistEnrollment(demoFixtures, study, participant, {
      ...slot,
      id: "backup-slot",
      status: "backup",
    }),
  ).toEqual({ allowed: false, reason: "backup-slot" });
});

test("promotes valid FIFO entries after capacity opens and notifies them locally", () => {
  const study = demoFixtures.studies[0]!;
  const slot = demoFixtures.slots[0]!;
  const invalidFirst: WaitlistEntry = {
    id: "waitlist-first",
    slotId: slot.id,
    participantId: "participant-morgan-reed",
    createdAt: "2026-06-03T09:00:00.000Z",
    status: "waiting",
  };
  const validSecond: WaitlistEntry = {
    id: "waitlist-second",
    slotId: slot.id,
    participantId: "participant-quinn-patel",
    createdAt: "2026-06-03T10:00:00.000Z",
    status: "waiting",
  };
  const result = promoteWaitlistEntries(
    {
      ...demoFixtures,
      bookings: [],
      bookingVisits: [],
      waitlistEntries: [invalidFirst, validSecond],
    },
    study,
    slot.id,
    "2026-06-04T12:00:00.000Z",
  );

  expect(result.promotedEntryIds).toEqual([validSecond.id]);
  expect(result.waitlistEntries).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ id: invalidFirst.id, status: "expired" }),
      expect.objectContaining({ id: validSecond.id, status: "promoted" }),
    ]),
  );
  expect(result.bookings).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        participantId: "participant-quinn-patel",
        source: "waitlist-promotion",
      }),
    ]),
  );
  expect(result.notificationEvents).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ eventType: "waitlist-promoted" }),
    ]),
  );
});
