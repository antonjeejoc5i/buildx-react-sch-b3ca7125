import { expect, test } from "vitest";
import {
  canAcceptNewBookings,
  requireStudyOpenForBooking,
  StudyBookingError,
} from "../../domain/models.ts";
import { demoFixtures } from "../../fixtures/demoFixtures.ts";
import { buildStudy, StudyEditorError } from "./studyEditorData.ts";

const study = demoFixtures.studies[0];
const draftValues = {
  name: "Draft participant interviews",
  description: "",
  decipherProjectId: "",
  lifecycleStatus: "draft" as const,
  facilityId: "",
  roomId: "",
  visitName: "",
  visitDurationMinutes: "",
  allowSelfServiceReschedule: false,
  maxReschedules: "0",
  reminderHoursBefore: "24",
};

test("allows an incomplete study to be saved as a draft", () => {
  expect(
    buildStudy(study, draftValues, demoFixtures.facilities, demoFixtures.rooms),
  ).toMatchObject({
    lifecycleStatus: "draft",
    facilityId: "",
    roomId: "",
    decipherProjectId: "",
  });
});

test("requires a facility, matching room, and Decipher project before opening", () => {
  expect(() =>
    buildStudy(
      study,
      { ...draftValues, lifecycleStatus: "open" },
      demoFixtures.facilities,
      demoFixtures.rooms,
    ),
  ).toThrow(StudyEditorError);

  expect(
    buildStudy(
      study,
      {
        ...draftValues,
        lifecycleStatus: "open",
        facilityId: study.facilityId,
        roomId: study.roomId,
        decipherProjectId: "DCP-NEW-001",
      },
      demoFixtures.facilities,
      demoFixtures.rooms,
    ).lifecycleStatus,
  ).toBe("open");
});

test("permits new participant bookings only while a study is open", () => {
  expect(canAcceptNewBookings({ ...study, lifecycleStatus: "open" })).toBe(
    true,
  );
  for (const lifecycleStatus of [
    "draft",
    "paused",
    "closed",
    "archived",
  ] as const) {
    expect(canAcceptNewBookings({ ...study, lifecycleStatus })).toBe(false);
    expect(() =>
      requireStudyOpenForBooking({ ...study, lifecycleStatus }),
    ).toThrow(StudyBookingError);
  }
});
