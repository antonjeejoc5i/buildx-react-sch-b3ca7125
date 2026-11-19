import type { SchedulePattern, Slot } from "../../domain/models.ts";

export interface SchedulePatternValues {
  startsOn: string;
  endsOn: string;
  weekdays: number[];
  startsAt: string;
  endsAt: string;
  slotLengthMinutes: string;
  bufferMinutes: string;
}

export class ScheduleGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ScheduleGenerationError";
  }
}

interface LocalDateTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

function parseDate(value: string, label: string): LocalDateTime {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match === null) {
    throw new ScheduleGenerationError(
      `${label} must be a valid YYYY-MM-DD date.`,
    );
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const candidate = new Date(Date.UTC(year, month - 1, day));
  if (
    candidate.getUTCFullYear() !== year ||
    candidate.getUTCMonth() !== month - 1 ||
    candidate.getUTCDate() !== day
  ) {
    throw new ScheduleGenerationError(
      `${label} must be a valid YYYY-MM-DD date.`,
    );
  }

  return { year, month, day, hour: 0, minute: 0 };
}

function parseTime(
  value: string,
  label: string,
): { hour: number; minute: number } {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (match === null) {
    throw new ScheduleGenerationError(`${label} must be a valid 24-hour time.`);
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) {
    throw new ScheduleGenerationError(`${label} must be a valid 24-hour time.`);
  }

  return { hour, minute };
}

function wholeNumber(value: string, label: string, minimum: number): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < minimum) {
    throw new ScheduleGenerationError(
      `${label} must be a whole number of ${minimum} or greater.`,
    );
  }

  return parsed;
}

function utcDate(date: LocalDateTime): Date {
  return new Date(Date.UTC(date.year, date.month - 1, date.day));
}

function formatDate(date: LocalDateTime): string {
  return `${date.year.toString().padStart(4, "0")}-${date.month
    .toString()
    .padStart(2, "0")}-${date.day.toString().padStart(2, "0")}`;
}

function dateFromUtc(date: Date): LocalDateTime {
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    hour: 0,
    minute: 0,
  };
}

function zonedParts(timestamp: number, timeZone: string): LocalDateTime {
  const values = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date(timestamp))
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  ) as Record<string, number>;

  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
  };
}

function localTimeToUtc(localTime: LocalDateTime, timeZone: string): Date {
  const localTimestamp = Date.UTC(
    localTime.year,
    localTime.month - 1,
    localTime.day,
    localTime.hour,
    localTime.minute,
  );
  let utcTimestamp = localTimestamp;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const zoned = zonedParts(utcTimestamp, timeZone);
    const zonedTimestamp = Date.UTC(
      zoned.year,
      zoned.month - 1,
      zoned.day,
      zoned.hour,
      zoned.minute,
    );
    utcTimestamp = localTimestamp - (zonedTimestamp - utcTimestamp);
  }

  return new Date(utcTimestamp);
}

function validateTimeZone(timeZone: string): void {
  try {
    new Intl.DateTimeFormat("en", { timeZone }).format();
  } catch {
    throw new ScheduleGenerationError("Select a valid facility time zone.");
  }
}

export function buildSchedulePattern(
  id: string,
  studyId: string,
  visitId: string,
  timeZone: string,
  values: SchedulePatternValues,
): SchedulePattern {
  const startsOn = parseDate(values.startsOn, "Start date");
  const endsOn = parseDate(values.endsOn, "End date");
  if (utcDate(startsOn).getTime() > utcDate(endsOn).getTime()) {
    throw new ScheduleGenerationError(
      "End date must be on or after start date.",
    );
  }

  const weekdays = [...new Set(values.weekdays)].sort(
    (first, second) => first - second,
  );
  if (
    weekdays.length === 0 ||
    weekdays.some((weekday) => weekday < 0 || weekday > 6)
  ) {
    throw new ScheduleGenerationError("Select at least one weekday.");
  }

  const startsAt = parseTime(values.startsAt, "Operating window start");
  const endsAt = parseTime(values.endsAt, "Operating window end");
  const windowStart = startsAt.hour * 60 + startsAt.minute;
  const windowEnd = endsAt.hour * 60 + endsAt.minute;
  if (windowEnd <= windowStart) {
    throw new ScheduleGenerationError(
      "Operating window end must be after its start.",
    );
  }

  const slotLengthMinutes = wholeNumber(
    values.slotLengthMinutes,
    "Slot length",
    1,
  );
  const bufferMinutes = wholeNumber(values.bufferMinutes, "Buffer", 0);
  if (windowStart + slotLengthMinutes > windowEnd) {
    throw new ScheduleGenerationError(
      "The operating window must fit at least one slot.",
    );
  }
  validateTimeZone(timeZone);

  return {
    id,
    studyId,
    visitId,
    startsOn: formatDate(startsOn),
    endsOn: formatDate(endsOn),
    weekdays,
    operatingWindow: { startsAt: values.startsAt, endsAt: values.endsAt },
    slotLengthMinutes,
    bufferMinutes,
    timeZone,
  };
}

export function generateSlots(pattern: SchedulePattern): Slot[] {
  validateTimeZone(pattern.timeZone);
  const firstDate = parseDate(pattern.startsOn, "Start date");
  const lastDate = parseDate(pattern.endsOn, "End date");
  const startsAt = parseTime(
    pattern.operatingWindow.startsAt,
    "Operating window start",
  );
  const endsAt = parseTime(
    pattern.operatingWindow.endsAt,
    "Operating window end",
  );
  const windowStart = startsAt.hour * 60 + startsAt.minute;
  const windowEnd = endsAt.hour * 60 + endsAt.minute;
  const slots: Slot[] = [];
  const lastTimestamp = utcDate(lastDate).getTime();

  for (
    let current = utcDate(firstDate);
    current.getTime() <= lastTimestamp;
    current = new Date(current.getTime() + 24 * 60 * 60 * 1000)
  ) {
    if (!pattern.weekdays.includes(current.getUTCDay())) continue;

    const date = dateFromUtc(current);
    for (
      let slotStart = windowStart;
      slotStart + pattern.slotLengthMinutes <= windowEnd;
      slotStart += pattern.slotLengthMinutes + pattern.bufferMinutes
    ) {
      const localStart = {
        ...date,
        hour: Math.floor(slotStart / 60),
        minute: slotStart % 60,
      };
      const startsAtUtc = localTimeToUtc(localStart, pattern.timeZone);
      const endsAtUtc = new Date(
        startsAtUtc.getTime() + pattern.slotLengthMinutes * 60 * 1000,
      );
      const timeLabel = `${localStart.hour.toString().padStart(2, "0")}${localStart.minute
        .toString()
        .padStart(2, "0")}`;

      slots.push({
        id: `${pattern.id}-${formatDate(date)}-${timeLabel}`,
        studyId: pattern.studyId,
        visitId: pattern.visitId,
        startsAtUtc: startsAtUtc.toISOString(),
        endsAtUtc: endsAtUtc.toISOString(),
        capacity: 1,
        status: "primary",
        eligibilityRules: {},
      });
    }
  }

  return slots;
}
