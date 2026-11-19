import { expect, test } from "vitest";
import { demoFixtures } from "../../fixtures/demoFixtures.ts";
import {
  applyScheduleTemplate,
  copySchedule,
  createScheduleTemplate,
  duplicateScheduleTemplate,
  renameScheduleTemplate,
  ScheduleCopyTemplateError,
} from "./scheduleCopyTemplatesData.ts";

const pattern = demoFixtures.schedulePatterns[0]!;
const override = demoFixtures.scheduleOverrides[0]!;

test("copies patterns and overrides independently without study operational data", () => {
  const copied = copySchedule(
    [pattern],
    [override],
    "study-destination",
    "visit-destination",
    "copied",
  );

  expect(copied.patterns).toEqual([
    expect.objectContaining({
      id: "copied-pattern-1",
      studyId: "study-destination",
      visitId: "visit-destination",
    }),
  ]);
  expect(copied.overrides).toEqual([
    expect.objectContaining({
      id: "copied-override-1",
      schedulePatternId: "copied-pattern-1",
    }),
  ]);

  copied.patterns[0]!.weekdays.push(0);
  expect(pattern.weekdays).toEqual([1, 2, 3, 4, 5]);
});

test("saves, edits, duplicates, archives, and applies templates as editable copies", () => {
  const template = createScheduleTemplate(
    "template-new",
    "  Morning sessions  ",
    [pattern],
    [override],
  );
  const renamed = renameScheduleTemplate(template, "Edited sessions");
  const duplicate = duplicateScheduleTemplate(renamed, "template-copy");
  const applied = applyScheduleTemplate(
    renamed,
    "study-destination",
    "visit-destination",
    "applied",
  );

  expect(renamed.name).toBe("Edited sessions");
  expect(duplicate).toMatchObject({
    id: "template-copy",
    name: "Edited sessions copy",
    archived: false,
  });
  expect(applied.patterns[0]).toMatchObject({
    id: "applied-pattern-1",
    studyId: "study-destination",
    visitId: "visit-destination",
  });
  expect(() =>
    applyScheduleTemplate(
      { ...template, archived: true },
      "study-destination",
      "visit-destination",
      "archived",
    ),
  ).toThrow(ScheduleCopyTemplateError);
});
