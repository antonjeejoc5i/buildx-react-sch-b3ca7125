import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import type {
  Booking,
  BookingVisit,
  Slot,
  Study,
} from "../../domain/models.ts";
import { demoFixtures } from "../../fixtures/demoFixtures.ts";
import BookingFlow from "./BookingFlow.tsx";

test("requires every visit in one local hold flow before confirmation", async () => {
  const participant = demoFixtures.participants.find(
    (item) => item.id === "participant-quinn-patel",
  );
  if (participant === undefined) throw new Error("Missing fixture.");

  const study: Study = {
    ...demoFixtures.studies[0]!,
    visits: [
      { id: "one", name: "First visit", durationMinutes: 30 },
      {
        id: "two",
        name: "Second visit",
        durationMinutes: 30,
        intervalFromPrevious: { kind: "exact-day", day: 2 },
      },
    ],
  };
  const first: Slot = {
    ...demoFixtures.slots[0]!,
    id: "first",
    visitId: "one",
    startsAtUtc: "2026-06-16T13:00:00.000Z",
    endsAtUtc: "2026-06-16T13:30:00.000Z",
    capacity: 2,
  };
  const second: Slot = {
    ...first,
    id: "second",
    visitId: "two",
    startsAtUtc: "2026-06-18T13:00:00.000Z",
    endsAtUtc: "2026-06-18T13:30:00.000Z",
  };
  const data = {
    ...demoFixtures,
    studies: [study],
    slots: [first, second],
    bookings: [],
    bookingVisits: [],
  };

  const saveParticipation = vi.fn<
    (booking: Booking, bookingVisits: BookingVisit[]) => Promise<void>
  >(async () => undefined);
  render(
    <BookingFlow
      data={data}
      participant={participant}
      saveParticipation={saveParticipation}
      study={study}
    />,
  );

  expect(screen.getByText("Visit 1 of 2")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: /June 16/ }));
  expect(screen.getByText("Visit 2 of 2")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: /June 18/ }));
  expect(
    screen.getByRole("heading", { name: "Review your booking" }),
  ).toBeTruthy();
  expect(screen.getByText(/held locally/i)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Confirm booking" }));
  expect(
    await screen.findByRole("heading", { name: "Booking confirmed" }),
  ).toBeTruthy();
  expect(saveParticipation).toHaveBeenCalledTimes(1);
  const [booking, bookingVisits] = saveParticipation.mock.calls[0]!;
  expect(booking).toMatchObject({
    studyId: study.id,
    participantId: participant.id,
    status: "confirmed",
    selectedSlotIds: ["first", "second"],
  });
  expect(bookingVisits.map((visit) => visit.slotId)).toEqual([
    "first",
    "second",
  ]);
});
