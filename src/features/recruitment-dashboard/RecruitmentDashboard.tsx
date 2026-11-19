import type {
  Booking,
  BookingVisit,
  Participant,
  Quota,
  Slot,
  Study,
} from "../../domain/models.ts";
import { buildRecruitmentDashboardData } from "./recruitmentDashboardData.ts";
import "./RecruitmentDashboard.css";

interface RecruitmentDashboardProps {
  study: Study;
  quotas: Quota[];
  slots: Slot[];
  bookings: Booking[];
  bookingVisits: BookingVisit[];
  participants: Participant[];
}

function formatSlot(timestamp: string): string {
  return new Date(timestamp).toLocaleString();
}

export default function RecruitmentDashboard({
  study,
  quotas,
  slots,
  bookings,
  bookingVisits,
  participants,
}: RecruitmentDashboardProps) {
  const dashboard = buildRecruitmentDashboardData(
    study,
    quotas,
    slots,
    bookings,
    bookingVisits,
    participants,
  );

  return (
    <section
      aria-labelledby="recruitment-dashboard-heading"
      className="recruitment-dashboard"
    >
      <header>
        <p className="recruitment-dashboard__notice">
          Local demonstration calculations
        </p>
        <h2 id="recruitment-dashboard-heading">Recruitment dashboard</h2>
        <p className="recruitment-dashboard__description">
          These study metrics are calculated from local seeded records and are
          not production reporting.
        </p>
      </header>
      <div className="recruitment-dashboard__metrics">
        <article>
          <p>Scheduled participants</p>
          <strong>{dashboard.scheduledParticipants}</strong>
        </article>
        <article>
          <p>Scheduled slots</p>
          <strong>{dashboard.scheduledSlots}</strong>
        </article>
        <article>
          <p>Cancellations</p>
          <strong>{dashboard.cancellations}</strong>
        </article>
        <article>
          <p>No-shows</p>
          <strong>{dashboard.noShows}</strong>
        </article>
      </div>
      <section aria-labelledby="segment-slot-fill-heading">
        <h3 id="segment-slot-fill-heading">Segment slot fill</h3>
        {dashboard.segmentFill.length === 0 ? (
          <p className="recruitment-dashboard__description">
            No local slots are available for this study.
          </p>
        ) : (
          <ul className="recruitment-dashboard__segments">
            {dashboard.segmentFill.map((segment) => (
              <li key={segment.segment}>
                <span>{segment.segment}</span>
                <span>
                  {segment.booked} of {segment.capacity} filled
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <div className="recruitment-dashboard__drill-downs">
        <details>
          <summary>Quota drill-down</summary>
          {dashboard.quotas.length === 0 ? (
            <p>No local quota buckets are configured for this study.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th scope="col">Quota</th>
                  <th scope="col">Filled</th>
                  <th scope="col">Target</th>
                  <th scope="col">Maximum</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.quotas.map((quota) => (
                  <tr key={quota.id}>
                    <td>{quota.label}</td>
                    <td>{quota.filled}</td>
                    <td>{quota.target}</td>
                    <td>{quota.maximum}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </details>
        <details>
          <summary>Slot drill-down</summary>
          {dashboard.slots.length === 0 ? (
            <p>No local slots are available for this study.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th scope="col">Slot</th>
                  <th scope="col">Type</th>
                  <th scope="col">Segment</th>
                  <th scope="col">Fill</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.slots.map((slot) => (
                  <tr key={slot.id}>
                    <td>{formatSlot(slot.startsAtUtc)}</td>
                    <td>{slot.status}</td>
                    <td>{slot.segment}</td>
                    <td>
                      {slot.booked} of {slot.capacity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </details>
        <details>
          <summary>Participant drill-down</summary>
          {dashboard.participants.length === 0 ? (
            <p>
              No scheduled, cancelled, or no-show participant records exist.
            </p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th scope="col">Participant</th>
                  <th scope="col">Status</th>
                  <th scope="col">Slot</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.participants.map((participant) => (
                  <tr key={participant.id}>
                    <td>{participant.name}</td>
                    <td>{participant.status}</td>
                    <td>{formatSlot(participant.startsAtUtc)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </details>
      </div>
    </section>
  );
}
