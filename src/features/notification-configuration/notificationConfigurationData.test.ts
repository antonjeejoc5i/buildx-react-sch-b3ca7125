import { expect, test } from "vitest";
import { demoFixtures } from "../../fixtures/demoFixtures.ts";
import {
  NotificationConfigurationError,
  buildNotificationRecords,
  validateNotificationSettings,
} from "./notificationConfigurationData.ts";

test("skips reminders already due at booking time", () => {
  const records = buildNotificationRecords(
    demoFixtures.studies[0]!,
    demoFixtures.bookings[0]!,
    demoFixtures.bookingVisits,
    "rescheduled",
    "2026-06-14T14:00:00.000Z",
  );

  expect(records.reminders).toEqual([]);
  expect(records.notificationEvents).toHaveLength(1);
});

test("generates future reminders and affected-visit event previews", () => {
  const records = buildNotificationRecords(
    demoFixtures.studies[0]!,
    demoFixtures.bookings[0]!,
    demoFixtures.bookingVisits,
    "rescheduled",
    "2026-06-01T00:00:00.000Z",
  );

  expect(records.reminders).toHaveLength(1);
  expect(records.reminders[0]?.dueAtUtc).toBe("2026-06-14T13:00:00.000Z");
  expect(records.notificationEvents[0]).toMatchObject({
    eventType: "rescheduled",
  });
});

test("rejects invalid reminder timing settings", () => {
  expect(() =>
    validateNotificationSettings({
      reminderTimings: [
        {
          id: "invalid",
          hoursBefore: -1,
          channels: ["email"],
          template: "Reminder",
        },
      ],
      eventTemplates: { cancelled: "Cancelled" },
    }),
  ).toThrow(NotificationConfigurationError);
});
