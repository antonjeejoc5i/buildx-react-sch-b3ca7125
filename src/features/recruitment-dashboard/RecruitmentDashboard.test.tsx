import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { demoFixtures } from "../../fixtures/demoFixtures.ts";
import RecruitmentDashboard from "./RecruitmentDashboard.tsx";

test("renders local metrics and all required drill-down controls", () => {
  const study = demoFixtures.studies[0];
  if (study === undefined) throw new Error("Expected a seeded study.");

  render(
    <RecruitmentDashboard
      bookingVisits={demoFixtures.bookingVisits}
      bookings={demoFixtures.bookings}
      participants={demoFixtures.participants}
      quotas={demoFixtures.quotas}
      slots={demoFixtures.slots}
      study={study}
    />,
  );

  expect(screen.getByText("Local demonstration calculations")).toBeTruthy();
  expect(screen.getByText("Scheduled participants")).toBeTruthy();
  expect(screen.getByText("Scheduled slots")).toBeTruthy();
  expect(screen.getByText("Cancellations")).toBeTruthy();
  expect(screen.getByText("No-shows")).toBeTruthy();
  expect(
    screen.getByRole("heading", { name: "Segment slot fill" }),
  ).toBeTruthy();
  expect(screen.getByText("Quota drill-down")).toBeTruthy();
  expect(screen.getByText("Slot drill-down")).toBeTruthy();
  expect(screen.getByText("Participant drill-down")).toBeTruthy();
});
