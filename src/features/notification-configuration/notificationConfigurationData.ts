import type {
  Booking,
  BookingVisit,
  NotificationEvent,
  Reminder,
  ReminderChannel,
  Study,
} from "../../domain/models.ts";

export interface ReminderTiming {
  id: string;
  hoursBefore: number;
  channels: ReminderChannel[];
  template: string;
}

export interface NotificationSettings {
  reminderTimings: ReminderTiming[];
  eventTemplates: Record<string, string>;
}

export interface GeneratedNotificationRecords {
  reminders: Reminder[];
  notificationEvents: NotificationEvent[];
}

const defaultReminderTiming: ReminderTiming = {
  id: "reminder-24-hours",
  hoursBefore: 24,
  channels: ["email"],
  template: "Reminder: your {{visitName}} is scheduled for {{appointment}}.",
};

const defaultEventTemplates: Record<string, string> = {
  rescheduled: "Your {{visitName}} has been rescheduled for {{appointment}}.",
  cancelled: "Your {{visitName}} has been cancelled.",
  "waitlist-promoted":
    "A place has opened for your {{visitName}} on {{appointment}}.",
};

export class NotificationConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotificationConfigurationError";
  }
}

function isReminderChannel(value: unknown): value is ReminderChannel {
  return value === "email" || value === "sms";
}

function isReminderTiming(value: unknown): value is ReminderTiming {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.hoursBefore === "number" &&
    Array.isArray(candidate.channels) &&
    candidate.channels.every(isReminderChannel) &&
    typeof candidate.template === "string"
  );
}

function readReminderTimings(value: unknown): ReminderTiming[] | null {
  if (!Array.isArray(value)) return null;

  const timings: ReminderTiming[] = [];
  for (const timing of value) {
    if (!isReminderTiming(timing)) return null;
    timings.push({
      id: timing.id,
      hoursBefore: timing.hoursBefore,
      channels: [...timing.channels],
      template: timing.template,
    });
  }

  return timings;
}

export function getNotificationSettings(study: Study): NotificationSettings {
  const reminderTimings = readReminderTimings(
    study.notificationSettings.reminderTimings,
  );
  const eventTemplates = study.notificationSettings.eventTemplates;

  return {
    reminderTimings: reminderTimings ?? [
      {
        ...defaultReminderTiming,
        channels: [...defaultReminderTiming.channels],
      },
    ],
    eventTemplates:
      typeof eventTemplates === "object" &&
      eventTemplates !== null &&
      !Array.isArray(eventTemplates)
        ? Object.fromEntries(
            Object.entries(eventTemplates).filter(
              (entry): entry is [string, string] =>
                typeof entry[1] === "string",
            ),
          )
        : { ...defaultEventTemplates },
  };
}

export function validateNotificationSettings(
  settings: NotificationSettings,
): NotificationSettings {
  const timingIds = new Set<string>();
  const reminderTimings = settings.reminderTimings.map((timing) => {
    const id = timing.id.trim();
    const template = timing.template.trim();

    if (id === "" || timingIds.has(id)) {
      throw new NotificationConfigurationError(
        "Each reminder timing needs a unique identifier.",
      );
    }
    timingIds.add(id);

    if (!Number.isFinite(timing.hoursBefore) || timing.hoursBefore < 0) {
      throw new NotificationConfigurationError(
        "Reminder timing must be zero or more hours before a visit.",
      );
    }
    if (
      timing.channels.length === 0 ||
      !timing.channels.every(isReminderChannel)
    ) {
      throw new NotificationConfigurationError(
        "Select at least one valid reminder delivery channel.",
      );
    }
    if (template === "") {
      throw new NotificationConfigurationError(
        "Reminder template content is required.",
      );
    }

    return { ...timing, id, template, channels: [...timing.channels] };
  });

  const eventTemplates = Object.fromEntries(
    Object.entries(settings.eventTemplates).map(([eventType, template]) => {
      if (eventType.trim() === "" || template.trim() === "") {
        throw new NotificationConfigurationError(
          "Event types and event templates are required.",
        );
      }
      return [eventType.trim(), template.trim()];
    }),
  );

  return { reminderTimings, eventTemplates };
}

function renderTemplate(template: string, bookingVisit: BookingVisit): string {
  return template
    .replaceAll("{{visitName}}", bookingVisit.visitId)
    .replaceAll(
      "{{appointment}}",
      new Date(bookingVisit.startsAtUtc).toLocaleString(),
    );
}

export function buildNotificationRecords(
  study: Study,
  booking: Booking,
  bookingVisits: BookingVisit[],
  eventType: "rescheduled" | "cancelled" | "waitlist-promoted",
  createdAt: string,
): GeneratedNotificationRecords {
  const settings = getNotificationSettings(study);
  const creationTime = new Date(createdAt).getTime();
  const activeVisits = bookingVisits.filter(
    (visit) => visit.status === "scheduled",
  );
  const reminders =
    eventType === "cancelled"
      ? []
      : activeVisits.flatMap((visit) =>
          settings.reminderTimings.flatMap((timing) => {
            const dueAtUtc = new Date(
              new Date(visit.startsAtUtc).getTime() -
                timing.hoursBefore * 60 * 60 * 1000,
            ).toISOString();
            if (new Date(dueAtUtc).getTime() <= creationTime) return [];

            return [
              {
                id: `reminder-${booking.id}-${visit.id}-${timing.id}`,
                bookingVisitId: visit.id,
                dueAtUtc,
                channels: timing.channels,
                template: renderTemplate(timing.template, visit),
                deliveryStatus: "pending" as const,
              },
            ];
          }),
        );
  const eventTemplate =
    settings.eventTemplates[eventType] ?? defaultEventTemplates[eventType];
  const notificationEvents: NotificationEvent[] = bookingVisits.map(
    (visit) => ({
      id: `notification-${eventType}-${booking.id}-${visit.id}-${createdAt}`,
      bookingId: booking.id,
      eventType,
      channels: booking.reminderPreference,
      localizedPreview: renderTemplate(eventTemplate, visit),
      deliveryStatus: "pending",
      createdAt,
    }),
  );

  return { reminders, notificationEvents };
}
