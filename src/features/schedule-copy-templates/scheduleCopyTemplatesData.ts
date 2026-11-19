import type {
  JsonValue,
  ScheduleOverride,
  SchedulePattern,
  ScheduleTemplate,
} from "../../domain/models.ts";

export interface CopiedSchedule {
  patterns: SchedulePattern[];
  overrides: ScheduleOverride[];
}

export class ScheduleCopyTemplateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ScheduleCopyTemplateError";
  }
}

function requiredTemplateName(name: string): string {
  const trimmedName = name.trim();
  if (trimmedName === "") {
    throw new ScheduleCopyTemplateError("Template name is required.");
  }
  return trimmedName;
}

function templateOverrides(template: ScheduleTemplate): ScheduleOverride[] {
  const overrides = template.overrideStructure.overrides;
  return Array.isArray(overrides)
    ? (structuredClone(overrides) as unknown as ScheduleOverride[])
    : [];
}

export function copySchedule(
  sourcePatterns: SchedulePattern[],
  sourceOverrides: ScheduleOverride[],
  targetStudyId: string,
  targetVisitId: string,
  idPrefix: string,
): CopiedSchedule {
  if (targetVisitId === "") {
    throw new ScheduleCopyTemplateError(
      "The destination study needs a visit before a schedule can be copied.",
    );
  }

  const copiedPatternIds = new Map<string, string>();
  const patterns = sourcePatterns.map((pattern, index) => {
    const id = `${idPrefix}-pattern-${index + 1}`;
    copiedPatternIds.set(pattern.id, id);
    return {
      ...structuredClone(pattern),
      id,
      studyId: targetStudyId,
      visitId: targetVisitId,
    };
  });

  const overrides = sourceOverrides.flatMap((override, index) => {
    const schedulePatternId = copiedPatternIds.get(override.schedulePatternId);
    if (schedulePatternId === undefined) return [];
    return [
      {
        ...structuredClone(override),
        id: `${idPrefix}-override-${index + 1}`,
        schedulePatternId,
      },
    ];
  });

  return { patterns, overrides };
}

export function createScheduleTemplate(
  id: string,
  name: string,
  patterns: SchedulePattern[],
  overrides: ScheduleOverride[],
): ScheduleTemplate {
  return {
    id,
    name: requiredTemplateName(name),
    recurringPatterns: structuredClone(patterns),
    overrideStructure: {
      overrides: structuredClone(overrides) as unknown as JsonValue,
    },
    archived: false,
  };
}

export function renameScheduleTemplate(
  template: ScheduleTemplate,
  name: string,
): ScheduleTemplate {
  return {
    ...structuredClone(template),
    name: requiredTemplateName(name),
  };
}

export function duplicateScheduleTemplate(
  template: ScheduleTemplate,
  id: string,
): ScheduleTemplate {
  return {
    ...structuredClone(template),
    id,
    name: `${template.name} copy`,
    archived: false,
  };
}

export function applyScheduleTemplate(
  template: ScheduleTemplate,
  targetStudyId: string,
  targetVisitId: string,
  idPrefix: string,
): CopiedSchedule {
  if (template.archived) {
    throw new ScheduleCopyTemplateError(
      "Archived templates cannot be applied.",
    );
  }

  return copySchedule(
    template.recurringPatterns,
    templateOverrides(template),
    targetStudyId,
    targetVisitId,
    idPrefix,
  );
}
