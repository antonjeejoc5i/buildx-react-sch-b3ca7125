import { createContext } from "react";
import type { DemoFixtures } from "../../fixtures/demoFixtures.ts";

export interface DemoState {
  data: DemoFixtures | null;
  error: Error | null;
  isLoading: boolean;
  reload: () => Promise<void>;
  resetToSeed: () => Promise<void>;
  importData: (serializedData: string) => Promise<void>;
  clearData: () => Promise<void>;
  exportData: () => string;
}

export const DemoStateContext = createContext<DemoState | null>(null);
