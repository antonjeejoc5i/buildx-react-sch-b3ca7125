import { expect, test } from "vitest";
import { demoFixtures } from "../../fixtures/demoFixtures.ts";
import {
  calculateQuotaStatus,
  evaluateBookingQuota,
  quotaMatchesParticipant,
} from "./quotaConfigurationData.ts";

const study = demoFixtures.studies[0]!;
const avery = demoFixtures.participants[0]!;
const morgan = demoFixtures.participants.find(
  (participant) => participant.id === "participant-morgan-reed",
)!;
const commuterQuota = demoFixtures.quotas[0]!;

test("matches single and multi-dimensional buckets using profile and screener attributes", () => {
  expect(quotaMatchesParticipant(commuterQuota, avery)).toBe(true);
  expect(quotaMatchesParticipant(commuterQuota, morgan)).toBe(false);

  expect(
    quotaMatchesParticipant(
      {
        ...commuterQuota,
        dimensions: ["transportation", "employment"],
        attributeConditions: {
          transportation: "Subway",
          employment: "full-time",
        },
      },
      avery,
    ),
  ).toBe(true);
});

test("calculates filled and remaining values from active study bookings", () => {
  expect(
    calculateQuotaStatus(
      commuterQuota,
      demoFixtures.participants,
      demoFixtures.bookings,
    ),
  ).toEqual({ filled: 1, remaining: 7, maximum: 8 });
});

test("blocks a booking when its applicable quota target is filled", () => {
  expect(
    evaluateBookingQuota(
      avery,
      study.id,
      [{ ...commuterQuota, target: 1, maximum: 2 }],
      demoFixtures.participants,
      demoFixtures.bookings,
    ),
  ).toMatchObject({
    applicableQuota: { id: commuterQuota.id },
    allowed: false,
    reason: "quota-target-reached",
  });
});

test("blocks a booking when the whole-participant overbooking maximum is filled", () => {
  expect(
    evaluateBookingQuota(
      morgan,
      study.id,
      [
        {
          ...commuterQuota,
          id: "quota-whole-study",
          dimensions: [],
          attributeConditions: {},
          target: 10,
          maximum: 1,
        },
      ],
      demoFixtures.participants,
      demoFixtures.bookings,
    ),
  ).toMatchObject({
    applicableQuota: { id: "quota-whole-study" },
    allowed: false,
    reason: "overbooking-maximum-reached",
  });
});
