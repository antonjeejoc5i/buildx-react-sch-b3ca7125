import { createContext } from "react";
import type {
  Facility,
  Quota,
  Room,
  ScheduleOverride,
  SchedulePattern,
  ScheduleTemplate,
  Study,
} from "../../domain/models.ts";
import type { DemoFixtures } from "../../fixtures/demoFixtures.ts";

export interface DemoState {
  data: DemoFixtures | null;
  error: Error | null;
  isLoading: boolean;
  reload: () => Promise<void>;
  resetToSeed: () => Promise<void>;
  importData: (serializedData: string) => Promise<void>;
  clearData: () => Promise<void>;
  saveFacility: (facility: Facility) => Promise<void>;
  saveRoom: (room: Room) => Promise<void>;
  saveStudy: (study: Study) => Promise<void>;
  saveQuota: (quota: Quota) => Promise<void>;
  saveSchedulePattern: (pattern: SchedulePattern) => Promise<void>;
  saveScheduleOverride: (override: ScheduleOverride) => Promise<void>;
  saveScheduleTemplate: (template: ScheduleTemplate) => Promise<void>;
  exportData: () => string;
}

export const DemoStateContext = createContext<DemoState | null>(null);
