import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { createTestDemoState } from "../../test/createTestDemoState.ts";
import { DemoStateContext } from "../demo-state/DemoStateContext.ts";
import LocalDataControls from "./LocalDataControls.tsx";

test("requires confirmation before clearing local data and states the simulation limits", () => {
  const clearData = vi.fn().mockResolvedValue(undefined);
  render(
    <DemoStateContext.Provider value={createTestDemoState({ clearData })}>
      <LocalDataControls />
    </DemoStateContext.Provider>,
  );
  expect(screen.getByText(/Data, permissions, audit history/)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Clear local data" }));
  expect(clearData).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Confirm clear data" }));
  expect(clearData).toHaveBeenCalledOnce();
});

test("resets local records through the visible lifecycle control", async () => {
  const resetToSeed = vi.fn<() => Promise<void>>(async () => undefined);
  render(
    <DemoStateContext.Provider value={createTestDemoState({ resetToSeed })}>
      <LocalDataControls />
    </DemoStateContext.Provider>,
  );

  fireEvent.click(screen.getByRole("button", { name: "Reset to seed data" }));

  await waitFor(() => expect(resetToSeed).toHaveBeenCalledOnce());
  expect(screen.getByText("Deterministic seed data restored.")).toBeTruthy();
});

test("makes a failed local-data operation visible without claiming success", async () => {
  const clearData = vi.fn<() => Promise<void>>(async () => {
    throw new Error("Local browser storage is unavailable.");
  });
  render(
    <DemoStateContext.Provider value={createTestDemoState({ clearData })}>
      <LocalDataControls />
    </DemoStateContext.Provider>,
  );

  fireEvent.click(screen.getByRole("button", { name: "Clear local data" }));
  fireEvent.click(screen.getByRole("button", { name: "Confirm clear data" }));

  expect(
    await screen.findByText("Local browser storage is unavailable."),
  ).toBeTruthy();
  expect(screen.queryByText("All local demo data was cleared.")).toBeNull();
});
