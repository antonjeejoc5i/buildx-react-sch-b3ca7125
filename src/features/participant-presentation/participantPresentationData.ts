export const supportedLanguages = [
  { value: "English", locale: "en-US", label: "English" },
  { value: "French", locale: "fr-FR", label: "Français" },
  { value: "German", locale: "de-DE", label: "Deutsch" },
  { value: "Dutch", locale: "nl-NL", label: "Nederlands" },
  { value: "Flemish", locale: "nl-BE", label: "Vlaams" },
  { value: "Spanish", locale: "es-ES", label: "Español" },
  {
    value: "Portuguese (Brazil)",
    locale: "pt-BR",
    label: "Português (Brasil)",
  },
  { value: "Hindi", locale: "hi-IN", label: "हिन्दी" },
] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number]["value"];

interface ParticipantCopy {
  heading: string;
  language: string;
  timeZone: string;
  save: string;
  appointment: string;
  appointmentNumber: string;
  preview: string;
  confirmation: (appointment: string) => string;
  reminder: (appointment: string) => string;
}

const participantCopy: Record<SupportedLanguage, ParticipantCopy> = {
  English: {
    heading: "Your appointment preferences",
    language: "Language",
    timeZone: "Display time zone",
    save: "Save preferences",
    appointment: "Appointment time",
    appointmentNumber: "Appointment number",
    preview: "Message preview",
    confirmation: (appointment) =>
      `Your appointment is confirmed for ${appointment}.`,
    reminder: (appointment) => `Reminder: your appointment is ${appointment}.`,
  },
  French: {
    heading: "Vos préférences de rendez-vous",
    language: "Langue",
    timeZone: "Fuseau horaire d’affichage",
    save: "Enregistrer les préférences",
    appointment: "Heure du rendez-vous",
    appointmentNumber: "Numéro de rendez-vous",
    preview: "Aperçu du message",
    confirmation: (appointment) =>
      `Votre rendez-vous est confirmé pour le ${appointment}.`,
    reminder: (appointment) =>
      `Rappel : votre rendez-vous est le ${appointment}.`,
  },
  German: {
    heading: "Ihre Terminvoreinstellungen",
    language: "Sprache",
    timeZone: "Zeitzone für die Anzeige",
    save: "Einstellungen speichern",
    appointment: "Terminzeit",
    appointmentNumber: "Terminnummer",
    preview: "Nachrichtenvorschau",
    confirmation: (appointment) =>
      `Ihr Termin für ${appointment} ist bestätigt.`,
    reminder: (appointment) => `Erinnerung: Ihr Termin ist am ${appointment}.`,
  },
  Dutch: {
    heading: "Uw afspraakvoorkeuren",
    language: "Taal",
    timeZone: "Tijdzone voor weergave",
    save: "Voorkeuren opslaan",
    appointment: "Afspraaktijd",
    appointmentNumber: "Afspraaknummer",
    preview: "Berichtvoorbeeld",
    confirmation: (appointment) =>
      `Uw afspraak voor ${appointment} is bevestigd.`,
    reminder: (appointment) => `Herinnering: uw afspraak is op ${appointment}.`,
  },
  Flemish: {
    heading: "Uw afspraakvoorkeuren",
    language: "Taal",
    timeZone: "Tijdzone voor weergave",
    save: "Voorkeuren opslaan",
    appointment: "Afspraakuur",
    appointmentNumber: "Afspraaknummer",
    preview: "Berichtvoorbeeld",
    confirmation: (appointment) =>
      `Uw afspraak voor ${appointment} is bevestigd.`,
    reminder: (appointment) => `Herinnering: uw afspraak is op ${appointment}.`,
  },
  Spanish: {
    heading: "Sus preferencias de cita",
    language: "Idioma",
    timeZone: "Zona horaria de visualización",
    save: "Guardar preferencias",
    appointment: "Hora de la cita",
    appointmentNumber: "Número de cita",
    preview: "Vista previa del mensaje",
    confirmation: (appointment) =>
      `Su cita para ${appointment} está confirmada.`,
    reminder: (appointment) => `Recordatorio: su cita es el ${appointment}.`,
  },
  "Portuguese (Brazil)": {
    heading: "Suas preferências de agendamento",
    language: "Idioma",
    timeZone: "Fuso horário de exibição",
    save: "Salvar preferências",
    appointment: "Horário do agendamento",
    appointmentNumber: "Número do agendamento",
    preview: "Prévia da mensagem",
    confirmation: (appointment) =>
      `Seu agendamento para ${appointment} está confirmado.`,
    reminder: (appointment) => `Lembrete: seu agendamento é ${appointment}.`,
  },
  Hindi: {
    heading: "आपकी अपॉइंटमेंट प्राथमिकताएँ",
    language: "भाषा",
    timeZone: "प्रदर्शन समय क्षेत्र",
    save: "प्राथमिकताएँ सहेजें",
    appointment: "अपॉइंटमेंट का समय",
    appointmentNumber: "अपॉइंटमेंट संख्या",
    preview: "संदेश पूर्वावलोकन",
    confirmation: (appointment) =>
      `${appointment} के लिए आपकी अपॉइंटमेंट की पुष्टि हो गई है।`,
    reminder: (appointment) => `स्मरण: आपकी अपॉइंटमेंट ${appointment} को है।`,
  },
};

export function isSupportedLanguage(
  language: string,
): language is SupportedLanguage {
  return supportedLanguages.some((option) => option.value === language);
}

export function getLocale(language: string): string {
  return (
    supportedLanguages.find((option) => option.value === language)?.locale ??
    "en-US"
  );
}

export function getParticipantCopy(language: string): ParticipantCopy {
  return participantCopy[isSupportedLanguage(language) ? language : "English"];
}

export function formatAppointment(
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

export function formatAppointmentNumber(
  value: number,
  language: string,
): string {
  return new Intl.NumberFormat(getLocale(language)).format(value);
}
