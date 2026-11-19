import type { JsonValue, Participant, Slot } from "../../domain/models.ts";

export type EligibilityLogic = "and" | "or";
export type EligibilityAttributeSource = "profile" | "screener";
export type EligibilityAttributeValue = string | number | boolean | null;

export interface EligibilityCriterion {
  source: EligibilityAttributeSource;
  attribute: string;
  expectedValue: EligibilityAttributeValue;
}

export interface EligibilityCriteria {
  logic: EligibilityLogic;
  conditions: EligibilityCriterion[];
}

export interface SlotEligibilityOverride {
  criteria?: EligibilityCriteria;
  restrictedPoolParticipantIds?: string[];
  alternatingSegment?: string;
}

export interface SegmentEligibilityConfiguration {
  criteria: EligibilityCriteria;
  restrictedPoolParticipantIds: string[];
  alternatingSegments: Record<string, string[]>;
  slotOverrides: Record<string, SlotEligibilityOverride>;
}

export interface EligibilityCheck {
  mechanism: "criteria" | "restricted-pool" | "alternating-segment";
  passed: boolean;
  message: string;
}

export interface SegmentSlotEligibilityResult {
  eligible: boolean;
  available: boolean;
  checks: EligibilityCheck[];
}

function participantAttribute(
  participant: Participant,
  criterion: EligibilityCriterion,
): JsonValue | undefined {
  if (criterion.source === "profile") {
    if (criterion.attribute in participant.profile) {
      return participant.profile[
        criterion.attribute as keyof typeof participant.profile
      ];
    }

    return undefined;
  }

  return participant.screenerAttributes[criterion.attribute];
}

function matchesExpectedValue(
  actualValue: JsonValue | undefined,
  expectedValue: EligibilityAttributeValue,
): boolean {
  if (Array.isArray(actualValue)) {
    return actualValue.some((value) =>
      matchesExpectedValue(value, expectedValue),
    );
  }

  return actualValue === expectedValue;
}

function evaluateCriteria(
  participant: Participant,
  criteria: EligibilityCriteria,
): EligibilityCheck {
  if (criteria.conditions.length === 0) {
    return {
      mechanism: "criteria",
      passed: true,
      message: "No attribute criteria apply.",
    };
  }

  const conditionResults = criteria.conditions.map((criterion) =>
    matchesExpectedValue(
      participantAttribute(participant, criterion),
      criterion.expectedValue,
    ),
  );
  const passed =
    criteria.logic === "and"
      ? conditionResults.every(Boolean)
      : conditionResults.some(Boolean);

  return {
    mechanism: "criteria",
    passed,
    message: passed
      ? `Participant matches ${criteria.logic.toUpperCase()} attribute criteria.`
      : `Participant does not match ${criteria.logic.toUpperCase()} attribute criteria.`,
  };
}

function effectiveRules(
  slot: Slot,
  configuration: SegmentEligibilityConfiguration,
): {
  criteria: EligibilityCriteria;
  restrictedPoolParticipantIds: string[];
  alternatingSegment: string | undefined;
} {
  const override = configuration.slotOverrides[slot.id];

  return {
    criteria: override?.criteria ?? configuration.criteria,
    restrictedPoolParticipantIds:
      override?.restrictedPoolParticipantIds ??
      configuration.restrictedPoolParticipantIds,
    alternatingSegment: override?.alternatingSegment ?? slot.segmentAssignment,
  };
}

export function evaluateSegmentSlotEligibility(
  slot: Slot,
  participant: Participant,
  configuration: SegmentEligibilityConfiguration,
): SegmentSlotEligibilityResult {
  const rules = effectiveRules(slot, configuration);
  const checks = [evaluateCriteria(participant, rules.criteria)];

  if (rules.restrictedPoolParticipantIds.length > 0) {
    const passed = rules.restrictedPoolParticipantIds.includes(participant.id);
    checks.push({
      mechanism: "restricted-pool" as const,
      passed,
      message: passed
        ? "Participant is in the restricted pool."
        : "Participant is not in the restricted pool.",
    });
  }

  if (rules.alternatingSegment !== undefined) {
    const assignedParticipantIds =
      configuration.alternatingSegments[rules.alternatingSegment] ?? [];
    const passed = assignedParticipantIds.includes(participant.id);
    checks.push({
      mechanism: "alternating-segment" as const,
      passed,
      message: passed
        ? `Participant is assigned to alternating segment ${rules.alternatingSegment}.`
        : `Participant is not assigned to alternating segment ${rules.alternatingSegment}.`,
    });
  }

  const eligible = checks.every((check) => check.passed);

  return {
    eligible,
    available: eligible,
    checks,
  };
}
