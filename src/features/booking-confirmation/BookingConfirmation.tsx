import type { BookingConfirmationDetails } from "./bookingConfirmationData.ts";
import "./BookingConfirmation.css";

interface BookingConfirmationProps {
  confirmation: BookingConfirmationDetails;
}

export default function BookingConfirmation({
  confirmation,
}: BookingConfirmationProps) {
  return (
    <section
      aria-labelledby="booking-confirmed-heading"
      className="booking-confirmation"
      role="status"
    >
      <h2 id="booking-confirmed-heading">Booking confirmed</h2>
      <p>{confirmation.renderedTemplate}</p>
      <dl>
        <div>
          <dt>Appointments</dt>
          <dd>
            <ol>
              {confirmation.visits.map((visit) => (
                <li key={visit.name}>
                  <strong>{visit.name}</strong>
                  <span>{visit.appointment}</span>
                </li>
              ))}
            </ol>
          </dd>
        </div>
        <div>
          <dt>Location</dt>
          <dd>{confirmation.location}</dd>
        </div>
        <div>
          <dt>Reminder delivery</dt>
          <dd>{confirmation.reminderChannels.join(" and ")}</dd>
        </div>
      </dl>
      {confirmation.enableRescheduleLink || confirmation.enableCancelLink ? (
        <nav
          aria-label="Manage booking"
          className="booking-confirmation__links"
        >
          {confirmation.enableRescheduleLink ? (
            <a href="#manage-reschedule">Reschedule booking</a>
          ) : null}
          {confirmation.enableCancelLink ? (
            <a href="#manage-cancel">Cancel booking</a>
          ) : null}
        </nav>
      ) : null}
    </section>
  );
}
