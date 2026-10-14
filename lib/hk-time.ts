const HK = "Asia/Hong_Kong";

export type HkClock = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: string;
};

export function hkClock(date: Date): HkClock {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: HK,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hourCycle: "h23",
  }).formatToParts(date);

  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    year: Number(pick("year")),
    month: Number(pick("month")),
    day: Number(pick("day")),
    hour: Number(pick("hour")) % 24,
    minute: Number(pick("minute")),
    weekday: pick("weekday"),
  };
}

const WEEKDAY_ZH: Record<string, string> = {
  Sun: "星期日",
  Mon: "星期一",
  Tue: "星期二",
  Wed: "星期三",
  Thu: "星期四",
  Fri: "星期五",
  Sat: "星期六",
};

/**
 * General holidays from the HKSAR government list, not CUHK's own calendar.
 * 2026: https://www.gov.hk/en/about/abouthk/holiday/2026.htm (revised May 2025)
 * 2027: https://www.gov.hk/en/about/abouthk/holiday/2027.htm (revised May 2026)
 * Sundays are holidays by themselves and are not repeated here.
 */
const PUBLIC_HOLIDAYS: Record<string, string> = {
  "2026-01-01": "元旦",
  "2026-02-17": "农历年初一",
  "2026-02-18": "农历年初二",
  "2026-02-19": "农历年初三",
  "2026-04-03": "耶稣受难节",
  "2026-04-04": "耶稣受难节翌日",
  "2026-04-06": "清明节翌日",
  "2026-04-07": "复活节星期一翌日",
  "2026-05-01": "劳动节",
  "2026-05-25": "佛诞翌日",
  "2026-06-19": "端午节",
  "2026-07-01": "香港特别行政区成立纪念日",
  "2026-09-26": "中秋节翌日",
  "2026-10-01": "国庆日",
  "2026-10-19": "重阳节翌日",
  "2026-12-25": "圣诞节",
  "2026-12-26": "圣诞节后首个工作日",
  "2027-01-01": "元旦",
  "2027-02-06": "农历年初一",
  "2027-02-08": "农历年初三",
  "2027-02-09": "农历年初四",
  "2027-03-26": "耶稣受难节",
  "2027-03-27": "耶稣受难节翌日",
  "2027-03-29": "复活节星期一",
  "2027-04-05": "清明节",
  "2027-05-01": "劳动节",
  "2027-05-13": "佛诞",
  "2027-06-09": "端午节",
  "2027-07-01": "香港特别行政区成立纪念日",
  "2027-09-16": "中秋节翌日",
  "2027-10-01": "国庆日",
  "2027-10-08": "重阳节",
  "2027-12-25": "圣诞节",
  "2027-12-27": "圣诞节后首个工作日",
};

export type HolidayKind = "teaching" | "saturday" | "sunday" | "public";

export type HolidayInfo = {
  holiday: boolean;
  kind: HolidayKind;
  name?: string;
  weekday: string;
};

export function holidayInfo(date: Date): HolidayInfo {
  const clock = hkClock(date);
  const key = `${clock.year}-${String(clock.month).padStart(2, "0")}-${String(clock.day).padStart(2, "0")}`;
  const name = PUBLIC_HOLIDAYS[key];
  const weekday = WEEKDAY_ZH[clock.weekday] ?? clock.weekday;
  if (name) return { holiday: true, kind: "public", name, weekday };
  if (clock.weekday === "Sun") return { holiday: true, kind: "sunday", weekday };
  if (clock.weekday === "Sat") return { holiday: false, kind: "saturday", weekday };
  return { holiday: false, kind: "teaching", weekday };
}

/** Hong Kong has no daylight saving; UTC+8 all year. */
export function hkWallTime(year: number, month: number, day: number, hour: number, minute: number): Date {
  return new Date(Date.UTC(year, month - 1, day, hour - 8, minute, 0));
}

export function clockLabel(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function parseClock(value: string): number {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}
