import type { IdentifiedRecord } from "../../domain/models.ts";
import type {
  Repository,
  SchedulingRepositories,
} from "../../domain/repositories.ts";
import type { DemoFixtures } from "../../fixtures/demoFixtures.ts";

const collectionNames = [
  "studies",
  "facilities",
  "rooms",
  "schedulePatterns",
  "scheduleOverrides",
  "slots",
  "quotas",
  "participants",
  "bookings",
  "bookingVisits",
  "waitlistEntries",
  "reminders",
  "notificationEvents",
  "auditEvents",
  "scheduleTemplates",
  "demoUsers",
] as const;
type CollectionName = (typeof collectionNames)[number];

export class LocalImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LocalImportError";
  }
}

function isCollection(value: unknown): value is IdentifiedRecord[] {
  if (!Array.isArray(value)) return false;
  const ids = new Set<string>();
  return value.every((record) => {
    if (typeof record !== "object" || record === null) return false;
    const id = (record as IdentifiedRecord).id;
    if (typeof id !== "string" || id.trim() === "" || ids.has(id)) return false;
    ids.add(id);
    return true;
  });
}

export function parseImportedData(serializedData: string): DemoFixtures {
  let parsed: unknown;
  try {
    parsed = JSON.parse(serializedData);
  } catch {
    throw new LocalImportError("The selected file is not valid JSON.");
  }
  if (typeof parsed !== "object" || parsed === null) {
    throw new LocalImportError("The selected file does not contain demo data.");
  }
  const candidate = parsed as Record<string, unknown>;
  if (!collectionNames.every((name) => isCollection(candidate[name]))) {
    throw new LocalImportError(
      "The selected file is missing a valid local data collection.",
    );
  }
  return candidate as unknown as DemoFixtures;
}

function repositoryFor(
  repositories: SchedulingRepositories,
  name: CollectionName,
): Repository<IdentifiedRecord> {
  return repositories[name] as Repository<IdentifiedRecord>;
}

async function writeData(
  repositories: SchedulingRepositories,
  data: DemoFixtures,
): Promise<void> {
  await Promise.all(
    collectionNames.map(async (name) => {
      const repository = repositoryFor(repositories, name);
      await repository.clear();
      await Promise.all(
        (data[name] as IdentifiedRecord[]).map((record) =>
          repository.put(record),
        ),
      );
    }),
  );
}

export async function loadLocalData(
  repositories: SchedulingRepositories,
): Promise<DemoFixtures> {
  const collections = await Promise.all(
    collectionNames.map((name) => repositoryFor(repositories, name).getAll()),
  );
  return Object.fromEntries(
    collectionNames.map((name, index) => [name, collections[index]]),
  ) as unknown as DemoFixtures;
}

export async function replaceLocalData(
  repositories: SchedulingRepositories,
  serializedData: string,
): Promise<DemoFixtures> {
  const importedData = parseImportedData(serializedData);
  await writeData(repositories, importedData);
  return loadLocalData(repositories);
}

export async function resetLocalDataToSeed(
  repositories: SchedulingRepositories,
  seedData: DemoFixtures,
): Promise<DemoFixtures> {
  await writeData(repositories, structuredClone(seedData));
  return loadLocalData(repositories);
}

export async function clearLocalData(
  repositories: SchedulingRepositories,
): Promise<DemoFixtures> {
  await Promise.all(
    collectionNames.map((name) => repositoryFor(repositories, name).clear()),
  );
  return loadLocalData(repositories);
}

export function exportLocalData(data: DemoFixtures | null): string {
  return JSON.stringify(
    data ?? Object.fromEntries(collectionNames.map((name) => [name, []])),
    null,
    2,
  );
}
