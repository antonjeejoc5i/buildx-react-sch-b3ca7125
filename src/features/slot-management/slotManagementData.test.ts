import { expect, test } from "vitest";
import { demoFixtures } from "../../fixtures/demoFixtures.ts";
import {
  buildBackupSlot,
  calculateSlotCapacity,
  evaluateSlotBooking,
  getWaitlistCount,
  promoteBackupSlot,
} from "./slotManagementData.ts";

const slot = demoFixtures.slots[0]!;

test("rejects a booking for a full primary slot independently of quota or room capacity", () => {
  expect(
    calculateSlotCapacity(
      slot,
      demoFixtures.bookingVisits,
      demoFixtures.bookings,
    ),
  ).toEqual({ booked: 1, remaining: 0, isFull: true });

  expect(
    evaluateSlotBooking(
      slot.id,
      [slot],
      demoFixtures.bookingVisits,
      demoFixtures.bookings,
    ),
  ).toEqual({ allowed: false, reason: "slot-full" });
});

test("keeps backup slots unavailable until promotion and separate from waitlist records", () => {
  const backupSlot = buildBackupSlot(
    "slot-backup",
    slot.studyId,
    slot.visitId,
    {
      startsAtUtc: "2026-06-15T15:00:00.000Z",
      durationMinutes: "30",
      capacity: "2",
    },
  );

  expect(backupSlot.endsAtUtc).toBe("2026-06-15T15:30:00.000Z");
  expect(evaluateSlotBooking(backupSlot.id, [backupSlot], [], [])).toEqual({
    allowed: false,
    reason: "backup-slot-unavailable",
  });
  expect(getWaitlistCount(slot.id, demoFixtures.waitlistEntries)).toBe(1);
  expect(promoteBackupSlot(backupSlot).status).toBe("primary");
  expect(
    evaluateSlotBooking(backupSlot.id, [promoteBackupSlot(backupSlot)], [], []),
  ).toEqual({ allowed: true });
});
