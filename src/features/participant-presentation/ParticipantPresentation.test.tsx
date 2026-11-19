import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { demoFixtures } from "../../fixtures/demoFixtures.ts";
import ParticipantPresentation from "./ParticipantPresentation.tsx";

test("defaults to profile language and changes displayed appointment time without changing UTC", () => {
  const participant = demoFixtures.participants[0]!;
  const appointment = demoFixtures.slots[0]!;
  const storedUtc = appointment.startsAtUtc;

  render(
    <ParticipantPresentation
      appointment={appointment}
      participant={participant}
    />,
  );

  const languageControl = screen.getByLabelText(
    "Language",
  ) as HTMLSelectElement;
  const timeZoneControl = screen.getByLabelText(
    "Display time zone",
  ) as HTMLSelectElement;
  expect(languageControl.value).toBe("English");
  expect(timeZoneControl.value).toBe("America/New_York");

  fireEvent.change(languageControl, { target: { value: "French" } });
  fireEvent.change(timeZoneControl, { target: { value: "Europe/Paris" } });

  expect(screen.getByText("Fuseau horaire d’affichage")).toBeTruthy();
  expect(screen.getByText(/Votre rendez-vous est confirmé/)).toBeTruthy();
  expect(screen.getByText(/Rappel/)).toBeTruthy();
  expect(appointment.startsAtUtc).toBe(storedUtc);
});
