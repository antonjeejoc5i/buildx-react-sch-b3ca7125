import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import type { WaitlistEntry } from "../../domain/models.ts";
import { demoFixtures } from "../../fixtures/demoFixtures.ts";
import WaitlistEnrollment from "./WaitlistEnrollment.tsx";

test("enrolls an eligible participant into a full-slot waitlist", async () => {
  const participant = demoFixtures.participants.find(
    (item) => item.id === "participant-quinn-patel",
  );
  if (participant === undefined)
    throw new Error("Missing participant fixture.");
  const saveWaitlistEntry = vi.fn<(entry: WaitlistEntry) => Promise<void>>(
    async () => undefined,
  );

  render(
    <WaitlistEnrollment
      data={demoFixtures}
      participant={participant}
      saveWaitlistEntry={saveWaitlistEntry}
      study={demoFixtures.studies[0]!}
    />,
  );

  fireEvent.click(
    screen.getByRole("button", { name: "Join waitlist for full slot" }),
  );

  await waitFor(() => expect(saveWaitlistEntry).toHaveBeenCalledOnce());
  expect(saveWaitlistEntry.mock.calls[0]?.[0]).toMatchObject({
    participantId: participant.id,
    slotId: demoFixtures.slots[0]!.id,
    status: "waiting",
  });
  expect(screen.getByText(/You have joined the waitlist/i)).toBeTruthy();
});
