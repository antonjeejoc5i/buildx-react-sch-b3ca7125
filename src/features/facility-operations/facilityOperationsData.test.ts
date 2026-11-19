import { expect, test } from "vitest";
import { demoFixtures } from "../../fixtures/demoFixtures.ts";
import {
  checkIn,
  getPlannedAppointments,
  getReceptionAppointments,
  markNoShow,
} from "./facilityOperationsData.ts";

test("limits reception appointments to authorized facilities and minimum participant data", () => {
  const appointments = getReceptionAppointments(
    ["facility-harbor"],
    demoFixtures.rooms,
    demoFixtures.studies,
    demoFixtures.slots,
    demoFixtures.bookings,
    demoFixtures.bookingVisits,
    demoFixtures.participants,
  );

  expect(appointments).toHaveLength(1);
  expect(appointments[0]).toMatchObject({
    participantName: "Avery Chen",
    studyName: "Morning Routines Research",
    roomName: "Interview Room 101",
  });
  expect(appointments[0]).not.toHaveProperty("email");
});

test("keeps affects-standing as a placeholder when attendance changes", () => {
  const bookingVisit = demoFixtures.bookingVisits[0];
  if (bookingVisit === undefined)
    throw new Error("Expected a seeded booking visit.");

  expect(checkIn(bookingVisit, "2026-06-15T13:01:00.000Z")).toMatchObject({
    status: "checked-in",
    noShow: false,
    affectsStanding: false,
  });
  expect(markNoShow(bookingVisit)).toMatchObject({
    noShow: true,
    affectsStanding: false,
  });
});

test("filters authorized planning appointments by facility, dates, study, and room", () => {
  const appointments = getPlannedAppointments(
    ["facility-harbor"],
    ["study-morning-routines"],
    demoFixtures.facilities,
    demoFixtures.rooms,
    demoFixtures.studies,
    demoFixtures.slots,
    {
      facilityId: "facility-harbor",
      startsOn: "2026-06-15",
      endsOn: "2026-06-15",
      studyId: "study-morning-routines",
      roomId: "room-harbor-101",
    },
  );

  expect(appointments).toEqual([
    expect.objectContaining({
      studyName: "Morning Routines Research",
      roomName: "Interview Room 101",
    }),
  ]);
});
