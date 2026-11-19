import type {
  ConsecutiveVisitInterval,
  ScheduleOverride,
  SchedulePattern,
  Study,
  Visit,
} from "../../domain/models.ts";

export type IntervalKind = ConsecutiveVisitInterval["kind"];

export interface VisitConfigurationValue {
  id: string;
  name: string;
  durationMinutes: string;
  intervalKind: IntervalKind;
  exactDay: string;
  minimumDay: string;
  maximumDay: string;
}

export class MultiVisitConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MultiVisitConfigurationError";
  }
}

function positiveWholeNumber(value: string, label: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new MultiVisitConfigurationError(
      `${label} must be a whole number greater than zero.`,
    );
  }
  return parsed;
}

function nonNegativeWholeNumber(value: string, label: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new MultiVisitConfigurationError(
      `${label} must be a whole number of zero or greater.`,
    );
  }
  return parsed;
}

function buildInterval(
  value: VisitConfigurationValue,
): ConsecutiveVisitInterval {
  if (value.intervalKind === "same-day") {
    return { kind: "same-day" };
  }

  if (value.intervalKind === "exact-day") {
    return {
      kind: "exact-day",
      day: positiveWholeNumber(value.exactDay, "Exact day interval"),
    };
  }

  const minimumDay = nonNegativeWholeNumber(
    value.minimumDay,
    "Minimum day interval",
  );
  const maximumDay = nonNegativeWholeNumber(
    value.maximumDay,
    "Maximum day interval",
  );

  if (maximumDay < minimumDay) {
    throw new MultiVisitConfigurationError(
      "Maximum day interval must be on or after minimum day interval.",
    );
  }

  return { kind: "day-window", minimumDay, maximumDay };
}

export function buildConfiguredVisits(
  values: VisitConfigurationValue[],
): Visit[] {
  const visitIds = new Set<string>();

  return values.map((value, index) => {
    const name = value.name.trim();
    if (name === "") {
      throw new MultiVisitConfigurationError(
        `Visit ${index + 1} needs a name.`,
      );
    }
    if (value.id === "" || visitIds.has(value.id)) {
      throw new MultiVisitConfigurationError(
        "Each visit must have a unique ID.",
      );
    }

    visitIds.add(value.id);

    return {
      id: value.id,
      name,
      durationMinutes: positiveWholeNumber(
        value.durationMinutes,
        `Visit ${index + 1} duration`,
      ),
      ...(index === 0 ? {} : { intervalFromPrevious: buildInterval(value) }),
    };
  });
}

export function buildMultiVisitStudy(
  study: Study,
  values: VisitConfigurationValue[],
): Study {
  return { ...study, visits: buildConfiguredVisits(values) };
}

export function schedulesByVisit(
  study: Study,
  patterns: SchedulePattern[],
  overrides: ScheduleOverride[],
): Map<string, { patterns: SchedulePattern[]; overrideCount: number }> {
  const assignments = new Map(
    study.visits.map((visit) => [
      visit.id,
      { patterns: [] as SchedulePattern[], overrideCount: 0 },
    ]),
  );

  for (const pattern of patterns) {
    if (pattern.studyId !== study.id) continue;
    const assignment = assignments.get(pattern.visitId);
    if (assignment === undefined) continue;

    assignment.patterns.push(pattern);
    assignment.overrideCount += overrides.filter(
      (override) => override.schedulePatternId === pattern.id,
    ).length;
  }

  return assignments;
}
