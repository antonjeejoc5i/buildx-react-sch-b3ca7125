import type {
  Booking,
  BookingVisit,
  Participant,
  Quota,
  Slot,
  Study,
} from "../../domain/models.ts";
import { buildReportingMetrics } from "./reportingMetricsData.ts";
import "./ReportingMetrics.css";

interface ReportingMetricsProps {
  bookingVisits: BookingVisit[];
  bookings: Booking[];
  participants: Participant[];
  quotas: Quota[];
  slots: Slot[];
  study: Study;
}

function formatPercentage(value: number): string {
  return `${Number.isInteger(value) ? value : value.toFixed(1)}%`;
}

function formatRecruitmentStatus(status: string): string {
  if (status === "not-recruiting") return "Not recruiting";
  if (status === "quota-targets-met") return "Quota targets met";
  if (status === "no-quota-targets") return "No quota targets";
  return "Recruiting";
}

function formatTimeToFill(
  value: ReturnType<typeof buildReportingMetrics>["timeToFill"]["value"],
): string {
  if (value.state === "not-applicable") return "Not applicable";
  if (value.state === "in-progress") return "Not yet filled";
  const days = (value.durationMilliseconds ?? 0) / 86400000;
  return `${Number.isInteger(days) ? days : days.toFixed(1)} days`;
}

export default function ReportingMetrics({
  bookingVisits,
  bookings,
  participants,
  quotas,
  slots,
  study,
}: ReportingMetricsProps) {
  const metrics = buildReportingMetrics(
    study,
    quotas,
    slots,
    bookings,
    bookingVisits,
    participants,
    new Date(),
  );

  return (
    <section
      aria-labelledby="reporting-metrics-heading"
      className="reporting-metrics"
    >
      <header>
        <h2 id="reporting-metrics-heading">Reporting metrics</h2>
        <p>
          Local demonstration calculations only; these values are not production
          reporting.
        </p>
      </header>
      <div className="reporting-metrics__grid">
        <article>
          <h3>Fill rate</h3>
          <strong>{formatPercentage(metrics.fillRate.value.percentage)}</strong>
          <p>
            {metrics.fillRate.value.booked} booked of{" "}
            {metrics.fillRate.value.capacity} primary-slot places
          </p>
          <small>{metrics.fillRate.disclosure}</small>
        </article>
        <article>
          <h3>No-show rate</h3>
          <strong>
            {formatPercentage(metrics.noShowRate.value.percentage)}
          </strong>
          <p>
            {metrics.noShowRate.value.noShows} no-shows from{" "}
            {metrics.noShowRate.value.eligibleAppointments} eligible
            appointments
          </p>
          <small>{metrics.noShowRate.disclosure}</small>
        </article>
        <article>
          <h3>Recruitment status</h3>
          <strong>
            {formatRecruitmentStatus(metrics.recruitmentStatus.value)}
          </strong>
          <p>Based on current study lifecycle and original quota targets.</p>
          <small>{metrics.recruitmentStatus.disclosure}</small>
        </article>
        <article>
          <h3>Time to fill</h3>
          <strong>{formatTimeToFill(metrics.timeToFill.value)}</strong>
          <p>From opening until original quota targets are met.</p>
          <small>{metrics.timeToFill.disclosure}</small>
        </article>
      </div>
    </section>
  );
}
