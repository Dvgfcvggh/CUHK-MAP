"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CampusMap } from "@/components/campus-map";
import {
  messages,
  noteText,
  pictureText,
  placeLabel,
  remarkText,
  routeLabel,
  routeWhenText,
  timetableFor,
  windowText,
} from "@/lib/copy";
import { setLocale, useLocale, type Locale } from "@/lib/locale";
import {
  currentPositionPoint,
  distanceMeters,
  commonPlaces,
  nearbyStops,
  otherStops,
  searchPlaces,
  typedPin,
  type Point,
} from "@/lib/places";
import { advise, isShortTrip, walkingBeatsBus, type BusOption, type TripAdvice } from "@/lib/recommend";
import { ROUTES, servicePicture, type ServicePicture } from "@/lib/routes";
import { walkApps, walkEndsApart, type WalkEnd } from "@/lib/walk-links";
import { cn } from "@/lib/utils";

const tap = "h-11 min-h-11 px-3.5";
const chipOn =
  "border-primary/25 bg-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground";
const segmentOn = "bg-card font-semibold text-foreground shadow-[0_1px_2px_rgba(28,28,30,0.18)] hover:bg-card";
const segmentOff = "font-medium text-muted-foreground hover:bg-transparent hover:text-foreground";

function inkFor(hex: string): string {
  const n = Number.parseInt(hex.slice(1), 16);
  if (!Number.isFinite(n)) return "#fff";
  const channel = (value: number) => {
    const s = value / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const y =
    0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
  return y > 0.18 ? "#120c08" : "#fff";
}

let clockSnapshot = 0;

function subscribeClock(onStoreChange: () => void) {
  const id = window.setInterval(() => {
    clockSnapshot = Date.now();
    onStoreChange();
  }, 30000);
  return () => window.clearInterval(id);
}

function getClockSnapshot() {
  if (clockSnapshot === 0) clockSnapshot = Date.now();
  return clockSnapshot;
}

function getServerClock() {
  return 0;
}

type PickMode = "start" | "end";
type PlaceNote = "miss-start" | "miss-end" | "empty" | "many";
type LocationNote = "none" | "denied" | "timeout";

export function Planner() {
  const locale = useLocale();
  const copy = messages(locale);
  const [start, setStart] = useState<Point | null>(null);
  const [end, setEnd] = useState<Point | null>(null);
  const [mode, setMode] = useState<PickMode>("start");
  const [locating, setLocating] = useState(false);
  const [locationNote, setLocationNote] = useState<LocationNote | null>(null);
  const [placeQuery, setPlaceQuery] = useState("");
  const [placeMatches, setPlaceMatches] = useState<Point[]>([]);
  const [placeNote, setPlaceNote] = useState<PlaceNote | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const endRef = useRef(end);
  const startRef = useRef(start);
  const locatingRef = useRef(false);
  const lookingRef = useRef(false);
  useEffect(() => {
    endRef.current = end;
    startRef.current = start;
  }, [end, start]);
  const nowMs = useSyncExternalStore(subscribeClock, getClockSnapshot, getServerClock);
  const picture = nowMs === 0 ? null : servicePicture(new Date(nowMs));

  useEffect(() => {
    document.documentElement.lang = locale === "en" ? "en" : locale === "zh-Hant" ? "zh-Hant" : "zh-CN";
    document.title = copy.title;
  }, [locale, copy.title]);

  const advice = useMemo<TripAdvice | null>(() => {
    if (!start || !end || nowMs === 0) return null;
    return advise(start, end, new Date(nowMs));
  }, [start, end, nowMs]);

  function choose(point: Point) {
    setLocationNote(null);
    setPlaceNote(null);
    setPlaceMatches([]);
    if (mode === "start") {
      setStart(point);
      if (!end) setMode("end");
      return;
    }
    setEnd(point);
    if (!start) setMode("start");
  }

  function assignLookup(point: Point, pickedMode: PickMode, endEmpty: boolean, startEmpty: boolean) {
    setLocationNote(null);
    setPlaceNote(null);
    setPlaceMatches([]);
    if (pickedMode === "start") {
      setStart(point);
      if (endEmpty) setMode("end");
      return;
    }
    setEnd(point);
    if (startEmpty) setMode("start");
  }

  function missedLookup(pickedMode: PickMode) {
    setPlaceNote(pickedMode === "start" ? "miss-start" : "miss-end");
  }

  async function lookupPlace() {
    const text = placeQuery.trim();
    const pickedMode = mode;
    if (!text) {
      setPlaceMatches([]);
      setPlaceNote("empty");
      return;
    }
    const found = searchPlaces(text);
    if (found.length === 1) {
      assignLookup(found[0], pickedMode, !end, !start);
      return;
    }
    if (found.length > 1) {
      setPlaceMatches(found);
      setPlaceNote("many");
      return;
    }
    if (lookingRef.current) return;
    lookingRef.current = true;
    setLookingUp(true);
    setPlaceMatches([]);
    setPlaceNote(null);
    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(text)}`);
      const body = (await response.json()) as { found?: boolean; lat?: number; lng?: number };
      if (!response.ok || !body.found || typeof body.lat !== "number" || typeof body.lng !== "number") {
        missedLookup(pickedMode);
        return;
      }
      assignLookup(typedPin(body.lat, body.lng, text), pickedMode, !endRef.current, !startRef.current);
    } catch {
      missedLookup(pickedMode);
    } finally {
      lookingRef.current = false;
      setLookingUp(false);
    }
  }

  function locateStart() {
    if (locatingRef.current) return;
    if (!navigator.geolocation) {
      setLocationNote("none");
      return;
    }
    locatingRef.current = true;
    setLocating(true);
    setLocationNote(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        locatingRef.current = false;
        setLocating(false);
        const lat = position.coords?.latitude;
        const lng = position.coords?.longitude;
        if (typeof lat !== "number" || typeof lng !== "number" || !Number.isFinite(lat) || !Number.isFinite(lng)) {
          setLocationNote("none");
          return;
        }
        setStart(currentPositionPoint(lat, lng));
        if (!endRef.current) setMode("end");
      },
      (error) => {
        locatingRef.current = false;
        setLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationNote("denied");
          return;
        }
        if (error.code === error.TIMEOUT) {
          setLocationNote("timeout");
          return;
        }
        setLocationNote("none");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }

  const highlighted = advice && "bus" in advice ? advice.bus : undefined;
  const boardId = highlighted?.board.id;
  const alightId = highlighted?.alight.id;

  const placeMessage =
    placeNote === "many"
      ? copy.manyPlaces
      : placeNote === "empty"
        ? copy.emptyQuery
        : placeNote === "miss-start"
          ? copy.missStart
          : placeNote === "miss-end"
            ? copy.missEnd
            : null;
  const locationMessage =
    locationNote === "denied" ? copy.noPermission : locationNote === "timeout" ? copy.locationTimeout : locationNote === "none" ? copy.noPosition : null;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-5 pb-16 sm:py-8">
      <div className="flex items-start justify-between gap-3">
        <header className="flex min-w-0 max-w-[65ch] flex-col gap-3">
          <h1 className="font-heading text-balance text-[1.75rem] leading-8 font-semibold tracking-normal text-foreground sm:text-[2rem] sm:leading-9">
            {copy.title}
          </h1>
          <p className="text-sm leading-6 text-muted-foreground sm:text-base">{copy.intro}</p>
        </header>
        <LanguageSwitch locale={locale} />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:gap-6">
        <div className="lg:sticky lg:top-4">
          <div className="h-60 sm:h-80 lg:h-[calc(100dvh-16.5rem)]">
            <CampusMap start={start} end={end} boardId={boardId} alightId={alightId} onPick={choose} />
          </div>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">{copy.mapKey}</p>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>{copy.endsTitle}</CardTitle>
              <CardDescription>{mode === "start" ? copy.modeStart : copy.modeEnd}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-[#e4e6ea] p-1" role="group" aria-label={copy.endsAria}>
                <Button
                  className={cn(tap, mode === "start" ? segmentOn : segmentOff)}
                  variant="ghost"
                  onClick={() => setMode("start")}
                >
                  {copy.setStart}
                </Button>
                <Button
                  className={cn(tap, mode === "end" ? segmentOn : segmentOff)}
                  variant="ghost"
                  onClick={() => setMode("end")}
                >
                  {copy.setEnd}
                </Button>
              </div>
              <form
                className="flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  void lookupPlace();
                }}
              >
                <input
                  value={placeQuery}
                  onChange={(event) => {
                    setPlaceQuery(event.target.value);
                    setPlaceMatches([]);
                  }}
                  placeholder={copy.placePlaceholder}
                  aria-label={copy.placeAria}
                  className="h-11 min-h-11 min-w-0 flex-1 rounded-lg border border-input bg-card px-3.5 text-base text-foreground outline-none transition-[border-color,outline-color] duration-150 ease-[cubic-bezier(0.2,0,0,1)] placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                />
                <Button type="submit" variant="outline" className={tap} disabled={lookingUp}>
                  {lookingUp ? copy.looking : copy.lookup}
                </Button>
              </form>
              {placeMatches.length > 1 ? (
                <div className="flex flex-wrap gap-2">
                  {placeMatches.map((place) => (
                    <Button key={place.id} type="button" variant="outline" className={tap} onClick={() => choose(place)}>
                      {placeLabel(place, locale)}
                    </Button>
                  ))}
                </div>
              ) : null}
              {placeMessage ? <StatusNote tone={placeNote === "many" ? "hint" : "error"}>{placeMessage}</StatusNote> : null}
              <Button variant="outline" className={tap} onClick={locateStart} disabled={locating}>
                {locating ? copy.locating : copy.useHere}
              </Button>
              {locationMessage ? <StatusNote tone="error">{locationMessage}</StatusNote> : null}
              <SelectionRow label={copy.start} point={start} unset={copy.unset} clearLabel={copy.clear} locale={locale} onClear={() => setStart(null)} />
              <SelectionRow label={copy.end} point={end} unset={copy.unset} clearLabel={copy.clear} locale={locale} onClear={() => setEnd(null)} />
              <p className="text-sm leading-6 text-muted-foreground">
                {picture ? pictureText(picture, locale).summary : copy.clockLoading}
              </p>
            </CardContent>
          </Card>

          <StopRow selectedId={mode === "start" ? start?.id : end?.id} onPick={choose} />

          <ResultCard start={start} end={end} advice={advice} picture={picture} />
        </div>
      </div>

      <section className="flex flex-col border-t border-border pt-10">
        <h2 className="font-heading text-xl leading-7 font-semibold tracking-normal">{copy.routes}</h2>
        <p className="mt-2 max-w-[65ch] text-sm leading-6 text-muted-foreground">{copy.routesLead}</p>
        <ul className="mt-5 grid gap-2 sm:grid-cols-2">
          {ROUTES.map((route) => (
            <li key={route.id} className="flex items-start gap-3 rounded-xl border border-border bg-card px-3.5 py-3.5">
              <span
                className="inline-flex h-8 min-w-8 items-center justify-center rounded-md px-1.5 text-sm font-semibold tabular-nums"
                style={{ background: route.color, color: inkFor(route.color) }}
              >
                {route.id}
              </span>
              <span>
                <span className="block text-base leading-6 font-medium">
                  {routeLabel(route.name, locale)}
                  <span className="ml-2 text-sm font-normal text-muted-foreground">{routeWhenText(route, locale)}</span>
                </span>
                <span className="mt-1 block text-sm leading-5 text-muted-foreground tabular-nums">{windowText(route, locale)}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-5 max-w-[65ch] text-xs leading-5 text-muted-foreground">
          {copy.routesFoot}{" "}
          <a
            className="text-primary underline underline-offset-4 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            href="https://transport.cuhk.edu.hk/"
            target="_blank"
            rel="noopener noreferrer"
          >
            {copy.office}
          </a>
          {locale === "en" ? "." : "。"}
        </p>
      </section>
    </div>
  );
}

function LanguageSwitch({ locale }: { locale: Locale }) {
  return (
    <label className="flex shrink-0 items-center gap-1.5 pt-1 text-xs leading-5 text-muted-foreground">
      <span className="whitespace-nowrap">语言/language</span>
      <select
        value={locale}
        aria-label="语言/language"
        onChange={(event) => setLocale(event.target.value as Locale)}
        className="h-8 rounded-md border border-input bg-card px-1.5 text-xs text-foreground outline-none focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <option value="zh-Hans">简体中文</option>
        <option value="zh-Hant">繁体中文</option>
        <option value="en">English</option>
      </select>
    </label>
  );
}

function SelectionRow({
  label,
  point,
  unset,
  clearLabel,
  locale,
  onClear,
}: {
  label: string;
  point: Point | null;
  unset: string;
  clearLabel: string;
  locale: Locale;
  onClear: () => void;
}) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-3 border-t border-border pt-3">
      <p className="text-sm leading-6">
        <span className="text-muted-foreground">{label}</span>
        <span className="mx-2 text-muted-foreground">·</span>
        <span className="font-medium">{point ? placeLabel(point, locale) : unset}</span>
      </p>
      {point ? (
        <Button variant="ghost" className="h-11 min-h-11 px-3" onClick={onClear}>
          {clearLabel}
        </Button>
      ) : null}
    </div>
  );
}

const stopRowPlaces = [...commonPlaces(), ...otherStops()];

function StopRow({ selectedId, onPick }: { selectedId?: string; onPick: (point: Point) => void }) {
  const locale = useLocale();
  const copy = messages(locale);
  const [open, setOpen] = useState(false);
  const [limit, setLimit] = useState(stopRowPlaces.length);
  const [ready, setReady] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) return;
    const row = rowRef.current;
    if (!row) return;

    let lastWidth = -1;
    const measure = () => {
      const width = row.clientWidth;
      if (width === lastWidth) return;
      lastWidth = width;
      const chips = [...row.querySelectorAll<HTMLElement>("[data-stop]")];
      if (chips.length === 0) return;
      chips.forEach((chip) => chip.classList.remove("hidden"));
      const rowTop = row.getBoundingClientRect().top;
      const tops: number[] = [];
      let count = chips.length;
      for (let i = 0; i < chips.length; i += 1) {
        const top = Math.round(chips[i].getBoundingClientRect().top - rowTop);
        if (!tops.includes(top)) tops.push(top);
        if (tops.length > 2) {
          count = Math.max(1, i);
          break;
        }
      }
      chips.forEach((chip, index) => chip.classList.toggle("hidden", index >= count));
      setLimit(count);
      setReady(true);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(row);
    return () => observer.disconnect();
  }, [open]);

  return (
    <section className="flex flex-col gap-2">
      <h2>
        <button
          type="button"
          className="flex min-h-11 items-center gap-1.5 rounded-md text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          aria-expanded={open}
          aria-controls="campus-stops"
          onClick={() => setOpen((value) => !value)}
        >
          <svg
            viewBox="0 0 16 16"
            aria-hidden="true"
            className={cn(
              "size-3.5 shrink-0 text-muted-foreground transition-transform duration-150 ease-[cubic-bezier(0.2,0,0,1)]",
              open && "rotate-90",
            )}
          >
            <path
              d="M6 3.5 11 8 6 12.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {copy.stops}
        </button>
      </h2>
      <div
        id="campus-stops"
        ref={rowRef}
        className={cn("flex flex-wrap gap-2", !open && !ready && "max-h-24 overflow-hidden")}
      >
        {stopRowPlaces.map((place, index) => {
          const selected = place.id === selectedId;
          const collapsed = !open && ready && index >= limit;
          return (
            <Button
              key={place.id}
              data-stop=""
              variant="outline"
              className={cn(tap, collapsed && "hidden", selected && chipOn)}
              aria-pressed={selected}
              onClick={() => onPick(place)}
            >
              {placeLabel(place, locale)}
            </Button>
          );
        })}
      </div>
    </section>
  );
}

function ResultCard({
  start,
  end,
  advice,
  picture,
}: {
  start: Point | null;
  end: Point | null;
  advice: TripAdvice | null;
  picture: ServicePicture | null;
}) {
  const locale = useLocale();
  const copy = messages(locale);
  const startName = start ? placeLabel(start, locale) : "";
  const endName = end ? placeLabel(end, locale) : "";

  if (!start || !end) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{copy.notReadyTitle}</CardTitle>
          <CardDescription>{copy.notReadyLead}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-muted-foreground">{copy.notReadyBody}</p>
        </CardContent>
      </Card>
    );
  }

  if (!advice) {
    return (
      <Card aria-busy="true">
        <CardHeader>
          <CardTitle>{copy.matchingTitle}</CardTitle>
          <CardDescription>{copy.matchingLead}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const fine = <FinePrint picture={picture} />;
  const answerTitle = "text-xl leading-snug font-semibold sm:text-2xl";
  const answerLead = "text-base leading-7 text-muted-foreground";

  if (advice.status === "same") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className={answerTitle}>{copy.sameTitle}</CardTitle>
          <CardDescription className={answerLead}>{copy.sameLead}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (advice.status === "walk" && advice.because === "short") {
    const meters = Math.round(distanceMeters(start.lat, start.lng, end.lat, end.lng));
    return (
      <Card>
        <CardHeader>
          <CardTitle className={answerTitle}>{copy.walkTitle}</CardTitle>
          <CardDescription className={answerLead}>
            {copy.walkLead(startName, endName, advice.directMin, meters)}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <WalkChoices title={copy.walkDirect} origin={start} destination={end} />
          {fine}
        </CardContent>
      </Card>
    );
  }

  if (advice.status === "bus") {
    const title = advice.bus.special ? copy.suggestMeet(advice.bus.routeId) : copy.suggestLine(advice.bus.routeId);
    const mentionWalk = walkingBeatsBus(advice.directMin, advice.bus) || isShortTrip(start, end);
    return (
      <Card>
        <CardHeader>
          <CardTitle className={answerTitle}>{title}</CardTitle>
          <CardDescription className={answerLead}>
            {copy.busLead(
              routeLabel(advice.bus.routeName, locale),
              timetableFor(advice.bus.routeId, advice.bus.timetable, locale),
              advice.bus.total ?? 0,
              advice.directMin,
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <TripNotes start={start} end={end} directMin={advice.directMin} bus={advice.bus} />
          <BusDetail bus={advice.bus} />
          <WalkChoices title={copy.walkToBoard} origin={start} destination={advice.bus.board} />
          {/* This leg starts at the alighting stop, not the campus center or the user's start. */}
          <WalkChoices title={copy.walkFromAlight} origin={advice.bus.alight} destination={end} />
          {mentionWalk ? <WalkChoices title={copy.walkDirect} origin={start} destination={end} /> : null}
          {fine}
        </CardContent>
      </Card>
    );
  }

  if (advice.status === "closed") {
    const ended = advice.bus.departLabel === null;
    return (
      <Card>
        <CardHeader>
          <CardTitle className={answerTitle}>{copy.closedTitle}</CardTitle>
          <CardDescription className={answerLead}>
            {ended
              ? copy.closedEnded(advice.bus.routeId)
              : copy.closedWait(advice.bus.routeId, advice.bus.departLabel ?? "", advice.bus.wait ?? 0)}
            {copy.closedThen(advice.directMin)}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <TripNotes start={start} end={end} directMin={advice.directMin} bus={advice.bus} />
          <BusDetail bus={advice.bus} compact />
          <WalkChoices title={copy.walkToBoard} origin={start} destination={advice.bus.board} />
          <WalkChoices title={copy.walkFromAlight} origin={advice.bus.alight} destination={end} />
          <WalkChoices title={copy.walkDirect} origin={start} destination={end} />
          {fine}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className={answerTitle}>{copy.noneTitle}</CardTitle>
        <CardDescription className={answerLead}>{copy.noneLead(startName, endName, advice.directMin)}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <WalkChoices title={copy.walkDirect} origin={start} destination={end} />
        {fine}
      </CardContent>
    </Card>
  );
}

function TripNotes({
  start,
  end,
  directMin,
  bus,
}: {
  start: Point;
  end: Point;
  directMin: number;
  bus: BusOption;
}) {
  const locale = useLocale();
  const copy = messages(locale);
  const faster = walkingBeatsBus(directMin, bus);
  const short = isShortTrip(start, end);
  if (!faster && !short) return null;
  const meters = Math.round(distanceMeters(start.lat, start.lng, end.lat, end.lng));
  const saved = bus.total != null ? bus.total - directMin : 0;
  const startName = placeLabel(start, locale);
  const endName = placeLabel(end, locale);
  return (
    <div className="flex flex-col gap-2">
      {faster ? (
        <div className="rounded-lg border border-border px-3 py-2">
          <p className="text-base font-semibold">{copy.fasterTitle}</p>
          <p className="text-sm leading-6 text-muted-foreground">{copy.fasterBody(startName, endName, directMin, saved)}</p>
        </div>
      ) : null}
      {short ? <p className="text-sm leading-6 text-muted-foreground">{copy.shortNote(meters)}</p> : null}
    </div>
  );
}

function BusDetail({ bus, compact = false }: { bus: BusOption; compact?: boolean }) {
  const locale = useLocale();
  const copy = messages(locale);
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-3">
        <Badge
          className="size-8 rounded-md px-0 text-sm font-semibold tabular-nums"
          style={{ background: bus.color, color: inkFor(bus.color) }}
        >
          {bus.routeId}
        </Badge>
        <span className="text-base font-semibold">{routeLabel(bus.routeName, locale)}</span>
      </div>
      <ol className="mt-3 divide-y divide-border border-t border-border">
        <li className="flex flex-col gap-0.5 py-2.5">
          <span className="text-sm text-muted-foreground">{copy.board}</span>
          <span className="text-base font-medium">{placeLabel(bus.board, locale)}</span>
          <span className="text-sm text-muted-foreground tabular-nums">{copy.walkIn(bus.walkIn)}</span>
        </li>
        <li className="flex flex-col gap-0.5 py-2.5">
          <span className="text-sm text-muted-foreground">{copy.alight}</span>
          <span className="text-base font-medium">{placeLabel(bus.alight, locale)}</span>
          <span className="text-sm text-muted-foreground tabular-nums">{copy.walkOut(bus.walkOut)}</span>
        </li>
      </ol>
      <CloseStopNotes board={bus.board} alight={bus.alight} />
      {!compact ? (
        <p className="mt-3 text-sm leading-6 tabular-nums">
          {copy.ride(bus.ride, Math.max(0, bus.hops - 1), bus.departLabel, bus.wait ?? 0)}
        </p>
      ) : null}
      <p className="mt-2 text-xs leading-5 text-muted-foreground tabular-nums">
        {timetableFor(bus.routeId, bus.timetable, locale)}
      </p>
      {bus.special ? <p className="mt-1 text-xs leading-5 text-muted-foreground">{copy.meetOnly}</p> : null}
      {bus.remarks.map((remark) => (
        <p key={remark} className="mt-1 text-xs leading-5 text-muted-foreground">
          {remarkText(remark, locale)}
        </p>
      ))}
      {bus.routeNote ? <p className="mt-1 text-xs leading-5 text-muted-foreground">{noteText(bus.routeNote, locale)}</p> : null}
    </div>
  );
}

function CloseStopNotes({ board, alight }: { board: Point; alight: Point }) {
  const locale = useLocale();
  const copy = messages(locale);
  const nearBoard = nearbyStops(board, 120);
  const nearAlight = nearbyStops(alight, 120);
  const between = distanceMeters(board.lat, board.lng, alight.lat, alight.lng);
  const pairClose = board.id !== alight.id && between <= 200;
  if (nearBoard.length === 0 && nearAlight.length === 0 && !pairClose) return null;
  const boardName = placeLabel(board, locale);
  const alightName = placeLabel(alight, locale);

  return (
    <div className="mt-3 rounded-lg border border-[#f3d48a] bg-[#fef7e0] px-3 py-2 text-sm leading-6 text-[#7a4f01]">
      {nearBoard.map((item) => (
        <p key={`board-${item.stop.id}`}>{copy.nearBoard(boardName, item.meters, placeLabel(item.stop, locale))}</p>
      ))}
      {nearAlight.map((item) => (
        <p key={`alight-${item.stop.id}`}>{copy.nearAlight(alightName, item.meters, placeLabel(item.stop, locale))}</p>
      ))}
      {pairClose ? <p>{copy.pairClose(boardName, alightName, between)}</p> : null}
    </div>
  );
}

function WalkChoices({ title, origin, destination }: { title: string; origin: WalkEnd; destination: WalkEnd }) {
  const copy = messages(useLocale());
  if (!walkEndsApart(origin, destination)) {
    return (
      <div className="flex flex-col gap-2 border-t border-border pt-3" role="group" aria-label={title}>
        <p className="text-base font-medium">{title}</p>
        <p className="text-sm leading-6 text-muted-foreground">{copy.alreadyHere}</p>
      </div>
    );
  }
  const apps = walkApps(origin, destination);
  return (
    <div className="flex flex-col gap-2 border-t border-border pt-3" role="group" aria-label={title}>
      <p className="text-base font-medium">{title}</p>
      <p className="text-sm leading-6 text-muted-foreground">{copy.walkHint}</p>
      <div className="flex flex-wrap gap-2">
        {apps.map((app) => (
          <a
            key={app.id}
            className={cn(buttonVariants({ variant: "outline" }), tap)}
            href={app.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            {copy.app(app.id)}
          </a>
        ))}
      </div>
    </div>
  );
}

function StatusNote({ tone, children }: { tone: "error" | "hint"; children: string }) {
  if (tone === "hint") {
    return (
      <p role="status" className="text-sm leading-6 text-muted-foreground">
        {children}
      </p>
    );
  }
  return (
    <p
      role="alert"
      className="rounded-lg bg-[#fce8e6] px-3 py-2 text-sm leading-6 text-[#a50e0e]"
    >
      {children}
    </p>
  );
}

function FinePrint({ picture }: { picture: ServicePicture | null }) {
  const copy = messages(useLocale());
  return <p className="text-xs leading-5 text-muted-foreground">{copy.fine(picture)}</p>;
}
