import { createContext } from "react";
import type { DemoFixtures } from "../../fixtures/demoFixtures.ts";

export interface DemoState {
  data: DemoFixtures | null;
  error: Error | null;
  isLoading: boolean;
  reload: () => Promise<void>;
}

export const DemoStateContext = createContext<DemoState | null>(null);
