import type {
  AuditEvent,
  Booking,
  BookingVisit,
  DemoUser,
  Facility,
  NotificationEvent,
  Participant,
  Quota,
  Reminder,
  Room,
  ScheduleOverride,
  SchedulePattern,
  ScheduleTemplate,
  Slot,
  Study,
  WaitlistEntry,
} from "../domain/models.ts";

export interface DemoFixtures {
  studies: Study[];
  facilities: Facility[];
  rooms: Room[];
  schedulePatterns: SchedulePattern[];
  scheduleOverrides: ScheduleOverride[];
  slots: Slot[];
  quotas: Quota[];
  participants: Participant[];
  bookings: Booking[];
  bookingVisits: BookingVisit[];
  waitlistEntries: WaitlistEntry[];
  reminders: Reminder[];
  notificationEvents: NotificationEvent[];
  auditEvents: AuditEvent[];
  scheduleTemplates: ScheduleTemplate[];
  demoUsers: DemoUser[];
}

const facility: Facility = {
  id: "facility-harbor",
  name: "Harbor Research Center",
  timeZone: "America/New_York",
  blackoutDates: ["2026-07-04"],
  authorisedRoleIds: ["coordinator", "researcher"],
};
const room: Room = {
  id: "room-harbor-101",
  facilityId: facility.id,
  name: "Interview Room 101",
  informationalCapacity: 4,
};
const study: Study = {
  id: "study-morning-routines",
  name: "Morning Routines Research",
  description: "A fictional study about planning everyday mornings.",
  decipherProjectId: "DCP-DEMO-2048",
  lifecycleStatus: "open",
  facilityId: facility.id,
  roomId: room.id,
  visits: [
    { id: "visit-interview", name: "Research interview", durationMinutes: 45 },
  ],
  bookingControls: { allowSelfServiceReschedule: true, maxReschedules: 2 },
  notificationSettings: { sendReminderHoursBefore: 24 },
  openedAt: "2026-06-01T09:00:00.000Z",
};
const closedStudy: Study = {
  ...study,
  id: "study-closed-diary",
  name: "Evening Diary Research",
  description: "A fictional study about recording everyday evenings.",
  decipherProjectId: "DCP-DEMO-CLOSED-2049",
  lifecycleStatus: "closed",
};
const pattern: SchedulePattern = {
  id: "pattern-weekday-mornings",
  studyId: study.id,
  visitId: "visit-interview",
  startsOn: "2026-06-01",
  endsOn: "2026-08-31",
  weekdays: [1, 2, 3, 4, 5],
  operatingWindow: { startsAt: "09:00", endsAt: "12:00" },
  slotLengthMinutes: 45,
  bufferMinutes: 15,
  timeZone: facility.timeZone,
};
const slot: Slot = {
  id: "slot-2026-06-15-0900",
  studyId: study.id,
  visitId: "visit-interview",
  startsAtUtc: "2026-06-15T13:00:00.000Z",
  endsAtUtc: "2026-06-15T13:45:00.000Z",
  capacity: 1,
  status: "primary",
  eligibilityRules: { minimumAge: 18, language: "English" },
  segmentAssignment: "weekday-commuters",
};
const participant: Participant = {
  id: "participant-avery-chen",
  name: "Avery Chen",
  email: "avery.chen@example.test",
  phone: "+1-555-0101",
  qualificationState: "eligible",
  language: "English",
  timeZone: "America/New_York",
  profile: { ageRange: "25-34", postalCode: "11201", transportation: "Subway" },
  screenerAttributes: { employment: "full-time", morningRoutine: "planned" },
  reminderDefault: ["email"],
};
const booking: Booking = {
  id: "booking-avery-001",
  studyId: study.id,
  participantId: participant.id,
  status: "confirmed",
  selectedVisitIds: ["visit-interview"],
  selectedSlotIds: [slot.id],
  reminderPreference: ["email"],
  selfServiceRescheduleCount: 0,
  source: "participant-portal",
  createdAt: "2026-06-02T14:00:00.000Z",
  updatedAt: "2026-06-02T14:00:00.000Z",
};

