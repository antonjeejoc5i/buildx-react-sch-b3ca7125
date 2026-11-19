import { expect, test } from "vitest";
import type { Slot, Study } from "../../domain/models.ts";
import { demoFixtures } from "../../fixtures/demoFixtures.ts";
import {
  buildCancelledParticipation,
  buildRescheduledParticipation,
  evaluateAppointmentManagement,
  revalidateReschedule,
  suggestDependentSlots,
} from "./appointmentManagementData.ts";

test("honors reschedule enablement, cutoffs, and the default two-change limit", () => {
  const booking = {
    ...demoFixtures.bookings[0]!,
    selfServiceRescheduleCount: 2,
  };
  expect(
    evaluateAppointmentManagement(
      "reschedule",
      demoFixtures.studies[0]!,
      booking,
      demoFixtures.bookingVisits,
      new Date("2026-06-01T00:00:00.000Z"),
    ).allowed,
  ).toBe(false);

  const cutoffStudy: Study = {
    ...demoFixtures.studies[0]!,
    bookingControls: {
      allowSelfServiceReschedule: true,
      rescheduleCutoffHours: 24,
    },
  };
  expect(
    evaluateAppointmentManagement(
      "reschedule",
      cutoffStudy,
      demoFixtures.bookings[0]!,
      demoFixtures.bookingVisits,
      new Date("2026-06-14T14:00:00.000Z"),
    ).message,
  ).toContain("24 hours");
  expect(
    evaluateAppointmentManagement(
      "cancel",
      { ...cutoffStudy, lifecycleStatus: "paused" },
      demoFixtures.bookings[0]!,
      demoFixtures.bookingVisits,
      new Date("2026-06-01T00:00:00.000Z"),
    ).allowed,
  ).toBe(false);
});

test("revalidates a complete multi-visit reschedule and cancels all visits", () => {
  const participant = demoFixtures.participants.find(
    (item) => item.id === "participant-quinn-patel",
  );
  if (participant === undefined)
    throw new Error("Missing fixture participant.");

  const study: Study = {
    ...demoFixtures.studies[0]!,
    visits: [
      { id: "first", name: "First visit", durationMinutes: 30 },
      {
        id: "second",
        name: "Second visit",
        durationMinutes: 30,
        intervalFromPrevious: { kind: "exact-day", day: 2 },
      },
    ],
  };
  const first: Slot = {
    ...demoFixtures.slots[0]!,
    id: "replacement-first",
    visitId: "first",
    startsAtUtc: "2026-06-16T13:00:00.000Z",
    capacity: 2,
  };
  const second: Slot = {
    ...first,
    id: "replacement-second",
    visitId: "second",
    startsAtUtc: "2026-06-18T13:00:00.000Z",
  };
  const booking = {
    ...demoFixtures.bookings[0]!,
    selectedVisitIds: ["first", "second"],
    selectedSlotIds: [first.id, second.id],
  };
  const bookingVisits = [
    {
      ...demoFixtures.bookingVisits[0]!,
      visitId: "first",
      slotId: first.id,
      startsAtUtc: first.startsAtUtc,
    },
    {
      ...demoFixtures.bookingVisits[0]!,
      id: "booking-visit-second",
      visitId: "second",
      slotId: second.id,
      startsAtUtc: second.startsAtUtc,
    },
  ];
  const data = {
    ...demoFixtures,
    studies: [study],
    slots: [first, second],
    bookings: [booking],
    bookingVisits,
  };

  const selectedSlots = suggestDependentSlots(
    data,
    study,
    participant,
    booking,
    "first",
    first.id,
  );
  expect(
    revalidateReschedule(data, study, participant, booking, selectedSlots)
      .allowed,
  ).toBe(true);

  const rescheduled = buildRescheduledParticipation(
    booking,
    bookingVisits,
    study,
    data,
    selectedSlots,
    "2026-06-03T00:00:00.000Z",
  );
  expect(rescheduled.booking.selfServiceRescheduleCount).toBe(1);
  expect(rescheduled.bookingVisits).toHaveLength(2);

  const cancelled = buildCancelledParticipation(
    booking,
    bookingVisits,
    "2026-06-03T00:00:00.000Z",
  );
  expect(cancelled.booking.status).toBe("cancelled");
  expect(
    cancelled.bookingVisits.every((visit) => visit.status === "cancelled"),
  ).toBe(true);
});
