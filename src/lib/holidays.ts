export type HolidayMap = Record<string, string>;

type NagerHoliday = {
  date: string;
  localName: string;
  name: string;
  global: boolean;
  types?: string[];
};

const holidayCache = new Map<string, { expiresAt: number; data: HolidayMap }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function toIsoDate(year: number, monthIndex: number, day: number) {
  const month = String(monthIndex + 1).padStart(2, "0");
  return `${year}-${month}-${String(day).padStart(2, "0")}`;
}

function parseIsoDate(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function observedHoliday(date: string) {
  const dt = parseIsoDate(date);
  const weekday = dt.getDay();
  if (weekday === 0) dt.setDate(dt.getDate() + 1);
  else if (weekday === 6) dt.setDate(dt.getDate() - 1);
  return toIsoDate(dt.getFullYear(), dt.getMonth(), dt.getDate());
}

function nthWeekdayOfMonth(year: number, monthIndex: number, weekday: number, nth: number) {
  const first = new Date(year, monthIndex, 1);
  const firstWeekday = first.getDay();
  const offset = (weekday - firstWeekday + 7) % 7;
  const day = 1 + offset + (nth - 1) * 7;
  return toIsoDate(year, monthIndex, day);
}

function lastWeekdayOfMonth(year: number, monthIndex: number, weekday: number) {
  const last = new Date(year, monthIndex + 1, 0);
  const offset = (last.getDay() - weekday + 7) % 7;
  last.setDate(last.getDate() - offset);
  return toIsoDate(last.getFullYear(), last.getMonth(), last.getDate());
}

export function getUsFederalHolidayMap(year: number): HolidayMap {
  const holidays: HolidayMap = {};
  const addObserved = (name: string, monthIndex: number, day: number) => {
    const base = toIsoDate(year, monthIndex, day);
    holidays[observedHoliday(base)] = name;
  };

  addObserved("New Year's Day", 0, 1);
  holidays[nthWeekdayOfMonth(year, 0, 1, 3)] = "Martin Luther King Jr. Day";
  holidays[nthWeekdayOfMonth(year, 1, 1, 3)] = "Presidents Day";
  holidays[lastWeekdayOfMonth(year, 4, 1)] = "Memorial Day";
  addObserved("Juneteenth National Independence Day", 5, 19);
  addObserved("Independence Day", 6, 4);
  holidays[nthWeekdayOfMonth(year, 8, 1, 1)] = "Labor Day";
  holidays[nthWeekdayOfMonth(year, 9, 1, 2)] = "Columbus Day";
  addObserved("Veterans Day", 10, 11);
  holidays[nthWeekdayOfMonth(year, 10, 4, 4)] = "Thanksgiving Day";
  addObserved("Christmas Day", 11, 25);

  return holidays;
}

function normalizeCountryCode(countryCode: string | null | undefined) {
  const code = (countryCode || "US").trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : "US";
}

function toHolidayMapFromNager(rows: NagerHoliday[]): HolidayMap {
  const result: HolidayMap = {};
  for (const row of rows) {
    const types = row.types ?? [];
    const isPublic = types.length === 0 || types.includes("Public");
    if (!isPublic || !row.global) continue;
    result[row.date] = row.localName || row.name;
  }
  return result;
}

export async function getPublicHolidayMap(year: number, countryCode?: string): Promise<HolidayMap> {
  const country = normalizeCountryCode(countryCode || process.env.HOLIDAY_COUNTRY_CODE);
  const cacheKey = `${country}-${year}`;
  const now = Date.now();
  const cached = holidayCache.get(cacheKey);
  if (cached && cached.expiresAt > now) return cached.data;

  try {
    const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${country}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 * 60 * 12 },
    });

    if (!res.ok) throw new Error(`Holiday API responded ${res.status}`);
    const body = (await res.json()) as NagerHoliday[];
    const map = toHolidayMapFromNager(body);

    if (Object.keys(map).length === 0) throw new Error("Holiday API returned empty map");

    holidayCache.set(cacheKey, { data: map, expiresAt: now + CACHE_TTL_MS });
    return map;
  } catch {
    const fallback = country === "US" ? getUsFederalHolidayMap(year) : {};
    holidayCache.set(cacheKey, { data: fallback, expiresAt: now + CACHE_TTL_MS });
    return fallback;
  }
}

export function getUsFederalHolidayName(dateIso: string) {
  const year = Number(dateIso.slice(0, 4));
  if (!Number.isFinite(year)) return null;
  return getUsFederalHolidayMap(year)[dateIso] ?? null;
}
