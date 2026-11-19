export type Identifier = string;
export type JsonValue =
  string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export type StudyLifecycleStatus =
  "draft" | "open" | "paused" | "closed" | "archived";
export type QualificationState = "eligible" | "pending" | "ineligible";
export type BookingStatus = "draft" | "confirmed" | "cancelled" | "completed";
export type BookingVisitStatus =
  "scheduled" | "checked-in" | "cancelled" | "completed";
export type WaitlistStatus = "waiting" | "promoted" | "expired" | "withdrawn";
export type DeliveryStatus = "pending" | "sent" | "failed";
export type SlotStatus = "primary" | "backup";
export type ReminderChannel = "email" | "sms";

export interface IdentifiedRecord {
  id: Identifier;
}

export interface Facility extends IdentifiedRecord {
  name: string;
  timeZone: string;
  blackoutDates: string[];
  authorisedRoleIds: string[];
}

export interface Room extends IdentifiedRecord {
  facilityId: Identifier;
  name: string;
  informationalCapacity: number;
}

export type ConsecutiveVisitInterval =
  | { kind: "same-day" }
  | { kind: "exact-day"; day: number }
  | { kind: "day-window"; minimumDay: number; maximumDay: number };

export interface Visit {
  id: Identifier;
  name: string;
  durationMinutes: number;
  intervalFromPrevious?: ConsecutiveVisitInterval;
}

export interface Study extends IdentifiedRecord {
  name: string;
  description: string;
  decipherProjectId: string;
  lifecycleStatus: StudyLifecycleStatus;
  facilityId: Identifier;
  roomId: Identifier;
  visits: Visit[];
  bookingControls: Record<string, JsonValue>;
  notificationSettings: Record<string, JsonValue>;
  openedAt: string;
}

export interface SchedulePattern extends IdentifiedRecord {
  studyId: Identifier;
  visitId: Identifier;
  startsOn: string;
  endsOn: string;
  weekdays: number[];
  operatingWindow: { startsAt: string; endsAt: string };
  slotLengthMinutes: number;
  bufferMinutes: number;
  timeZone: string;
}

export interface ScheduleOverride extends IdentifiedRecord {
  schedulePatternId: Identifier;
  date: string;
  availability: "available" | "unavailable";
  operatingWindow?: { startsAt: string; endsAt: string };
  slotLengthMinutes?: number;
  bufferMinutes?: number;
  addedSlots: string[];
  removedSlotIds: Identifier[];
}

export interface Slot extends IdentifiedRecord {
  studyId: Identifier;
  visitId: Identifier;
  startsAtUtc: string;
  endsAtUtc: string;
  capacity: number;
  status: SlotStatus;
  eligibilityRules: Record<string, JsonValue>;
  segmentAssignment?: string;
}

export interface Quota extends IdentifiedRecord {
  studyId: Identifier;
  dimensions: string[];
  attributeConditions: Record<string, JsonValue>;
  target: number;
  filled: number;
  overbookingPercentage: number;
  maximum: number;
}

export interface ParticipantProfile {
  ageRange: string;
  postalCode: string;
  transportation: string;
}

export interface Participant extends IdentifiedRecord {
  name: string;
  email: string;
  phone: string;
  qualificationState: QualificationState;
  language: string;
  timeZone: string;
  profile: ParticipantProfile;
  screenerAttributes: Record<string, JsonValue>;
  reminderDefault: ReminderChannel[];
}

export interface Booking extends IdentifiedRecord {
  studyId: Identifier;
  participantId: Identifier;
  status: BookingStatus;
  selectedVisitIds: Identifier[];
  selectedSlotIds: Identifier[];
  reminderPreference: ReminderChannel[];
  selfServiceRescheduleCount: number;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookingVisit extends IdentifiedRecord {
  bookingId: Identifier;
  visitId: Identifier;
  slotId: Identifier;
  startsAtUtc: string;
  status: BookingVisitStatus;
  checkedInAt?: string;
  noShow: boolean;
  affectsStanding: boolean;
}

export interface WaitlistEntry extends IdentifiedRecord {
  slotId: Identifier;
  participantId: Identifier;
  createdAt: string;
  status: WaitlistStatus;
  promotionOutcome?: string;
}

export interface Reminder extends IdentifiedRecord {
  bookingVisitId: Identifier;
  dueAtUtc: string;
  channels: ReminderChannel[];
  template: string;
  deliveryStatus: DeliveryStatus;
}

export interface NotificationEvent extends IdentifiedRecord {
  bookingId: Identifier;
  eventType: string;
  channels: ReminderChannel[];
  localizedPreview: string;
  deliveryStatus: DeliveryStatus;
  createdAt: string;
}

export interface AuditEvent extends IdentifiedRecord {
  actorRole: string;
  action: string;
  entityReferences: Record<string, Identifier>;
  beforeValues?: Record<string, JsonValue>;
  afterValues?: Record<string, JsonValue>;
  overrideReason?: string;
  bulkActionId?: Identifier;
  createdAt: string;
}

export interface ScheduleTemplate extends IdentifiedRecord {
  name: string;
  recurringPatterns: SchedulePattern[];
  overrideStructure: Record<string, JsonValue>;
  archived: boolean;
}

export interface DemoUser extends IdentifiedRecord {
  role: string;
  authorisedFacilityIds: Identifier[];
  authorisedStudyIds: Identifier[];
}

export class LocalProfileError extends Error {
  constructor(participantId: Identifier, missingFields: string[]) {
    super(
      `Participant ${participantId} has incomplete required profile data: ${missingFields.join(", ")}.`,
    );
    this.name = "LocalProfileError";
  }
}

export class StudyBookingError extends Error {
  constructor(studyId: Identifier) {
    super(`Study ${studyId} is not open for participant bookings.`);
    this.name = "StudyBookingError";
  }
}

export function requireParticipantProfile(
  participant: Participant,
): ParticipantProfile {
  const missingFields = Object.entries(participant.profile).flatMap(
    ([field, value]) => (value.trim() === "" ? [field] : []),
  );

  if (missingFields.length > 0) {
    throw new LocalProfileError(participant.id, missingFields);
  }

  return participant.profile;
}

export function canAcceptNewBookings(study: Study): boolean {
  return study.lifecycleStatus === "open";
}

export function requireStudyOpenForBooking(study: Study): void {
  if (!canAcceptNewBookings(study)) {
    throw new StudyBookingError(study.id);
  }
}
