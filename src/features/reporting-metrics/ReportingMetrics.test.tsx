import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { demoFixtures } from "../../fixtures/demoFixtures.ts";
import ReportingMetrics from "./ReportingMetrics.tsx";

test("renders all disclosed local reporting metrics", () => {
  const study = demoFixtures.studies[0];
  if (study === undefined) throw new Error("Expected a seeded study.");

  render(
    <ReportingMetrics
      bookingVisits={demoFixtures.bookingVisits}
      bookings={demoFixtures.bookings}
      participants={demoFixtures.participants}
      quotas={demoFixtures.quotas}
      slots={demoFixtures.slots}
      study={study}
    />,
  );

  expect(
    screen.getByRole("heading", { name: "Reporting metrics" }),
  ).toBeTruthy();
  expect(screen.getByRole("heading", { name: "Fill rate" })).toBeTruthy();
  expect(screen.getByRole("heading", { name: "No-show rate" })).toBeTruthy();
  expect(
    screen.getByRole("heading", { name: "Recruitment status" }),
  ).toBeTruthy();
  expect(screen.getByRole("heading", { name: "Time to fill" })).toBeTruthy();
  expect(
    screen.getAllByText("Calculated from local demonstration data."),
  ).toHaveLength(4);
});
