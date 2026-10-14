/**
 * CUHK Transport Office campus shuttle, as published on
 * https://transport.cuhk.edu.hk/ in October 2026.
 * Term-time guide only. Not a live feed.
 *
 * Stop order follows the office route diagram: leave the start,
 * go up the left column, across the top, then down the right column.
 *
 * Day choice is the Hong Kong clock, not a switch:
 * - Monday–Saturday, except public holidays: daytime routes in their own
 *   windows, then evening route N from 19:00–23:30. Saturday uses this
 *   same set, including N.
 * - Sunday and Hong Kong public holidays: holiday line H only.
 *
 * Meet-class routes 5 / 6A / 6B / 7 run only on Monday–Friday, and only
 * inside their windows. They stay off on Saturday. The paid minibus
 * (上行 / 下行) stays out: it charges a fare and is the visitor service.
 */

import { clockLabel, hkClock, holidayInfo, parseClock, type HolidayInfo } from "@/lib/hk-time";

export type RouteStop = {
  stopId: string;
  /** Departure minutes (0–59) that actually call at this visit. */
  onlyMinutes?: number[];
  remark?: string;
};

export type ShuttleRoute = {
  id: string;
  name: string;
  color: string;
  /** teaching = Mon–Sat except public holidays. holiday = Sunday and public holidays. */
  days: "teaching" | "holiday";
  /** Hidden unless the Hong Kong clock is inside first–last. */
  special?: boolean;
  /** Evening line. Chosen because the clock is inside its window, not by a switch. */
  evening?: boolean;
  first: string;
  last: string;
  minutes: number[];
  /** Named on a recommendation so the operating window is visible. */
  windowLabel: string;
  note?: string;
  stops: RouteStop[];
};

const shawOn45: RouteStop = {
  stopId: "srr",
  onlyMinutes: [45],
  remark: "邵逸夫堂只有每小时 45 分那班停靠。",
};

const pghOnHour: RouteStop = {
  stopId: "pgh1",
  onlyMinutes: [0],
  remark: "研究生宿舍一座只有每小时整点的班次停靠。",
};

const area39OnHour: RouteStop = {
  stopId: "area39-up",
  onlyMinutes: [0],
  remark: "39区（上行）只有每小时整点的班次停靠。",
};

const teachingDay = "星期一至六（公众假期除外）";
const teachingMeet = "星期一至五教学日";
const holidayDays = "星期日及香港公众假期";

function windowLabel(days: string, first: string, last: string, minutes: number[]): string {
  const list = minutes.map((minute) => String(minute).padStart(2, "0")).join("、");
  return `${days} ${first}–${last}，每小时 ${list} 分`;
}

