import { clockLabel, hkClock, hkWallTime, parseClock } from "@/lib/hk-time";
import { placeById, walkMinutes, type Point } from "@/lib/places";
import { inServiceWindow, routesOnClock, timetableLabel, type RouteStop, type ShuttleRoute } from "@/lib/routes";

const SHORT_WALK = 6;
const MAX_WAIT = 40;
/** Walking is the headline only when it beats the full bus trip by this many minutes. */
const WALK_SAVES_MINUTES = 15;

export type BusOption = {
  routeId: string;
  routeName: string;
  color: string;
  board: Point;
  alight: Point;
  walkIn: number;
  walkOut: number;
  ride: number;
  wait: number | null;
  departLabel: string | null;
  total: number | null;
  hops: number;
  remarks: string[];
  timetable: string;
  special: boolean;
  routeNote?: string;
};

export type TripAdvice =
  | { status: "same" }
  | { status: "walk"; directMin: number; because: "short" | "faster"; bus?: BusOption }
  | { status: "bus"; directMin: number; bus: BusOption }
  | { status: "closed"; directMin: number; bus: BusOption }
  | { status: "none"; directMin: number };

type Departure = { wait: number; label: string };

function rideMinutes(hops: number): number {
  return Math.max(4, hops * 3);
}

function allowedMinutes(route: ShuttleRoute, board: RouteStop, alight: RouteStop): number[] | null {
  let minutes = route.minutes;
  if (board.onlyMinutes) {
    minutes = minutes.filter((minute) => board.onlyMinutes?.includes(minute));
  }
  if (alight.onlyMinutes) {
    minutes = minutes.filter((minute) => alight.onlyMinutes?.includes(minute));
  }
  return minutes.length > 0 ? minutes : null;
}

function nextDeparture(now: Date, route: ShuttleRoute, minutes: number[]): Departure | null {
  const clock = hkClock(now);
  const nowMin = clock.hour * 60 + clock.minute;
  const first = parseClock(route.first);
  const last = parseClock(route.last);
  const allowed = new Set(minutes);

  for (let cursor = nowMin; cursor <= last; cursor += 1) {
    if (cursor < first) continue;
    if (!allowed.has(cursor % 60)) continue;
    return {
      wait: cursor - nowMin,
      label: clockLabel(Math.floor(cursor / 60), cursor % 60),
    };
  }
  return null;
}

function consider(
  route: ShuttleRoute,
  boardStop: RouteStop,
  alightStop: RouteStop,
  hops: number,
  origin: Point,
  dest: Point,
  direct: number,
  now: Date,
): BusOption | null {
  if (route.special && !inServiceWindow(now, route)) return null;
  if (boardStop.stopId === alightStop.stopId) return null;
  const board = placeById(boardStop.stopId);
  const alight = placeById(alightStop.stopId);
  const walkIn = walkMinutes(origin, board);
  const walkOut = walkMinutes(alight, dest);
  if (walkOut >= direct) return null;
  if (walkIn >= direct) return null;
  if (walkIn + walkOut + 4 >= direct) return null;

  const minutes = allowedMinutes(route, boardStop, alightStop);
  if (!minutes) return null;

  const departure = nextDeparture(now, route, minutes);
  const ride = rideMinutes(hops);
  const remarks = [boardStop.remark, alightStop.remark].filter((item): item is string => Boolean(item));
  const uniqueRemarks = [...new Set(remarks)];

  if (!departure) {
    return {
      routeId: route.id,
      routeName: route.name,
      color: route.color,
      board,
      alight,
      walkIn,
      walkOut,
      ride,
      wait: null,
      departLabel: null,
      total: null,
      hops,
      remarks: uniqueRemarks,
      timetable: timetableLabel(route),
      special: Boolean(route.special),
      routeNote: route.note,
    };
  }

  return {
    routeId: route.id,
    routeName: route.name,
    color: route.color,
    board,
    alight,
    walkIn,
    walkOut,
    ride,
    wait: departure.wait,
    departLabel: departure.label,
    total: walkIn + departure.wait + ride + walkOut,
    hops,
    remarks: uniqueRemarks,
    timetable: timetableLabel(route),
    special: Boolean(route.special),
    routeNote: route.note,
  };
}

function better(next: BusOption, current: BusOption | undefined, preferRunning: boolean): boolean {
  if (!current) return true;
  const nextRunning = next.wait !== null && next.wait <= MAX_WAIT;
  const currentRunning = current.wait !== null && current.wait <= MAX_WAIT;
  if (preferRunning && nextRunning !== currentRunning) return nextRunning;
  const nextScore = next.total ?? Number.POSITIVE_INFINITY;
  const currentScore = current.total ?? Number.POSITIVE_INFINITY;
  if (nextScore !== currentScore) return nextScore < currentScore;
  return next.walkIn + next.walkOut < current.walkIn + current.walkOut;
}

export function advise(origin: Point, dest: Point, now: Date): TripAdvice {
  const direct = walkMinutes(origin, dest);
  if (origin.id === dest.id || direct === 0) return { status: "same" };
  if (direct <= SHORT_WALK) return { status: "walk", directMin: direct, because: "short" };

  let bestRunning: BusOption | undefined;
  let bestAny: BusOption | undefined;

  for (const route of routesOnClock(now)) {
    for (let i = 0; i < route.stops.length; i += 1) {
      for (let j = i + 1; j < route.stops.length; j += 1) {
        const option = consider(route, route.stops[i], route.stops[j], j - i, origin, dest, direct, now);
        if (!option) continue;
        if (better(option, bestAny, false)) bestAny = option;
        if (option.wait !== null && option.wait <= MAX_WAIT && better(option, bestRunning, true)) {
          bestRunning = option;
        }
      }
    }
  }

  if (bestRunning && bestRunning.total !== null && bestRunning.total - direct >= WALK_SAVES_MINUTES) {
    return { status: "walk", directMin: direct, because: "faster", bus: bestRunning };
  }
  if (bestRunning) {
    return { status: "bus", directMin: direct, bus: bestRunning };
  }
  if (bestAny) {
    return { status: "closed", directMin: direct, bus: bestAny };
  }
  return { status: "none", directMin: direct };
}

export function formatWait(wait: number): string {
  if (wait <= 0) return "现在这班刚开出或即将开出";
  return `大约还要等 ${wait} 分钟`;
}

export function hkDate(year: number, month: number, day: number, hour: number, minute: number): Date {
  return hkWallTime(year, month, day, hour, minute);
}
