import type { Booking, Participant, Slot, Study } from "../../domain/models.ts";
import { getLocale } from "../participant-presentation/participantPresentationData.ts";

export type HandoffResult =
  | { kind: "ready"; participant: Participant; study: Study }
  | {
      kind: "existing-booking";
      booking: Booking;
      participant: Participant;
      slot: Slot | undefined;
      study: Study;
    }
  | { kind: "denied"; title: string; message: string };

export interface HandoffCopy {
  summary: string;
  visit: string;
  continue: string;
  selectSlot: string;
  existingAppointment: string;
  existingMessage: string;
  unqualifiedTitle: string;
  unqualifiedMessage: string;
  missingDataTitle: string;
  missingDataMessage: string;
  closedTitle: string;
  closedMessage: string;
}

const englishCopy: HandoffCopy = {
  summary: "Study summary",
  visit: "Visit",
  continue: "Continue to slot selection",
  selectSlot: "Select a slot",
  existingAppointment: "Your existing appointment",
  existingMessage:
    "You already have an active appointment for this study. We opened it instead of starting another booking.",
  unqualifiedTitle: "You cannot book this study",
  unqualifiedMessage:
    "You are not currently qualified to book this study. Please contact the research team if you have questions.",
  missingDataTitle: "More information is needed",
  missingDataMessage:
    "We need complete profile details before you can continue. Please contact the research team.",
  closedTitle: "This study is closed",
  closedMessage:
    "This study is no longer accepting bookings. Please contact the research team if you need help.",
};

const copyByLanguage: Record<string, HandoffCopy> = {
  English: englishCopy,
  French: {
    ...englishCopy,
    summary: "Résumé de l’étude",
    visit: "Visite",
    continue: "Continuer vers la sélection d’un créneau",
    selectSlot: "Sélectionnez un créneau",
    existingAppointment: "Votre rendez-vous existant",
    unqualifiedTitle: "Vous ne pouvez pas réserver cette étude",
    missingDataTitle: "Des informations supplémentaires sont nécessaires",
    closedTitle: "Cette étude est fermée",
  },
  German: {
    ...englishCopy,
    summary: "Studienübersicht",
    visit: "Besuch",
    continue: "Weiter zur Terminauswahl",
    selectSlot: "Termin auswählen",
    existingAppointment: "Ihr bestehender Termin",
    unqualifiedTitle: "Sie können diese Studie nicht buchen",
    missingDataTitle: "Weitere Informationen werden benötigt",
    closedTitle: "Diese Studie ist geschlossen",
  },
  Dutch: {
    ...englishCopy,
    summary: "Studieoverzicht",
    visit: "Bezoek",
    continue: "Doorgaan naar tijdslotselectie",
    selectSlot: "Kies een tijdslot",
    existingAppointment: "Uw bestaande afspraak",
    unqualifiedTitle: "U kunt deze studie niet boeken",
    missingDataTitle: "Meer informatie is nodig",
    closedTitle: "Deze studie is gesloten",
  },
  Flemish: {
    ...englishCopy,
    summary: "Studieoverzicht",
    visit: "Bezoek",
    continue: "Verder naar tijdslotselectie",
    selectSlot: "Kies een tijdslot",
    existingAppointment: "Uw bestaande afspraak",
    unqualifiedTitle: "U kunt deze studie niet boeken",
    missingDataTitle: "Meer informatie is nodig",
    closedTitle: "Deze studie is gesloten",
  },
  Spanish: {
    ...englishCopy,
    summary: "Resumen del estudio",
    visit: "Visita",
    continue: "Continuar a la selección de horario",
    selectSlot: "Seleccione un horario",
    existingAppointment: "Su cita actual",
    unqualifiedTitle: "No puede reservar este estudio",
    missingDataTitle: "Se necesita más información",
    closedTitle: "Este estudio está cerrado",
  },
  "Portuguese (Brazil)": {
    ...englishCopy,
    summary: "Resumo do estudo",
    visit: "Visita",
    continue: "Continuar para a seleção de horário",
    selectSlot: "Selecione um horário",
    existingAppointment: "Seu agendamento atual",
    unqualifiedTitle: "Você não pode agendar este estudo",
    missingDataTitle: "Mais informações são necessárias",
    closedTitle: "Este estudo está encerrado",
  },
  Hindi: {
    ...englishCopy,
    summary: "अध्ययन सारांश",
    visit: "विज़िट",
    continue: "समय चुनने के लिए आगे बढ़ें",
    selectSlot: "समय चुनें",
    existingAppointment: "आपकी मौजूदा अपॉइंटमेंट",
    unqualifiedTitle: "आप इस अध्ययन को बुक नहीं कर सकते",
    missingDataTitle: "अधिक जानकारी आवश्यक है",
    closedTitle: "यह अध्ययन बंद है",
  },
};

export function getHandoffCopy(language: string): HandoffCopy {
  return copyByLanguage[language] ?? englishCopy;
}

export function resolveHandoff(
  studies: Study[],
  participants: Participant[],
  bookings: Booking[],
  slots: Slot[],
  projectId: string,
  participantId: string,
): HandoffResult {
  const study = studies.find((item) => item.decipherProjectId === projectId);
  const participant = participants.find((item) => item.id === participantId);

  if (study === undefined || participant === undefined) {
    return {
      kind: "denied",
      title: "Handoff unavailable",
      message: "This local handoff link is not available.",
    };
  }

  const copy = getHandoffCopy(participant.language);
  if (study.lifecycleStatus !== "open") {
    return {
      kind: "denied",
      title: copy.closedTitle,
      message: copy.closedMessage,
    };
  }
  if (participant.qualificationState !== "eligible") {
    return {
      kind: "denied",
      title: copy.unqualifiedTitle,
      message: copy.unqualifiedMessage,
    };
  }
  if (Object.values(participant.profile).some((value) => value.trim() === "")) {
    return {
      kind: "denied",
      title: copy.missingDataTitle,
      message: copy.missingDataMessage,
    };
  }

  const booking = bookings.find(
    (item) =>
      item.studyId === study.id &&
      item.participantId === participant.id &&
      (item.status === "draft" || item.status === "confirmed"),
  );
  if (booking !== undefined) {
    return {
      kind: "existing-booking",
      booking,
      participant,
      slot: slots.find((item) => item.id === booking.selectedSlotIds[0]),
      study,
    };
  }
  return { kind: "ready", participant, study };
}

export function formatHandoffTime(
  startsAtUtc: string,
  language: string,
  timeZone: string,
): string {
  return new Intl.DateTimeFormat(getLocale(language), {
    dateStyle: "full",
    timeStyle: "short",
    timeZone,
  }).format(new Date(startsAtUtc));
}
