import { useState } from "react";
import type { FormEvent } from "react";
import type { Facility, Room, Study } from "../../domain/models.ts";
import {
  buildStudy,
  studyLifecycleOptions,
  type StudyEditorValues,
} from "./studyEditorData.ts";
import "./StudyEditor.css";

interface StudyEditorProps {
  study: Study;
  facilities: Facility[];
  rooms: Room[];
  saveStudy: (study: Study) => Promise<void>;
}

function initialValues(study: Study): StudyEditorValues {
  const visit = study.visits[0];
  return {
    name: study.name,
    description: study.description,
    decipherProjectId: study.decipherProjectId,
    lifecycleStatus: study.lifecycleStatus,
    facilityId: study.facilityId,
    roomId: study.roomId,
    visitName: visit?.name ?? "",
    visitDurationMinutes: visit?.durationMinutes.toString() ?? "",
    allowSelfServiceReschedule:
      study.bookingControls.allowSelfServiceReschedule === true,
    maxReschedules: String(study.bookingControls.maxReschedules ?? 0),
    reminderHoursBefore: String(
      study.notificationSettings.sendReminderHoursBefore ?? 24,
    ),
  };
}

export default function StudyEditor({
  study,
  facilities,
  rooms,
  saveStudy,
}: StudyEditorProps) {
  const [values, setValues] = useState(() => initialValues(study));
  const [message, setMessage] = useState<string | null>(null);
  const availableRooms = rooms.filter(
    (room) => room.facilityId === values.facilityId,
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const nextStudy = buildStudy(study, values, facilities, rooms);
      await saveStudy(nextStudy);
      setMessage(
        nextStudy.lifecycleStatus === "open"
          ? "Study is open for booking."
          : "Study saved locally.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to save the study.",
      );
    }
  }

  return (
    <section aria-labelledby="study-editor-heading" className="study-editor">
      <header>
        <p>Study editor</p>
        <h1 id="study-editor-heading">{study.name}</h1>
      </header>
      {message !== null ? (
        <p aria-live="polite" className="study-editor__message">
          {message}
        </p>
      ) : null}
      <form className="study-editor__card" onSubmit={submit}>
        <h2>Study details</h2>
        <label htmlFor="study-name">
          Study name
          <input
            id="study-name"
            onChange={(event) =>
              setValues((current) => ({ ...current, name: event.target.value }))
            }
            value={values.name}
          />
        </label>
        <label htmlFor="study-description">
          Description
          <textarea
            id="study-description"
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
            value={values.description}
          />
        </label>
        <label htmlFor="study-status">
          Lifecycle status
          <select
            id="study-status"
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                lifecycleStatus: event.target
                  .value as StudyEditorValues["lifecycleStatus"],
              }))
            }
            value={values.lifecycleStatus}
          >
            {studyLifecycleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <h2>Booking location</h2>
        <label htmlFor="study-facility">
          Facility
          <select
            id="study-facility"
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                facilityId: event.target.value,
                roomId: rooms.some(
                  (room) =>
                    room.id === current.roomId &&
                    room.facilityId === event.target.value,
                )
                  ? current.roomId
                  : "",
              }))
            }
            value={values.facilityId}
          >
            <option value="">Select a facility</option>
            {facilities.map((facility) => (
              <option key={facility.id} value={facility.id}>
                {facility.name}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor="study-room">
          Room
          <select
            disabled={values.facilityId === ""}
            id="study-room"
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                roomId: event.target.value,
              }))
            }
            value={values.roomId}
          >
            <option value="">Select a room</option>
            {availableRooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor="study-decipher-project">
          Simulated Decipher project ID
          <input
            id="study-decipher-project"
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                decipherProjectId: event.target.value,
              }))
            }
            value={values.decipherProjectId}
          />
        </label>
        <h2>Visit</h2>
        <label htmlFor="study-visit-name">
          Visit name
          <input
            id="study-visit-name"
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                visitName: event.target.value,
              }))
            }
            value={values.visitName}
          />
        </label>
        <label htmlFor="study-visit-duration">
          Visit duration in minutes
          <input
            id="study-visit-duration"
            min="1"
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                visitDurationMinutes: event.target.value,
              }))
            }
            type="number"
            value={values.visitDurationMinutes}
          />
        </label>
        <h2>Booking controls</h2>
        <label className="study-editor__checkbox" htmlFor="study-reschedule">
          <input
            checked={values.allowSelfServiceReschedule}
            id="study-reschedule"
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                allowSelfServiceReschedule: event.target.checked,
              }))
            }
            type="checkbox"
          />
          Allow self-service rescheduling
        </label>
        <label htmlFor="study-max-reschedules">
          Maximum self-service reschedules
          <input
            id="study-max-reschedules"
            min="0"
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                maxReschedules: event.target.value,
              }))
            }
            type="number"
            value={values.maxReschedules}
          />
        </label>
        <h2>Notifications</h2>
        <label htmlFor="study-reminder-hours">
          Send reminder hours before visit
          <input
            id="study-reminder-hours"
            min="0"
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                reminderHoursBefore: event.target.value,
              }))
            }
            type="number"
            value={values.reminderHoursBefore}
          />
        </label>
        <button type="submit">
          {values.lifecycleStatus === "open"
            ? "Open for booking"
            : "Save study"}
        </button>
      </form>
    </section>
  );
}
