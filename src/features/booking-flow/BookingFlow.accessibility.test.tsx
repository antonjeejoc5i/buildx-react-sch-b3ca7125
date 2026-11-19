import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { demoFixtures } from "../../fixtures/demoFixtures.ts";
import BookingFlow from "./BookingFlow.tsx";

test("provides a named, focusable available-slot control and announces confirmation", () => {
  const participant = demoFixtures.participants.find(
    (item) => item.id === "participant-quinn-patel",
  );
  if (participant === undefined)
    throw new Error("Missing fixture participant.");

  const slot = demoFixtures.slots[0];
  if (slot === undefined) throw new Error("Missing fixture slot.");

  const study = demoFixtures.studies[0];
  if (study === undefined) throw new Error("Missing fixture study.");

  const data = {
    ...demoFixtures,
    bookings: [],
    bookingVisits: [],
    slots: [{ ...slot, capacity: 2 }],
  };

  render(<BookingFlow data={data} participant={participant} study={study} />);

  const availableSlot = screen.getByRole("button", {
    name: /select available slot:.*june 15/i,
  });
  availableSlot.focus();
  expect(document.activeElement).toBe(availableSlot);

  fireEvent.click(availableSlot);
  fireEvent.click(screen.getByRole("button", { name: "Confirm booking" }));

  expect(screen.getByRole("status").textContent).toContain("Booking confirmed");
});