export const ROUTES: ShuttleRoute[] = [
  {
    id: "1",
    name: "本部线",
    color: "#c4a000",
    days: "teaching",
    first: "07:40",
    last: "18:55",
    minutes: [10, 25, 40, 55],
    windowLabel: windowLabel(teachingDay, "07:40", "18:55", [10, 25, 40, 55]),
    stops: [
      { stopId: "univ-station" },
      { stopId: "sports" },
      { stopId: "srr" },
      { stopId: "admin" },
      { stopId: "sh-ho" },
      { stopId: "univ-station" },
    ],
  },
  {
    id: "2",
    name: "新联线",
    color: "#2f7d4a",
    days: "teaching",
    first: "07:45",
    last: "18:45",
    minutes: [15, 45],
    windowLabel: windowLabel(teachingDay, "07:45", "18:45", [15, 45]),
    note: "每小时 45 分的班次加停邵逸夫堂，15 分的班次不停。",
    stops: [
      { stopId: "station-piazza" },
      { stopId: "sports" },
      shawOn45,
      { stopId: "fkh" },
      { stopId: "uc-up" },
      { stopId: "na" },
      { stopId: "uc-down" },
      { stopId: "admin" },
      { stopId: "sh-ho" },
      { stopId: "univ-station" },
    ],
  },
  {
    id: "2S",
    name: "新联线（S）",
    color: "#1f7a72",
    days: "teaching",
    first: "08:00",
    last: "18:30",
    minutes: [0, 30],
    windowLabel: windowLabel(teachingDay, "08:00", "18:30", [0, 30]),
    note: "比 2 号线多停研究生宿舍一座，去程和回程各一站。",
    stops: [
      { stopId: "station-piazza" },
      { stopId: "pgh1" },
      { stopId: "sports" },
      { stopId: "srr" },
      { stopId: "fkh" },
      { stopId: "uc-up" },
      { stopId: "na" },
      { stopId: "uc-down" },
      { stopId: "admin" },
      { stopId: "sh-ho" },
      { stopId: "pgh1" },
      { stopId: "univ-station" },
    ],
  },
  {
    id: "3",
    name: "逸夫线",
    color: "#d06a1e",
    days: "teaching",
    first: "09:00",
    last: "18:40",
    minutes: [0, 20, 40],
    windowLabel: windowLabel(teachingDay, "09:00", "18:40", [0, 20, 40]),
    stops: [
      { stopId: "yiap" },
      { stopId: "sports" },
      { stopId: "science" },
      { stopId: "fkh" },
      { stopId: "res34-up" },
      { stopId: "shaw-up" },
      { stopId: "cwc-down" },
      { stopId: "res15" },
      { stopId: "uc-staff" },
      { stopId: "cch" },
      { stopId: "shaw-down" },
      { stopId: "res34-down" },
      { stopId: "admin" },
      { stopId: "sh-ho" },
      { stopId: "station-piazza" },
    ],
  },
  {
    id: "4",
    name: "环回线",
    color: "#d3543c",
    days: "teaching",
    first: "07:30",
    last: "18:50",
    minutes: [10, 30, 50],
    windowLabel: windowLabel(teachingDay, "07:30", "18:50", [10, 30, 50]),
    stops: [
      { stopId: "yiap" },
      { stopId: "cc-east-up" },
      { stopId: "cwc-up" },
      { stopId: "area39-up" },
      { stopId: "cwc-down" },
      { stopId: "res15" },
      { stopId: "uc-staff" },
      { stopId: "cch" },
      { stopId: "shaw-down" },
      { stopId: "res34-down" },
      { stopId: "na" },
      { stopId: "uc-down" },
      { stopId: "admin" },
      { stopId: "sh-ho" },
      { stopId: "univ-station" },
    ],
  },
  {
    id: "8",
    name: "西部线",
    color: "#b8860b",
    days: "teaching",
    first: "07:35",
    last: "18:35",
    minutes: [15, 35, 55],
    windowLabel: windowLabel(teachingDay, "07:35", "18:35", [15, 35, 55]),
    note: "星期一至六（公众假期除外），终点是大学站。星期日和公众假期改走假日线 H。",
    stops: [
      { stopId: "yiap" },
      { stopId: "cc-east-up" },
      { stopId: "cwc-up" },
      { stopId: "area39-up" },
      { stopId: "cwc-down" },
      { stopId: "uc-staff" },
      { stopId: "cch" },
      { stopId: "shaw-down" },
      { stopId: "res34-down" },
      { stopId: "admin" },
      { stopId: "science" },
      { stopId: "na-circle" },
      { stopId: "uc-down" },
      { stopId: "res34-up" },
      { stopId: "shaw-up" },
      { stopId: "area39-down" },
      { stopId: "cc-north" },
      { stopId: "cc-east-down" },
      { stopId: "univ-station" },
    ],
  },
  {
    id: "N",
    name: "晚间线",
    color: "#6b4c9a",
    days: "teaching",
    evening: true,
    first: "19:00",
    last: "23:30",
    minutes: [0, 15, 30, 45],
    windowLabel: windowLabel("星期一至六晚间（公众假期除外）", "19:00", "23:30", [0, 15, 30, 45]),
    note: "星期六同样走晚间线。到了这个时段才建议，没有单独开关。整点班次加停研究生宿舍一座。",
    stops: [
      { stopId: "univ-station" },
      pghOnHour,
      { stopId: "sports" },
      { stopId: "srr" },
      { stopId: "na-circle" },
      { stopId: "uc-down" },
      { stopId: "res34-up" },
      { stopId: "shaw-up" },
      { stopId: "area39-up" },
      { stopId: "cwc-down" },
      { stopId: "res15" },
      { stopId: "uc-staff" },
      { stopId: "cch" },
      { stopId: "shaw-down" },
      { stopId: "res34-down" },
      { stopId: "na" },
      { stopId: "uc-down" },
      { stopId: "admin" },
      { stopId: "sh-ho" },
      pghOnHour,
      { stopId: "univ-station" },
    ],
  },
  {
    id: "H",
    name: "假日线",
    color: "#2c6fbb",
    days: "holiday",
    first: "08:20",
    last: "23:20",
    minutes: [0, 20, 40],
    windowLabel: windowLabel(holidayDays, "08:20", "23:20", [0, 20, 40]),
    note: "只开星期日和公众假期，星期六不走这条线。全天用这一条，包含傍晚，不另开晚间线。整点班次加停研究生宿舍一座和 39区（上行）。",
    stops: [
      { stopId: "univ-station" },
      pghOnHour,
      { stopId: "sports" },
      { stopId: "srr" },
      { stopId: "na-circle" },
      { stopId: "uc-down" },
      { stopId: "res34-up" },
      { stopId: "shaw-up" },
      area39OnHour,
      { stopId: "cwc-down" },
      { stopId: "res15" },
      { stopId: "uc-staff" },
      { stopId: "cch" },
      { stopId: "shaw-down" },
      { stopId: "res34-down" },
      { stopId: "na" },
      { stopId: "uc-down" },
      { stopId: "admin" },
      { stopId: "sh-ho" },
      pghOnHour,
      { stopId: "univ-station" },
    ],
  },
  {
    id: "5",
    name: "转堂上行",
    color: "#1d7aa8",
    days: "teaching",
    special: true,
    first: "09:18",
    last: "17:26",
    minutes: [18, 22, 26],
    windowLabel: windowLabel(teachingMeet, "09:18", "17:26", [18, 22, 26]),
    note: "转堂校巴。只在这个时段内建议。",
    stops: [
      { stopId: "chung-chi" },
      { stopId: "sports" },
      { stopId: "srr" },
      { stopId: "fkh" },
      { stopId: "uc-up" },
      { stopId: "na" },
      { stopId: "res34-up" },
      { stopId: "shaw-up" },
      { stopId: "cwc-down" },
    ],
  },
  {
    id: "6A",
    name: "转堂下行",
    color: "#5c6b8a",
    days: "teaching",
    special: true,
    first: "09:10",
    last: "17:10",
    minutes: [10],
    windowLabel: windowLabel(teachingMeet, "09:10", "17:10", [10]),
    note: "转堂校巴。只在这个时段内建议。",
    stops: [
      { stopId: "cwc-down" },
      { stopId: "uc-staff" },
      { stopId: "cch" },
      { stopId: "res34-down" },
      { stopId: "na" },
      { stopId: "uc-down" },
      { stopId: "admin" },
      { stopId: "sh-ho" },
      { stopId: "station-piazza" },
      { stopId: "chung-chi" },
    ],
  },
  {
    id: "6B",
    name: "转堂下行",
    color: "#3d4a7a",
    days: "teaching",
    special: true,
    first: "12:20",
    last: "17:20",
    minutes: [20],
    windowLabel: windowLabel(teachingMeet, "12:20", "17:20", [20]),
    note: "转堂校巴。只在这个时段内建议。",
    stops: [
      { stopId: "na" },
      { stopId: "uc-down" },
      { stopId: "admin" },
      { stopId: "sh-ho" },
      { stopId: "station-piazza" },
      { stopId: "chung-chi" },
    ],
  },
  {
    id: "7",
    name: "转堂下行",
    color: "#7a4e2d",
    days: "teaching",
    special: true,
    first: "08:18",
    last: "17:18",
    minutes: [0, 18],
    windowLabel: windowLabel(teachingMeet, "08:18", "17:18", [0, 18]),
    note: "转堂校巴。只在这个时段内建议。",
    stops: [
      { stopId: "shaw-down" },
      { stopId: "res34-down" },
      { stopId: "na" },
      { stopId: "uc-down" },
      { stopId: "admin" },
      { stopId: "sh-ho" },
      { stopId: "station-piazza" },
      { stopId: "chung-chi" },
    ],
  },
];

