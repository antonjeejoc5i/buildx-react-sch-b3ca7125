import { useState } from "react";
import type { FormEvent } from "react";
import type { DemoUser, Study } from "../../domain/models.ts";
import { createDraftStudy, createStudyId } from "./studyEditorData.ts";
import "./CreateStudyForm.css";

interface CreateStudyFormProps {
  actor: DemoUser;
  studies: Study[];
  createStudy: (study: Study, actorId: string) => Promise<void>;
}

/** Creates a Draft study, then opens its workspace so the researcher can finish setup. */
export default function CreateStudyForm({
  actor,
  studies,
  createStudy,
}: CreateStudyFormProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed === "") {
      setError("Study name is required.");
      return;
    }
    const id = createStudyId(
      trimmed,
      studies.map((study) => study.id),
    );
    setIsSaving(true);
    try {
      await createStudy({ ...createDraftStudy(id), name: trimmed }, actor.id);
      setName("");
      setError(null);
      window.location.hash = `#/studies/${id}`;
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to create the study.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form
      aria-label="Create study"
      className="create-study-form"
      noValidate
      onSubmit={submit}
    >
      <label htmlFor="create-study-name">New study name</label>
      <div className="create-study-form__row">
        <input
          aria-describedby={
            error === null ? undefined : "create-study-name-error"
          }
          aria-invalid={error === null ? undefined : true}
          id="create-study-name"
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Evening Habits Study"
          value={name}
        />
        <button disabled={isSaving} type="submit">
          Create study
        </button>
      </div>
      {error === null ? (
        <p className="create-study-form__hint">
          Saved locally as a Draft. You can add the facility, room, Decipher
          project and visits next.
        </p>
      ) : (
        <p
          className="create-study-form__error"
          id="create-study-name-error"
          role="alert"
        >
          {error}
        </p>
      )}
    </form>
  );
}
