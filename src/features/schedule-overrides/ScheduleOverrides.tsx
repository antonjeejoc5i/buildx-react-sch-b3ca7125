import { useState } from "react";
import type { FormEvent } from "react";
import type {
  Booking,
  BookingVisit,
  Facility,
  Participant,
  ScheduleOverride,
  SchedulePattern,
  Slot,
} from "../../domain/models.ts";
import {
  buildOverridePreview,
  getCalendarState,
  type OverridePreview,
  type OverrideValues,
} from "./scheduleOverrideData.ts";
import "./ScheduleOverrides.css";

interface ScheduleOverridesProps {
  facility: Facility;
  pattern: SchedulePattern;
  overrides: ScheduleOverride[];
  slots: Slot[];
  bookingVisits: BookingVisit[];
  bookings: Booking[];
  participants: Participant[];
  saveOverride: (override: ScheduleOverride) => Promise<void>;
}

function initialValues(pattern: SchedulePattern): OverrideValues {
  return {
    date: pattern.startsOn,
    availability: "available",
    startsAt: pattern.operatingWindow.startsAt,
    endsAt: pattern.operatingWindow.endsAt,
    slotLengthMinutes: String(pattern.slotLengthMinutes),
    bufferMinutes: String(pattern.bufferMinutes),
    addedSlots: "",
    removedSlotIds: [],
  };
}

export default function ScheduleOverrides({
  facility,
  pattern,
  overrides,
  slots,
  bookingVisits,
  bookings,
  participants,
  saveOverride,
}: ScheduleOverridesProps) {
  const [values, setValues] = useState(() => initialValues(pattern));
  const [preview, setPreview] = useState<OverridePreview | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const existingOverride = overrides.find(
    (override) =>
      override.schedulePatternId === pattern.id &&
      override.date === values.date,
  );
  const affectedNames = preview?.affectedBookingVisits.map((visit) => {
    const booking = bookings.find((item) => item.id === visit.bookingId);
    return (
      participants.find((item) => item.id === booking?.participantId)?.name ??
      "Unknown participant"
    );
  });

  function update<Key extends keyof OverrideValues>(
    key: Key,
    value: OverrideValues[Key],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    setPreview(null);
    setMessage(null);
  }

  function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setPreview(
        buildOverridePreview(
          existingOverride?.id ?? `override-${pattern.id}-${values.date}`,
          pattern,
          facility,
          values,
          slots,
          bookingVisits,
        ),
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to review schedule change.",
      );
    }
  }

  async function confirm() {
    if (preview === null) return;
    try {
      await saveOverride(preview.override);
      setPreview(null);
      setMessage("Schedule override saved locally.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to save schedule override.",
      );
    }
  }

  return (
    <section
      aria-labelledby="schedule-overrides-heading"
      className="schedule-overrides"
    >
      <header>
        <p>Schedule calendar</p>
        <h1 id="schedule-overrides-heading">Date overrides</h1>
        <p>
          Normal dates use the recurring schedule. Blackout dates have no
          availability.
        </p>
      </header>
      {message !== null ? (
        <p aria-live="polite" className="schedule-overrides__message">
          {message}
        </p>
      ) : null}
      <div
        className="schedule-overrides__calendar"
        aria-label="Calendar states"
      >
        {facility.blackoutDates.map((date) => (
          <span key={date}>
            {date}: {getCalendarState(date, facility, overrides)}
          </span>
        ))}
        {overrides.map((override) => (
          <span key={override.id}>
            {override.date}:{" "}
            {getCalendarState(override.date, facility, overrides)}
          </span>
        ))}
        <span>
          {values.date}: {getCalendarState(values.date, facility, overrides)}
        </span>
      </div>
      <form className="schedule-overrides__card" onSubmit={review}>
        <label htmlFor="override-date">
          Date
          <input
            id="override-date"
            onChange={(event) => update("date", event.target.value)}
            type="date"
            value={values.date}
          />
        </label>
        <label htmlFor="override-availability">
          Availability
          <select
            id="override-availability"
            onChange={(event) =>
              update(
                "availability",
                event.target.value as OverrideValues["availability"],
              )
            }
            value={values.availability}
          >
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </label>
        <label htmlFor="override-start">
          Operating window start
          <input
            disabled={values.availability === "unavailable"}
            id="override-start"
            onChange={(event) => update("startsAt", event.target.value)}
            type="time"
            value={values.startsAt}
          />
        </label>
        <label htmlFor="override-end">
          Operating window end
          <input
            disabled={values.availability === "unavailable"}
            id="override-end"
            onChange={(event) => update("endsAt", event.target.value)}
            type="time"
            value={values.endsAt}
          />
        </label>
        <label htmlFor="override-length">
          Slot length in minutes
          <input
            disabled={values.availability === "unavailable"}
            id="override-length"
            min="1"
            onChange={(event) =>
              update("slotLengthMinutes", event.target.value)
            }
            type="number"
            value={values.slotLengthMinutes}
          />
        </label>
        <label htmlFor="override-buffer">
          Buffer in minutes
          <input
            disabled={values.availability === "unavailable"}
            id="override-buffer"
            min="0"
            onChange={(event) => update("bufferMinutes", event.target.value)}
            type="number"
            value={values.bufferMinutes}
          />
        </label>
        <label htmlFor="override-added">
          Added slot start times
          <input
            disabled={values.availability === "unavailable"}
            id="override-added"
            onChange={(event) => update("addedSlots", event.target.value)}
            placeholder="13:00, 14:30"
            value={values.addedSlots}
          />
        </label>
        <button type="submit">
          {existingOverride === undefined
            ? "Review schedule change"
            : "Review replacement override"}
        </button>
      </form>
      {preview !== null ? (
        <section
          aria-labelledby="override-confirm-heading"
          className="schedule-overrides__confirmation"
          role="dialog"
        >
          <h2 id="override-confirm-heading">Confirm schedule change</h2>
          {existingOverride !== undefined ? (
            <p>This date already has an override. Confirm to replace it.</p>
          ) : null}
          <p>
            {preview.override.availability === "unavailable"
              ? "This date will have no availability."
              : "Availability will use this date-level override."}
          </p>
          <h3>Affected bookings</h3>
          {affectedNames?.length === 0 ? (
            <p>No bookings are affected.</p>
          ) : (
            <ul>
              {affectedNames?.map((name, index) => (
                <li key={`${name}-${index}`}>{name}</li>
              ))}
            </ul>
          )}
          <button onClick={() => void confirm()} type="button">
            Confirm schedule change
          </button>
          <button
            className="schedule-overrides__secondary"
            onClick={() => setPreview(null)}
            type="button"
          >
            Cancel
          </button>
        </section>
      ) : null}
    </section>
  );
}
