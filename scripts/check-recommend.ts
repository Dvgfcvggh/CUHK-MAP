import { holidayInfo } from "../lib/hk-time";
import { CAMPUS_CENTER, currentPositionPoint, distanceMeters, nearbyStops, placeById, pointFromMap } from "../lib/places";
import { advise, hkDate } from "../lib/recommend";
import { servicePicture } from "../lib/routes";
import { walkApps } from "../lib/walk-links";
import type { TripAdvice } from "../lib/recommend";

function expect(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function routeOf(advice: TripAdvice): string | null {
  if ("bus" in advice && advice.bus) return advice.bus.routeId;
  return null;
}

const wedSoon = hkDate(2026, 10, 14, 10, 12);
const wedAfter = hkDate(2026, 10, 14, 10, 20);
const wedNa = hkDate(2026, 10, 14, 10, 14);
const wedMeet = hkDate(2026, 10, 14, 10, 22);
const wedBeforeMeet = hkDate(2026, 10, 14, 9, 0);
const wedEvening = hkDate(2026, 10, 14, 20, 10);
const sat = hkDate(2026, 10, 17, 10, 50);
const sun = hkDate(2026, 10, 18, 10, 50);
const nationalDay = hkDate(2026, 10, 1, 10, 50);

expect(holidayInfo(wedSoon).kind === "teaching", "14 Oct 2026 is a teaching Wednesday");
expect(holidayInfo(sat).kind === "saturday", "17 Oct 2026 is Saturday");
expect(holidayInfo(sun).kind === "sunday", "18 Oct 2026 is Sunday");
expect(holidayInfo(nationalDay).name === "国庆日", holidayInfo(nationalDay).name ?? "missing holiday");

const uphill = advise(placeById("univ-station"), placeById("area39-up"), wedSoon);
expect(uphill.status === "bus", `station to area 39 should take a bus, got ${uphill.status}`);
if (uphill.status === "bus") {
  expect(uphill.bus.routeId === "4" || uphill.bus.routeId === "8", uphill.bus.routeId);
}

const hop = advise(placeById("science"), placeById("srr"), wedSoon);
expect(hop.status === "walk" && hop.because === "short", `science to Shaw Hall should be a short walk, got ${hop.status}`);

const toSrr = advise(placeById("univ-station"), placeById("srr"), wedSoon);
expect(toSrr.status === "bus", `station to Shaw Hall should take the bus, got ${toSrr.status}`);
if (toSrr.status === "bus") {
  expect(toSrr.bus.total !== null && toSrr.bus.total - toSrr.directMin < 15, `saved ${toSrr.bus.total}-${toSrr.directMin}`);
  expect(toSrr.directMin > 0, "bus result still carries the direct walk time");
}

const walkMuchFaster = advise(placeById("yiap"), placeById("univ-station"), hkDate(2026, 10, 14, 10, 0));
expect(
  walkMuchFaster.status === "walk" && walkMuchFaster.because === "faster",
  `康本园 to 大学站 should stay 步行更快, got ${walkMuchFaster.status}`,
);
if (walkMuchFaster.status === "walk" && walkMuchFaster.bus?.total != null) {
  expect(walkMuchFaster.bus.total - walkMuchFaster.directMin >= 15, `save ${walkMuchFaster.bus.total - walkMuchFaster.directMin}`);
}

const same = advise(placeById("na"), placeById("na"), wedSoon);
expect(same.status === "same", "same place");

const toNa = advise(placeById("univ-station"), placeById("na"), wedSoon);
const toNaLater = advise(placeById("univ-station"), placeById("na"), wedAfter);
expect(toNa.status === "bus", `10:12 station to NA should catch the bus, got ${toNa.status}`);
if (toNa.status === "bus") {
  expect(toNa.bus.routeId === "2", `10:12 expected route 2, got ${toNa.bus.routeId}`);
  expect(toNa.bus.alight.name === "新亚书院", toNa.bus.alight.name);
}
expect(toNaLater.status === "bus", `10:20 station to NA should still use a bus, got ${toNaLater.status}`);
if (toNaLater.status === "bus") {
  expect(toNaLater.bus.routeId === "1", `10:20 expected route 1, got ${toNaLater.bus.routeId}`);
  expect(toNaLater.bus.alight.name === "邵逸夫堂", toNaLater.bus.alight.name);
}

const downhill = advise(placeById("na"), placeById("univ-station"), wedNa);
expect(downhill.status === "bus", `NA to station at 10:14 should be a bus, got ${downhill.status}`);
if (downhill.status === "bus") {
  expect(downhill.bus.routeId === "2", `expected route 2, got ${downhill.bus.routeId}`);
  expect(downhill.bus.board.name === "新亚书院", downhill.bus.board.name);
  expect(downhill.bus.alight.name === "大学站", downhill.bus.alight.name);
}

const holiday = advise(placeById("univ-station"), placeById("area39-up"), sun);
expect(holiday.status === "bus", `Sunday area 39 should use H, got ${holiday.status} ${routeOf(holiday)}`);
if (holiday.status === "bus") {
  expect(holiday.bus.routeId === "H", holiday.bus.routeId);
  expect(holiday.bus.timetable.includes("08:20–23:20"), holiday.bus.timetable);
}

expect(holidayInfo(sat).holiday === false, "an ordinary Saturday is not a holiday");
const saturday = advise(placeById("univ-station"), placeById("area39-up"), sat);
expect(saturday.status === "bus" && saturday.bus.routeId !== "H", `Saturday 10:50 must not use H, got ${routeOf(saturday)}`);
if (saturday.status === "bus") {
  expect(saturday.bus.routeId === "4" || saturday.bus.routeId === "8", saturday.bus.routeId);
}
expect(servicePicture(sat).short.includes("星期一至六"), servicePicture(sat).short);
expect(!servicePicture(sat).summary.includes("按假日线"), servicePicture(sat).summary);

const satEvening = advise(placeById("univ-station"), placeById("area39-up"), hkDate(2026, 10, 17, 20, 10));
expect(satEvening.status === "bus" && satEvening.bus.routeId === "N", `Saturday 20:10 should use N, got ${routeOf(satEvening)}`);
expect(servicePicture(hkDate(2026, 10, 17, 20, 10)).period === "evening", "Saturday evening is the N window");

const satHoliday = hkDate(2026, 4, 4, 10, 50);
expect(holidayInfo(satHoliday).kind === "public", "4 Apr 2026 is a Saturday public holiday");
const satHolidayTrip = advise(placeById("univ-station"), placeById("area39-up"), satHoliday);
expect(
  satHolidayTrip.status === "bus" && satHolidayTrip.bus.routeId === "H",
  `a Saturday public holiday should use H, got ${routeOf(satHolidayTrip)}`,
);

const publicHoliday = advise(placeById("univ-station"), placeById("area39-up"), nationalDay);
expect(
  publicHoliday.status === "bus" && publicHoliday.bus.routeId === "H",
  `National Day should use H, got ${routeOf(publicHoliday)}`,
);
expect(servicePicture(nationalDay).summary.includes("国庆日"), servicePicture(nationalDay).summary);

const evening = advise(placeById("univ-station"), placeById("area39-up"), wedEvening);
expect(evening.status === "bus" && evening.bus.routeId === "N", `20:10 should use N, got ${routeOf(evening)}`);
if (evening.status === "bus") {
  expect(evening.bus.timetable.includes("19:00–23:30"), evening.bus.timetable);
  expect(!evening.bus.special, "N is not a meet-class run");
}
expect(servicePicture(wedEvening).period === "evening", servicePicture(wedEvening).summary);

const meet = advise(placeById("shaw-up"), placeById("cwc-down"), wedMeet);
expect(meet.status === "bus" && meet.bus.routeId === "5", `10:22 Shaw up to CWC should be route 5, got ${routeOf(meet)}`);
if (meet.status === "bus") {
  expect(meet.bus.special, "route 5 is a special run");
  expect(meet.bus.timetable.includes("09:18–17:26"), meet.bus.timetable);
  expect(meet.bus.board.name === "逸夫书院（上行）", meet.bus.board.name);
  expect(meet.bus.alight.name === "敬文书院（下行）", meet.bus.alight.name);
}

const closeRide = advise(placeById("science"), placeById("cwc-down"), hkDate(2026, 10, 14, 10, 0));
expect(closeRide.status === "bus" && closeRide.bus.routeId === "3", `10:00 science to CWC should be route 3, got ${routeOf(closeRide)}`);
if (closeRide.status === "bus") {
  expect(closeRide.bus.board.name === "科学馆", closeRide.bus.board.name);
}

const tooEarly = advise(placeById("chung-chi"), placeById("cwc-down"), wedBeforeMeet);
expect(routeOf(tooEarly) !== "5", `09:00 is outside route 5, got ${routeOf(tooEarly)}`);

const satMeet = advise(placeById("shaw-up"), placeById("cwc-down"), hkDate(2026, 10, 17, 10, 22));
expect(routeOf(satMeet) !== "5" && routeOf(satMeet) !== "6A" && routeOf(satMeet) !== "6B" && routeOf(satMeet) !== "7", `Saturday must not recommend a meet-class bus, got ${routeOf(satMeet)}`);

const nearScience = nearbyStops(placeById("srr"), 120);
const science = nearScience.find((item) => item.stop.id === "science");
expect(Boolean(science), "邵逸夫堂 should warn about 科学馆");
expect(science !== undefined && science.meters < 120 && science.meters > 20, `distance ${science?.meters}`);
const srrGap = distanceMeters(
  placeById("srr").lat,
  placeById("srr").lng,
  placeById("science").lat,
  placeById("science").lng,
);
expect(srrGap <= 120, `SRR to science is ${srrGap}`);

const snapped = pointFromMap(placeById("science").lat + 0.0001, placeById("science").lng);
expect(snapped.id === "science", `click within 45m should snap, got ${snapped.id}`);
const free = pointFromMap(22.4, 114.19);
expect(free.kind === "pin", `a far click should stay a pin, got ${free.id}`);

const here = currentPositionPoint(22.5, 114.2);
expect(here.name === "当前位置", here.name);
expect(here.lat === 22.5 && here.lng === 114.2, "a GPS fix keeps its own coordinates");
expect(here.kind === "pin", here.kind);
const onStop = currentPositionPoint(placeById("science").lat, placeById("science").lng);
expect(onStop.name === "当前位置" && onStop.id !== "science", "current position does not snap to a stop");

const apps = walkApps(placeById("univ-station"), placeById("srr"));
expect(apps.map((app) => app.label).join(",") === "Google 地图,苹果地图,高德地图,腾讯地图,百度地图", apps.map((app) => app.label).join(","));
const google = apps.find((app) => app.id === "google");
const apple = apps.find((app) => app.id === "apple");
const amap = apps.find((app) => app.id === "amap");
const tencent = apps.find((app) => app.id === "tencent");
const baidu = apps.find((app) => app.id === "baidu");
expect(Boolean(google?.href.includes("3e2") && google.href.includes("0x0:0x0")), google?.href ?? "");
expect(Boolean(apple?.href.includes("dirflg=w")), apple?.href ?? "");
expect(Boolean(amap?.href.includes("mode=walk")), amap?.href ?? "");
expect(Boolean(tencent?.href.includes("type=walk")), tencent?.href ?? "");
expect(Boolean(baidu?.href.includes("mode=walking") && baidu.href.includes("coord_type=wgs84")), baidu?.href ?? "");
expect(!apps.some((app) => app.href.includes("BAIDU_MAP") || app.href.includes("ak=")), "walk links must not need a key");

function expectBothEnds(
  href: string,
  origin: { lat: number; lng: number; name: string },
  destination: { lat: number; lng: number; name: string },
  label: string,
  id: string,
) {
  const originPairs = [`${origin.lat.toFixed(6)},${origin.lng.toFixed(6)}`, `${origin.lng.toFixed(6)},${origin.lat.toFixed(6)}`];
  const destPairs = [
    `${destination.lat.toFixed(6)},${destination.lng.toFixed(6)}`,
    `${destination.lng.toFixed(6)},${destination.lat.toFixed(6)}`,
  ];
  expect(originPairs.some((pair) => href.includes(pair)), `${label} missing origin coordinates in ${href}`);
  expect(destPairs.some((pair) => href.includes(pair)), `${label} missing destination coordinates in ${href}`);
  if (id === "google") {
    expect(href.includes(`!2m2!1d${origin.lng.toFixed(6)}!2d${origin.lat.toFixed(6)}`), `${label} origin pin ${href}`);
    expect(href.includes(`!2m2!1d${destination.lng.toFixed(6)}!2d${destination.lat.toFixed(6)}`), `${label} destination pin ${href}`);
    expect(!href.includes("api=1"), `${label} must not use the snapping directions API ${href}`);
    expect(!href.includes(encodeURIComponent(origin.name)), `${label} must not send the origin name ${href}`);
    expect(!href.includes(encodeURIComponent(destination.name)), `${label} must not send the destination name ${href}`);
    return;
  }
  expect(href.includes(encodeURIComponent(origin.name)), `${label} missing origin name in ${href}`);
  expect(href.includes(encodeURIComponent(destination.name)), `${label} missing destination name in ${href}`);
}

for (const app of apps) {
  expectBothEnds(app.href, placeById("univ-station"), placeById("srr"), app.label, app.id);
}

const chungChi = placeById("chung-chi");
const sciencePlace = placeById("science");
const googleToScience = walkApps(chungChi, sciencePlace).find((app) => app.id === "google");
expect(Boolean(googleToScience?.href.includes("0x0:0x0") && googleToScience.href.endsWith("3e2")), googleToScience?.href ?? "");

const legTrip = advise(placeById("univ-station"), placeById("library"), wedSoon);
expect(legTrip.status === "bus", `station to library should be a bus so both walk legs differ, got ${legTrip.status}`);
if (legTrip.status === "bus") {
  const start = placeById("univ-station");
  const end = placeById("library");
  expect(legTrip.bus.board.id !== start.id, "boarding stop should not be the start");
  expect(legTrip.bus.alight.id !== end.id, "alighting stop should not be the end");
  for (const app of walkApps(start, legTrip.bus.board)) {
    expectBothEnds(app.href, start, legTrip.bus.board, `步行到上车站 ${app.label}`, app.id);
  }
  for (const app of walkApps(legTrip.bus.alight, end)) {
    expectBothEnds(app.href, legTrip.bus.alight, end, `从下车站步行到终点 ${app.label}`, app.id);
  }
  const alightGoogle = walkApps(legTrip.bus.alight, end).find((app) => app.id === "google");
  const campusPin = `${CAMPUS_CENTER.lat.toFixed(6)},${CAMPUS_CENTER.lng.toFixed(6)}`;
  expect(alightGoogle?.href.includes(`${legTrip.bus.alight.lat.toFixed(6)},${legTrip.bus.alight.lng.toFixed(6)}`), alightGoogle?.href ?? "");
  expect(!alightGoogle?.href.includes(campusPin), `alight leg must not start at the campus center ${alightGoogle?.href}`);
  expect(!alightGoogle?.href.includes(`${start.lat.toFixed(6)},${start.lng.toFixed(6)}`), "alight leg must not start at the chosen start");
  console.log("google 下车站 → 终点", legTrip.bus.alight.name, "→", end.name, alightGoogle?.href);
}

console.log("recommend checks passed");
if (toSrr.status === "bus") {
  console.log("bus", "大学站 → 邵逸夫堂", toSrr.bus.routeId, `total ${toSrr.bus.total} walk ${toSrr.directMin}`);
}
if (walkMuchFaster.status === "walk") {
  console.log(
    "walk faster",
    "康本园 → 大学站",
    walkMuchFaster.directMin,
    "vs",
    walkMuchFaster.bus?.total,
  );
}
console.log("evening", routeOf(evening), evening.status === "bus" ? evening.bus.timetable : "");
console.log("saturday", routeOf(saturday));
console.log("special", routeOf(meet), meet.status === "bus" ? meet.bus.timetable : "");
console.log("close pair 邵逸夫堂–科学馆", Math.round(srrGap), "m");
