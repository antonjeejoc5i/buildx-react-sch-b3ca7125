import { createContext } from "react";
import type {
  AuditEvent,
  Booking,
  BookingVisit,
  Facility,
  NotificationEvent,
  Quota,
  Room,
  ScheduleOverride,
  SchedulePattern,
  ScheduleTemplate,
  Slot,
  Study,
  WaitlistEntry,
} from "../../domain/models.ts";
import type { DemoFixtures } from "../../fixtures/demoFixtures.ts";

export interface DemoState {
  data: DemoFixtures | null;
  error: Error | null;
  isLoading: boolean;
  reload: () => Promise<void>;
  resetToSeed: () => Promise<void>;
  importData: (serializedData: string) => Promise<void>;
  clearData: () => Promise<void>;
  saveFacility: (facility: Facility) => Promise<void>;
  saveRoom: (room: Room) => Promise<void>;
  saveStudy: (study: Study) => Promise<void>;
  saveQuota: (quota: Quota) => Promise<void>;
  saveSchedulePattern: (pattern: SchedulePattern) => Promise<void>;
  saveScheduleOverride: (override: ScheduleOverride) => Promise<void>;
  saveScheduleTemplate: (template: ScheduleTemplate) => Promise<void>;
  saveSlot: (slot: Slot) => Promise<void>;
  saveWaitlistEntry?: (entry: WaitlistEntry) => Promise<void>;
  saveBookingParticipation: (
    booking: Booking,
    bookingVisits: BookingVisit[],
  ) => Promise<void>;
  saveBulkBookingOperation: (
    bookings: Booking[],
    bookingVisits: BookingVisit[],
    notificationEvents: NotificationEvent[],
    auditEvents: AuditEvent[],
  ) => Promise<void>;
  exportData: () => string;
}

export const DemoStateContext = createContext<DemoState | null>(null);
