import { expect, test } from "vitest";
import { demoFixtures } from "../../fixtures/demoFixtures.ts";
import {
  buildResearcherOperation,
  evaluateResearcherOperation,
} from "./researcherBookingOperationsData.ts";

const researcher = {
  id: "user-researcher-lee",
  role: "researcher",
  authorisedFacilityIds: ["facility-harbor"],
  authorisedStudyIds: ["study-morning-routines"],
};

test("checks normal rules before a researcher can acknowledge and override them", () => {
  const participant = demoFixtures.participants.find(
    (item) => item.id === "participant-quinn-patel",
  );
  if (participant === undefined)
    throw new Error("Missing participant fixture.");

  const input = {
    action: "booking.created" as const,
    actor: researcher,
    study: demoFixtures.studies[0]!,
    participant,
    selectedSlotByVisit: { "visit-interview": "slot-2026-06-15-0900" },
    overrideAcknowledged: false,
    overrideReason: "",
    now: "2026-06-03T12:00:00.000Z",
  };

  const evaluation = evaluateResearcherOperation(input, demoFixtures);
  expect(evaluation.authorised).toBe(true);
  expect(evaluation.normalRulesAllowed).toBe(false);
  expect(evaluation.failures).toContain("slot-full");
  expect(() => buildResearcherOperation(input, demoFixtures)).toThrow(
    "Acknowledge the restriction warning",
  );
  expect(() =>
    buildResearcherOperation(
      { ...input, overrideAcknowledged: true },
      demoFixtures,
    ),
  ).toThrow("Provide a reason");

  const result = buildResearcherOperation(
    {
      ...input,
      overrideAcknowledged: true,
      overrideReason: "Participant requested researcher assistance.",
    },
    demoFixtures,
  );
  expect(result.booking.status).toBe("confirmed");
  expect(result.auditEvent.actorRole).toBe("researcher");
  expect(result.auditEvent.overrideReason).toBe(
    "Participant requested researcher assistance.",
  );
  expect(result.auditEvent.entityReferences.studyId).toBe(
    "study-morning-routines",
  );
  expect(result.auditEvent.beforeValues).toBeUndefined();
  expect(result.auditEvent.afterValues?.status).toBe("confirmed");
});

test("denies a researcher outside simulated scope and audits cancellation values", () => {
  const booking = demoFixtures.bookings[0]!;
  const cancellationInput = {
    action: "booking.cancelled" as const,
    actor: researcher,
    study: demoFixtures.studies[0]!,
    participant: demoFixtures.participants[0]!,
    booking,
    selectedSlotByVisit: {},
    overrideAcknowledged: true,
    overrideReason: "Participant requested cancellation after the cutoff.",
    now: "2026-06-15T12:00:00.000Z",
  };

  expect(
    evaluateResearcherOperation(
      {
        ...cancellationInput,
        actor: { ...researcher, authorisedStudyIds: [] },
      },
      demoFixtures,
    ).authorised,
  ).toBe(false);

  const result = buildResearcherOperation(cancellationInput, demoFixtures);
  expect(result.booking.status).toBe("cancelled");
  expect(
    result.bookingVisits.every((visit) => visit.status === "cancelled"),
  ).toBe(true);
  expect(result.auditEvent.beforeValues?.status).toBe("confirmed");
  expect(result.auditEvent.afterValues?.status).toBe("cancelled");
  expect(result.auditEvent.createdAt).toBe("2026-06-15T12:00:00.000Z");
});
