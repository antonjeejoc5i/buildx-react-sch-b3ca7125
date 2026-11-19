import { useState } from "react";
import type { Facility, Room, Slot, Study } from "../../domain/models.ts";
import {
  getPlannedAppointments,
  type PlanningFilters,
} from "./facilityOperationsData.ts";
import "./FacilityOperations.css";

interface FacilityPlanningProps {
  authorisedFacilityIds: string[];
  authorisedStudyIds: string[];
  facilities: Facility[];
  rooms: Room[];
  studies: Study[];
  slots: Slot[];
}

const initialFilters: PlanningFilters = {
  facilityId: "",
  startsOn: "",
  endsOn: "",
  studyId: "",
  roomId: "",
};

function formatDateTime(timestamp: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

export default function FacilityPlanning({
  authorisedFacilityIds,
  authorisedStudyIds,
  facilities,
  rooms,
  studies,
  slots,
}: FacilityPlanningProps) {
  const [filters, setFilters] = useState(initialFilters);
  const appointments = getPlannedAppointments(
    authorisedFacilityIds,
    authorisedStudyIds,
    facilities,
    rooms,
    studies,
    slots,
    filters,
  );
  const scopedFacilities = facilities.filter((facility) =>
    authorisedFacilityIds.includes(facility.id),
  );
  const scopedStudies = studies.filter((study) =>
    authorisedStudyIds.includes(study.id),
  );
  const scopedRooms = rooms.filter((room) =>
    authorisedFacilityIds.includes(room.facilityId),
  );

  return (
    <section aria-labelledby="planning-heading" className="facility-operations">
      <header>
        <p className="facility-operations__eyebrow">Facility operations</p>
        <h1 id="planning-heading">Upcoming study planning</h1>
        <p className="facility-operations__description">
          Results include only facilities, studies, and rooms in your simulated
          local scope.
        </p>
      </header>
      <div className="facility-operations__filters">
        <label htmlFor="planning-facility">
          Facility
          <select
            id="planning-facility"
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                facilityId: event.target.value,
              }))
            }
            value={filters.facilityId}
          >
            <option value="">All authorized facilities</option>
            {scopedFacilities.map((facility) => (
              <option key={facility.id} value={facility.id}>
                {facility.name}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor="planning-start-date">
          Start date
          <input
            id="planning-start-date"
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                startsOn: event.target.value,
              }))
            }
            type="date"
            value={filters.startsOn}
          />
        </label>
        <label htmlFor="planning-end-date">
          End date
          <input
            id="planning-end-date"
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                endsOn: event.target.value,
              }))
            }
            type="date"
            value={filters.endsOn}
          />
        </label>
        <label htmlFor="planning-study">
          Study
          <select
            id="planning-study"
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                studyId: event.target.value,
              }))
            }
            value={filters.studyId}
          >
            <option value="">All authorized studies</option>
            {scopedStudies.map((study) => (
              <option key={study.id} value={study.id}>
                {study.name}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor="planning-room">
          Room
          <select
            id="planning-room"
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                roomId: event.target.value,
              }))
            }
            value={filters.roomId}
          >
            <option value="">All authorized rooms</option>
            {scopedRooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {appointments.length === 0 ? (
        <p className="facility-operations__empty">
          No authorized upcoming study appointments match these filters.
        </p>
      ) : (
        <table className="facility-operations__table">
          <thead>
            <tr>
              <th scope="col">When</th>
              <th scope="col">Study</th>
              <th scope="col">Facility</th>
              <th scope="col">Room</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appointment) => (
              <tr key={appointment.id}>
                <td>{formatDateTime(appointment.startsAtUtc)}</td>
                <td>{appointment.studyName}</td>
                <td>{appointment.facilityName}</td>
                <td>{appointment.roomName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
