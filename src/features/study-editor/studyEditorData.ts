import type {
  Facility,
  Room,
  Study,
  StudyLifecycleStatus,
  Visit,
} from "../../domain/models.ts";

export const studyLifecycleOptions: Array<{
  value: StudyLifecycleStatus;
  label: string;
}> = [
  { value: "draft", label: "Draft" },
  { value: "open", label: "Open for Booking" },
  { value: "paused", label: "Paused" },
  { value: "closed", label: "Closed" },
  { value: "archived", label: "Archived" },
];

export class StudyEditorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StudyEditorError";
  }
}

export interface StudyEditorValues {
  name: string;
  description: string;
  decipherProjectId: string;
  lifecycleStatus: StudyLifecycleStatus;
  facilityId: string;
  roomId: string;
  visitName: string;
  visitDurationMinutes: string;
  allowSelfServiceReschedule: boolean;
  maxReschedules: string;
  reminderHoursBefore: string;
}

function requiredText(value: string, label: string): string {
  const trimmed = value.trim();
  if (trimmed === "") throw new StudyEditorError(`${label} is required.`);
  return trimmed;
}

function wholeNumber(value: string, label: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new StudyEditorError(
      `${label} must be a whole number of zero or greater.`,
    );
  }
  return parsed;
}

function buildVisits(study: Study, values: StudyEditorValues): Visit[] {
  const name = values.visitName.trim();
  const duration = values.visitDurationMinutes.trim();
  if (name === "" && duration === "") return [];
  if (name === "" || duration === "") {
    throw new StudyEditorError("A visit needs both a name and duration.");
  }
  const durationMinutes = Number(duration);
  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
    throw new StudyEditorError(
      "Visit duration must be a whole number greater than zero.",
    );
  }
  return [
    {
      id: study.visits[0]?.id ?? `${study.id}-visit-1`,
      name,
      durationMinutes,
    },
  ];
}

function validateOpening(
  values: StudyEditorValues,
  facilities: Facility[],
  rooms: Room[],
): void {
  requiredText(values.decipherProjectId, "Simulated Decipher project ID");
  if (!facilities.some((facility) => facility.id === values.facilityId)) {
    throw new StudyEditorError("Select a facility before opening booking.");
  }
  if (
    !rooms.some(
      (room) =>
        room.id === values.roomId && room.facilityId === values.facilityId,
    )
  ) {
    throw new StudyEditorError(
      "Select a room in the chosen facility before opening booking.",
    );
  }
}

export function buildStudy(
  study: Study,
  values: StudyEditorValues,
  facilities: Facility[],
  rooms: Room[],
  openedAt = new Date().toISOString(),
): Study {
  if (values.lifecycleStatus === "open") {
    validateOpening(values, facilities, rooms);
  }
  return {
    ...study,
    name: requiredText(values.name, "Study name"),
    description: values.description.trim(),
    decipherProjectId: values.decipherProjectId.trim(),
    lifecycleStatus: values.lifecycleStatus,
    facilityId: values.facilityId,
    roomId: values.roomId,
    visits: buildVisits(study, values),
    bookingControls: {
      allowSelfServiceReschedule: values.allowSelfServiceReschedule,
      maxReschedules: wholeNumber(
        values.maxReschedules,
        "Maximum self-service reschedules",
      ),
    },
    notificationSettings: {
      sendReminderHoursBefore: wholeNumber(
        values.reminderHoursBefore,
        "Reminder lead time",
      ),
    },
    openedAt:
      values.lifecycleStatus === "open" && study.openedAt === ""
        ? openedAt
        : study.openedAt,
  };
}

/** A readable study ID from its name, made unique against the studies that already exist. */
export function createStudyId(name: string, existingIds: string[]): string {
  const slug =
    name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48)
      .replace(/-+$/, "") || "untitled";
  const base = `study-${slug}`;
  const taken = new Set(existingIds);
  if (!taken.has(base)) return base;
  let suffix = 2;
  while (taken.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

export function createDraftStudy(id: string): Study {
  return {
    id,
    name: "Untitled study",
    description: "",
    decipherProjectId: "",
    lifecycleStatus: "draft",
    facilityId: "",
    roomId: "",
    visits: [],
    bookingControls: {
      allowSelfServiceReschedule: false,
      maxReschedules: 0,
    },
    notificationSettings: { sendReminderHoursBefore: 24 },
    openedAt: "",
  };
}
