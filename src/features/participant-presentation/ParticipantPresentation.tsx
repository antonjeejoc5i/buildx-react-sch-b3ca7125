import { useState } from "react";
import type { Participant, Slot } from "../../domain/models.ts";
import {
  formatAppointment,
  formatAppointmentNumber,
  getParticipantCopy,
  supportedLanguages,
} from "./participantPresentationData.ts";
import "./ParticipantPresentation.css";

interface ParticipantPresentationProps {
  participant: Participant;
  appointment: Slot;
}

const displayTimeZones = [
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Amsterdam",
  "Europe/Brussels",
  "Europe/Madrid",
  "America/Sao_Paulo",
  "Asia/Kolkata",
];

export default function ParticipantPresentation({
  participant,
  appointment,
}: ParticipantPresentationProps) {
  const [language, setLanguage] = useState(participant.language);
  const [timeZone, setTimeZone] = useState(participant.timeZone);
  const copy = getParticipantCopy(language);
  const appointmentTime = formatAppointment(
    appointment.startsAtUtc,
    language,
    timeZone,
  );
  const timeZones = Array.from(
    new Set([participant.timeZone, ...displayTimeZones]),
  );

  return (
    <section
      aria-labelledby="participant-presentation-heading"
      className="participant-presentation"
    >
      <header>
        <p>{copy.preview}</p>
        <h2 id="participant-presentation-heading">{copy.heading}</h2>
      </header>
      <div className="participant-presentation__controls">
        <label htmlFor="participant-language">
          {copy.language}
          <select
            id="participant-language"
            onChange={(event) => setLanguage(event.target.value)}
            value={language}
          >
            {supportedLanguages.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor="participant-time-zone">
          {copy.timeZone}
          <select
            id="participant-time-zone"
            onChange={(event) => setTimeZone(event.target.value)}
            value={timeZone}
          >
            {timeZones.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="participant-presentation__preview">
        <dl>
          <div>
            <dt>{copy.appointment}</dt>
            <dd>{appointmentTime}</dd>
          </div>
          <div>
            <dt>{copy.appointmentNumber}</dt>
            <dd>{formatAppointmentNumber(1, language)}</dd>
          </div>
        </dl>
        <p>{copy.confirmation(appointmentTime)}</p>
        <p>{copy.reminder(appointmentTime)}</p>
      </div>
    </section>
  );
}
