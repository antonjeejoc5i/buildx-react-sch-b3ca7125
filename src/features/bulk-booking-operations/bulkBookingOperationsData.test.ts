import { expect, test } from "vitest";
import { demoFixtures } from "../../fixtures/demoFixtures.ts";
import {
  buildBulkBookingOperation,
  previewBulkBookingOperation,
} from "./bulkBookingOperationsData.ts";

const actor = demoFixtures.demoUsers[0]!;
const study = demoFixtures.studies[0]!;
const booking = demoFixtures.bookings[0]!;

test("previews reschedule conflicts and refuses execution until they are resolved and confirmed", () => {
  const input = {
    action: "reschedule" as const,
    actor,
    study,
    bookingIds: [booking.id],
    replacementSlotByVisit: {},
  };

  const preview = previewBulkBookingOperation(input, demoFixtures);
  expect(preview.affectedBookings).toHaveLength(1);
  expect(preview.conflicts[0]).toContain(
    "Select an available replacement slot",
  );
  expect(() =>
    buildBulkBookingOperation(
      { ...input, confirmed: true, now: "2026-06-03T12:00:00.000Z" },
      demoFixtures,
    ),
  ).toThrow("Resolve all bulk operation conflicts");

  expect(() =>
    buildBulkBookingOperation(
      {
        ...input,
        action: "notify",
        confirmed: false,
        now: "2026-06-03T12:00:00.000Z",
      },
      demoFixtures,
    ),
  ).toThrow("Confirm the bulk operation");
});

test("creates a bulk audit record and links every affected booking audit", () => {
  const result = buildBulkBookingOperation(
    {
      action: "notify",
      actor,
      study,
      bookingIds: [booking.id],
      replacementSlotByVisit: {},
      confirmed: true,
      now: "2026-06-03T12:00:00.000Z",
    },
    demoFixtures,
  );

  expect(result.notificationEvents).toHaveLength(1);
  expect(result.auditEvents[0]?.id).toBe(result.bulkAuditId);
  expect(result.auditEvents).toHaveLength(2);
  expect(
    result.auditEvents
      .slice(1)
      .every((event) => event.bulkActionId === result.bulkAuditId),
  ).toBe(true);
  expect(result.auditEvents[1]?.entityReferences.bookingId).toBe(booking.id);
});
