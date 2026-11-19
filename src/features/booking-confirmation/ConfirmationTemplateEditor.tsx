import { useState } from "react";
import type { FormEvent } from "react";
import type { Study } from "../../domain/models.ts";
import {
  getConfirmationTemplateSettings,
  validateConfirmationTemplate,
} from "./bookingConfirmationData.ts";
import "./ConfirmationTemplateEditor.css";

interface ConfirmationTemplateEditorProps {
  study: Study;
  saveStudy: (study: Study) => Promise<void>;
}

export default function ConfirmationTemplateEditor({
  study,
  saveStudy,
}: ConfirmationTemplateEditorProps) {
  const settings = getConfirmationTemplateSettings(study);
  const [template, setTemplate] = useState(settings.template);
  const [enableRescheduleLink, setEnableRescheduleLink] = useState(
    settings.enableRescheduleLink,
  );
  const [enableCancelLink, setEnableCancelLink] = useState(
    settings.enableCancelLink,
  );
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const confirmationTemplate = validateConfirmationTemplate(template);
      await saveStudy({
        ...study,
        notificationSettings: {
          ...study.notificationSettings,
          confirmationTemplate,
          enableRescheduleLink,
          enableCancelLink,
        },
      });
      setMessage("Confirmation template saved locally.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to save the confirmation template.",
      );
    }
  }

  return (
    <section
      aria-labelledby="confirmation-template-heading"
      className="confirmation-template-editor"
    >
      <header>
        <p>Participant communications</p>
        <h2 id="confirmation-template-heading">Booking confirmation</h2>
      </header>
      {message !== null ? (
        <p aria-live="polite" className="confirmation-template-editor__message">
          {message}
        </p>
      ) : null}
      <form onSubmit={submit}>
        <label htmlFor="confirmation-template">
          Confirmation template
          <textarea
            id="confirmation-template"
            onChange={(event) => setTemplate(event.target.value)}
            value={template}
          />
        </label>
        <p className="confirmation-template-editor__help">
          Available fields: {"{{participantName}}"}, {"{{studyName}}"},{" "}
          {"{{visits}}"}, {"{{location}}"}, and {"{{managementLinks}}"}.
        </p>
        <fieldset>
          <legend>Booking management links</legend>
          <label htmlFor="confirmation-reschedule-link">
            <input
              checked={enableRescheduleLink}
              id="confirmation-reschedule-link"
              onChange={(event) =>
                setEnableRescheduleLink(event.target.checked)
              }
              type="checkbox"
            />
            Include reschedule booking link
          </label>
          <label htmlFor="confirmation-cancel-link">
            <input
              checked={enableCancelLink}
              id="confirmation-cancel-link"
              onChange={(event) => setEnableCancelLink(event.target.checked)}
              type="checkbox"
            />
            Include cancel booking link
          </label>
        </fieldset>
        <button type="submit">Save confirmation template</button>
      </form>
    </section>
  );
}
