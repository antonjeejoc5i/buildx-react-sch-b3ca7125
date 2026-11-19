import { useState } from "react";
import type { DemoUser } from "../../domain/models.ts";
import type { DemoFixtures } from "../../fixtures/demoFixtures.ts";
import RecruitmentDashboard from "../recruitment-dashboard/RecruitmentDashboard.tsx";
import ReportingMetrics from "../reporting-metrics/ReportingMetrics.tsx";
import {
  appointmentCsv,
  getScopedFacilities,
  getScopedReportRecords,
  getScopedResearchers,
  getScopedStudies,
  getUpcomingAppointments,
  LOCAL_REPORT_DISCLOSURE,
  reportCsv,
  type AppointmentFilters,
} from "./reportsAndAppointmentsData.ts";
import "./ReportsAndAppointments.css";

interface ReportsAndAppointmentsProps {
  actor: DemoUser;
  data: DemoFixtures;
}

const initialAppointmentFilters: AppointmentFilters = {
  facilityId: "",
  researcherId: "",
  startsOn: "",
  endsOn: "",
  studyId: "",
};

function csvHref(csv: string): string {
  return `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
}

function formatDateTime(timestamp: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

export default function ReportsAndAppointments({
  actor,
  data,
}: ReportsAndAppointmentsProps) {
  const [reportStudyId, setReportStudyId] = useState("");
  const [appointmentFilters, setAppointmentFilters] = useState(
    initialAppointmentFilters,
  );
  const scopedStudies = getScopedStudies(actor, data.studies);
  const scopedFacilities = getScopedFacilities(actor, data.facilities);
  const scopedResearchers = getScopedResearchers(actor, data.demoUsers);
  const selectedStudy = scopedStudies.find(
    (study) => study.id === reportStudyId,
  );
  const reportRecords = getScopedReportRecords(actor, data, reportStudyId);
  const appointments = getUpcomingAppointments(
    actor,
    data,
    appointmentFilters,
    new Date(),
  );

  return (
    <section
      aria-labelledby="reports-and-appointments-heading"
      className="reports-and-appointments"
    >
      <header>
        <p className="reports-and-appointments__notice">
          Local demonstration reporting
        </p>
        <h1 id="reports-and-appointments-heading">Reports and appointments</h1>
        <p className="reports-and-appointments__description">
          {LOCAL_REPORT_DISCLOSURE} Results are limited to your simulated
          facility and study scope.
        </p>
      </header>

      <section aria-labelledby="recruitment-reports-heading">
        <div className="reports-and-appointments__section-header">
          <div>
            <h2 id="recruitment-reports-heading">Recruitment reports</h2>
            <p>{LOCAL_REPORT_DISCLOSURE}</p>
          </div>
          <label htmlFor="report-study">
            Report study
            <select
              id="report-study"
              onChange={(event) => setReportStudyId(event.target.value)}
              value={reportStudyId}
            >
              <option value="">All in-scope studies</option>
              {scopedStudies.map((study) => (
                <option key={study.id} value={study.id}>
                  {study.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <a
          className="reports-and-appointments__export"
          download="recruitment-report.csv"
          href={csvHref(reportCsv(reportRecords))}
        >
          Export {reportStudyId === "" ? "all in-scope" : "current filtered"}{" "}
          recruitment records (CSV)
        </a>
        {selectedStudy === undefined ? (
          <p className="reports-and-appointments__empty">
            Choose an in-scope study to review its dashboard calculations.
          </p>
        ) : (
          <>
            <RecruitmentDashboard
              bookingVisits={data.bookingVisits}
              bookings={data.bookings}
              participants={data.participants}
              quotas={data.quotas}
              slots={data.slots}
              study={selectedStudy}
            />
            <ReportingMetrics
              bookingVisits={data.bookingVisits}
              bookings={data.bookings}
              participants={data.participants}
              quotas={data.quotas}
              slots={data.slots}
              study={selectedStudy}
            />
          </>
        )}
      </section>

      <section aria-labelledby="upcoming-appointments-heading">
        <div className="reports-and-appointments__section-header">
          <div>
            <h2 id="upcoming-appointments-heading">Upcoming appointments</h2>
            <p>{LOCAL_REPORT_DISCLOSURE}</p>
          </div>
          <a
            className="reports-and-appointments__export"
            download="upcoming-appointments.csv"
            href={csvHref(appointmentCsv(appointments))}
          >
            Export current filtered appointments (CSV)
          </a>
        </div>
        <div className="reports-and-appointments__filters">
          <label htmlFor="appointment-researcher">
            Researcher
            <select
              id="appointment-researcher"
              onChange={(event) =>
                setAppointmentFilters((current) => ({
                  ...current,
                  researcherId: event.target.value,
                }))
              }
              value={appointmentFilters.researcherId}
            >
              <option value="">All in-scope researchers</option>
              {scopedResearchers.map((researcher) => (
                <option key={researcher.id} value={researcher.id}>
                  {researcher.role}
                </option>
              ))}
            </select>
          </label>
          <label htmlFor="appointment-study">
            Study
            <select
              id="appointment-study"
              onChange={(event) =>
                setAppointmentFilters((current) => ({
                  ...current,
                  studyId: event.target.value,
                }))
              }
              value={appointmentFilters.studyId}
            >
              <option value="">All in-scope studies</option>
              {scopedStudies.map((study) => (
                <option key={study.id} value={study.id}>
                  {study.name}
                </option>
              ))}
            </select>
          </label>
          <label htmlFor="appointment-facility">
            Facility
            <select
              id="appointment-facility"
              onChange={(event) =>
                setAppointmentFilters((current) => ({
                  ...current,
                  facilityId: event.target.value,
                }))
              }
              value={appointmentFilters.facilityId}
            >
              <option value="">All in-scope facilities</option>
              {scopedFacilities.map((facility) => (
                <option key={facility.id} value={facility.id}>
                  {facility.name}
                </option>
              ))}
            </select>
          </label>
          <label htmlFor="appointment-start-date">
            Start date
            <input
              id="appointment-start-date"
              onChange={(event) =>
                setAppointmentFilters((current) => ({
                  ...current,
                  startsOn: event.target.value,
                }))
              }
              type="date"
              value={appointmentFilters.startsOn}
            />
          </label>
          <label htmlFor="appointment-end-date">
            End date
            <input
              id="appointment-end-date"
              onChange={(event) =>
                setAppointmentFilters((current) => ({
                  ...current,
                  endsOn: event.target.value,
                }))
              }
              type="date"
              value={appointmentFilters.endsOn}
            />
          </label>
        </div>
        {appointments.length === 0 ? (
          <p className="reports-and-appointments__empty" role="status">
            No upcoming appointments in your scope match these filters.
          </p>
        ) : (
          <table className="reports-and-appointments__table">
            <thead>
              <tr>
                <th scope="col">When</th>
                <th scope="col">Participant</th>
                <th scope="col">Study</th>
                <th scope="col">Facility</th>
                <th scope="col">Room</th>
                <th scope="col">Researcher</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment) => (
                <tr key={appointment.id}>
                  <td>{formatDateTime(appointment.startsAtUtc)}</td>
                  <td>{appointment.participantName}</td>
                  <td>{appointment.studyName}</td>
                  <td>{appointment.facilityName}</td>
                  <td>{appointment.roomName}</td>
                  <td>{appointment.researcherName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </section>
  );
}
