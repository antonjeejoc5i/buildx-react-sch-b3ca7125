import "fake-indexeddb/auto";
import { expect, test } from "vitest";
import { demoFixtures } from "../../fixtures/demoFixtures.ts";
import { createSchedulingRepositories } from "../../infrastructure/schedulingRepositories.ts";
import {
  LocalImportError,
  exportLocalData,
  replaceLocalData,
  resetLocalDataToSeed,
} from "./lifecycleData.ts";

test("imports valid data and resets deterministic seed data", async () => {
  const repositories = createSchedulingRepositories(
    `local-data-${crypto.randomUUID()}`,
  );
  const imported = structuredClone(demoFixtures);
  imported.participants[0].name = "Imported participant";
  await replaceLocalData(repositories, exportLocalData(imported));
  await expect(
    repositories.participants.get(imported.participants[0].id),
  ).resolves.toEqual(imported.participants[0]);
  await resetLocalDataToSeed(repositories, demoFixtures);
  await expect(
    repositories.participants.get(demoFixtures.participants[0].id),
  ).resolves.toEqual(demoFixtures.participants[0]);
});

test("preserves existing records when an import is invalid", async () => {
  const repositories = createSchedulingRepositories(
    `local-data-${crypto.randomUUID()}`,
  );
  await resetLocalDataToSeed(repositories, demoFixtures);
  await expect(
    replaceLocalData(repositories, '{"studies":[]}'),
  ).rejects.toThrow(LocalImportError);
  await expect(
    repositories.participants.get(demoFixtures.participants[0].id),
  ).resolves.toEqual(demoFixtures.participants[0]);
});
