"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { Bus, Footprints } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CampusMap } from "@/components/campus-map";
import { distanceMeters, commonPlaces, nearbyStops, otherStops, type Point } from "@/lib/places";
import { advise, formatWait, type BusOption, type TripAdvice } from "@/lib/recommend";
import { ROUTES, TERM_LABEL, routeWhen, servicePicture, timetableLabel, type ServicePicture } from "@/lib/routes";
import { walkApps, type WalkEnd } from "@/lib/walk-links";
import { cn } from "@/lib/utils";

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
  const nowMs = useSyncExternalStore(subscribeClock, getClockSnapshot, getServerClock);
  const picture = nowMs === 0 ? null : servicePicture(new Date(nowMs));

  const advice = useMemo<TripAdvice | null>(() => {
    if (!start || !end || nowMs === 0) return null;
    return advise(start, end, new Date(nowMs));
  }, [start, end, nowMs]);

  function choose(point: Point) {
    if (mode === "start") {
      setStart(point);
      if (!end) setMode("end");
      return;
    }
    setEnd(point);
    if (!start) setMode("start");
  }

  const highlighted = advice && "bus" in advice ? advice.bus : undefined;
  const boardId = highlighted?.board.id;
  const alightId = highlighted?.alight.id;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 pb-16 sm:py-6">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-medium tracking-widest text-primary uppercase">香港中文大学</p>
        <h1 className="font-heading text-3xl text-foreground sm:text-4xl">中大穿梭校巴</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          {TERM_LABEL}。班次是静态时刻表，非实时，以交通处为准。按香港时间区分上课日、晚间和假日。选出起点和终点，看该乘哪一路、在哪一站上、在哪一站下。
        </p>
      </header>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <div className="h-[320px] sm:h-[420px] lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:min-h-[560px]">
          <CampusMap start={start} end={end} boardId={boardId} alightId={alightId} onPick={choose} />
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
              <div className="grid grid-cols-2 gap-2">
                <Button variant={mode === "start" ? "default" : "outline"} onClick={() => setMode("start")}>
                  设置起点
                </Button>
                <Button variant={mode === "end" ? "default" : "outline"} onClick={() => setMode("end")}>
                  设置终点
                </Button>
              </div>
              <SelectionRow label="起点" point={start} onClear={() => setStart(null)} />
              <SelectionRow label="终点" point={end} onClear={() => setEnd(null)} />
              <p className="text-sm leading-6 text-muted-foreground">
                {picture
                  ? picture.summary
                  : "正在读取香港时间。上课日、晚间和假日都按这个时间决定，不用手动切换。"}
              </p>
            </CardContent>
          </Card>

          <PlacePicker
            title="常用地点"
            places={commonPlaces()}
            selectedId={mode === "start" ? start?.id : end?.id}
            onPick={choose}
          />
          <PlacePicker
            title="其他校巴站"
            places={otherStops()}
            selectedId={mode === "start" ? start?.id : end?.id}
            onPick={choose}
          />

          <ResultCard start={start} end={end} advice={advice} picture={picture} />
        </div>
      </div>

      <Separator />
      <section className="grid gap-3">
        <h2 className="font-heading text-xl">收录的路线</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          整理自交通处穿梭校巴和转堂校巴页面（2026 年 10 月）。收费小巴不在这里。校巴是中大学生和教职员专车。
        </p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {ROUTES.map((route) => (
            <li key={route.id} className="flex items-start gap-3 rounded-xl bg-card px-3 py-3 ring-1 ring-foreground/10">
              <span
                className="mt-0.5 inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-semibold text-white"
                style={{ background: route.color }}
              >
                {route.id}
              </span>
              <span>
                <span className="block text-sm font-medium">
                  {route.name}
                  <span className="ml-2 font-normal text-muted-foreground">{routeWhen(route)}</span>
                </span>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground">{timetableLabel(route)}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="text-xs leading-5 text-muted-foreground">
          星期一至五的晚间按 N 线 19:00–23:30，没有单独开关。星期六、星期日和香港公众假期走假日线 H。转堂校巴 5、6A、6B、7 只在教学日的开行时段里建议。步行时间按校园分区估算。出处：
          <a className="underline" href="https://transport.cuhk.edu.hk/" target="_blank" rel="noopener noreferrer">
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
    <div className="flex items-center justify-between gap-3 rounded-lg bg-muted px-3 py-2">
      <p className="text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="mx-2 text-muted-foreground">·</span>
        <span className="font-medium">{point ? point.name : "还没选"}</span>
      </p>
      {point ? (
        <Button variant="ghost" size="sm" onClick={onClear}>
          清除
        </Button>
      ) : null}
    </div>
  );
}

function PlacePicker({
  title,
  places,
  selectedId,
  onPick,
}: {
  title: string;
  places: Point[];
  selectedId?: string;
  onPick: (point: Point) => void;
}) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-medium">{title}</h2>
      <div className="flex flex-wrap gap-2">
        {places.map((place) => {
          const selected = place.id === selectedId;
          return (
            <Button
              key={place.id}
              size="sm"
              variant={selected ? "default" : "outline"}
              className="h-9"
              onClick={() => onPick(place)}
            >
              {place.name}
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
      <Card>
        <CardHeader>
          <CardTitle>正在对时刻表</CardTitle>
          <CardDescription>按香港时间看下一班大概几点开出。</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const fine = <FinePrint picture={picture} />;

  if (advice.status === "same") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>起点和终点是同一个地方</CardTitle>
          <CardDescription>不用乘车。换一个终点再看。</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (advice.status === "walk" && advice.because === "short") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Footprints className="size-4" />
            走过去就好
          </CardTitle>
          <CardDescription>
            从{start.name}到{end.name}大约 {advice.directMin} 分钟，这段路不必等校巴。
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
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bus className="size-4" />
            {title}
          </CardTitle>
          <CardDescription>
            {advice.bus.routeName}。{advice.bus.timetable}。全程大约 {advice.bus.total} 分钟，含走到车站和等车。直接走大约{" "}
            {advice.directMin} 分钟。
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <BusDetail bus={advice.bus} />
          <WalkChoices title="步行到上车站" origin={start} destination={advice.bus.board} />
          <WalkChoices title="从下车站步行到终点" origin={advice.bus.alight} destination={end} />
          {fine}
        </CardContent>
      </Card>
    );
  }

  if (advice.status === "walk") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Footprints className="size-4" />
            步行更快
          </CardTitle>
          <CardDescription>
            从{start.name}走到{end.name}大约 {advice.directMin} 分钟。
            {advice.bus
              ? ` 乘 ${advice.bus.routeId} 号线含等车大约要 ${advice.bus.total} 分钟，省不下来。`
              : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {advice.bus ? <BusDetail bus={advice.bus} compact /> : null}
          <WalkChoices title="选择地图步行" origin={start} destination={end} />
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
          <CardTitle>现在等不到合适的班次</CardTitle>
          <CardDescription>
            {ended
              ? `${advice.bus.routeId} 号线今天的班次已经过了末班，或还没到你要坐的那一班。`
              : `${advice.bus.routeId} 号线下一班是 ${advice.bus.departLabel}，还要等 ${advice.bus.wait} 分钟，太久了。`}
            先步行大约 {advice.directMin} 分钟。
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <BusDetail bus={advice.bus} compact />
          <WalkChoices title="选择地图步行" origin={start} destination={end} />
          {fine}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>没有顺路的校巴</CardTitle>
        <CardDescription>
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

function BusDetail({ bus, compact = false }: { bus: BusOption; compact?: boolean }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-muted/70 p-3">
      <div className="flex items-center gap-2">
        <Badge style={{ background: bus.color, color: "#fff" }}>{bus.routeId}</Badge>
        <span className="text-sm font-medium">{bus.routeName}</span>
      </div>
      <ol className="grid gap-2 text-sm">
        <li>
          <span className="text-muted-foreground">上车</span> {bus.board.name}
          <span className="text-muted-foreground"> · 走到车站约 {bus.walkIn} 分钟</span>
        </li>
        <li>
          <span className="text-muted-foreground">下车</span> {bus.alight.name}
          <span className="text-muted-foreground"> · 下车后再走约 {bus.walkOut} 分钟</span>
        </li>
      </ol>
      <CloseStopNotes board={bus.board} alight={bus.alight} />
      {!compact ? (
        <p className="text-sm leading-6">
          车程约 {bus.ride} 分钟，中途大约 {Math.max(0, bus.hops - 1)} 站。
          {bus.departLabel ? ` 下一班 ${bus.departLabel}，${formatWait(bus.wait ?? 0)}。` : " 今天没有更晚的班次。"}
        </p>
      ) : null}
      <p className="text-xs leading-5 text-muted-foreground">{bus.timetable}</p>
      {bus.special ? <p className="text-xs leading-5 text-muted-foreground">转堂校巴只在上面这个时段内开。</p> : null}
      {bus.remarks.map((remark) => (
        <p key={remark} className="text-xs leading-5 text-muted-foreground">
          {remark}
        </p>
      ))}
      {bus.routeNote ? <p className="text-xs leading-5 text-muted-foreground">{bus.routeNote}</p> : null}
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
    <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-950">
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
  const apps = walkApps(origin, destination);
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-muted/50 p-3" role="group" aria-label={title}>
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs leading-5 text-muted-foreground">先选一个地图，再打开步行路线。</p>
      <div className="flex flex-wrap gap-2">
        {apps.map((app) => (
          <a
            key={app.id}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-9")}
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

function FinePrint({ picture }: { picture: ServicePicture | null }) {
  return (
    <p className="text-xs leading-5 text-muted-foreground">
      {picture ? picture.short : "按香港时间对时刻表。"}
      非实时，以交通处为准。步行时间是分区估计。
    </p>
  );
}
