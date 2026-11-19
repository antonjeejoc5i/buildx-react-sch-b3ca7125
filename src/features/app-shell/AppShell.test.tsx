import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import type { DemoFixtures } from "../../fixtures/demoFixtures.ts";
import { demoFixtures } from "../../fixtures/demoFixtures.ts";
import { createTestDemoState } from "../../test/createTestDemoState.ts";
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
      value={createTestDemoState({ data: facilityScopedFixtures })}
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

function goTo(hash: string) {
  window.location.hash = hash;
  fireEvent(window, new Event("hashchange"));
}

test("links the overview to scoped studies and simulated participant handoffs", () => {
  renderShell();
  expect(
    screen
      .getByRole("link", { name: "Open study: Morning Routines Research" })
      .getAttribute("href"),
  ).toBe("#/studies/study-morning-routines");
  expect(
    screen
      .getByRole("link", { name: "Continue as Quinn Patel" })
      .getAttribute("href"),
  ).toBe("#/handoff/DCP-DEMO-2048/participant-quinn-patel");
});

test("mounts every study configuration area on the study page", () => {
  renderShell();
  goTo("#/studies/study-morning-routines");
  for (const name of [
    "Morning Routines Research",
    "Study setup",
    "Date overrides",
    "Copy schedules and templates",
    "Quota configuration",
    "Slot capacity and backup slots",
    "Bulk booking operations",
    "Booking confirmation",
    "Notification outbox",
    "Reporting metrics",
  ]) {
    expect(screen.getByRole("heading", { name })).toBeTruthy();
  }
  expect(
    screen.getAllByRole("heading", { level: 1 }).map((item) => item.textContent),
  ).toEqual(["Morning Routines Research"]);
  expect(screen.getByRole("navigation", { name: "Study sections" })).toBeTruthy();
});

test("routes the demo tools and shows facility planning", () => {
  renderShell();
  goTo("#/outbox");
  expect(screen.getByRole("heading", { name: "Notification outbox" })).toBeTruthy();
  goTo("#/participant-preview");
  expect(
    screen.getByRole("heading", { name: "Your appointment preferences" }),
  ).toBeTruthy();
  goTo("#/facilities/facility-harbor");
  expect(
    screen.getByRole("heading", { name: "Upcoming study planning" }),
  ).toBeTruthy();
  goTo("#/nowhere");
  expect(screen.getByRole("alert").textContent).toContain("Access denied");
});

test("labels every screen as demo-mode local data", () => {
  renderShell();
  expect(screen.getByText("Demo · local data")).toBeTruthy();
});
