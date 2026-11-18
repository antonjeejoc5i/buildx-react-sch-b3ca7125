import type { IdentifiedRecord } from "../domain/models.ts";
import type {
  Repository,
  SchedulingRepositories,
} from "../domain/repositories.ts";
import {
  IndexedDbRepository,
  openIndexedDatabase,
} from "./indexedDbRepository.ts";

const storeNames = [
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

type StoreName = (typeof storeNames)[number];

function repositoryFor<T extends IdentifiedRecord>(
  database: Promise<IDBDatabase>,
  storeName: StoreName,
): Repository<T> {
  return new IndexedDbRepository<T>(database, storeName);
}

export function createSchedulingRepositories(
  databaseName = "scheduling-demo",
  factory?: IDBFactory,
): SchedulingRepositories {
  const database = openIndexedDatabase(databaseName, storeNames, factory);

  return {
    studies: repositoryFor(database, "studies"),
    facilities: repositoryFor(database, "facilities"),
    rooms: repositoryFor(database, "rooms"),
    schedulePatterns: repositoryFor(database, "schedulePatterns"),
    scheduleOverrides: repositoryFor(database, "scheduleOverrides"),
    slots: repositoryFor(database, "slots"),
    quotas: repositoryFor(database, "quotas"),
    participants: repositoryFor(database, "participants"),
    bookings: repositoryFor(database, "bookings"),
    bookingVisits: repositoryFor(database, "bookingVisits"),
    waitlistEntries: repositoryFor(database, "waitlistEntries"),
    reminders: repositoryFor(database, "reminders"),
    notificationEvents: repositoryFor(database, "notificationEvents"),
    auditEvents: repositoryFor(database, "auditEvents"),
    scheduleTemplates: repositoryFor(database, "scheduleTemplates"),
    demoUsers: repositoryFor(database, "demoUsers"),
  };
}
