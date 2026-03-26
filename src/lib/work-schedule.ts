export const weekdayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
export type WeekdayKey = (typeof weekdayKeys)[number];

export type DaySchedule = {
  enabled: boolean;
  start: string;
  end: string;
  breakStart: string;
  breakEnd: string;
};

export type WorkSchedule = Record<WeekdayKey, DaySchedule>;

const EMPTY_DAY: DaySchedule = {
  enabled: false,
  start: "09:00",
  end: "17:00",
  breakStart: "12:30",
  breakEnd: "13:00",
};

export const DEFAULT_WORK_SCHEDULE: WorkSchedule = {
  sun: { ...EMPTY_DAY },
  mon: { ...EMPTY_DAY },
  tue: { ...EMPTY_DAY },
  wed: { ...EMPTY_DAY },
  thu: { ...EMPTY_DAY },
  fri: { ...EMPTY_DAY },
  sat: { ...EMPTY_DAY },
};

export const DAY_LABELS: Record<WeekdayKey, string> = {
  sun: "Sunday",
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
};
