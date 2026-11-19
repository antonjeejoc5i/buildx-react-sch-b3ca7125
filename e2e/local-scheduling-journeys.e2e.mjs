import { readFile } from "node:fs/promises";
import { test, expect } from "@playwright/test";

const studyId = "study-local-journey";
const facilityId = "facility-local-journey";
const roomId = "room-local-journey";
const quinnId = "participant-quinn";

function data({ filled = false, qualification = "eligible" } = {}) {
  const slots = [
    {
      id: "slot-one",
      studyId,
      visitId: "visit-one",
      startsAtUtc: "2027-06-16T13:00:00.000Z",
      endsAtUtc: "2027-06-16T13:30:00.000Z",
      capacity: 1,
      status: "primary",
      eligibilityRules: { language: "English" },
    },
    {
      id: "slot-two",
      studyId,
      visitId: "visit-two",
      startsAtUtc: "2027-06-18T13:00:00.000Z",
      endsAtUtc: "2027-06-18T13:30:00.000Z",
      capacity: 1,
      status: "primary",
      eligibilityRules: { language: "English" },
    },
  ];
  const booking = {
    id: "booking-avery",
    studyId,
    participantId: "participant-avery",
    status: "confirmed",
    selectedVisitIds: ["visit-one", "visit-two"],
    selectedSlotIds: ["slot-one", "slot-two"],
    reminderPreference: ["email"],
    selfServiceRescheduleCount: 0,
    source: "participant-portal",
    createdAt: "2027-01-01T09:00:00.000Z",
    updatedAt: "2027-01-01T09:00:00.000Z",
  };
  return {
    studies: [
      {
        id: studyId,
        name: "Local scheduling journey",
        description: "Browser-only scenario.",
        decipherProjectId: "DCP-LOCAL-JOURNEY",
        lifecycleStatus: "open",
        facilityId,
        roomId,
        visits: [
          { id: "visit-one", name: "First visit", durationMinutes: 30 },
          {
            id: "visit-two",
            name: "Second visit",
            durationMinutes: 30,
            intervalFromPrevious: { kind: "exact-day", day: 2 },
          },
        ],
        bookingControls: {
          allowSelfServiceReschedule: true,
          maxReschedules: 2,
          waitlistEnabled: true,
        },
        notificationSettings: { sendReminderHoursBefore: 24 },
        openedAt: "2026-01-01T09:00:00.000Z",
      },
    ],
    facilities: [
      {
        id: facilityId,
        name: "Local Harbor Center",
        timeZone: "America/New_York",
        blackoutDates: [],
        authorisedRoleIds: ["researcher"],
      },
    ],
    rooms: [
      {
        id: roomId,
        facilityId,
        name: "Local Interview Room",
        informationalCapacity: 2,
      },
    ],
    schedulePatterns: [],
    scheduleOverrides: [],
    slots,
    quotas: [],
    participants: [
      {
        id: quinnId,
        name: "Quinn Patel",
        email: "quinn@example.test",
        phone: "+1-555-0110",
        qualificationState: qualification,
        language: "English",
        timeZone: "America/New_York",
        profile: {
          ageRange: "25-34",
          postalCode: "11201",
          transportation: "Subway",
        },
        screenerAttributes: {},
        reminderDefault: ["email"],
      },
      {
        id: "participant-avery",
        name: "Avery Chen",
        email: "avery@example.test",
        phone: "+1-555-0111",
        qualificationState: "eligible",
        language: "English",
        timeZone: "America/New_York",
        profile: {
          ageRange: "25-34",
          postalCode: "11202",
          transportation: "Walk",
        },
        screenerAttributes: {},
        reminderDefault: ["email"],
      },
    ],
    bookings: filled ? [booking] : [],
    bookingVisits: filled
      ? slots.map((slot, index) => ({
          id: `visit-avery-${index}`,
          bookingId: booking.id,
          visitId: slot.visitId,
          slotId: slot.id,
          startsAtUtc: slot.startsAtUtc,
          status: "scheduled",
          noShow: false,
          affectsStanding: false,
        }))
      : [],
    waitlistEntries: [],
    reminders: [],
    notificationEvents: [],
    auditEvents: [],
    scheduleTemplates: [],
    demoUsers: [
      {
        id: "user-researcher-local",
        role: "researcher",
        authorisedFacilityIds: [facilityId],
        authorisedStudyIds: [studyId],
      },
    ],
  };
}

