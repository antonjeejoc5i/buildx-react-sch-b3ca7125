import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import type { Quota, Study } from "../../domain/models.ts";
import { demoFixtures } from "../../fixtures/demoFixtures.ts";
import QuotaConfiguration from "./QuotaConfiguration.tsx";

test("shows calculated bucket status and saves default and segment overbooking", async () => {
  const saveStudy = vi.fn<(study: Study) => Promise<void>>(
    async () => undefined,
  );
  const saveQuota = vi.fn<(quota: Quota) => Promise<void>>(
    async () => undefined,
  );

  render(
    <QuotaConfiguration
      bookings={demoFixtures.bookings}
      participants={demoFixtures.participants}
      quotas={demoFixtures.quotas}
      saveQuota={saveQuota}
      saveStudy={saveStudy}
      study={demoFixtures.studies[0]!}
    />,
  );

  expect(screen.getByText("Remaining")).toBeTruthy();
  expect(screen.getByText("7")).toBeTruthy();

  fireEvent.change(screen.getByLabelText("Default overbooking percentage"), {
    target: { value: "15" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save default" }));
  await waitFor(() => expect(saveStudy).toHaveBeenCalledTimes(1));
  expect(saveStudy.mock.calls[0]?.[0].bookingControls).toMatchObject({
    defaultOverbookingPercentage: 15,
  });

  fireEvent.change(screen.getByLabelText("Segment overbooking percentage"), {
    target: { value: "25" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save bucket" }));
  await waitFor(() => expect(saveQuota).toHaveBeenCalledTimes(1));
  expect(saveQuota.mock.calls[0]?.[0]).toMatchObject({
    overbookingPercentage: 25,
    maximum: 10,
  });
});
