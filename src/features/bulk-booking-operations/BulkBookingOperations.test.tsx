import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { demoFixtures } from "../../fixtures/demoFixtures.ts";
import BulkBookingOperations from "./BulkBookingOperations.tsx";

test("shows conflicts before execution and requires confirmation after a clean preview", async () => {
  const saveBulkBookingOperation = vi.fn<
    (
      bookings: typeof demoFixtures.bookings,
      bookingVisits: typeof demoFixtures.bookingVisits,
      notificationEvents: typeof demoFixtures.notificationEvents,
      auditEvents: typeof demoFixtures.auditEvents,
    ) => Promise<void>
  >(async () => undefined);

  render(
    <BulkBookingOperations
      actor={demoFixtures.demoUsers[0]!}
      data={demoFixtures}
      saveBulkBookingOperation={saveBulkBookingOperation}
      study={demoFixtures.studies[0]!}
    />,
  );

  fireEvent.change(screen.getByLabelText("Bulk action"), {
    target: { value: "reschedule" },
  });
  fireEvent.click(screen.getByLabelText("Avery Chen"));
  expect(
    screen.getByLabelText("Bulk operation conflicts").textContent,
  ).toContain("Select an available replacement slot");
  expect(
    screen.getByRole("button", { name: "Execute bulk action" }),
  ).toHaveProperty("disabled", true);

  fireEvent.change(screen.getByLabelText("Bulk action"), {
    target: { value: "notify" },
  });
  expect(screen.getByText("There are no conflicts to resolve.")).toBeTruthy();
  const executeButton = screen.getByRole("button", {
    name: "Execute bulk action",
  });
  expect(executeButton).toHaveProperty("disabled", true);
  fireEvent.click(
    screen.getByLabelText(
      "I reviewed this preview and confirm this bulk action.",
    ),
  );
  expect(executeButton).toHaveProperty("disabled", false);
  fireEvent.click(executeButton);

  await vi.waitFor(() =>
    expect(saveBulkBookingOperation).toHaveBeenCalledTimes(1),
  );
});