export const demoFixtures: DemoFixtures = {
  studies: [study, closedStudy],
  facilities: [facility],
  rooms: [room],
  schedulePatterns: [pattern],
  scheduleOverrides: [
    {
      id: "override-juneteenth",
      schedulePatternId: pattern.id,
      date: "2026-06-19",
      availability: "unavailable",
      addedSlots: [],
      removedSlotIds: [],
    },
  ],
  slots: [slot],
  quotas: [
    {
      id: "quota-commuters",
      studyId: study.id,
      dimensions: ["transportation"],
      attributeConditions: { transportation: "Subway" },
      target: 8,
      filled: 1,
      overbookingPercentage: 0,
      maximum: 8,
    },
  ],
  participants: [
    participant,
    {
      id: "participant-quinn-patel",
      name: "Quinn Patel",
      email: "quinn.patel@example.test",
      phone: "+1-555-0103",
      qualificationState: "eligible",
      language: "English",
      timeZone: "America/New_York",
      profile: {
        ageRange: "25-34",
        postalCode: "11201",
        transportation: "Subway",
      },
      screenerAttributes: {
        employment: "full-time",
        morningRoutine: "planned",
      },
      reminderDefault: ["email"],
    },
    {
      id: "participant-morgan-reed",
      name: "Morgan Reed",
      email: "morgan.reed@example.test",
      phone: "+1-555-0102",
      qualificationState: "pending",
      language: "English",
      timeZone: "America/Chicago",
      profile: {
        ageRange: "35-44",
        postalCode: "60601",
        transportation: "Bus",
      },
      screenerAttributes: {
        employment: "part-time",
        morningRoutine: "flexible",
      },
      reminderDefault: ["email", "sms"],
    },
    {
      id: "participant-riley-stone",
      name: "Riley Stone",
      email: "riley.stone@example.test",
      phone: "+1-555-0104",
      qualificationState: "eligible",
      language: "English",
      timeZone: "America/New_York",
      profile: { ageRange: "", postalCode: "10001", transportation: "Subway" },
      screenerAttributes: { employment: "full-time" },
      reminderDefault: ["email"],
    },
    {
      id: "participant-jordan-lee",
      name: "Jordan Lee",
      email: "jordan.lee@example.test",
      phone: "+1-555-0105",
      qualificationState: "eligible",
      language: "English",
      timeZone: "America/New_York",
      profile: {
        ageRange: "45-54",
        postalCode: "11215",
        transportation: "Walk",
      },
      screenerAttributes: { employment: "full-time" },
      reminderDefault: ["email"],
    },
  ],
  bookings: [booking],
  bookingVisits: [
    {
      id: "booking-visit-avery-001",
      bookingId: booking.id,
      visitId: "visit-interview",
      slotId: slot.id,
      startsAtUtc: slot.startsAtUtc,
      status: "scheduled",
      noShow: false,
      affectsStanding: false,
    },
  ],
  waitlistEntries: [
    {
      id: "waitlist-morgan-001",
      slotId: slot.id,
      participantId: "participant-morgan-reed",
      createdAt: "2026-06-03T10:00:00.000Z",
      status: "waiting",
    },
  ],
  reminders: [
    {
      id: "reminder-avery-001",
      bookingVisitId: "booking-visit-avery-001",
      dueAtUtc: "2026-06-14T13:00:00.000Z",
      channels: ["email"],
      template: "Appointment reminder",
      deliveryStatus: "pending",
    },
  ],
  notificationEvents: [
    {
      id: "notification-avery-001",
      bookingId: booking.id,
      eventType: "booking-confirmed",
      channels: ["email"],
      localizedPreview: "Your research interview is confirmed for June 15.",
      deliveryStatus: "sent",
      createdAt: "2026-06-02T14:00:00.000Z",
    },
  ],
  auditEvents: [
    {
      id: "audit-booking-avery-001",
      actorRole: "participant",
      action: "booking.created",
      entityReferences: {
        bookingId: booking.id,
        participantId: participant.id,
      },
      afterValues: { status: "confirmed" },
      createdAt: "2026-06-02T14:00:00.000Z",
    },
  ],
  scheduleTemplates: [
    {
      id: "template-weekday-interviews",
      name: "Weekday morning interviews",
      recurringPatterns: [pattern],
      overrideStructure: { supportsBlackoutDates: true },
      archived: false,
    },
  ],
  demoUsers: [
    {
      id: "user-coordinator-ava",
      role: "coordinator",
      authorisedFacilityIds: [facility.id],
      authorisedStudyIds: [study.id],
    },
  ],
};
