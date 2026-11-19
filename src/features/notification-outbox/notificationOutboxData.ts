import type {
  Booking,
  BookingVisit,
  NotificationEvent,
  Participant,
  Reminder,
  ReminderChannel,
  Study,
} from "../../domain/models.ts";

export interface OutboxPreview {
  id: string;
  studyId: string;
  participantName: string;
  kind: "event" | "reminder";
  message: string;
  channels: ReminderChannel[];
  deliveryStatus: "pending" | "sent" | "failed";
}

type StoredFailures = Record<string, true>;

function storedFailures(study: Study): StoredFailures {
  const value = study.notificationSettings.simulatedOutboxFailures;
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, true] => entry[1] === true,
    ),
  );
}

function bookingForVisit(
  visit: BookingVisit,
  bookings: Booking[],
): Booking | undefined {
  return bookings.find((booking) => booking.id === visit.bookingId);
}

function participantName(
  booking: Booking | undefined,
  participants: Participant[],
): string {
  return (
    participants.find(
      (participant) => participant.id === booking?.participantId,
    )?.name ?? "Unknown participant"
  );
}

export function buildOutboxPreviews(
  studies: Study[],
  bookings: Booking[],
  bookingVisits: BookingVisit[],
  participants: Participant[],
  reminders: Reminder[],
  notificationEvents: NotificationEvent[],
): OutboxPreview[] {
  const eventPreviews = notificationEvents.flatMap((event) => {
    const booking = bookings.find((item) => item.id === event.bookingId);
    const study = studies.find((item) => item.id === booking?.studyId);
    if (booking === undefined || study === undefined) return [];
    const failed = storedFailures(study)[`event:${event.id}`] === true;
    return [
      {
        id: `event:${event.id}`,
        studyId: study.id,
        participantName: participantName(booking, participants),
        kind: "event" as const,
        message: event.localizedPreview,
        channels: [...event.channels],
        deliveryStatus: failed ? "failed" : event.deliveryStatus,
      },
    ];
  });
  const reminderPreviews = reminders.flatMap((reminder) => {
    const visit = bookingVisits.find(
      (item) => item.id === reminder.bookingVisitId,
    );
    if (visit === undefined) return [];
    const booking = bookingForVisit(visit, bookings);
    const study = studies.find((item) => item.id === booking?.studyId);
    if (booking === undefined || study === undefined) return [];
    const failed = storedFailures(study)[`reminder:${reminder.id}`] === true;
    return [
      {
        id: `reminder:${reminder.id}`,
        studyId: study.id,
        participantName: participantName(booking, participants),
        kind: "reminder" as const,
        message: reminder.template,
        channels: [...reminder.channels],
        deliveryStatus: failed ? "failed" : reminder.deliveryStatus,
      },
    ];
  });

  return [...eventPreviews, ...reminderPreviews];
}

export function storeSimulatedFailure(study: Study, previewId: string): Study {
  return {
    ...study,
    notificationSettings: {
      ...study.notificationSettings,
      simulatedOutboxFailures: {
        ...storedFailures(study),
        [previewId]: true,
      },
    },
  };
}
