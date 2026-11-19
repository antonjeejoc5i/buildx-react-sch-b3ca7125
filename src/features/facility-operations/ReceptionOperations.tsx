import { useState } from "react";
import type {
  Booking,
  BookingVisit,
  Participant,
  Room,
  Slot,
  Study,
} from "../../domain/models.ts";
import {
  checkIn,
  getReceptionAppointments,
  markNoShow,
} from "./facilityOperationsData.ts";
import "./FacilityOperations.css";

interface ReceptionOperationsProps {
  authorisedFacilityIds: string[];
  rooms: Room[];
  studies: Study[];
  slots: Slot[];
  bookings: Booking[];
  bookingVisits: BookingVisit[];
  participants: Participant[];
  saveBookingVisit?: (bookingVisit: BookingVisit) => Promise<void>;
}

function formatDateTime(timestamp: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

export default function ReceptionOperations({
  authorisedFacilityIds,
  rooms,
  studies,
  slots,
  bookings,
  bookingVisits,
  participants,
  saveBookingVisit,
}: ReceptionOperationsProps) {
  const appointments = getReceptionAppointments(
    authorisedFacilityIds,
    rooms,
    studies,
    slots,
    bookings,
    bookingVisits,
    participants,
  );
  const [message, setMessage] = useState<string | null>(null);

  async function updateVisit(bookingVisit: BookingVisit, confirmation: string) {
    if (saveBookingVisit === undefined) {
      setMessage("Attendance updates are unavailable in this local view.");
      return;
    }

    try {
      await saveBookingVisit(bookingVisit);
      setMessage(confirmation);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to update attendance.",
      );
    }
  }

  return (
    <section
      aria-labelledby="reception-heading"
      className="facility-operations"
    >
      <header>
        <p className="facility-operations__eyebrow">Day-of operations</p>
        <h1 id="reception-heading">Reception appointments</h1>
        <p className="facility-operations__description">
          This view shows only the participant name needed for arrival and
          attendance handling.
        </p>
      </header>
      {message !== null ? (
        <p aria-live="polite" className="facility-operations__message">
          {message}
        </p>
      ) : null}
      {appointments.length === 0 ? (
        <p className="facility-operations__empty">
          No authorized facility appointments are scheduled.
        </p>
      ) : (
        <ul className="facility-operations__list">
          {appointments.map((appointment) => (
            <li key={appointment.bookingVisit.id}>
              <div>
                <h2>{appointment.participantName}</h2>
                <p>{formatDateTime(appointment.startsAtUtc)}</p>
                <p>
                  {appointment.studyName} · {appointment.roomName}
                </p>
                <p>
                  Status:{" "}
                  {appointment.bookingVisit.noShow
                    ? "no-show"
                    : appointment.bookingVisit.status}
                </p>
                <p className="facility-operations__placeholder">
                  Affects standing: placeholder — no standing rule is
                  configured.
                </p>
              </div>
              <div className="facility-operations__actions">
                <button
                  disabled={
                    appointment.bookingVisit.status === "checked-in" ||
                    appointment.bookingVisit.noShow
                  }
                  onClick={() =>
                    void updateVisit(
                      checkIn(
                        appointment.bookingVisit,
                        new Date().toISOString(),
                      ),
                      "Appointment checked in locally.",
                    )
                  }
                  type="button"
                >
                  Check in
                </button>
                <button
                  disabled={
                    appointment.bookingVisit.status === "checked-in" ||
                    appointment.bookingVisit.noShow
                  }
                  onClick={() =>
                    void updateVisit(
                      markNoShow(appointment.bookingVisit),
                      "Appointment marked as no-show locally.",
                    )
                  }
                  type="button"
                >
                  Mark no-show
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
