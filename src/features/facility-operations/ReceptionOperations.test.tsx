import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import type { BookingVisit } from "../../domain/models.ts";
import { demoFixtures } from "../../fixtures/demoFixtures.ts";
import ReceptionOperations from "./ReceptionOperations.tsx";

test("renders minimum participant data and attendance actions", () => {
  const saveBookingVisit = vi.fn<(bookingVisit: BookingVisit) => Promise<void>>(
    async () => undefined,
  );

  render(
    <ReceptionOperations
      authorisedFacilityIds={["facility-harbor"]}
      bookingVisits={demoFixtures.bookingVisits}
      bookings={demoFixtures.bookings}
      participants={demoFixtures.participants}
      rooms={demoFixtures.rooms}
      saveBookingVisit={saveBookingVisit}
      slots={demoFixtures.slots}
      studies={demoFixtures.studies}
    />,
  );

  expect(screen.getByText("Avery Chen")).toBeTruthy();
  expect(screen.queryByText("avery.chen@example.test")).toBeNull();
  expect(screen.getByText(/Affects standing: placeholder/)).toBeTruthy();

  fireEvent.click(screen.getByRole("button", { name: "Check in" }));
  expect(saveBookingVisit).toHaveBeenCalledWith(
    expect.objectContaining({ status: "checked-in", noShow: false }),
  );

  fireEvent.click(screen.getByRole("button", { name: "Mark no-show" }));
  expect(saveBookingVisit).toHaveBeenCalledWith(
    expect.objectContaining({ noShow: true, affectsStanding: false }),
  );
});
