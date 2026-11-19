import { expect, test } from "vitest";
import { demoFixtures } from "../../fixtures/demoFixtures.ts";
import {
  evaluateSegmentSlotEligibility,
  type SegmentEligibilityConfiguration,
} from "./segmentEligibilityData.ts";

const slot = demoFixtures.slots[0]!;
const avery = demoFixtures.participants[0]!;
const morgan = demoFixtures.participants.find(
  (participant) => participant.id === "participant-morgan-reed",
)!;

const combinedConfiguration: SegmentEligibilityConfiguration = {
  criteria: {
    logic: "and",
    conditions: [
      {
        source: "profile",
        attribute: "transportation",
        expectedValue: "Subway",
      },
      {
        source: "screener",
        attribute: "employment",
        expectedValue: "full-time",
      },
    ],
  },
  restrictedPoolParticipantIds: [avery.id],
  alternatingSegments: {
    "weekday-commuters": [avery.id],
  },
  slotOverrides: {},
};

test("combines profile and screener criteria with restricted-pool and alternating-segment rules", () => {
  expect(
    evaluateSegmentSlotEligibility(slot, avery, combinedConfiguration),
  ).toMatchObject({
    eligible: true,
    available: true,
    checks: [
      { mechanism: "criteria", passed: true },
      { mechanism: "restricted-pool", passed: true },
      { mechanism: "alternating-segment", passed: true },
    ],
  });

  expect(
    evaluateSegmentSlotEligibility(slot, morgan, combinedConfiguration),
  ).toMatchObject({
    eligible: false,
    available: false,
    checks: [
      { mechanism: "criteria", passed: false },
      {
        mechanism: "restricted-pool",
        passed: false,
        message: "Participant is not in the restricted pool.",
      },
      { mechanism: "alternating-segment", passed: false },
    ],
  });
});

test("uses OR criteria and applies per-slot overrides before exposing availability", () => {
  const result = evaluateSegmentSlotEligibility(slot, morgan, {
    ...combinedConfiguration,
    criteria: {
      logic: "or",
      conditions: [
        {
          source: "profile",
          attribute: "transportation",
          expectedValue: "Subway",
        },
        {
          source: "screener",
          attribute: "employment",
          expectedValue: "part-time",
        },
      ],
    },
    restrictedPoolParticipantIds: [],
    alternatingSegments: {},
    slotOverrides: {
      [slot.id]: {
        criteria: {
          logic: "and",
          conditions: [
            {
              source: "screener",
              attribute: "morningRoutine",
              expectedValue: "planned",
            },
          ],
        },
        restrictedPoolParticipantIds: [avery.id],
      },
    },
  });

  expect(result.eligible).toBe(false);
  expect(result.available).toBe(false);
  expect(result.checks).toContainEqual({
    mechanism: "criteria",
    passed: false,
    message: "Participant does not match AND attribute criteria.",
  });
  expect(result.checks).toContainEqual({
    mechanism: "restricted-pool",
    passed: false,
    message: "Participant is not in the restricted pool.",
  });
});
