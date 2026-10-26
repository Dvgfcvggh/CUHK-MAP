import { clockLabel, hkClock, hkWallTime, parseClock } from "@/lib/hk-time";
import { distanceMeters, placeById, walkMinutes, type Point } from "@/lib/places";
import { inServiceWindow, routesOnClock, timetableLabel, type RouteStop, type ShuttleRoute } from "@/lib/routes";

const MAX_WAIT = 40;
/** A leftover walk of about a kilometre is not a bus recommendation. */
const FAR_WALK_METERS = 1000;
/** Alighting within this beats a much longer leftover walk. */
const CLOSE_ALIGHT_METERS = 200;
const LONG_LEFTOVER_METERS = 400;
/** Straight-line distance at or under this is a short trip: say 走过去就好, and still show a running bus. */
export const SHORT_TRIP_METERS = 500;
/** Show 步行更快 when walking beats the full bus trip by this many minutes. The bus stays on the page. */
export const WALK_SAVES_MINUTES = 15;

export type BusOption = {
  routeId: string;
  routeName: string;
  color: string;
  board: Point;
  alight: Point;
  walkIn: number;
  walkOut: number;
  walkOutMeters: number;
  ride: number;
  wait: number | null;
  departLabel: string | null;
  total: number | null;
  hops: number;
  /** Stop ids strictly between the chosen boarding and alighting visits, in route order. */
  betweenIds: string[];
  remarks: string[];
  timetable: string;
  special: boolean;
  routeNote?: string;
};

export type TripAdvice =
  | { status: "same" }
  | { status: "walk"; directMin: number; because: "short" }
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
  betweenIds: string[],
): BusOption | null {
  if (route.special && !inServiceWindow(now, route)) return null;
  if (boardStop.stopId === alightStop.stopId) return null;
  const board = placeById(boardStop.stopId);
  const alight = placeById(alightStop.stopId);
  const walkIn = walkMinutes(origin, board);
  const walkOut = walkMinutes(alight, dest);
  const walkOutMeters = distanceMeters(alight.lat, alight.lng, dest.lat, dest.lng);
  if (walkOutMeters >= FAR_WALK_METERS) return null;
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
      walkOutMeters,
      ride,
      wait: null,
      departLabel: null,
      total: null,
      hops,
      betweenIds,
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
    walkOutMeters,
    ride,
    wait: departure.wait,
    departLabel: departure.label,
    total: walkIn + departure.wait + ride + walkOut,
    hops,
    betweenIds,
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
  const nextClose = next.walkOutMeters <= CLOSE_ALIGHT_METERS;
  const currentClose = current.walkOutMeters <= CLOSE_ALIGHT_METERS;
  if (nextClose !== currentClose && Math.max(next.walkOutMeters, current.walkOutMeters) >= LONG_LEFTOVER_METERS) {
    return nextClose;
  }
  const nextScore = next.total ?? Number.POSITIVE_INFINITY;
  const currentScore = current.total ?? Number.POSITIVE_INFINITY;
  if (nextScore !== currentScore) return nextScore < currentScore;
  return next.walkIn + next.walkOut < current.walkIn + current.walkOut;
}

/** True when the straight-line trip is short enough to mention 走过去就好. */
export function isShortTrip(origin: Point, dest: Point): boolean {
  return distanceMeters(origin.lat, origin.lng, dest.lat, dest.lng) <= SHORT_TRIP_METERS;
}

/** True when walking beats this bus by at least WALK_SAVES_MINUTES. Does not hide the bus. */
export function walkingBeatsBus(directMin: number, bus: BusOption | undefined): boolean {
  return bus?.total != null && bus.total - directMin >= WALK_SAVES_MINUTES;
}

export function advise(origin: Point, dest: Point, now: Date): TripAdvice {
  const direct = walkMinutes(origin, dest);
  if (origin.id === dest.id || direct === 0) return { status: "same" };

  let bestRunning: BusOption | undefined;
  let bestAny: BusOption | undefined;

  for (const route of routesOnClock(now)) {
    for (let i = 0; i < route.stops.length; i += 1) {
      for (let j = i + 1; j < route.stops.length; j += 1) {
        const betweenIds = route.stops.slice(i + 1, j).map((stop) => stop.stopId);
        const option = consider(route, route.stops[i], route.stops[j], j - i, origin, dest, direct, now, betweenIds);
        if (!option) continue;
        if (better(option, bestAny, false)) bestAny = option;
        if (option.wait !== null && option.wait <= MAX_WAIT && better(option, bestRunning, true)) {
          bestRunning = option;
        }
      }
    }
  }

  if (bestRunning) {
    return { status: "bus", directMin: direct, bus: bestRunning };
  }
  if (bestAny) {
    return { status: "closed", directMin: direct, bus: bestAny };
  }
  if (isShortTrip(origin, dest)) return { status: "walk", directMin: direct, because: "short" };
  return { status: "none", directMin: direct };
}

/** One running option per route that can finish this trip now, soonest total first. */
export function routeChoices(origin: Point, dest: Point, now: Date): BusOption[] {
  const direct = walkMinutes(origin, dest);
  if (origin.id === dest.id || direct === 0) return [];
  const byRoute = new Map<string, BusOption>();
  for (const route of routesOnClock(now)) {
    for (let i = 0; i < route.stops.length; i += 1) {
      for (let j = i + 1; j < route.stops.length; j += 1) {
        const betweenIds = route.stops.slice(i + 1, j).map((stop) => stop.stopId);
        const option = consider(route, route.stops[i], route.stops[j], j - i, origin, dest, direct, now, betweenIds);
        if (!option || option.wait === null || option.wait > MAX_WAIT || option.total === null) continue;
        const current = byRoute.get(route.id);
        if (better(option, current, true)) byRoute.set(route.id, option);
      }
    }
  }
  return [...byRoute.values()].sort((a, b) => {
    const diff = (a.total ?? 0) - (b.total ?? 0);
    if (diff !== 0) return diff;
    return a.routeId < b.routeId ? -1 : 1;
  });
}

/** Display marks for the route chips. Does not change which route is recommended or the sort. */
export function routeAdvantage(options: Pick<BusOption, "total" | "walkIn" | "walkOut">[]): { shortestTime: boolean; shortestWalk: boolean }[] {
  if (options.length === 0) return [];
  const minTotal = Math.min(...options.map((option) => option.total ?? Number.POSITIVE_INFINITY));
  const minWalk = Math.min(...options.map((option) => option.walkIn + option.walkOut));
  return options.map((option) => ({
    shortestTime: (option.total ?? Number.POSITIVE_INFINITY) === minTotal,
    shortestWalk: option.walkIn + option.walkOut === minWalk,
  }));
}

export function formatWait(wait: number): string {
  if (wait <= 0) return "现在这班刚开出或即将开出";
  return `大约还要等 ${wait} 分钟`;
}

export function hkDate(year: number, month: number, day: number, hour: number, minute: number): Date {
  return hkWallTime(year, month, day, hour, minute);
}
