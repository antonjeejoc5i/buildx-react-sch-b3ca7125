import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { expect, test, vi } from "vitest";
import type {
  ScheduleOverride,
  SchedulePattern,
  ScheduleTemplate,
} from "../../domain/models.ts";
import { demoFixtures } from "../../fixtures/demoFixtures.ts";
import ScheduleCopyTemplates from "./ScheduleCopyTemplates.tsx";

function renderFeature() {
  const savePattern = vi.fn<(pattern: SchedulePattern) => Promise<void>>(
    async () => undefined,
  );
  const saveOverride = vi.fn<(override: ScheduleOverride) => Promise<void>>(
    async () => undefined,
  );
  const saveTemplate = vi.fn<(template: ScheduleTemplate) => Promise<void>>(
    async () => undefined,
  );

  render(
    <ScheduleCopyTemplates
      facilities={demoFixtures.facilities}
      overrides={demoFixtures.scheduleOverrides}
      patterns={demoFixtures.schedulePatterns}
      saveOverride={saveOverride}
      savePattern={savePattern}
      saveTemplate={saveTemplate}
      studies={demoFixtures.studies}
      study={demoFixtures.studies[0]!}
      templates={demoFixtures.scheduleTemplates}
    />,
  );

  return { saveOverride, savePattern, saveTemplate };
}

test("copies patterns and override structure without copying operational study data", async () => {
  const { saveOverride, savePattern } = renderFeature();

  fireEvent.click(screen.getByRole("button", { name: "Copy schedule" }));

  await waitFor(() => expect(savePattern).toHaveBeenCalledOnce());
  expect(savePattern.mock.calls[0]?.[0]).toMatchObject({
    studyId: "study-morning-routines",
    visitId: "visit-interview",
  });
  expect(saveOverride).toHaveBeenCalledOnce();
  expect(
    screen.getByText(/location, quotas, and bookings are never copied/i),
  ).toBeTruthy();
});

test("saves a template and applies it as a new editable schedule copy", async () => {
  const { savePattern, saveTemplate } = renderFeature();

  const saveSection = screen.getByRole("region", {
    name: "Save this schedule as a template",
  });
  fireEvent.change(within(saveSection).getByLabelText("Template name"), {
    target: { value: "My recurring sessions" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save template" }));

  await waitFor(() => expect(saveTemplate).toHaveBeenCalledOnce());
  expect(saveTemplate.mock.calls[0]?.[0]).toMatchObject({
    name: "My recurring sessions",
    archived: false,
  });

  fireEvent.click(screen.getByRole("button", { name: "Apply to this study" }));
  await waitFor(() => expect(savePattern).toHaveBeenCalledOnce());
});
