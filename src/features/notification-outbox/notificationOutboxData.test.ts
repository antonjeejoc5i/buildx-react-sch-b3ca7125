import { expect, test } from "vitest";
import { demoFixtures } from "../../fixtures/demoFixtures.ts";
import {
  buildOutboxPreviews,
  storeSimulatedFailure,
} from "./notificationOutboxData.ts";

test("builds previews from booked channels without delivery actions", () => {
  const previews = buildOutboxPreviews(
    demoFixtures.studies,
    demoFixtures.bookings,
    demoFixtures.bookingVisits,
    demoFixtures.participants,
    demoFixtures.reminders,
    demoFixtures.notificationEvents,
  );

  expect(previews).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: "event:notification-avery-001",
        participantName: "Avery Chen",
        channels: ["email"],
      }),
      expect.objectContaining({
        id: "reminder:reminder-avery-001",
        channels: ["email"],
      }),
    ]),
  );
});

test("stores a failure flag without changing booked channels", () => {
  const study = storeSimulatedFailure(
    demoFixtures.studies[0]!,
    "event:notification-avery-001",
  );
  const preview = buildOutboxPreviews(
    [study],
    demoFixtures.bookings,
    demoFixtures.bookingVisits,
    demoFixtures.participants,
    demoFixtures.reminders,
    demoFixtures.notificationEvents,
  ).find((item) => item.id === "event:notification-avery-001");

  expect(preview).toMatchObject({
    deliveryStatus: "failed",
    channels: ["email"],
  });
});
