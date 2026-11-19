import { expect, test } from "vitest";
import type { DemoUser } from "../../domain/models.ts";
import { demoFixtures } from "../../fixtures/demoFixtures.ts";
import {
  appointmentCsv,
  getScopedReportRecords,
  getUpcomingAppointments,
  reportCsv,
} from "./reportsAndAppointmentsData.ts";

const actor = demoFixtures.demoUsers[0]!;
const allFilters = {
  facilityId: "",
  researcherId: "",
  startsOn: "",
  endsOn: "",
  studyId: "",
};

test("returns only future appointments within the actor scope and honours date filters", () => {
  const appointments = getUpcomingAppointments(
    actor,
    demoFixtures,
    allFilters,
    new Date("2026-06-01T00:00:00.000Z"),
  );

  expect(appointments).toEqual([
    expect.objectContaining({
      participantName: "Avery Chen",
      studyName: "Morning Routines Research",
    }),
  ]);
  expect(
    getUpcomingAppointments(
      actor,
      demoFixtures,
      { ...allFilters, startsOn: "2026-06-16" },
      new Date("2026-06-01T00:00:00.000Z"),
    ),
  ).toEqual([]);
});

test("does not expose records from studies outside the simulated scope", () => {
  const restrictedActor: DemoUser = {
    ...actor,
    authorisedStudyIds: [],
  };

  expect(
    getUpcomingAppointments(
      restrictedActor,
      demoFixtures,
      allFilters,
      new Date("2026-06-01T00:00:00.000Z"),
    ),
  ).toEqual([]);
  expect(getScopedReportRecords(restrictedActor, demoFixtures, "")).toEqual([]);
});

test("builds Excel-compatible CSV exports from dashboard calculations and current rows", () => {
  const reports = getScopedReportRecords(actor, demoFixtures, "");
  const appointments = getUpcomingAppointments(
    actor,
    demoFixtures,
    allFilters,
    new Date("2026-06-01T00:00:00.000Z"),
  );

  expect(reportCsv(reports)).toContain("Scheduled participants");
  expect(reportCsv(reports)).toContain("Morning Routines Research,1,1,1,0,0");
  expect(appointmentCsv(appointments)).toContain("Participant,Study,Facility");
  expect(appointmentCsv(appointments)).toContain("Avery Chen");
});
