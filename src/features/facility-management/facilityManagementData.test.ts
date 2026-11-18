import { expect, test } from "vitest";
import { demoFixtures } from "../../fixtures/demoFixtures.ts";
import {
  FacilityManagementError,
  buildFacility,
  buildRoom,
} from "./facilityManagementData.ts";

test("maintains facility blackout dates and authorised roles locally", () => {
  const facility = buildFacility(demoFixtures.facilities[0], {
    name: " Harbor Research Center ",
    timeZone: "America/Chicago",
    blackoutDates: "2026-07-04\n2026-12-25, 2026-07-04",
    authorisedRoleIds: ["coordinator", "coordinator", "researcher"],
  });

  expect(facility).toMatchObject({
    name: "Harbor Research Center",
    timeZone: "America/Chicago",
    blackoutDates: ["2026-07-04", "2026-12-25"],
    authorisedRoleIds: ["coordinator", "researcher"],
  });
});

test("accepts zero capacity because room capacity is informational", () => {
  expect(
    buildRoom(demoFixtures.rooms[0], {
      name: "Available room",
      informationalCapacity: "0",
    }),
  ).toMatchObject({ name: "Available room", informationalCapacity: 0 });

  expect(() =>
    buildRoom(demoFixtures.rooms[0], {
      name: "Available room",
      informationalCapacity: "-1",
    }),
  ).toThrow(FacilityManagementError);
});
