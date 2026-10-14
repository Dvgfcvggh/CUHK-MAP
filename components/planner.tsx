"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CampusMap } from "@/components/campus-map";
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
import { advise, formatWait, isShortTrip, walkingBeatsBus, type BusOption, type TripAdvice } from "@/lib/recommend";
import { ROUTES, TERM_LABEL, routeWhen, servicePicture, timetableLabel, type ServicePicture } from "@/lib/routes";
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

export function Planner() {
  const [start, setStart] = useState<Point | null>(null);
  const [end, setEnd] = useState<Point | null>(null);
  const [mode, setMode] = useState<PickMode>("start");
  const [locating, setLocating] = useState(false);
  const [locationNote, setLocationNote] = useState<string | null>(null);
  const [placeQuery, setPlaceQuery] = useState("");
  const [placeMatches, setPlaceMatches] = useState<Point[]>([]);
  const [placeNote, setPlaceNote] = useState<string | null>(null);
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
    setPlaceNote(pickedMode === "start" ? "没有找到这个地点，起点没改。" : "没有找到这个地点，终点没改。");
  }

  async function lookupPlace() {
    const text = placeQuery.trim();
    const pickedMode = mode;
    if (!text) {
      setPlaceMatches([]);
      setPlaceNote("请先输入地点。");
      return;
    }
    const found = searchPlaces(text);
    if (found.length === 1) {
      assignLookup(found[0], pickedMode, !end, !start);
      return;
    }
    if (found.length > 1) {
      setPlaceMatches(found);
      setPlaceNote("找到多个地点，点一个用上。");
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
      setLocationNote("没有拿到位置，起点没改。");
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
          setLocationNote("没有拿到位置，起点没改。");
          return;
        }
        setStart(currentPositionPoint(lat, lng));
        if (!endRef.current) setMode("end");
      },
      (error) => {
        locatingRef.current = false;
        setLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationNote("没有定位权限，起点没改。");
          return;
        }
        if (error.code === error.TIMEOUT) {
          setLocationNote("定位超时，起点没改。");
          return;
        }
        setLocationNote("没有拿到位置，起点没改。");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }

  const highlighted = advice && "bus" in advice ? advice.bus : undefined;
  const boardId = highlighted?.board.id;
  const alightId = highlighted?.alight.id;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-5 pb-16 sm:py-8">
      <header className="flex max-w-[65ch] flex-col gap-3">
        <h1 className="font-heading text-balance text-[1.75rem] leading-8 font-semibold tracking-normal text-foreground sm:text-[2rem] sm:leading-9">
          中大穿梭校巴
        </h1>
        <p className="text-sm leading-6 text-muted-foreground sm:text-base">
          {TERM_LABEL}。班次是静态时刻表，非实时，以交通处为准。按香港时间区分上课日、晚间和假日。选出起点和终点，看该乘哪一路、在哪一站上、在哪一站下。
        </p>
      </header>

      <StopRow selectedId={mode === "start" ? start?.id : end?.id} onPick={choose} />

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:gap-6">
        <div className="lg:sticky lg:top-4">
          <div className="h-60 sm:h-80 lg:h-[calc(100dvh-16.5rem)]">
            <CampusMap start={start} end={end} boardId={boardId} alightId={alightId} onPick={choose} />
          </div>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            灰点是校巴站 · 绿点起点 · 红点终点 · OpenStreetMap
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>起点和终点</CardTitle>
              <CardDescription>
                {mode === "start" ? "现在点地图或地点，会记成起点。" : "现在点地图或地点，会记成终点。"}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-[#e4e6ea] p-1" role="group" aria-label="起点或终点">
                <Button
                  className={cn(tap, mode === "start" ? segmentOn : segmentOff)}
                  variant="ghost"
                  onClick={() => setMode("start")}
                >
                  设置起点
                </Button>
                <Button
                  className={cn(tap, mode === "end" ? segmentOn : segmentOff)}
                  variant="ghost"
                  onClick={() => setMode("end")}
                >
                  设置终点
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
                  placeholder="输入地点名称"
                  aria-label="地点名称"
                  className="h-11 min-h-11 min-w-0 flex-1 rounded-lg border border-input bg-card px-3.5 text-base text-foreground outline-none transition-[border-color,outline-color] duration-150 ease-[cubic-bezier(0.2,0,0,1)] placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                />
                <Button type="submit" variant="outline" className={tap} disabled={lookingUp}>
                  {lookingUp ? "正在查找…" : "定位"}
                </Button>
              </form>
              {placeMatches.length > 1 ? (
                <div className="flex flex-wrap gap-2">
                  {placeMatches.map((place) => (
                    <Button key={place.id} type="button" variant="outline" className={tap} onClick={() => choose(place)}>
                      {place.name}
                    </Button>
                  ))}
                </div>
              ) : null}
              {placeNote ? (
                <StatusNote tone={placeNote === "找到多个地点，点一个用上。" ? "hint" : "error"}>{placeNote}</StatusNote>
              ) : null}
              <Button variant="outline" className={tap} onClick={locateStart} disabled={locating}>
                {locating ? "正在定位…" : "使用当前位置"}
              </Button>
              {locationNote ? <StatusNote tone="error">{locationNote}</StatusNote> : null}
              <SelectionRow label="起点" point={start} onClear={() => setStart(null)} />
              <SelectionRow label="终点" point={end} onClear={() => setEnd(null)} />
              <p className="text-sm leading-6 text-muted-foreground">
                {picture
                  ? picture.summary
                  : "正在读取香港时间。上课日、晚间和假日都按这个时间决定，不用手动切换。"}
              </p>
            </CardContent>
          </Card>

          <ResultCard start={start} end={end} advice={advice} picture={picture} />
        </div>
      </div>

      <section className="flex flex-col border-t border-border pt-10">
        <h2 className="font-heading text-xl leading-7 font-semibold tracking-normal">收录的路线</h2>
        <p className="mt-2 max-w-[65ch] text-sm leading-6 text-muted-foreground">
          整理自交通处穿梭校巴和转堂校巴页面（2026 年 10 月）。收费小巴不在这里。校巴是中大学生和教职员专车。
        </p>
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
                  {route.name}
                  <span className="ml-2 text-sm font-normal text-muted-foreground">{routeWhen(route)}</span>
                </span>
                <span className="mt-1 block text-sm leading-5 text-muted-foreground tabular-nums">{timetableLabel(route)}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-5 max-w-[65ch] text-xs leading-5 text-muted-foreground">
          星期一至六（公众假期除外）的晚间按 N 线 19:00–23:30，没有单独开关。星期日和香港公众假期走假日线 H。转堂校巴 5、6A、6B、7 只在星期一至五的时段里建议，星期六不开。步行时间按校园分区估算。出处：
          <a
            className="text-primary underline underline-offset-4 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            href="https://transport.cuhk.edu.hk/"
            target="_blank"
            rel="noopener noreferrer"
          >
            香港中文大学交通处
          </a>
          。
        </p>
      </section>
    </div>
  );
}