export const TERM_LABEL = "2026–27 学年第一学期";

export function timetableLabel(route: ShuttleRoute): string {
  return route.windowLabel;
}

export function routeWhen(route: ShuttleRoute): string {
  if (route.days === "holiday") return "星期日及公众假期";
  if (route.special) return "星期一至五教学日，限时";
  if (route.evening) return "星期一至六晚间（公众假期除外）";
  return "星期一至六（公众假期除外）";
}

export function routesOnClock(now: Date): ShuttleRoute[] {
  const info = holidayInfo(now);
  if (info.holiday) return ROUTES.filter((route) => route.days === "holiday");
  return ROUTES.filter((route) => route.days === "teaching" && !(info.kind === "saturday" && route.special));
}

export function inServiceWindow(now: Date, route: ShuttleRoute): boolean {
  const nowMin = hkMinutes(now);
  return nowMin >= parseClock(route.first) && nowMin <= parseClock(route.last);
}

function hkMinutes(now: Date): number {
  const clock = hkClock(now);
  return (clock.hour % 24) * 60 + clock.minute;
}

export type ServicePicture = {
  info: HolidayInfo;
  period: "day" | "evening" | "closed";
  timeLabel: string;
  summary: string;
  short: string;
};

export function servicePicture(now: Date): ServicePicture {
  const info = holidayInfo(now);
  const clock = hkClock(now);
  const nowMin = (clock.hour % 24) * 60 + clock.minute;
  const timeLabel = clockLabel(clock.hour % 24, clock.minute);
  const open = routesOnClock(now)
    .filter((route) => !route.special)
    .filter((route) => nowMin >= parseClock(route.first) && nowMin <= parseClock(route.last));
  const period = open.some((route) => route.evening) ? "evening" : open.length > 0 ? "day" : "closed";
  const when = `香港时间 ${timeLabel}，${info.weekday}`;

  let summary: string;
  let short: string;
  if (info.kind === "public") {
    summary = `${when}，公众假期（${info.name}）。全天按假日线 H，08:20–23:20，不分开晚间线。`;
    short = "当前是公众假期，按假日线 H。";
  } else if (info.kind === "saturday" && period === "evening") {
    summary = `${when}。星期六晚间按晚间线 N，19:00–23:30。转堂校巴星期六不开。`;
    short = "当前是星期六晚间，按晚间线 N。";
  } else if (info.kind === "saturday" && period === "day") {
    summary = `${when}。星期六按星期一至六的路线，不是假日线。白天走 1、2、2S、3、4、8；19:00 起改晚间线 N。转堂校巴星期六不开。`;
    short = "当前是星期六，按星期一至六的路线。";
  } else if (info.kind === "saturday") {
    summary = `${when}。星期六现在不在日间班次或晚间线 N（19:00–23:30）里面。`;
    short = "当前是星期六，不在开行时段里。";
  } else if (info.kind === "sunday") {
    summary = `${when}。星期日按假日线 H，08:20–23:20，不分开晚间线。`;
    short = "当前是星期日，按假日线 H。";
  } else if (period === "evening") {
    summary = `${when}，上课日晚间。按晚间线 N 的时刻表 19:00–23:30，不是单独开关。`;
    short = "当前是上课日晚间，按晚间线 N。";
  } else if (period === "day") {
    summary = `${when}，上课日白天。按 1、2、2S、3、4、8 线各自的开行时段；19:00 起改晚间线 N。转堂校巴只在教学日时段内建议。`;
    short = "当前是上课日白天。";
  } else {
    summary = `${when}，上课日。现在不在日间班次或晚间线 N（19:00–23:30）里面。`;
    short = "当前不在校巴开行时段里。";
  }

  return { info, period, timeLabel, summary, short };
}
