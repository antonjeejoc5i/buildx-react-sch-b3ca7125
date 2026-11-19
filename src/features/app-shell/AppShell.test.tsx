import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import type { DemoFixtures } from "../../fixtures/demoFixtures.ts";
import { demoFixtures } from "../../fixtures/demoFixtures.ts";
import { DemoStateContext } from "../demo-state/DemoStateContext.ts";
import AppShell from "./AppShell.tsx";

const facilityScopedFixtures: DemoFixtures = {
  ...demoFixtures,
  demoUsers: [
    ...demoFixtures.demoUsers,
    {
      id: "user-facility-reviewer",
      role: "facility reviewer",
      authorisedFacilityIds: ["facility-harbor"],
      authorisedStudyIds: [],
    },
  ],
};

function renderShell() {
  window.location.hash = "#/";
  render(
    <DemoStateContext.Provider
      value={{
        data: facilityScopedFixtures,
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
      <AppShell />
    </DemoStateContext.Provider>,
  );
}

afterEach(cleanup);

test("updates navigation for the selected actor scope", () => {
  renderShell();
  expect(
    screen.getByRole("link", { name: "Morning Routines Research" }),
  ).toBeTruthy();
  fireEvent.change(screen.getByLabelText("Simulated local actor"), {
    target: { value: "user-facility-reviewer" },
  });
  expect(
    screen.queryByRole("link", { name: "Morning Routines Research" }),
  ).toBeNull();
  expect(
    screen.getByRole("link", { name: "Harbor Research Center" }),
  ).toBeTruthy();
});

test("announces denial for a direct route outside the selected actor scope", () => {
  renderShell();
  fireEvent.change(screen.getByLabelText("Simulated local actor"), {
    target: { value: "user-facility-reviewer" },
  });
  window.location.hash = "#/studies/study-morning-routines";
  fireEvent(window, new Event("hashchange"));
  expect(screen.getByRole("alert").textContent).toContain("Access denied");
});
