import { expect, test } from "vitest";
import {
  formatAppointment,
  formatAppointmentNumber,
  getLocale,
  supportedLanguages,
} from "./participantPresentationData.ts";

test("supports the approved participant languages and their locales", () => {
  expect(supportedLanguages.map((language) => language.value)).toEqual([
    "English",
    "French",
    "German",
    "Dutch",
    "Flemish",
    "Spanish",
    "Portuguese (Brazil)",
    "Hindi",
  ]);
  expect(getLocale("Flemish")).toBe("nl-BE");
  expect(getLocale("Portuguese (Brazil)")).toBe("pt-BR");
});

test("formats dates, times, and numbers with the selected locale and time zone", () => {
  const startsAtUtc = "2026-06-15T13:00:00.000Z";

  expect(formatAppointment(startsAtUtc, "French", "Europe/Paris")).toBe(
    new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: "Europe/Paris",
    }).format(new Date(startsAtUtc)),
  );
  expect(formatAppointmentNumber(1234567, "German")).toBe(
    new Intl.NumberFormat("de-DE").format(1234567),
  );
});
