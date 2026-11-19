import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import type { Slot } from "../../domain/models.ts";
import { demoFixtures } from "../../fixtures/demoFixtures.ts";
import SlotManagement from "./SlotManagement.tsx";

test("shows a full primary slot and promotes a backup slot separately from waitlist records", async () => {
  const backupSlot: Slot = {
    ...demoFixtures.slots[0]!,
    id: "slot-backup-test",
    startsAtUtc: "2026-06-15T15:00:00.000Z",
    endsAtUtc: "2026-06-15T15:30:00.000Z",
    status: "backup",
  };
  const saveSlot = vi.fn<(slot: Slot) => Promise<void>>(async () => undefined);

  render(
    <SlotManagement
      bookingVisits={demoFixtures.bookingVisits}
      bookings={demoFixtures.bookings}
      saveSlot={saveSlot}
      slots={[demoFixtures.slots[0]!, backupSlot]}
      study={demoFixtures.studies[0]!}
      waitlistEntries={demoFixtures.waitlistEntries}
    />,
  );

  expect(screen.getByText("Full")).toBeTruthy();
  expect(screen.getByText("Unavailable until promoted")).toBeTruthy();
  expect(screen.getAllByText("Waitlist records").length).toBeGreaterThan(0);

  fireEvent.click(screen.getByRole("button", { name: "Promote backup slot" }));
  await waitFor(() => expect(saveSlot).toHaveBeenCalledTimes(1));
  expect(saveSlot).toHaveBeenCalledWith({ ...backupSlot, status: "primary" });
});

test("creates a backup slot with its own duration", async () => {
  const saveSlot = vi.fn<(slot: Slot) => Promise<void>>(async () => undefined);

  render(
    <SlotManagement
      bookingVisits={demoFixtures.bookingVisits}
      bookings={demoFixtures.bookings}
      saveSlot={saveSlot}
      slots={demoFixtures.slots}
      study={demoFixtures.studies[0]!}
      waitlistEntries={demoFixtures.waitlistEntries}
    />,
  );

  fireEvent.change(screen.getByLabelText("Backup slot duration in minutes"), {
    target: { value: "30" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save backup slot" }));

  await waitFor(() => expect(saveSlot).toHaveBeenCalledTimes(1));
  expect(saveSlot.mock.calls[0]?.[0]).toMatchObject({
    status: "backup",
    endsAtUtc: "2026-06-15T15:30:00.000Z",
  });
});
