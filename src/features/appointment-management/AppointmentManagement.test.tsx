import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { Booking, BookingVisit } from "../../domain/models.ts";
import { demoFixtures } from "../../fixtures/demoFixtures.ts";
import AppointmentManagement from "./AppointmentManagement.tsx";

// The fixture appointments are in June 2026: pin the clock before them, so cutoffs do not depend on
// the day the tests run. Only Date is faked, so waitFor keeps its real timers.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-06-01T00:00:00.000Z"));
});
afterEach(() => {
  vi.useRealTimers();
});

test("requires confirmation before cancelling the complete study participation", async () => {
  const saveParticipation = vi.fn<
    (booking: Booking, visits: BookingVisit[]) => Promise<void>
  >(async () => undefined);
  const study = {
    ...demoFixtures.studies[0]!,
    bookingControls: {
      ...demoFixtures.studies[0]!.bookingControls,
      allowSelfServiceCancellation: true,
    },
  };

  render(
    <AppointmentManagement
      booking={demoFixtures.bookings[0]!}
      data={demoFixtures}
      participant={demoFixtures.participants[0]!}
      saveParticipation={saveParticipation}
      study={study}
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: "Cancel participation" }));
  expect(saveParticipation).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Confirm cancellation" }));

  await waitFor(() => expect(saveParticipation).toHaveBeenCalledTimes(1));
  expect(saveParticipation.mock.calls[0]?.[0].status).toBe("cancelled");
  expect(
    saveParticipation.mock.calls[0]?.[1].every(
      (visit) => visit.status === "cancelled",
    ),
  ).toBe(true);
});
