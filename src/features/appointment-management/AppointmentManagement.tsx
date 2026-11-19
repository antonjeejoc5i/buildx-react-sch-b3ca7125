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
  buildCancelledParticipation,
  buildRescheduledParticipation,
  evaluateAppointmentManagement,
  revalidateReschedule,
  suggestDependentSlots,
} from "./appointmentManagementData.ts";
import "./AppointmentManagement.css";

interface AppointmentManagementProps {
  data: DemoFixtures;
  booking: Booking;
  participant: Participant;
  study: Study;
  saveParticipation: (
    booking: Booking,
    bookingVisits: BookingVisit[],
  ) => Promise<void>;
}

export default function AppointmentManagement({
  data,
  booking,
  participant,
  study,
  saveParticipation,
}: AppointmentManagementProps) {
  const bookingVisits = data.bookingVisits.filter(
    (bookingVisit) => bookingVisit.bookingId === booking.id,
  );
  const [selectedSlotByVisit, setSelectedSlotByVisit] = useState(() =>
    Object.fromEntries(
      bookingVisits.map((bookingVisit) => [
        bookingVisit.visitId,
        bookingVisit.slotId,
      ]),
    ),
  );
  const [mode, setMode] = useState<"idle" | "reschedule" | "cancel">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const rescheduleEvaluation = evaluateAppointmentManagement(
    "reschedule",
    study,
    booking,
    bookingVisits,
  );
  const cancellationEvaluation = evaluateAppointmentManagement(
    "cancel",
    study,
    booking,
    bookingVisits,
  );

  function chooseReplacement(visitId: string, slotId: string) {
    setSelectedSlotByVisit(
      suggestDependentSlots(data, study, participant, booking, visitId, slotId),
    );
    setMessage(
      "We first attempted to shift dependent visits to keep your schedule valid.",
    );
  }

  async function confirmReschedule() {
    const validation = revalidateReschedule(
      data,
      study,
      participant,
      booking,
      selectedSlotByVisit,
    );
    if (!validation.allowed) {
      setMessage(
        "Your replacement appointments no longer meet booking rules. Please choose another available slot.",
      );
      return;
    }

    const participation = buildRescheduledParticipation(
      booking,
      bookingVisits,
      study,
      data,
      selectedSlotByVisit,
      new Date().toISOString(),
    );
    setIsSaving(true);
    try {
      await saveParticipation(
        participation.booking,
        participation.bookingVisits,
      );
      setMode("idle");
      setMessage("Your complete study participation has been rescheduled.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to reschedule your appointments. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmCancellation() {
    const participation = buildCancelledParticipation(
      booking,
      bookingVisits,
      new Date().toISOString(),
    );
    setIsSaving(true);
    try {
      await saveParticipation(
        participation.booking,
        participation.bookingVisits,
      );
      setMode("idle");
      setMessage("Your complete study participation has been cancelled.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to cancel your appointments. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section
      aria-labelledby="manage-appointment-heading"
      className="appointment-management"
    >
      <h2 id="manage-appointment-heading">Manage your appointment</h2>
      {message === null ? null : (
        <p aria-live="polite" role="status">
          {message}
        </p>
      )}
      {mode === "idle" ? (
        <div className="appointment-management__actions">
          <div>
            <button
              disabled={!rescheduleEvaluation.allowed}
              type="button"
              onClick={() => setMode("reschedule")}
            >
              Reschedule participation
            </button>
            {!rescheduleEvaluation.allowed &&
            rescheduleEvaluation.message !== undefined ? (
              <p>{rescheduleEvaluation.message}</p>
            ) : null}
          </div>
          <div>
            <button
              disabled={!cancellationEvaluation.allowed}
              type="button"
              onClick={() => setMode("cancel")}
            >
              Cancel participation
            </button>
            {!cancellationEvaluation.allowed &&
            cancellationEvaluation.message !== undefined ? (
              <p>{cancellationEvaluation.message}</p>
            ) : null}
          </div>
        </div>
      ) : null}
      {mode === "reschedule" ? (
        <div>
          <p>
            Choose replacements for your study visits. A complete participation
            change counts once.
          </p>
          {study.visits.map((visit) => {
            const slots = data.slots.filter(
              (slot) =>
                slot.studyId === study.id &&
                slot.visitId === visit.id &&
                slot.status === "primary",
            );
            return (
              <label key={visit.id} className="appointment-management__field">
                {visit.name}
                <select
                  value={selectedSlotByVisit[visit.id] ?? ""}
                  onChange={(event) =>
                    chooseReplacement(visit.id, event.target.value)
                  }
                >
                  <option value="">Choose a replacement</option>
                  {slots.map((slot) => (
                    <option key={slot.id} value={slot.id}>
                      {formatHandoffTime(
                        slot.startsAtUtc,
                        participant.language,
                        participant.timeZone,
                      )}
                    </option>
                  ))}
                </select>
              </label>
            );
          })}
          <div className="appointment-management__actions">
            <button
              disabled={isSaving}
              type="button"
              onClick={() => void confirmReschedule()}
            >
              Confirm reschedule
            </button>
            <button
              disabled={isSaving}
              type="button"
              onClick={() => setMode("idle")}
            >
              Keep current appointment
            </button>
          </div>
        </div>
      ) : null}
      {mode === "cancel" ? (
        <div className="appointment-management__confirmation" role="alert">
          <p>
            Cancel every visit in this study participation? This cannot be
            undone through self-service.
          </p>
          <div className="appointment-management__actions">
            <button
              disabled={isSaving}
              type="button"
              onClick={() => void confirmCancellation()}
            >
              Confirm cancellation
            </button>
            <button
              disabled={isSaving}
              type="button"
              onClick={() => setMode("idle")}
            >
              Keep participation
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
