import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { demoFixtures } from "../../fixtures/demoFixtures.ts";
import { createTestDemoState } from "../../test/createTestDemoState.ts";
import { DemoStateContext } from "../demo-state/DemoStateContext.ts";
import ParticipantPresentationPanel from "./ParticipantPresentationPanel.tsx";

test("uses the participant profile language from local demo data", () => {
  render(
    <DemoStateContext.Provider
      value={createTestDemoState({ data: demoFixtures })}
    >
      <ParticipantPresentationPanel />
    </DemoStateContext.Provider>,
  );

  expect(screen.getByLabelText("Language")).toBeTruthy();
});
