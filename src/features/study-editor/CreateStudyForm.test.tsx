import "fake-indexeddb/auto";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { createSchedulingRepositories } from "../../infrastructure/schedulingRepositories.ts";
import AppShell from "../app-shell/AppShell.tsx";
import DemoStateProvider from "../demo-state/DemoStateProvider.tsx";
import { createStudyId } from "./studyEditorData.ts";

afterEach(cleanup);

function goTo(hash: string) {
  window.location.hash = hash;
  fireEvent(window, new Event("hashchange"));
}

async function renderApp() {
  const repositories = createSchedulingRepositories(
    `create-study-${crypto.randomUUID()}`,
  );
  window.location.hash = "#/";
  render(
    <DemoStateProvider repositories={repositories}>
      <AppShell />
    </DemoStateProvider>,
  );
  await screen.findByRole("form", { name: "Create study" });
  return repositories;
}

test("creates a draft study, opens its workspace and lists it on the overview", async () => {
  const repositories = await renderApp();

  fireEvent.change(screen.getByLabelText("New study name"), {
    target: { value: "Evening Habits Study" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Create study" }));

  await waitFor(() =>
    expect(window.location.hash).toBe("#/studies/study-evening-habits-study"),
  );
  fireEvent(window, new Event("hashchange"));
  expect(
    (await screen.findByRole("heading", { level: 1 })).textContent,
  ).toBe("Evening Habits Study");
  expect(screen.getByLabelText("Study name")).toHaveProperty(
    "value",
    "Evening Habits Study",
  );

  await expect(
    repositories.studies.get("study-evening-habits-study"),
  ).resolves.toMatchObject({
    name: "Evening Habits Study",
    lifecycleStatus: "draft",
  });

  goTo("#/");
  expect(
    screen
      .getByRole("link", { name: "Open study: Evening Habits Study" })
      .getAttribute("href"),
  ).toBe("#/studies/study-evening-habits-study");
});

test("requires a study name before creating", async () => {
  await renderApp();
  fireEvent.click(screen.getByRole("button", { name: "Create study" }));
  expect((await screen.findByRole("alert")).textContent).toBe(
    "Study name is required.",
  );
  expect(window.location.hash).toBe("#/");
});

test("derives readable, unique study IDs from the name", () => {
  expect(createStudyId("Evening Habits Study", [])).toBe(
    "study-evening-habits-study",
  );
  expect(
    createStudyId("Evening Habits Study", [
      "study-evening-habits-study",
      "study-evening-habits-study-2",
    ]),
  ).toBe("study-evening-habits-study-3");
  expect(createStudyId("  !!!  ", [])).toBe("study-untitled");
});
