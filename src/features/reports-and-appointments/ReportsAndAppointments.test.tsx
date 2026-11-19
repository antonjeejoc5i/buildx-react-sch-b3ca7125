import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { demoFixtures } from "../../fixtures/demoFixtures.ts";
import ReportsAndAppointments from "./ReportsAndAppointments.tsx";

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-06-01T00:00:00.000Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

test("renders disclosed exports and an accessible future appointment table without a calendar", () => {
  render(
    <ReportsAndAppointments
      actor={demoFixtures.demoUsers[0]!}
      data={demoFixtures}
    />,
  );

  expect(
    screen.getByRole("heading", { name: "Upcoming appointments" }),
  ).toBeTruthy();
  expect(screen.getByLabelText("Researcher")).toBeTruthy();
  expect(screen.getByLabelText("Study")).toBeTruthy();
  expect(screen.getByLabelText("Facility")).toBeTruthy();
  expect(screen.getByLabelText("Start date")).toBeTruthy();
  expect(screen.getByLabelText("End date")).toBeTruthy();
  expect(
    screen
      .getByRole("link", {
        name: "Export all in-scope recruitment records (CSV)",
      })
      .getAttribute("download"),
  ).toBe("recruitment-report.csv");
  expect(
    screen
      .getByRole("link", {
        name: "Export current filtered appointments (CSV)",
      })
      .getAttribute("download"),
  ).toBe("upcoming-appointments.csv");
  expect(screen.getByText("Avery Chen")).toBeTruthy();
});

test("announces an accessible empty state when future appointment filters match nothing", () => {
  render(
    <ReportsAndAppointments
      actor={demoFixtures.demoUsers[0]!}
      data={demoFixtures}
    />,
  );

  fireEvent.change(screen.getByLabelText("Start date"), {
    target: { value: "2026-06-16" },
  });

  expect(
    screen
      .getByText("No upcoming appointments in your scope match these filters.")
      .getAttribute("role"),
  ).toBe("status");
});
