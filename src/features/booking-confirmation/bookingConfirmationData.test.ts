import { expect, test } from "vitest";
import type { Slot, Study } from "../../domain/models.ts";
import { demoFixtures } from "../../fixtures/demoFixtures.ts";
import {
  ConfirmationTemplateError,
  buildBookingConfirmation,
  resolveReminderChannels,
  validateConfirmationTemplate,
} from "./bookingConfirmationData.ts";

test("uses the profile reminder default or selected delivery channels", () => {
  expect(resolveReminderChannels("profile-default", ["email", "sms"])).toEqual([
    "email",
    "sms",
  ]);
  expect(resolveReminderChannels("email", ["sms"])).toEqual(["email"]);
  expect(resolveReminderChannels("sms", ["email"])).toEqual(["sms"]);
  expect(resolveReminderChannels("both", ["email"])).toEqual(["email", "sms"]);
});

test("builds a localized all-visit confirmation with location and links", () => {
  const participant = {
    ...demoFixtures.participants[0]!,
    language: "French",
    timeZone: "America/Chicago",
  };
  const study: Study = {
    ...demoFixtures.studies[0]!,
    visits: [
      { id: "visit-one", name: "Interview", durationMinutes: 30 },
      { id: "visit-two", name: "Follow-up", durationMinutes: 30 },
    ],
    notificationSettings: {
      confirmationTemplate:
        "{{participantName}}: {{visits}}. {{location}}. {{managementLinks}}",
      enableRescheduleLink: true,
      enableCancelLink: false,
    },
  };
  const first: Slot = {
    ...demoFixtures.slots[0]!,
    id: "first-confirmation-slot",
    visitId: "visit-one",
    startsAtUtc: "2026-06-16T13:00:00.000Z",
  };
  const second: Slot = {
    ...first,
    id: "second-confirmation-slot",
    visitId: "visit-two",
    startsAtUtc: "2026-06-18T13:00:00.000Z",
  };

  const confirmation = buildBookingConfirmation(
    study,
    participant,
    demoFixtures.facilities[0],
    demoFixtures.rooms[0],
    [first, second],
    { "visit-one": first.id, "visit-two": second.id },
    "both",
  );

  expect(confirmation.visits).toHaveLength(2);
  expect(confirmation.visits[0]?.appointment).toMatch(/juin/i);
  expect(confirmation.location).toBe(
    "Harbor Research Center, Interview Room 101",
  );
  expect(confirmation.renderedTemplate).toContain("Reschedule booking");
  expect(confirmation.enableCancelLink).toBe(false);
  expect(confirmation.reminderChannels).toEqual(["email", "sms"]);
});

test("rejects invalid confirmation template content", () => {
  expect(() => validateConfirmationTemplate(" ")).toThrow(
    ConfirmationTemplateError,
  );
  expect(() => validateConfirmationTemplate("Confirmed.")).toThrow(
    "must include a dynamic field",
  );
  expect(() => validateConfirmationTemplate("Hello {{invalid}}")).toThrow(
    "supported dynamic fields",
  );
});
