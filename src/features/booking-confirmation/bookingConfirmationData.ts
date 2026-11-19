import type {
  Facility,
  Participant,
  ReminderChannel,
  Room,
  Slot,
  Study,
  Visit,
} from "../../domain/models.ts";
import { formatAppointment } from "../participant-presentation/participantPresentationData.ts";

export type ReminderPreference = "profile-default" | "email" | "sms" | "both";

export interface ConfirmationTemplateSettings {
  template: string;
  enableRescheduleLink: boolean;
  enableCancelLink: boolean;
}

export interface BookingConfirmationDetails {
  renderedTemplate: string;
  location: string;
  visits: Array<{ name: string; appointment: string }>;
  reminderChannels: ReminderChannel[];
  enableRescheduleLink: boolean;
  enableCancelLink: boolean;
}

const dynamicFields = [
  "participantName",
  "studyName",
  "visits",
  "location",
  "managementLinks",
] as const;

type DynamicField = (typeof dynamicFields)[number];

export const defaultConfirmationTemplate =
  "Hello {{participantName}}, your {{studyName}} booking is confirmed. {{visits}} Location: {{location}}. {{managementLinks}}";

export class ConfirmationTemplateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfirmationTemplateError";
  }
}

export function getConfirmationTemplateSettings(
  study: Study,
): ConfirmationTemplateSettings {
  const template = study.notificationSettings.confirmationTemplate;
  const enableRescheduleLink = study.notificationSettings.enableRescheduleLink;
  const enableCancelLink = study.notificationSettings.enableCancelLink;

  return {
    template:
      typeof template === "string" && template.trim() !== ""
        ? template
        : defaultConfirmationTemplate,
    enableRescheduleLink:
      typeof enableRescheduleLink === "boolean"
        ? enableRescheduleLink
        : study.bookingControls.allowSelfServiceReschedule === true,
    enableCancelLink:
      typeof enableCancelLink === "boolean" ? enableCancelLink : true,
  };
}

export function validateConfirmationTemplate(template: string): string {
  const trimmedTemplate = template.trim();
  if (trimmedTemplate === "") {
    throw new ConfirmationTemplateError(
      "Confirmation template content is required.",
    );
  }

  const fields = Array.from(
    trimmedTemplate.matchAll(/{{\s*([a-zA-Z]+)\s*}}/g),
    (match) => match[1],
  );
  const hasUnsupportedField = fields.some(
    (field) => !dynamicFields.includes(field as DynamicField),
  );

  if (hasUnsupportedField) {
    throw new ConfirmationTemplateError(
      "Use only supported dynamic fields in the confirmation template.",
    );
  }
  if (fields.length === 0) {
    throw new ConfirmationTemplateError(
      "Confirmation template content must include a dynamic field.",
    );
  }

  return trimmedTemplate;
}

export function resolveReminderChannels(
  preference: ReminderPreference,
  profileDefault: ReminderChannel[],
): ReminderChannel[] {
  if (preference === "profile-default") return profileDefault;
  if (preference === "email") return ["email"];
  if (preference === "sms") return ["sms"];
  return ["email", "sms"];
}

function renderTemplate(
  template: string,
  values: Record<DynamicField, string>,
): string {
  return template.replace(/{{\s*([a-zA-Z]+)\s*}}/g, (match, field: string) => {
    if (!dynamicFields.includes(field as DynamicField)) return match;
    return values[field as DynamicField];
  });
}

function appointmentForVisit(
  visit: Visit,
  slots: Slot[],
  selectedSlotByVisit: Record<string, string>,
  participant: Participant,
): { name: string; appointment: string } {
  const slot = slots.find((item) => item.id === selectedSlotByVisit[visit.id]);
  if (slot === undefined) {
    throw new ConfirmationTemplateError(
      `The selected slot for ${visit.name} is unavailable for confirmation.`,
    );
  }

  return {
    name: visit.name,
    appointment: formatAppointment(
      slot.startsAtUtc,
      participant.language,
      participant.timeZone,
    ),
  };
}

export function buildBookingConfirmation(
  study: Study,
  participant: Participant,
  facility: Facility | undefined,
  room: Room | undefined,
  slots: Slot[],
  selectedSlotByVisit: Record<string, string>,
  preference: ReminderPreference,
): BookingConfirmationDetails {
  if (
    facility === undefined ||
    room === undefined ||
    room.facilityId !== facility.id
  ) {
    throw new ConfirmationTemplateError(
      "The booking location is unavailable for confirmation.",
    );
  }

  const settings = getConfirmationTemplateSettings(study);
  const template = validateConfirmationTemplate(settings.template);
  const visits = study.visits.map((visit) =>
    appointmentForVisit(visit, slots, selectedSlotByVisit, participant),
  );
  const location = `${facility.name}, ${room.name}`;
  const managementLinks = [
    ...(settings.enableRescheduleLink ? ["Reschedule booking"] : []),
    ...(settings.enableCancelLink ? ["Cancel booking"] : []),
  ].join("; ");

  return {
    renderedTemplate: renderTemplate(template, {
      participantName: participant.name,
      studyName: study.name,
      visits: visits
        .map((visit) => `${visit.name}: ${visit.appointment}`)
        .join("; "),
      location,
      managementLinks,
    }),
    location,
    visits,
    reminderChannels: resolveReminderChannels(
      preference,
      participant.reminderDefault,
    ),
    enableRescheduleLink: settings.enableRescheduleLink,
    enableCancelLink: settings.enableCancelLink,
  };
}
