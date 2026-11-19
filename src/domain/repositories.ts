import type {
  AuditEvent,
  Booking,
  BookingVisit,
  DemoUser,
  Facility,
  IdentifiedRecord,
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
} from "./models.ts";

export interface Repository<T extends IdentifiedRecord> {
  get(id: string): Promise<T | undefined>;
  getAll(): Promise<T[]>;
  put(record: T): Promise<void>;
  delete(id: string): Promise<void>;
  clear(): Promise<void>;
}

export interface SchedulingRepositories {
  studies: Repository<Study>;
  facilities: Repository<Facility>;
  rooms: Repository<Room>;
  schedulePatterns: Repository<SchedulePattern>;
  scheduleOverrides: Repository<ScheduleOverride>;
  slots: Repository<Slot>;
  quotas: Repository<Quota>;
  participants: Repository<Participant>;
  bookings: Repository<Booking>;
  bookingVisits: Repository<BookingVisit>;
  waitlistEntries: Repository<WaitlistEntry>;
  reminders: Repository<Reminder>;
  notificationEvents: Repository<NotificationEvent>;
  auditEvents: Repository<AuditEvent>;
  scheduleTemplates: Repository<ScheduleTemplate>;
  demoUsers: Repository<DemoUser>;
}
