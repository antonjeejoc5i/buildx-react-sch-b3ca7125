import { useState } from "react";
import type { FormEvent } from "react";
import type {
  Booking,
  BookingVisit,
  Slot,
  Study,
  WaitlistEntry,
} from "../../domain/models.ts";
import {
  buildBackupSlot,
  calculateSlotCapacity,
  getWaitlistCount,
  promoteBackupSlot,
  type BackupSlotValues,
} from "./slotManagementData.ts";
import "./SlotManagement.css";

interface SlotManagementProps {
  study: Study;
  slots: Slot[];
  bookings: Booking[];
  bookingVisits: BookingVisit[];
  waitlistEntries: WaitlistEntry[];
  saveSlot: (slot: Slot) => Promise<void>;
}

const initialBackupValues: BackupSlotValues = {
  startsAtUtc: "2026-06-15T15:00:00.000Z",
  durationMinutes: "30",
  capacity: "1",
};

function durationMinutes(slot: Slot): number {
  return Math.round(
    (new Date(slot.endsAtUtc).getTime() -
      new Date(slot.startsAtUtc).getTime()) /
      60000,
  );
}

export default function SlotManagement({
  study,
  slots,
  bookings,
  bookingVisits,
  waitlistEntries,
  saveSlot,
}: SlotManagementProps) {
  const [values, setValues] = useState(initialBackupValues);
  const [message, setMessage] = useState<string | null>(null);
  const studySlots = slots.filter((slot) => slot.studyId === study.id);
  const visitId = study.visits[0]?.id;

  function updateValue<Key extends keyof BackupSlotValues>(
    key: Key,
    value: BackupSlotValues[Key],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function createBackupSlot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (visitId === undefined) {
      setMessage("Add a visit before creating a backup slot.");
      return;
    }

    try {
      const backupSlot = buildBackupSlot(
        `slot-backup-${Date.now()}`,
        study.id,
        visitId,
        values,
      );
      await saveSlot(backupSlot);
      setMessage(
        "Backup slot saved locally. It is unavailable until promoted.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to save backup slot.",
      );
    }
  }

  async function promote(slot: Slot) {
    try {
      await saveSlot(promoteBackupSlot(slot));
      setMessage("Backup slot promoted and now available to participants.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to promote backup slot.",
      );
    }
  }

  return (
    <section
      aria-labelledby="slot-management-heading"
      className="slot-management"
    >
      <header>
        <p>Booking controls</p>
        <h2 id="slot-management-heading">Slot capacity and backup slots</h2>
        <p>
          Slot capacity is enforced separately from quota limits and room
          informational capacity.
        </p>
      </header>
      {message !== null ? (
        <p aria-live="polite" className="slot-management__message">
          {message}
        </p>
      ) : null}
      <div className="slot-management__slots">
        {studySlots.map((slot) => {
          const capacity = calculateSlotCapacity(slot, bookingVisits, bookings);
          const waitingCount = getWaitlistCount(slot.id, waitlistEntries);
          return (
            <article className="slot-management__slot" key={slot.id}>
              <h3>
                {slot.status === "backup" ? "Backup slot" : "Primary slot"}
              </h3>
              <p>
                {new Date(slot.startsAtUtc).toLocaleString()} ·{" "}
                {durationMinutes(slot)}
                {" minutes"}
              </p>
              <dl>
                <div>
                  <dt>Booked</dt>
                  <dd>{capacity.booked}</dd>
                </div>
                <div>
                  <dt>Capacity</dt>
                  <dd>{slot.capacity}</dd>
                </div>
                <div>
                  <dt>Availability</dt>
                  <dd>
                    {slot.status === "backup"
                      ? "Unavailable until promoted"
                      : capacity.isFull
                        ? "Full"
                        : `${capacity.remaining} remaining`}
                  </dd>
                </div>
                <div>
                  <dt>Waitlist records</dt>
                  <dd>{waitingCount}</dd>
                </div>
              </dl>
              {slot.status === "backup" ? (
                <button onClick={() => void promote(slot)} type="button">
                  Promote backup slot
                </button>
              ) : null}
            </article>
          );
        })}
      </div>
      <form className="slot-management__form" onSubmit={createBackupSlot}>
        <h3>Add backup slot</h3>
        <p>
          Backup slots can use a different duration and do not create or alter
          waitlist records.
        </p>
        <label htmlFor="backup-slot-start">
          Backup slot start (UTC)
          <input
            id="backup-slot-start"
            onChange={(event) => updateValue("startsAtUtc", event.target.value)}
            type="datetime-local"
            value={values.startsAtUtc.slice(0, 16)}
          />
        </label>
        <label htmlFor="backup-slot-duration">
          Backup slot duration in minutes
          <input
            id="backup-slot-duration"
            min="1"
            onChange={(event) =>
              updateValue("durationMinutes", event.target.value)
            }
            type="number"
            value={values.durationMinutes}
          />
        </label>
        <label htmlFor="backup-slot-capacity">
          Backup slot capacity
          <input
            id="backup-slot-capacity"
            min="1"
            onChange={(event) => updateValue("capacity", event.target.value)}
            type="number"
            value={values.capacity}
          />
        </label>
        <button type="submit">Save backup slot</button>
      </form>
    </section>
  );
}
