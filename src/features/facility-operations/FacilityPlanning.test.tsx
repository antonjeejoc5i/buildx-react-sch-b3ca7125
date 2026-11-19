import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { demoFixtures } from "../../fixtures/demoFixtures.ts";
import FacilityPlanning from "./FacilityPlanning.tsx";

test("renders authorized planning filters and updates the appointment list", () => {
  render(
    <FacilityPlanning
      authorisedFacilityIds={["facility-harbor"]}
      authorisedStudyIds={["study-morning-routines"]}
      facilities={demoFixtures.facilities}
      rooms={demoFixtures.rooms}
      slots={demoFixtures.slots}
      studies={demoFixtures.studies}
    />,
  );

  expect(screen.getByLabelText("Facility")).toBeTruthy();
  expect(screen.getByLabelText("Start date")).toBeTruthy();
  expect(screen.getByLabelText("End date")).toBeTruthy();
  expect(screen.getByLabelText("Study")).toBeTruthy();
  expect(screen.getByLabelText("Room")).toBeTruthy();
  expect(
    screen.getByRole("option", { name: "Morning Routines Research" }),
  ).toBeTruthy();

  fireEvent.change(screen.getByLabelText("Start date"), {
    target: { value: "2026-06-16" },
  });
  expect(
    screen.getByText(
      "No authorized upcoming study appointments match these filters.",
    ),
  ).toBeTruthy();
});
