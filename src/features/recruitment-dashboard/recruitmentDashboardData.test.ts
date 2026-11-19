import { expect, test } from "vitest";
import { demoFixtures } from "../../fixtures/demoFixtures.ts";
import { buildRecruitmentDashboardData } from "./recruitmentDashboardData.ts";

test("calculates local recruitment progress for the selected study", () => {
  const study = demoFixtures.studies[0];
  if (study === undefined) throw new Error("Expected a seeded study.");

  const dashboard = buildRecruitmentDashboardData(
    study,
    demoFixtures.quotas,
    demoFixtures.slots,
    demoFixtures.bookings,
    demoFixtures.bookingVisits,
    demoFixtures.participants,
  );

  expect(dashboard.scheduledParticipants).toBe(1);
  expect(dashboard.scheduledSlots).toBe(1);
  expect(dashboard.cancellations).toBe(0);
  expect(dashboard.noShows).toBe(0);
  expect(dashboard.quotas).toEqual([
    {
      id: "quota-commuters",
      label: "transportation: Subway",
      filled: 1,
      target: 8,
      maximum: 8,
    },
  ]);
  expect(dashboard.segmentFill).toEqual([
    { segment: "weekday-commuters", booked: 1, capacity: 1 },
  ]);
});

test("excludes records outside the selected study scope", () => {
  const study = demoFixtures.studies[1];
  if (study === undefined) throw new Error("Expected a seeded study.");

  const dashboard = buildRecruitmentDashboardData(
    study,
    demoFixtures.quotas,
    demoFixtures.slots,
    demoFixtures.bookings,
    demoFixtures.bookingVisits,
    demoFixtures.participants,
  );

  expect(dashboard.scheduledParticipants).toBe(0);
  expect(dashboard.quotas).toEqual([]);
  expect(dashboard.slots).toEqual([]);
  expect(dashboard.participants).toEqual([]);
});
