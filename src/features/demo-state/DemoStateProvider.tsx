import { useCallback, useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
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
    ],
  );

  return (
    <DemoStateContext.Provider value={value}>
      {children}
    </DemoStateContext.Provider>
  );
}
