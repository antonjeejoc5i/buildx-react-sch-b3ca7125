import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { demoFixtures } from "../../fixtures/demoFixtures.ts";
import DecipherHandoff from "./DecipherHandoff.tsx";

test("shows an eligible participant a localized summary before slot selection without a network call", () => {
  const fetchSpy = vi.fn();
  vi.stubGlobal("fetch", fetchSpy);

  render(
    <DecipherHandoff
      data={demoFixtures}
      participantId="participant-quinn-patel"
      projectId="DCP-DEMO-2048"
    />,
  );

  expect(screen.getByText("Study summary")).toBeTruthy();
  expect(
    screen.getByRole("button", { name: "Continue to slot selection" }),
  ).toBeTruthy();
  expect(fetchSpy).not.toHaveBeenCalled();
  fireEvent.click(
    screen.getByRole("button", { name: "Continue to slot selection" }),
  );
  expect(screen.getByRole("heading", { name: "Select a slot" })).toBeTruthy();
  vi.unstubAllGlobals();
});

test("shows a local denial for unqualified and incomplete participants", () => {
  const { rerender } = render(
    <DecipherHandoff
      data={demoFixtures}
      participantId="participant-morgan-reed"
      projectId="DCP-DEMO-2048"
    />,
  );
  expect(screen.getByRole("alert").textContent).toContain("cannot book");

  rerender(
    <DecipherHandoff
      data={demoFixtures}
      participantId="participant-riley-stone"
      projectId="DCP-DEMO-2048"
    />,
  );
  expect(screen.getByRole("alert").textContent).toContain(
    "information is needed",
  );
});

test("shows a local denial for a closed study", () => {
  render(
    <DecipherHandoff
      data={demoFixtures}
      participantId="participant-jordan-lee"
      projectId="DCP-DEMO-CLOSED-2049"
    />,
  );
  expect(screen.getByRole("alert").textContent).toContain("study is closed");
});

test("opens an active appointment instead of a duplicate booking flow", () => {
  render(
    <DecipherHandoff
      data={demoFixtures}
      participantId="participant-avery-chen"
      projectId="DCP-DEMO-2048"
    />,
  );
  expect(
    screen.getByRole("heading", { name: "Your existing appointment" }),
  ).toBeTruthy();
  expect(
    screen.queryByRole("button", { name: "Continue to slot selection" }),
  ).toBeNull();
});
