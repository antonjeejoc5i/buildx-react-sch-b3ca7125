import { useState } from "react";
import type {
  Booking,
  BookingVisit,
  Participant,
  Study,
} from "../../domain/models.ts";
import type { DemoFixtures } from "../../fixtures/demoFixtures.ts";
import { formatHandoffTime } from "../decipher-handoff/decipherHandoffData.ts";
import {
  availablePrimarySlots,
  bookingRuleMessage,
  buildConfirmedBooking,
  evaluateBookingPlan,
  type BookingRuleFailure,
} from "./bookingFlowData.ts";
import "./BookingFlow.css";

interface BookingFlowProps {
  data: DemoFixtures;
  participant: Participant;
  study: Study;
  /** Saves the confirmed booking locally, so it is still there after a reload. */
  saveParticipation?: (
    booking: Booking,
    bookingVisits: BookingVisit[],
  ) => Promise<void>;
  /** Called with the saved booking's id once it is confirmed. */
  onConfirmed?: (bookingId: string) => void;
}

export default function BookingFlow({
  data,
  participant,
  study,
  saveParticipation,
  onConfirmed,
}: BookingFlowProps) {
  const [saveError, setSaveError] = useState<string | null>(null);
  const [selectedSlotByVisit, setSelectedSlotByVisit] = useState<
    Record<string, string>
  >({});
  const [visitIndex, setVisitIndex] = useState(0);
  const [failures, setFailures] = useState<
    Array<{ visitId: string; reason: BookingRuleFailure }>
  >([]);
  const [confirmed, setConfirmed] = useState(false);
  const visit = study.visits[visitIndex];

  function selectSlot(slotId: string) {
    if (visit === undefined) return;
    setSelectedSlotByVisit((current) => ({ ...current, [visit.id]: slotId }));
    setFailures([]);
    setVisitIndex((current) => current + 1);
  }

  async function confirmBooking() {
    const evaluation = evaluateBookingPlan(
      data,
      study,
      participant,
      selectedSlotByVisit,
    );
    if (!evaluation.allowed) {
      setFailures(evaluation.failures);
      return;
    }
    const { booking, bookingVisits } = buildConfirmedBooking(
      data,
      study,
      participant,
      selectedSlotByVisit,
      `booking-${crypto.randomUUID()}`,
      new Date().toISOString(),
    );
    try {
      setSaveError(null);
      onConfirmed?.(booking.id);
      await saveParticipation?.(booking, bookingVisits);
      setConfirmed(true);
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "The booking could not be saved locally.",
      );
    }
  }

  if (confirmed) {
    return (
      <section
        aria-labelledby="booking-confirmed-heading"
        className="booking-flow"
        role="status"
      >
        <h2 id="booking-confirmed-heading">Booking confirmed</h2>
        <p>
          Your selected visits were revalidated and confirmed in this local
          booking flow.
        </p>
      </section>
    );
  }

  if (visit === undefined) {
    return (
      <section
        aria-labelledby="review-booking-heading"
        className="booking-flow"
      >
        <h2 id="review-booking-heading">Review your booking</h2>
        <p className="booking-flow__hold">
          Your selections are held locally while you complete this booking flow.
          They are revalidated before confirmation.
        </p>
        <ol className="booking-flow__review-list">
          {study.visits.map((studyVisit) => {
            const slot = data.slots.find(
              (item) => item.id === selectedSlotByVisit[studyVisit.id],
            );
            return (
              <li key={studyVisit.id}>
                <strong>{studyVisit.name}</strong>
                <span>
                  {slot === undefined
                    ? "No slot selected"
                    : formatHandoffTime(
                        slot.startsAtUtc,
                        participant.language,
                        participant.timeZone,
                      )}
                </span>
              </li>
            );
          })}
        </ol>
        {failures.length > 0 ? (
          <div
            aria-live="assertive"
            className="booking-flow__failure"
            role="alert"
          >
            <p>
              We could not confirm every visit. Choose a new available slot or
              contact the research team about waitlist availability.
            </p>
            <ul>
              {failures.map((failure) => {
                const failedVisit = study.visits.find(
                  (item) => item.id === failure.visitId,
                );
                return (
                  <li key={failure.visitId}>
                    <p>{bookingRuleMessage(failure.reason)}</p>
                    <button
                      type="button"
                      onClick={() =>
                        setVisitIndex(
                          study.visits.findIndex(
                            (item) => item.id === failure.visitId,
                          ),
                        )
                      }
                    >
                      Choose another slot for{" "}
                      {failedVisit?.name ?? "this visit"}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
        <div className="booking-flow__actions">
          <button
            type="button"
            onClick={() => setVisitIndex(study.visits.length - 1)}
          >
            Back to selection
          </button>
          <button type="button" onClick={() => void confirmBooking()}>
            Confirm booking
          </button>
        </div>
        {saveError === null ? null : (
          <p className="booking-flow__failure" role="alert">
            {saveError}
          </p>
        )}
      </section>
    );
  }

  const slots = availablePrimarySlots(
    data,
    study,
    participant,
    visit.id,
    selectedSlotByVisit,
  );

  return (
    <section aria-labelledby="select-slot-heading" className="booking-flow">
      <p className="booking-flow__progress">
        Visit {visitIndex + 1} of {study.visits.length}
      </p>
      <h2 id="select-slot-heading">Select a slot</h2>
      <h3>{visit.name}</h3>
      <p className="booking-flow__hold">
        Selections are held locally while you complete this continuous booking
        flow.
      </p>
      {slots.length === 0 ? (
        <div className="booking-flow__empty" role="status">
          <p>
            No eligible primary slots are currently available for this visit.
          </p>
          <p>
            Try another visit selection or contact the research team to ask
            about waitlist availability.
          </p>
        </div>
      ) : (
        <ul className="booking-flow__slots">
          {slots.map((slot) => {
            const slotTime = formatHandoffTime(
              slot.startsAtUtc,
              participant.language,
              participant.timeZone,
            );
            return (
              <li key={slot.id}>
                <button
                  aria-label={`Select available slot: ${slotTime}`}
                  type="button"
                  onClick={() => selectSlot(slot.id)}
                >
                  {slotTime}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {visitIndex > 0 ? (
        <button
          type="button"
          onClick={() => setVisitIndex((current) => current - 1)}
        >
          Back to previous visit
        </button>
      ) : null}
    </section>
  );
}
