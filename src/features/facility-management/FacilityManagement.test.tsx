import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { demoFixtures } from "../../fixtures/demoFixtures.ts";
import FacilityManagement from "./FacilityManagement.tsx";

test("saves facility controls and displays room capacity as informational", async () => {
  const saveFacility = vi.fn(async () => undefined);
  const saveRoom = vi.fn(async () => undefined);
  const facility = demoFixtures.facilities[0];
  const room = demoFixtures.rooms[0];

  render(
    <FacilityManagement
      demoUsers={demoFixtures.demoUsers}
      facility={facility}
      rooms={[room]}
      saveFacility={saveFacility}
      saveRoom={saveRoom}
    />,
  );

  fireEvent.change(screen.getByLabelText("Time zone"), {
    target: { value: "America/Chicago" },
  });
  fireEvent.change(screen.getByLabelText("Blackout dates"), {
    target: { value: "2026-07-04\n2026-12-25" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save facility" }));
  expect(saveFacility).toHaveBeenCalledWith({
    ...facility,
    timeZone: "America/Chicago",
    blackoutDates: ["2026-07-04", "2026-12-25"],
  });

  expect(
    screen.getByText(
      "Capacity is informational only and never blocks a booking or slot.",
    ),
  ).toBeTruthy();
  const roomForm = screen
    .getByRole("button", { name: "Save room" })
    .closest("form");
  if (roomForm === null) throw new Error("Room form was not rendered.");
  fireEvent.change(within(roomForm).getByLabelText("Informational capacity"), {
    target: { value: "0" },
  });
  fireEvent.click(within(roomForm).getByRole("button", { name: "Save room" }));
  expect(saveRoom).toHaveBeenCalledWith({ ...room, informationalCapacity: 0 });
});
