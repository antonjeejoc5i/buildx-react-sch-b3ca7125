import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { demoFixtures } from "../../fixtures/demoFixtures.ts";
import { DemoStateContext } from "../demo-state/DemoStateContext.ts";
import ParticipantPresentationPanel from "./ParticipantPresentationPanel.tsx";

test("uses the participant profile language from local demo data", () => {
  render(
    <DemoStateContext.Provider
      value={{
        data: demoFixtures,
        error: null,
        isLoading: false,
        reload: async () => undefined,
        resetToSeed: async () => undefined,
        importData: async () => undefined,
        clearData: async () => undefined,
        saveFacility: async () => undefined,
        saveRoom: async () => undefined,
        saveStudy: async () => undefined,
        saveQuota: async () => undefined,
        saveSchedulePattern: async () => undefined,
        saveScheduleOverride: async () => undefined,
        saveScheduleTemplate: async () => undefined,
        saveSlot: async () => undefined,
        exportData: () => "{}",
      }}
    >
      <ParticipantPresentationPanel />
    </DemoStateContext.Provider>,
  );

  expect(screen.getByLabelText("Language")).toBeTruthy();
});
