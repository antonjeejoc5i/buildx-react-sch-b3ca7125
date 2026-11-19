import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import type { Study } from "../../domain/models.ts";
import { demoFixtures } from "../../fixtures/demoFixtures.ts";
import { createDraftStudy } from "./studyEditorData.ts";
import StudyEditor from "./StudyEditor.tsx";

afterEach(cleanup);

test("saves an incomplete study as a draft", async () => {
  const saveStudy = vi.fn<(study: Study) => Promise<void>>(
    async () => undefined,
  );
  render(
    <StudyEditor
      facilities={demoFixtures.facilities}
      rooms={demoFixtures.rooms}
      saveStudy={saveStudy}
      study={createDraftStudy("study-new")}
    />,
  );
  fireEvent.change(screen.getByLabelText("Study name"), {
    target: { value: "Draft diary study" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save study" }));
  await waitFor(() => expect(saveStudy).toHaveBeenCalledTimes(1));
  expect(saveStudy.mock.calls[0]?.[0]).toMatchObject({
    lifecycleStatus: "draft",
    facilityId: "",
    roomId: "",
    decipherProjectId: "",
  });
});

test("requires selection before opening booking", async () => {
  const saveStudy = vi.fn<(study: Study) => Promise<void>>(
    async () => undefined,
  );
  render(
    <StudyEditor
      facilities={demoFixtures.facilities}
      rooms={demoFixtures.rooms}
      saveStudy={saveStudy}
      study={createDraftStudy("study-new")}
    />,
  );
  fireEvent.change(screen.getByLabelText("Lifecycle status"), {
    target: { value: "open" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Open for booking" }));
  expect(
    await screen.findByText("Simulated Decipher project ID is required."),
  ).toBeTruthy();
  expect(saveStudy).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("Facility"), {
    target: { value: demoFixtures.facilities[0].id },
  });
  fireEvent.change(screen.getByLabelText("Room"), {
    target: { value: demoFixtures.rooms[0].id },
  });
  fireEvent.change(screen.getByLabelText("Simulated Decipher project ID"), {
    target: { value: "DCP-DEMO-9001" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Open for booking" }));
  await waitFor(() => expect(saveStudy).toHaveBeenCalledTimes(1));
  expect(saveStudy.mock.calls[0]?.[0]).toMatchObject({
    lifecycleStatus: "open",
    facilityId: demoFixtures.facilities[0].id,
    roomId: demoFixtures.rooms[0].id,
  });
});
