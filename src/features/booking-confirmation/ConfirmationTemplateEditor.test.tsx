import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import type { Study } from "../../domain/models.ts";
import { demoFixtures } from "../../fixtures/demoFixtures.ts";
import ConfirmationTemplateEditor from "./ConfirmationTemplateEditor.tsx";

test("saves valid editable template content and enabled management links", async () => {
  const saveStudy = vi.fn<(study: Study) => Promise<void>>(
    async () => undefined,
  );

  render(
    <ConfirmationTemplateEditor
      saveStudy={saveStudy}
      study={demoFixtures.studies[0]!}
    />,
  );

  fireEvent.change(screen.getByLabelText("Confirmation template"), {
    target: { value: "Hello {{participantName}}, {{visits}} at {{location}}." },
  });
  fireEvent.click(screen.getByLabelText("Include cancel booking link"));
  fireEvent.click(
    screen.getByRole("button", { name: "Save confirmation template" }),
  );

  await waitFor(() => expect(saveStudy).toHaveBeenCalledTimes(1));
  expect(saveStudy.mock.calls[0]?.[0].notificationSettings).toMatchObject({
    confirmationTemplate:
      "Hello {{participantName}}, {{visits}} at {{location}}.",
    enableCancelLink: false,
  });
});
