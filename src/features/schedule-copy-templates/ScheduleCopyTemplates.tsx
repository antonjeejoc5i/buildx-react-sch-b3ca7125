import { useState } from "react";
import type {
  Facility,
  ScheduleOverride,
  SchedulePattern,
  ScheduleTemplate,
  Study,
} from "../../domain/models.ts";
import {
  applyScheduleTemplate,
  copySchedule,
  createScheduleTemplate,
  duplicateScheduleTemplate,
  renameScheduleTemplate,
} from "./scheduleCopyTemplatesData.ts";
import "./ScheduleCopyTemplates.css";

interface ScheduleCopyTemplatesProps {
  study: Study;
  studies: Study[];
  facilities: Facility[];
  patterns: SchedulePattern[];
  overrides: ScheduleOverride[];
  templates: ScheduleTemplate[];
  savePattern: (pattern: SchedulePattern) => Promise<void>;
  saveOverride: (override: ScheduleOverride) => Promise<void>;
  saveTemplate: (template: ScheduleTemplate) => Promise<void>;
}

type CopySourceType = "study" | "facility";

interface ScheduleSource {
  patterns: SchedulePattern[];
  overrides: ScheduleOverride[];
}

function scheduleForStudy(
  studyId: string,
  patterns: SchedulePattern[],
  overrides: ScheduleOverride[],
): ScheduleSource {
  const selectedPatterns = patterns.filter(
    (pattern) => pattern.studyId === studyId,
  );
  const patternIds = selectedPatterns.map((pattern) => pattern.id);
  return {
    patterns: selectedPatterns,
    overrides: overrides.filter((override) =>
      patternIds.includes(override.schedulePatternId),
    ),
  };
}

function scheduleForFacility(
  facilityId: string,
  studies: Study[],
  patterns: SchedulePattern[],
  overrides: ScheduleOverride[],
): ScheduleSource {
  const facilityStudyIds = studies
    .filter((item) => item.facilityId === facilityId)
    .map((item) => item.id);
  const selectedPatterns = patterns.filter((pattern) =>
    facilityStudyIds.includes(pattern.studyId),
  );
  const patternIds = selectedPatterns.map((pattern) => pattern.id);
  return {
    patterns: selectedPatterns,
    overrides: overrides.filter((override) =>
      patternIds.includes(override.schedulePatternId),
    ),
  };
}

