import "fake-indexeddb/auto";
import { expect, test } from "vitest";
import {
  LocalProfileError,
  requireParticipantProfile,
} from "../domain/models.ts";
import { demoFixtures } from "../fixtures/demoFixtures.ts";
import { createSchedulingRepositories } from "./schedulingRepositories.ts";

test("persists structured records through IndexedDB repositories", async () => {
  const repositories = createSchedulingRepositories(
    `scheduling-test-${crypto.randomUUID()}`,
  );
  const facility = demoFixtures.facilities[0];

  await repositories.facilities.put(facility);

  await expect(repositories.facilities.get(facility.id)).resolves.toEqual(
    facility,
  );
  await expect(repositories.facilities.getAll()).resolves.toEqual([facility]);
});

test("reports incomplete required participant profile data as a local error", () => {
  const incompleteParticipant = {
    ...demoFixtures.participants[0],
    profile: { ...demoFixtures.participants[0].profile, postalCode: "" },
  };

  expect(() => requireParticipantProfile(incompleteParticipant)).toThrow(
    LocalProfileError,
  );
  expect(() => requireParticipantProfile(incompleteParticipant)).toThrow(
    "postalCode",
  );
});
