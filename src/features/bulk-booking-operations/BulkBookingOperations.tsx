import { useState } from "react";
import type {
  AuditEvent,
  Booking,
  BookingVisit,
  DemoUser,
  NotificationEvent,
  Study,
} from "../../domain/models.ts";
import type { DemoFixtures } from "../../fixtures/demoFixtures.ts";
import {
  buildBulkBookingOperation,
  previewBulkBookingOperation,
  type BulkBookingAction,
} from "./bulkBookingOperationsData.ts";
import "./BulkBookingOperations.css";

interface BulkBookingOperationsProps {
  actor: DemoUser;
  data: DemoFixtures;
  study: Study;
  saveBulkBookingOperation: (
    bookings: Booking[],
    bookingVisits: BookingVisit[],
    notificationEvents: NotificationEvent[],
    auditEvents: AuditEvent[],
  ) => Promise<void>;
}

const actionLabels: Record<BulkBookingAction, string> = {
  reschedule: "Reschedule selected bookings",
  cancel: "Cancel selected bookings",
  notify: "Send appointment update",
};

export default function BulkBookingOperations({
  actor,
  data,
  study,
  saveBulkBookingOperation,
}: BulkBookingOperationsProps) {
  const [action, setAction] = useState<BulkBookingAction>("notify");
  const [bookingIds, setBookingIds] = useState<string[]>([]);
  const [replacementSlotByVisit, setReplacementSlotByVisit] = useState<
    Record<string, string>
  >({});
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const preview = previewBulkBookingOperation(
    { action, actor, study, bookingIds, replacementSlotByVisit },
    data,
  );
  const studyBookings = data.bookings.filter(
    (booking) => booking.studyId === study.id && booking.status === "confirmed",
  );

  function toggleBooking(bookingId: string, checked: boolean) {
    setBookingIds((current) =>
      checked
        ? [...current, bookingId]
        : current.filter((currentId) => currentId !== bookingId),
    );
    setHasConfirmed(false);
  }

  async function execute() {
    const result = buildBulkBookingOperation(
      {
        action,
        actor,
        study,
        bookingIds,
        replacementSlotByVisit,
        confirmed: hasConfirmed,
        now: new Date().toISOString(),
      },
      data,
    );
    setIsSaving(true);
    try {
      await saveBulkBookingOperation(
        result.bookings,
        result.bookingVisits,
        result.notificationEvents,
        result.auditEvents,
      );
      setBookingIds([]);
      setHasConfirmed(false);
      setMessage(
        `${result.bookings.length} booking${result.bookings.length === 1 ? "" : "s"} updated. Bulk audit ID: ${result.bulkAuditId}.`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to complete the bulk booking operation.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section
      aria-labelledby="bulk-booking-operations-heading"
      className="bulk-booking-operations"
    >
      <h2 id="bulk-booking-operations-heading">Bulk booking operations</h2>
      <p>
        Preview only confirmed bookings within your selected study scope before
        confirming a researcher action.
      </p>
      {message === null ? null : (
        <p aria-live="polite" role="status">
          {message}
        </p>
      )}
      <label className="bulk-booking-operations__field">
        Bulk action
        <select
          value={action}
          onChange={(event) => {
            setAction(event.target.value as BulkBookingAction);
            setHasConfirmed(false);
          }}
        >
          {Object.entries(actionLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <fieldset className="bulk-booking-operations__bookings">
        <legend>Confirmed bookings to affect</legend>
        {studyBookings.map((booking) => {
          const participant = data.participants.find(
            (item) => item.id === booking.participantId,
          );
          return (
            <label key={booking.id}>
              <input
                checked={bookingIds.includes(booking.id)}
                type="checkbox"
                onChange={(event) =>
                  toggleBooking(booking.id, event.target.checked)
                }
              />
              {participant?.name ?? booking.participantId}
            </label>
          );
        })}
      </fieldset>
      {action === "reschedule" ? (
        <div className="bulk-booking-operations__replacements">
          <h3>Replacement appointments</h3>
          {study.visits.map((visit) => (
            <label key={visit.id} className="bulk-booking-operations__field">
              {visit.name}
              <select
                value={replacementSlotByVisit[visit.id] ?? ""}
                onChange={(event) => {
                  setReplacementSlotByVisit((current) => ({
                    ...current,
                    [visit.id]: event.target.value,
                  }));
                  setHasConfirmed(false);
                }}
              >
                <option value="">Select a replacement slot</option>
                {data.slots
                  .filter(
                    (slot) =>
                      slot.studyId === study.id &&
                      slot.visitId === visit.id &&
                      slot.status === "primary",
                  )
                  .map((slot) => (
                    <option key={slot.id} value={slot.id}>
                      {new Date(slot.startsAtUtc).toLocaleString()}
                    </option>
                  ))}
              </select>
            </label>
          ))}
        </div>
      ) : null}
      <div className="bulk-booking-operations__preview">
        <h3>Operation preview</h3>
        <p>
          {preview.affectedBookings.length} confirmed booking(s) will be
          affected.
        </p>
        {preview.conflicts.length === 0 ? (
          <p>There are no conflicts to resolve.</p>
        ) : (
          <ul aria-label="Bulk operation conflicts">
            {preview.conflicts.map((conflict) => (
              <li key={conflict}>{conflict}</li>
            ))}
          </ul>
        )}
      </div>
      <label className="bulk-booking-operations__confirmation">
        <input
          checked={hasConfirmed}
          disabled={preview.conflicts.length > 0}
          type="checkbox"
          onChange={(event) => setHasConfirmed(event.target.checked)}
        />
        I reviewed this preview and confirm this bulk action.
      </label>
      <button
        disabled={isSaving || preview.conflicts.length > 0 || !hasConfirmed}
        type="button"
        onClick={() => void execute()}
      >
        Execute bulk action
      </button>
    </section>
  );
}
