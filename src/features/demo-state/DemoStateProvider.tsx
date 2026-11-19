import { useCallback, useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import type {
  Facility,
  Quota,
  Room,
  ScheduleOverride,
  SchedulePattern,
  ScheduleTemplate,
  Slot,
  Study,
  WaitlistEntry,
} from "../../domain/models.ts";
import type { DemoFixtures } from "../../fixtures/demoFixtures.ts";
import { demoFixtures } from "../../fixtures/demoFixtures.ts";
import type { SchedulingRepositories } from "../../domain/repositories.ts";
import { createSchedulingRepositories } from "../../infrastructure/schedulingRepositories.ts";
import {
  clearLocalData,
  exportLocalData,
  loadLocalData,
  replaceLocalData,
  resetLocalDataToSeed,
} from "../local-data/lifecycleData.ts";
import { DemoStateContext } from "./DemoStateContext.ts";

interface DemoStateProviderProps extends PropsWithChildren {
  repositories?: SchedulingRepositories;
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
  const updateData = useCallback(
    async (operation: () => Promise<DemoFixtures>) => {
      setIsLoading(true);
      try {
        setData(await operation());
        setError(null);
      } catch (caughtError) {
        const localError =
          caughtError instanceof Error
            ? caughtError
            : new Error("Unable to update local demo data.");
        setError(localError);
        throw localError;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );
  const reload = useCallback(
    async () =>
      updateData(async () => {
        const localData = await loadLocalData(activeRepositories);
        return localData.studies.length > 0
          ? localData
          : resetLocalDataToSeed(activeRepositories, demoFixtures);
      }),
    [activeRepositories, updateData],
  );
  const resetToSeed = useCallback(
    async () =>
      updateData(() => resetLocalDataToSeed(activeRepositories, demoFixtures)),
    [activeRepositories, updateData],
  );
  const importData = useCallback(
    async (serializedData: string) =>
      updateData(() => replaceLocalData(activeRepositories, serializedData)),
    [activeRepositories, updateData],
  );
  const clearData = useCallback(
    async () => updateData(() => clearLocalData(activeRepositories)),
    [activeRepositories, updateData],
  );
  const saveFacility = useCallback(
    async (facility: Facility) =>
      updateData(async () => {
        await activeRepositories.facilities.put(facility);
        return loadLocalData(activeRepositories);
      }),
    [activeRepositories, updateData],
  );
  const saveRoom = useCallback(
    async (room: Room) =>
      updateData(async () => {
        if (
          (await activeRepositories.facilities.get(room.facilityId)) ===
          undefined
        ) {
          throw new Error("A room must belong to an existing facility.");
        }
        await activeRepositories.rooms.put(room);
        return loadLocalData(activeRepositories);
      }),
    [activeRepositories, updateData],
  );
  const saveStudy = useCallback(
    async (study: Study) =>
      updateData(async () => {
        await activeRepositories.studies.put(study);
        return loadLocalData(activeRepositories);
      }),
    [activeRepositories, updateData],
  );
  const saveQuota = useCallback(
    async (quota: Quota) =>
      updateData(async () => {
        await activeRepositories.quotas.put(quota);
        return loadLocalData(activeRepositories);
      }),
    [activeRepositories, updateData],
  );
  const saveSchedulePattern = useCallback(
    async (pattern: SchedulePattern) =>
      updateData(async () => {
        await activeRepositories.schedulePatterns.put(pattern);
        return loadLocalData(activeRepositories);
      }),
    [activeRepositories, updateData],
  );
  const saveScheduleOverride = useCallback(
    async (override: ScheduleOverride) =>
      updateData(async () => {
        await activeRepositories.scheduleOverrides.put(override);
        return loadLocalData(activeRepositories);
      }),
    [activeRepositories, updateData],
  );
  const saveScheduleTemplate = useCallback(
    async (template: ScheduleTemplate) =>
      updateData(async () => {
        await activeRepositories.scheduleTemplates.put(template);
        return loadLocalData(activeRepositories);
      }),
    [activeRepositories, updateData],
  );
  const saveSlot = useCallback(
    async (slot: Slot) =>
      updateData(async () => {
        await activeRepositories.slots.put(slot);
        return loadLocalData(activeRepositories);
      }),
    [activeRepositories, updateData],
  );
  const saveWaitlistEntry = useCallback(
    async (entry: WaitlistEntry) =>
      updateData(async () => {
        await activeRepositories.waitlistEntries.put(entry);
        return loadLocalData(activeRepositories);
      }),
    [activeRepositories, updateData],
  );
  const exportData = useCallback(() => exportLocalData(data), [data]);

  useEffect(() => {
    void Promise.resolve().then(reload);
  }, [reload]);

  const value = useMemo(
    () => ({
      data,
      error,
      isLoading,
      reload,
      resetToSeed,
      importData,
      clearData,
      saveFacility,
      saveRoom,
      saveStudy,
      saveQuota,
      saveSchedulePattern,
      saveScheduleOverride,
      saveScheduleTemplate,
      saveSlot,
      saveWaitlistEntry,
      exportData,
    }),
    [
      clearData,
      data,
      error,
      exportData,
      importData,
      isLoading,
      reload,
      resetToSeed,
      saveFacility,
      saveQuota,
      saveRoom,
      saveScheduleOverride,
      saveSchedulePattern,
      saveScheduleTemplate,
      saveSlot,
      saveStudy,
      saveWaitlistEntry,
    ],
  );

  return (
    <DemoStateContext.Provider value={value}>
      {children}
    </DemoStateContext.Provider>
  );
}
