import { useState } from "react";
import type { FormEvent } from "react";
import type { DemoUser, Facility, Room } from "../../domain/models.ts";
import { buildFacility, buildRoom } from "./facilityManagementData.ts";
import "./FacilityManagement.css";

interface FacilityManagementProps {
  facility: Facility;
  rooms: Room[];
  demoUsers: DemoUser[];
  saveFacility: (facility: Facility) => Promise<void>;
  saveRoom: (room: Room) => Promise<void>;
}

function roleOptions(facility: Facility, users: DemoUser[]): string[] {
  return [
    ...new Set([
      ...facility.authorisedRoleIds,
      ...users.map((user) => user.role),
    ]),
  ].sort();
}

export default function FacilityManagement({
  facility,
  rooms,
  demoUsers,
  saveFacility,
  saveRoom,
}: FacilityManagementProps) {
  const [name, setName] = useState(facility.name);
  const [timeZone, setTimeZone] = useState(facility.timeZone);
  const [blackoutDates, setBlackoutDates] = useState(
    facility.blackoutDates.join("\n"),
  );
  const [roles, setRoles] = useState(facility.authorisedRoleIds);
  const [message, setMessage] = useState<string | null>(null);

  const toggleRole = (role: string) => {
    setRoles((current) =>
      current.includes(role)
        ? current.filter((item) => item !== role)
        : [...current, role],
    );
  };

  async function saveFacilityDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await saveFacility(
        buildFacility(facility, {
          name,
          timeZone,
          blackoutDates,
          authorisedRoleIds: roles,
        }),
      );
      setMessage("Facility details saved locally.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to save facility details.",
      );
    }
  }

  async function saveRoomDetails(
    event: FormEvent<HTMLFormElement>,
    room: Room,
  ) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await saveRoom(
        buildRoom(room, {
          name: String(form.get("name")),
          informationalCapacity: String(form.get("capacity")),
        }),
      );
      setMessage(`${room.name} saved locally.`);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to save room.",
      );
    }
  }

  return (
    <section aria-labelledby="facility-heading" className="facility-management">
      <header>
        <p>Facility settings</p>
        <h1 id="facility-heading">{facility.name}</h1>
      </header>
      {message !== null ? (
        <p aria-live="polite" className="facility-management__message">
          {message}
        </p>
      ) : null}
      <form
        className="facility-management__card"
        onSubmit={saveFacilityDetails}
      >
        <h2>Facility details</h2>
        <label htmlFor="facility-name">
          Facility name
          <input
            id="facility-name"
            onChange={(event) => setName(event.target.value)}
            value={name}
          />
        </label>
        <label htmlFor="facility-time-zone">
          Time zone
          <input
            id="facility-time-zone"
            onChange={(event) => setTimeZone(event.target.value)}
            value={timeZone}
          />
        </label>
        <label htmlFor="facility-blackout-dates">
          Blackout dates
          <textarea
            id="facility-blackout-dates"
            onChange={(event) => setBlackoutDates(event.target.value)}
            value={blackoutDates}
          />
        </label>
        <p className="facility-management__help">
          Enter one YYYY-MM-DD date per line. Dates use this facility's time
          zone.
        </p>
        <fieldset>
          <legend>Authorised roles</legend>
          {roleOptions(facility, demoUsers).map((role) => (
            <label key={role}>
              <input
                checked={roles.includes(role)}
                onChange={() => toggleRole(role)}
                type="checkbox"
              />
              {role}
            </label>
          ))}
        </fieldset>
        <button type="submit">Save facility</button>
      </form>
      <section
        aria-labelledby="rooms-heading"
        className="facility-management__card"
      >
        <h2 id="rooms-heading">Rooms</h2>
        <p className="facility-management__help">
          Capacity is informational only and never blocks a booking or slot.
        </p>
        {rooms.map((room) => (
          <form
            className="facility-management__room"
            key={room.id}
            onSubmit={(event) => saveRoomDetails(event, room)}
          >
            <label htmlFor={`room-name-${room.id}`}>
              Room name
              <input
                defaultValue={room.name}
                id={`room-name-${room.id}`}
                name="name"
              />
            </label>
            <label htmlFor={`room-capacity-${room.id}`}>
              Informational capacity
              <input
                defaultValue={room.informationalCapacity}
                id={`room-capacity-${room.id}`}
                min="0"
                name="capacity"
                type="number"
              />
            </label>
            <button type="submit">Save room</button>
          </form>
        ))}
      </section>
    </section>
  );
}
