import { useCallback, useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import type { DemoFixtures } from "../../fixtures/demoFixtures.ts";
import { demoFixtures } from "../../fixtures/demoFixtures.ts";
import type { SchedulingRepositories } from "../../domain/repositories.ts";
import { createSchedulingRepositories } from "../../infrastructure/schedulingRepositories.ts";
import { DemoStateContext } from "./DemoStateContext.ts";

interface DemoStateProviderProps extends PropsWithChildren {
  repositories?: SchedulingRepositories;
}

function persistRecords<T extends { id: string }>(
  records: T[],
  put: (record: T) => Promise<void>,
): Promise<void[]> {
  return Promise.all(records.map((record) => put(record)));
}

async function seedIfEmpty(
  repositories: SchedulingRepositories,
): Promise<void> {
  if ((await repositories.studies.getAll()).length > 0) {
    return;
  }

  await Promise.all([
    persistRecords(demoFixtures.studies, (record) =>
      repositories.studies.put(record),
    ),
    persistRecords(demoFixtures.facilities, (record) =>
      repositories.facilities.put(record),
    ),
    persistRecords(demoFixtures.rooms, (record) =>
      repositories.rooms.put(record),
    ),
    persistRecords(demoFixtures.schedulePatterns, (record) =>
      repositories.schedulePatterns.put(record),
    ),
    persistRecords(demoFixtures.scheduleOverrides, (record) =>
      repositories.scheduleOverrides.put(record),
    ),
    persistRecords(demoFixtures.slots, (record) =>
      repositories.slots.put(record),
    ),
    persistRecords(demoFixtures.quotas, (record) =>
      repositories.quotas.put(record),
    ),
    persistRecords(demoFixtures.participants, (record) =>
      repositories.participants.put(record),
    ),
    persistRecords(demoFixtures.bookings, (record) =>
      repositories.bookings.put(record),
    ),
    persistRecords(demoFixtures.bookingVisits, (record) =>
      repositories.bookingVisits.put(record),
    ),
    persistRecords(demoFixtures.waitlistEntries, (record) =>
      repositories.waitlistEntries.put(record),
    ),
    persistRecords(demoFixtures.reminders, (record) =>
      repositories.reminders.put(record),
    ),
    persistRecords(demoFixtures.notificationEvents, (record) =>
      repositories.notificationEvents.put(record),
    ),
    persistRecords(demoFixtures.auditEvents, (record) =>
      repositories.auditEvents.put(record),
    ),
    persistRecords(demoFixtures.scheduleTemplates, (record) =>
      repositories.scheduleTemplates.put(record),
    ),
    persistRecords(demoFixtures.demoUsers, (record) =>
      repositories.demoUsers.put(record),
    ),
  ]);
}

async function loadFixtures(
  repositories: SchedulingRepositories,
): Promise<DemoFixtures> {
  return {
    studies: await repositories.studies.getAll(),
    facilities: await repositories.facilities.getAll(),
    rooms: await repositories.rooms.getAll(),
    schedulePatterns: await repositories.schedulePatterns.getAll(),
    scheduleOverrides: await repositories.scheduleOverrides.getAll(),
    slots: await repositories.slots.getAll(),
    quotas: await repositories.quotas.getAll(),
    participants: await repositories.participants.getAll(),
    bookings: await repositories.bookings.getAll(),
    bookingVisits: await repositories.bookingVisits.getAll(),
    waitlistEntries: await repositories.waitlistEntries.getAll(),
    reminders: await repositories.reminders.getAll(),
    notificationEvents: await repositories.notificationEvents.getAll(),
    auditEvents: await repositories.auditEvents.getAll(),
    scheduleTemplates: await repositories.scheduleTemplates.getAll(),
    demoUsers: await repositories.demoUsers.getAll(),
  };
}

export default function DemoStateProvider({
  children,
  repositories,
}: DemoStateProviderProps) {
  const [data, setData] = useState<DemoFixtures | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const activeRepositories = useMemo(
    () => repositories ?? createSchedulingRepositories(),
    [repositories],
  );

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      await seedIfEmpty(activeRepositories);
      const localData = await loadFixtures(activeRepositories);
      setData(localData);
      setError(null);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError
          : new Error("Unable to load local demo data."),
      );
    } finally {
      setIsLoading(false);
    }
  }, [activeRepositories]);

  useEffect(() => {
    void Promise.resolve().then(reload);
  }, [reload]);

  const value = useMemo(
    () => ({ data, error, isLoading, reload }),
    [data, error, isLoading, reload],
  );

  return (
    <DemoStateContext.Provider value={value}>
      {children}
    </DemoStateContext.Provider>
  );
}
