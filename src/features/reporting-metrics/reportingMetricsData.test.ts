import { expect, test } from "vitest";
import type { Booking, BookingVisit, Slot } from "../../domain/models.ts";
import { demoFixtures } from "../../fixtures/demoFixtures.ts";
import {
  LOCAL_DATA_DISCLOSURE,
  buildReportingMetrics,
  calculateTimeToFill,
} from "./reportingMetricsData.ts";

const study = demoFixtures.studies[0]!;
const participant = demoFixtures.participants[0]!;
const quota = { ...demoFixtures.quotas[0]!, target: 2, maximum: 3 };

function createBooking(id: string, createdAt: string): Booking {
  return {
    ...demoFixtures.bookings[0]!,
    id,
    createdAt,
    selectedSlotIds: ["slot-reporting"],
    updatedAt: createdAt,
  };
}

function createVisit(
  id: string,
  bookingId: string,
  startsAtUtc: string,
  status: BookingVisit["status"],
  noShow: boolean,
): BookingVisit {
  return {
    id,
    bookingId,
    visitId: "visit-interview",
    slotId: "slot-reporting",
    startsAtUtc,
    status,
    noShow,
    affectsStanding: false,
  };
}

test("keeps fill rate separate from attendance and excludes cancelled, rescheduled-away, and future appointments from no-show rate", () => {
  const slots: Slot[] = [
    { ...demoFixtures.slots[0]!, id: "slot-reporting", capacity: 4 },
  ];
  const attended = createBooking(
    "booking-attended",
    "2026-06-02T09:00:00.000Z",
  );
  const noShow = createBooking("booking-no-show", "2026-06-02T10:00:00.000Z");
  const cancelled = {
    ...createBooking("booking-cancelled", "2026-06-02T11:00:00.000Z"),
    status: "cancelled" as const,
  };
  const rescheduled = {
    ...createBooking("booking-rescheduled", "2026-06-02T12:00:00.000Z"),
    selectedSlotIds: ["slot-new"],
  };
  const future = createBooking("booking-future", "2026-06-02T13:00:00.000Z");

  const metrics = buildReportingMetrics(
    study,
    [quota],
    slots,
    [attended, noShow, cancelled, rescheduled, future],
    [
      createVisit(
        "visit-attended",
        attended.id,
        "2026-06-10T13:00:00.000Z",
        "completed",
        false,
      ),
      createVisit(
        "visit-no-show",
        noShow.id,
        "2026-06-10T14:00:00.000Z",
        "scheduled",
        true,
      ),
      createVisit(
        "visit-cancelled",
        cancelled.id,
        "2026-06-10T15:00:00.000Z",
        "cancelled",
        true,
      ),
      createVisit(
        "visit-rescheduled",
        rescheduled.id,
        "2026-06-10T16:00:00.000Z",
        "scheduled",
        true,
      ),
      createVisit(
        "visit-future",
        future.id,
        "2026-06-20T13:00:00.000Z",
        "scheduled",
        true,
      ),
    ],
    [participant],
    new Date("2026-06-15T00:00:00.000Z"),
  );

  expect(metrics.fillRate.value).toEqual({
    booked: 3,
    capacity: 4,
    percentage: 75,
  });
  expect(metrics.noShowRate.value).toEqual({
    eligibleAppointments: 2,
    noShows: 1,
    percentage: 50,
  });
  expect(metrics.fillRate.disclosure).toBe(LOCAL_DATA_DISCLOSURE);
  expect(metrics.noShowRate.disclosure).toBe(LOCAL_DATA_DISCLOSURE);
});

test("stops time-to-fill when original quota targets are met rather than extending to later over-target bookings", () => {
  const timeToFill = calculateTimeToFill(
    study,
    [quota],
    [participant],
    [
      createBooking("booking-first", "2026-06-02T09:00:00.000Z"),
      createBooking("booking-target", "2026-06-03T09:00:00.000Z"),
      createBooking("booking-over-target", "2026-06-10T09:00:00.000Z"),
    ],
  );

  expect(timeToFill.disclosure).toBe(LOCAL_DATA_DISCLOSURE);
  expect(timeToFill.value).toEqual({
    state: "filled",
    achievedAt: "2026-06-03T09:00:00.000Z",
    durationMilliseconds: 172800000,
  });
});