async function importData(page, records) {
  await page.goto("/#/local-data");
  await expect(
    page.getByRole("heading", { name: "Manage local data" }),
  ).toBeVisible();
  await page.getByLabel("Choose local data JSON file").setInputFiles({
    name: "journey.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(records)),
  });
  await expect(
    page.getByText("Local data imported successfully."),
  ).toBeVisible();
}

test("completes qualified handoff, multi-visit review, confirmation, and reload persistence", async ({
  page,
}) => {
  await importData(page, data());
  await page.goto(`/#/handoff/DCP-LOCAL-JOURNEY/${quinnId}`);
  await page.getByRole("button", { name: "Continue" }).click();
  await page
    .getByRole("button", { name: /^Select available slot: .*June 16/ })
    .click();
  await page
    .getByRole("button", { name: /^Select available slot: .*June 18/ })
    .click();
  await expect(
    page.getByRole("heading", { name: "Review your booking" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Confirm booking" }).click();
  await expect(
    page.getByRole("heading", { name: "Booking confirmed" }),
  ).toBeVisible();
  await page.reload();
  // The booking was saved locally, so the same link now opens it.
  await expect(
    page.getByRole("heading", { name: "Your existing appointment" }),
  ).toBeVisible();
});

test("rejects unavailable and ineligible handoff booking attempts", async ({
  page,
}) => {
  await importData(page, data({ filled: true }));
  await page.goto(`/#/handoff/DCP-LOCAL-JOURNEY/${quinnId}`);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(
    page.getByText(
      "No eligible primary slots are currently available for this visit.",
    ),
  ).toBeVisible();
  await importData(page, data({ qualification: "pending" }));
  await page.goto(`/#/handoff/DCP-LOCAL-JOURNEY/${quinnId}`);
  await expect(
    page.getByRole("heading", { name: "You cannot book this study" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue" })).toHaveCount(0);
});

test("persists researcher records, reception attendance, scoped reports, and disclosure locally", async ({
  page,
}) => {
  await importData(page, data({ filled: true }));
  await page.goto(`/#/studies/${studyId}`);
  await page.getByLabel("Avery Chen").check();
  await page
    .getByLabel("I reviewed this preview and confirm this bulk action.")
    .check();
  await page.getByRole("button", { name: "Execute bulk action" }).click();
  await expect(
    page.getByText(/1 booking updated. Bulk audit ID:/),
  ).toBeVisible();
  await expect(page.getByText("Event for Avery Chen")).toBeVisible();
  await page.goto(`/#/facilities/${facilityId}`);
  await page.getByRole("button", { name: "Check in" }).first().click();
  await expect(page.getByText("Appointment checked in locally.")).toBeVisible();
  await page.reload();
  await expect(page.getByText("Status: checked-in")).toBeVisible();
  await page.goto("/#/reports");
  await page.getByLabel("Report study").selectOption(studyId);
  await expect(page.getByText("Local demonstration reporting")).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "Avery Chen" }).first(),
  ).toBeVisible();
  await page.goto("/#/local-data");
  await expect(page.getByText("Local simulation notice")).toBeVisible();
  const waiting = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export data" }).click();
  const download = await waiting;
  const path = await download.path();
  if (path === null) throw new Error("Local export was unavailable.");
  const exported = JSON.parse(await readFile(path, "utf8"));
  expect(exported.notificationEvents).toHaveLength(1);
  expect(
    exported.auditEvents.some((event) => event.bulkActionId !== undefined),
  ).toBe(true);
  expect(
    exported.bookingVisits.some((visit) => visit.status === "checked-in"),
  ).toBe(true);
});