function SelectionRow({
  label,
  point,
  onClear,
}: {
  label: string;
  point: Point | null;
  onClear: () => void;
}) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-3 border-t border-border pt-3">
      <p className="text-sm leading-6">
        <span className="text-muted-foreground">{label}</span>
        <span className="mx-2 text-muted-foreground">·</span>
        <span className="font-medium">{point ? point.name : "还没选"}</span>
      </p>
      {point ? (
        <Button variant="ghost" className="h-11 min-h-11 px-3" onClick={onClear}>
          清除
        </Button>
      ) : null}
    </div>
  );
}

const stopRowPlaces = [...commonPlaces(), ...otherStops()];

function StopRow({ selectedId, onPick }: { selectedId?: string; onPick: (point: Point) => void }) {
  const [open, setOpen] = useState(false);
  const [limit, setLimit] = useState(stopRowPlaces.length);
  const [ready, setReady] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) return;
    const row = rowRef.current;
    const parent = row?.parentElement;
    if (!row || !parent) return;

    let lastWidth = -1;
    const measure = () => {
      const width = parent.clientWidth;
      if (width === lastWidth) return;
      lastWidth = width;
      const chips = [...row.querySelectorAll<HTMLElement>("[data-stop]")];
      if (chips.length === 0) return;
      chips.forEach((chip) => chip.classList.remove("hidden"));
      const firstTop = chips[0].offsetTop;
      let count = chips.length;
      for (let i = 0; i < chips.length; i += 1) {
        if (chips[i].offsetTop > firstTop + 1) {
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
    observer.observe(parent);
    return () => observer.disconnect();
  }, [open]);

  return (
    <section className="flex items-start gap-2" aria-label="站点">
      <div
        id="campus-stops"
        ref={rowRef}
        className={cn(
          "flex min-w-0 flex-1 flex-wrap gap-2",
          !open && !ready && "max-h-11 overflow-hidden",
        )}
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
              {place.name}
            </Button>
          );
        })}
      </div>
      <Button
        type="button"
        variant="outline"
        className={cn(tap, "shrink-0")}
        aria-expanded={open}
        aria-controls="campus-stops"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? "收起" : "展开"}
      </Button>
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
  if (!start || !end) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>还没选好</CardTitle>
          <CardDescription>先选定起点和终点。可以点地图，也可以从上面的地点里选。</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-muted-foreground">
            选好两处之后，这里会告诉你乘哪一路，或者直接走路。要步行时先选一个地图再打开。
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!advice) {
    return (
      <Card aria-busy="true">
        <CardHeader>
          <CardTitle>正在对时刻表</CardTitle>
          <CardDescription>按香港时间看下一班大概几点开出。</CardDescription>
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
          <CardTitle className={answerTitle}>起点和终点是同一个地方</CardTitle>
          <CardDescription className={answerLead}>不用乘车。换一个终点再看。</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (advice.status === "walk" && advice.because === "short") {
    const meters = Math.round(distanceMeters(start.lat, start.lng, end.lat, end.lng));
    return (
      <Card>
        <CardHeader>
          <CardTitle className={answerTitle}>走过去就好</CardTitle>
          <CardDescription className={answerLead}>
            从{start.name}到{end.name}大约 {advice.directMin} 分钟，直线大约 {meters} 米，不超过 500 米。这段路没有更合适的校巴。
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <WalkChoices title="选择地图步行" origin={start} destination={end} />
          {fine}
        </CardContent>
      </Card>
    );
  }

  if (advice.status === "bus") {
    const title = advice.bus.special
      ? `建议乘转堂校巴 ${advice.bus.routeId}`
      : `建议乘 ${advice.bus.routeId} 号线`;
    const mentionWalk = walkingBeatsBus(advice.directMin, advice.bus) || isShortTrip(start, end);
    return (
      <Card>
        <CardHeader>
          <CardTitle className={answerTitle}>{title}</CardTitle>
          <CardDescription className={answerLead}>
            {advice.bus.routeName}。{advice.bus.timetable}。全程大约 {advice.bus.total} 分钟，含走到车站和等车。直接走大约{" "}
            {advice.directMin} 分钟。
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <TripNotes start={start} end={end} directMin={advice.directMin} bus={advice.bus} />
          <BusDetail bus={advice.bus} />
          <WalkChoices title="步行到上车站" origin={start} destination={advice.bus.board} />
          {/* This leg starts at the alighting stop, not the campus center or the user's start. */}
          <WalkChoices title="从下车站步行到终点" origin={advice.bus.alight} destination={end} />
          {mentionWalk ? <WalkChoices title="选择地图步行" origin={start} destination={end} /> : null}
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
          <CardTitle className={answerTitle}>现在等不到合适的班次</CardTitle>
          <CardDescription className={answerLead}>
            {ended
              ? `${advice.bus.routeId} 号线今天的班次已经过了末班，或还没到你要坐的那一班。`
              : `${advice.bus.routeId} 号线下一班是 ${advice.bus.departLabel}，还要等 ${advice.bus.wait} 分钟，太久了。`}
            先步行大约 {advice.directMin} 分钟。
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <TripNotes start={start} end={end} directMin={advice.directMin} bus={advice.bus} />
          <BusDetail bus={advice.bus} compact />
          <WalkChoices title="步行到上车站" origin={start} destination={advice.bus.board} />
          <WalkChoices title="从下车站步行到终点" origin={advice.bus.alight} destination={end} />
          <WalkChoices title="选择地图步行" origin={start} destination={end} />
          {fine}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className={answerTitle}>没有顺路的校巴</CardTitle>
        <CardDescription className={answerLead}>
          穿梭校巴只沿固定方向开，{start.name}到{end.name}没有顺路班次。步行大约 {advice.directMin} 分钟。
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <WalkChoices title="选择地图步行" origin={start} destination={end} />
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
  const faster = walkingBeatsBus(directMin, bus);
  const short = isShortTrip(start, end);
  if (!faster && !short) return null;
  const meters = Math.round(distanceMeters(start.lat, start.lng, end.lat, end.lng));
  const saved = bus.total != null ? bus.total - directMin : 0;
  return (
    <div className="flex flex-col gap-2">
      {faster ? (
        <div className="rounded-lg border border-border px-3 py-2">
          <p className="text-base font-semibold">步行更快</p>
          <p className="text-sm leading-6 text-muted-foreground">
            从{start.name}走到{end.name}大约 {directMin} 分钟，比这路校巴少 {saved} 分钟。
          </p>
        </div>
      ) : null}
      {short ? (
        <p className="text-sm leading-6 text-muted-foreground">
          走过去就好。直线大约 {meters} 米，不超过 500 米。
        </p>
      ) : null}
    </div>
  );
}

function BusDetail({ bus, compact = false }: { bus: BusOption; compact?: boolean }) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-3">
        <Badge
          className="size-8 rounded-md px-0 text-sm font-semibold tabular-nums"
          style={{ background: bus.color, color: inkFor(bus.color) }}
        >
          {bus.routeId}
        </Badge>
        <span className="text-base font-semibold">{bus.routeName}</span>
      </div>
      <ol className="mt-3 divide-y divide-border border-t border-border">
        <li className="flex flex-col gap-0.5 py-2.5">
          <span className="text-sm text-muted-foreground">上车</span>
          <span className="text-base font-medium">{bus.board.name}</span>
          <span className="text-sm text-muted-foreground tabular-nums">走到车站约 {bus.walkIn} 分钟</span>
        </li>
        <li className="flex flex-col gap-0.5 py-2.5">
          <span className="text-sm text-muted-foreground">下车</span>
          <span className="text-base font-medium">{bus.alight.name}</span>
          <span className="text-sm text-muted-foreground tabular-nums">下车后再走约 {bus.walkOut} 分钟</span>
        </li>
      </ol>
      <CloseStopNotes board={bus.board} alight={bus.alight} />
      {!compact ? (
        <p className="mt-3 text-sm leading-6 tabular-nums">
          车程约 {bus.ride} 分钟，中途大约 {Math.max(0, bus.hops - 1)} 站。
          {bus.departLabel ? ` 下一班 ${bus.departLabel}，${formatWait(bus.wait ?? 0)}。` : " 今天没有更晚的班次。"}
        </p>
      ) : null}
      <p className="mt-2 text-xs leading-5 text-muted-foreground tabular-nums">{bus.timetable}</p>
      {bus.special ? <p className="mt-1 text-xs leading-5 text-muted-foreground">转堂校巴只在上面这个时段内开。</p> : null}
      {bus.remarks.map((remark) => (
        <p key={remark} className="mt-1 text-xs leading-5 text-muted-foreground">
          {remark}
        </p>
      ))}
      {bus.routeNote ? <p className="mt-1 text-xs leading-5 text-muted-foreground">{bus.routeNote}</p> : null}
    </div>
  );
}

function formatDistance(meters: number): string {
  if (meters < 10) return "不到 10 米";
  const rounded = Math.max(10, Math.round(meters / 10) * 10);
  return `约 ${rounded} 米`;
}

function CloseStopNotes({ board, alight }: { board: Point; alight: Point }) {
  const nearBoard = nearbyStops(board, 120);
  const nearAlight = nearbyStops(alight, 120);
  const between = distanceMeters(board.lat, board.lng, alight.lat, alight.lng);
  const pairClose = board.id !== alight.id && between <= 200;
  if (nearBoard.length === 0 && nearAlight.length === 0 && !pairClose) return null;

  return (
    <div className="mt-3 rounded-lg border border-[#f3d48a] bg-[#fef7e0] px-3 py-2 text-sm leading-6 text-[#7a4f01]">
      {nearBoard.map((item) => (
        <p key={`board-${item.stop.id}`}>
          上车站「{board.name}」附近{formatDistance(item.meters)}还有「{item.stop.name}」。请核对站名再上车。
        </p>
      ))}
      {nearAlight.map((item) => (
        <p key={`alight-${item.stop.id}`}>
          下车站「{alight.name}」附近{formatDistance(item.meters)}还有「{item.stop.name}」。请核对站名再下车。
        </p>
      ))}
      {pairClose ? (
        <p>
          上车的「{board.name}」和下车的「{alight.name}」相距{formatDistance(between)}，两站很近。
        </p>
      ) : null}
    </div>
  );
}

function WalkChoices({ title, origin, destination }: { title: string; origin: WalkEnd; destination: WalkEnd }) {
  if (!walkEndsApart(origin, destination)) {
    return (
      <div className="flex flex-col gap-2 border-t border-border pt-3" role="group" aria-label={title}>
        <p className="text-base font-medium">{title}</p>
        <p className="text-sm leading-6 text-muted-foreground">已经在这里</p>
      </div>
    );
  }
  const apps = walkApps(origin, destination);
  return (
    <div className="flex flex-col gap-2 border-t border-border pt-3" role="group" aria-label={title}>
      <p className="text-base font-medium">{title}</p>
      <p className="text-sm leading-6 text-muted-foreground">
        先选一个地图，再打开步行路线。如果某个地图打不开路线，可以尝试切换导航。
      </p>
      <div className="flex flex-wrap gap-2">
        {apps.map((app) => (
          <a
            key={app.id}
            className={cn(buttonVariants({ variant: "outline" }), tap)}
            href={app.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            {app.label}
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
  return (
    <p className="text-xs leading-5 text-muted-foreground">
      {picture ? picture.short : "按香港时间对时刻表。"}
      非实时，以交通处为准。步行时间是分区估计。
    </p>
  );
}
