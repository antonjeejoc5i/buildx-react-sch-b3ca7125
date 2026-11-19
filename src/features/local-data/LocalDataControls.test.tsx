import { fireEvent, render, screen } from "@testing-library/react";
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
