import { expect, test } from "vitest";
import { demoFixtures } from "../../fixtures/demoFixtures.ts";
import {
  buildConfiguredVisits,
  MultiVisitConfigurationError,
  schedulesByVisit,
} from "./multiVisitConfigurationData.ts";

const firstVisit = demoFixtures.studies[0]!.visits[0]!;

const visitValues = [
  {
    id: firstVisit.id,
    name: firstVisit.name,
    durationMinutes: "45",
    intervalKind: "same-day" as const,
    exactDay: "1",
    minimumDay: "0",
    maximumDay: "0",
  },
  {
    id: "visit-follow-up",
    name: "Follow-up interview",
    durationMinutes: "30",
    intervalKind: "day-window" as const,
    exactDay: "1",
    minimumDay: "3",
    maximumDay: "7",
  },
];

test("supports same-day, exact-day, and day-window consecutive visit rules", () => {
  expect(buildConfiguredVisits(visitValues)[1]?.intervalFromPrevious).toEqual({
    kind: "day-window",
    minimumDay: 3,
    maximumDay: 7,
  });

  expect(
    buildConfiguredVisits([
      visitValues[0]!,
      { ...visitValues[1]!, intervalKind: "same-day" },
    ])[1]?.intervalFromPrevious,
  ).toEqual({ kind: "same-day" });

  expect(
    buildConfiguredVisits([
      visitValues[0]!,
      { ...visitValues[1]!, intervalKind: "exact-day", exactDay: "14" },
    ])[1]?.intervalFromPrevious,
  ).toEqual({ kind: "exact-day", day: 14 });
});

test("rejects invalid consecutive visit intervals clearly", () => {
  expect(() =>
    buildConfiguredVisits([
      visitValues[0]!,
      { ...visitValues[1]!, minimumDay: "8", maximumDay: "3" },
    ]),
  ).toThrow("Maximum day interval must be on or after minimum day interval.");

  expect(() =>
    buildConfiguredVisits([
      visitValues[0]!,
      { ...visitValues[1]!, intervalKind: "exact-day", exactDay: "0" },
    ]),
  ).toThrow(MultiVisitConfigurationError);
});

test("assigns schedules and overrides to their matching visit", () => {
  const study = {
    ...demoFixtures.studies[0]!,
    visits: [
      firstVisit,
      { ...firstVisit, id: "visit-follow-up", name: "Follow-up" },
    ],
  };
  const followUpPattern = {
    ...demoFixtures.schedulePatterns[0]!,
    id: "pattern-follow-up",
    visitId: "visit-follow-up",
  };
  const assignments = schedulesByVisit(
    study,
    [...demoFixtures.schedulePatterns, followUpPattern],
    [
      ...demoFixtures.scheduleOverrides,
      {
        ...demoFixtures.scheduleOverrides[0]!,
        id: "override-follow-up",
        schedulePatternId: followUpPattern.id,
      },
    ],
  );

  expect(assignments.get(firstVisit.id)?.patterns).toHaveLength(1);
  expect(assignments.get("visit-follow-up")?.overrideCount).toBe(1);
});