export default function ScheduleCopyTemplates({
  study,
  studies,
  facilities,
  patterns,
  overrides,
  templates,
  savePattern,
  saveOverride,
  saveTemplate,
}: ScheduleCopyTemplatesProps) {
  const [sourceType, setSourceType] = useState<CopySourceType>("study");
  const [sourceId, setSourceId] = useState(study.id);
  const [templateName, setTemplateName] = useState("");
  const [templateNames, setTemplateNames] = useState<Record<string, string>>(
    {},
  );
  const [message, setMessage] = useState<string | null>(null);
  const destinationVisitId = study.visits[0]?.id ?? "";

  function createId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  async function persistSchedule(schedule: ScheduleSource): Promise<void> {
    await Promise.all(schedule.patterns.map((pattern) => savePattern(pattern)));
    await Promise.all(
      schedule.overrides.map((override) => saveOverride(override)),
    );
  }

  function selectSourceType(nextSourceType: CopySourceType) {
    setSourceType(nextSourceType);
    setSourceId(
      nextSourceType === "study" ? study.id : (facilities[0]?.id ?? ""),
    );
    setMessage(null);
  }

  async function copySelectedSchedule() {
    try {
      const source =
        sourceType === "study"
          ? scheduleForStudy(sourceId, patterns, overrides)
          : scheduleForFacility(sourceId, studies, patterns, overrides);
      if (source.patterns.length === 0) {
        setMessage("The selected source has no recurring schedule patterns.");
        return;
      }
      const copied = copySchedule(
        source.patterns,
        source.overrides,
        study.id,
        destinationVisitId,
        createId("schedule-copy"),
      );
      await persistSchedule(copied);
      setMessage("Schedule patterns and override structure copied locally.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to copy schedule.",
      );
    }
  }

  async function saveCurrentScheduleAsTemplate() {
    try {
      const currentSchedule = scheduleForStudy(study.id, patterns, overrides);
      await saveTemplate(
        createScheduleTemplate(
          createId("template"),
          templateName,
          currentSchedule.patterns,
          currentSchedule.overrides,
        ),
      );
      setTemplateName("");
      setMessage("Schedule template saved locally.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to save schedule template.",
      );
    }
  }

  async function applyTemplate(template: ScheduleTemplate) {
    try {
      const copied = applyScheduleTemplate(
        template,
        study.id,
        destinationVisitId,
        createId("template-apply"),
      );
      await persistSchedule(copied);
      setMessage(`Template “${template.name}” applied as an editable copy.`);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to apply template.",
      );
    }
  }

  async function editTemplate(template: ScheduleTemplate) {
    try {
      await saveTemplate(
        renameScheduleTemplate(
          template,
          templateNames[template.id] ?? template.name,
        ),
      );
      setMessage("Schedule template updated locally.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to update template.",
      );
    }
  }

  async function duplicateTemplate(template: ScheduleTemplate) {
    try {
      await saveTemplate(
        duplicateScheduleTemplate(template, createId("template-copy")),
      );
      setMessage("Schedule template duplicated locally.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to duplicate template.",
      );
    }
  }

  async function archiveTemplate(template: ScheduleTemplate) {
    try {
      await saveTemplate({ ...template, archived: true });
      setMessage("Schedule template archived locally.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to archive template.",
      );
    }
  }

  const sourceOptions = sourceType === "study" ? studies : facilities;

  return (
    <section
      aria-labelledby="schedule-copy-templates-heading"
      className="schedule-copy-templates"
    >
      <header>
        <p>Schedule reuse</p>
        <h2 id="schedule-copy-templates-heading">
          Copy schedules and templates
        </h2>
        <p>
          Only recurring patterns and override structure are reused. Location,
          quotas, and bookings are never copied.
        </p>
      </header>
      {message !== null ? (
        <p aria-live="polite" className="schedule-copy-templates__message">
          {message}
        </p>
      ) : null}
      <section
        aria-labelledby="copy-schedule-heading"
        className="schedule-copy-templates__card"
      >
        <h3 id="copy-schedule-heading">Copy from a study or facility</h3>
        <label htmlFor="schedule-copy-source-type">
          Copy source type
          <select
            id="schedule-copy-source-type"
            onChange={(event) =>
              selectSourceType(event.target.value as CopySourceType)
            }
            value={sourceType}
          >
            <option value="study">Study</option>
            <option value="facility">Facility</option>
          </select>
        </label>
        <label htmlFor="schedule-copy-source-record">
          {sourceType === "study" ? "Source study" : "Source facility"}
          <select
            id="schedule-copy-source-record"
            onChange={(event) => setSourceId(event.target.value)}
            value={sourceId}
          >
            {sourceOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <button onClick={() => void copySelectedSchedule()} type="button">
          Copy schedule
        </button>
      </section>
      <section
        aria-labelledby="save-template-heading"
        className="schedule-copy-templates__card"
      >
        <h3 id="save-template-heading">Save this schedule as a template</h3>
        <label htmlFor="schedule-template-name">
          Template name
          <input
            id="schedule-template-name"
            onChange={(event) => setTemplateName(event.target.value)}
            value={templateName}
          />
        </label>
        <button
          onClick={() => void saveCurrentScheduleAsTemplate()}
          type="button"
        >
          Save template
        </button>
      </section>
      <section aria-labelledby="reusable-templates-heading">
        <h3 id="reusable-templates-heading">Reusable templates</h3>
        <div className="schedule-copy-templates__list">
          {templates.map((template) => (
            <article
              className="schedule-copy-templates__card"
              key={template.id}
            >
              <label htmlFor={`template-name-${template.id}`}>
                Template name
                <input
                  id={`template-name-${template.id}`}
                  onChange={(event) =>
                    setTemplateNames((current) => ({
                      ...current,
                      [template.id]: event.target.value,
                    }))
                  }
                  value={templateNames[template.id] ?? template.name}
                />
              </label>
              <p>
                {template.recurringPatterns.length} recurring pattern
                {template.recurringPatterns.length === 1 ? "" : "s"}.{" "}
                {template.archived ? "Archived." : "Active."}
              </p>
              <div className="schedule-copy-templates__actions">
                <button
                  onClick={() => void editTemplate(template)}
                  type="button"
                >
                  Save changes
                </button>
                <button
                  className="schedule-copy-templates__secondary"
                  onClick={() => void duplicateTemplate(template)}
                  type="button"
                >
                  Duplicate
                </button>
                <button
                  className="schedule-copy-templates__secondary"
                  disabled={template.archived}
                  onClick={() => void archiveTemplate(template)}
                  type="button"
                >
                  Archive
                </button>
                <button
                  disabled={template.archived}
                  onClick={() => void applyTemplate(template)}
                  type="button"
                >
                  Apply to this study
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
