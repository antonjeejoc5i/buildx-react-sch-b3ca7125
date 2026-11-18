import type { Facility, Room } from "../../domain/models.ts";

export class FacilityManagementError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FacilityManagementError";
  }
}

function requiredText(value: string, label: string): string {
  const trimmed = value.trim();
  if (trimmed === "")
    throw new FacilityManagementError(`${label} is required.`);
  return trimmed;
}

export function parseBlackoutDates(value: string): string[] {
  const dates = value
    .split(/[\n,]/)
    .map((date) => date.trim())
    .filter(Boolean);

  if (dates.some((date) => !/^\d{4}-\d{2}-\d{2}$/.test(date))) {
    throw new FacilityManagementError(
      "Blackout dates must use the YYYY-MM-DD format.",
    );
  }

  return [...new Set(dates)];
}

export function buildFacility(
  facility: Facility,
  values: {
    name: string;
    timeZone: string;
    blackoutDates: string;
    authorisedRoleIds: string[];
  },
): Facility {
  return {
    ...facility,
    name: requiredText(values.name, "Facility name"),
    timeZone: requiredText(values.timeZone, "Time zone"),
    blackoutDates: parseBlackoutDates(values.blackoutDates),
    authorisedRoleIds: [...new Set(values.authorisedRoleIds)],
  };
}

export function buildRoom(
  room: Room,
  values: { name: string; informationalCapacity: string },
): Room {
  const informationalCapacity = Number(values.informationalCapacity);
  if (!Number.isInteger(informationalCapacity) || informationalCapacity < 0) {
    throw new FacilityManagementError(
      "Informational capacity must be a whole number of zero or greater.",
    );
  }

  return {
    ...room,
    name: requiredText(values.name, "Room name"),
    informationalCapacity,
  };
}
