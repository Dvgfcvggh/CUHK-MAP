import { messages, pictureText, placeLabel, routeLabel, routeWhenText, windowText } from "../lib/copy";
import { holidayInfo } from "../lib/hk-time";
import { nominatimSearchUrl } from "../lib/geocode";
import { campusTileSpan, parseTilePath, tileAllowed } from "../lib/osm-tiles";
import { CAMPUS_CENTER, currentPositionPoint, distanceMeters, nearbyStops, nearestStops, placeById, pointFromMap, searchPlaces, typedPin, walkMinutes } from "../lib/places";
import { advise, hkDate, isShortTrip, routeChoices, walkingBeatsBus } from "../lib/recommend";
import { ROUTES, routeWhen, servicePicture } from "../lib/routes";
import { walkApps, walkEndsApart } from "../lib/walk-links";
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
  expect(!walkingBeatsBus(toSrr.directMin, toSrr.bus), "a small gap must not count as 步行更快");
  expect(!isShortTrip(placeById("univ-station"), placeById("srr")), "station to Shaw Hall is over 500m");
  expect(toSrr.directMin > 0, "bus result still carries the direct walk time");
}

const yiap = placeById("yiap");
const station = placeById("univ-station");
const walkMuchFaster = advise(yiap, station, hkDate(2026, 10, 14, 10, 0));
expect(walkMuchFaster.status === "bus", `康本园 to 大学站 should still recommend a bus, got ${walkMuchFaster.status}`);
expect(isShortTrip(yiap, station), "康本园 to 大学站 is within 500m");
if (walkMuchFaster.status === "bus") {
  expect(walkingBeatsBus(walkMuchFaster.directMin, walkMuchFaster.bus), `save ${walkMuchFaster.bus.total}-${walkMuchFaster.directMin}`);
  expect(walkMuchFaster.bus.board.id === "yiap" && walkMuchFaster.bus.alight.id === "univ-station", "board and alight stay on the result");
  expect(!walkEndsApart(yiap, walkMuchFaster.bus.board), "boarding at the start is not a walk link");
  expect(!walkEndsApart(walkMuchFaster.bus.alight, station), "alighting at the end is not a walk link");
  expect(walkApps(yiap, walkMuchFaster.bus.board).length === 0, "same-point board leg must not build map links");
  expect(walkApps(walkMuchFaster.bus.alight, station).length === 0, "same-point alight leg must not build map links");
}

const chungChi = placeById("chung-chi");
const library = placeById("library");
const fasterFar = advise(chungChi, library, hkDate(2026, 10, 14, 10, 0));
expect(fasterFar.status === "bus", `崇基教学楼 to 大学图书馆 should still recommend a bus, got ${fasterFar.status}`);
expect(!isShortTrip(chungChi, library), "崇基教学楼 to 大学图书馆 is over 500m");
if (fasterFar.status === "bus") {
  expect(walkingBeatsBus(fasterFar.directMin, fasterFar.bus), `save ${fasterFar.bus.total}-${fasterFar.directMin}`);
  expect(fasterFar.bus.board.id === "chung-chi", fasterFar.bus.board.name);
  expect(!walkEndsApart(chungChi, fasterFar.bus.board), "already at the boarding stop");
  expect(walkApps(chungChi, fasterFar.bus.board).length === 0, "same-point board leg must not build map links");
  expect(walkEndsApart(fasterFar.bus.alight, library), "the alighting stop and the library are different points");
  expect(walkApps(fasterFar.bus.alight, library).length === 5, "alight leg keeps every map app");
}

const eastStop = placeById("cc-east-up");
const shawStop = placeById("shaw-up");
const eastApart = distanceMeters(eastStop.lat, eastStop.lng, shawStop.lat, shawStop.lng);
const eastWalk = walkMinutes(eastStop, shawStop);
expect(eastApart > 800, `east pair is ${eastApart} m`);
expect(eastWalk > 5 && eastWalk >= Math.ceil(eastApart / 50), `long same-zone walk stayed flat at ${eastWalk}`);
const liang = pointFromMap(22.422902, 114.2019341);
expect(liang.zone === "east" && liang.kind === "pin", `${liang.zone} ${liang.kind}`);
expect(walkMinutes(eastStop, liang) > 5, `pin to east station is ${walkMinutes(eastStop, liang)}`);
const fromYiap = advise(placeById("yiap"), liang, hkDate(2026, 10, 14, 10, 5));
expect(fromYiap.status === "bus", `康本园 to the east pin should still have a close bus, got ${fromYiap.status}`);
if (fromYiap.status === "bus") {
  expect(fromYiap.bus.alight.id === "shaw-up" || fromYiap.bus.alight.id === "shaw-down", fromYiap.bus.alight.name);
  expect(fromYiap.bus.walkOutMeters < 120, `alight leftover ${fromYiap.bus.walkOutMeters}`);
  expect(fromYiap.bus.alight.id !== "cc-east-up", "a kilometre-long leftover walk must not win");
}

const shortBus = advise(placeById("chung-chi"), placeById("science"), hkDate(2026, 10, 14, 10, 0));
expect(shortBus.status === "bus", `崇基教学楼 to 科学馆 should keep the bus under 500m, got ${shortBus.status}`);
expect(isShortTrip(placeById("chung-chi"), placeById("science")), "崇基教学楼 to 科学馆 is within 500m");
if (shortBus.status === "bus") {
  expect(!walkingBeatsBus(shortBus.directMin, shortBus.bus), "this short trip is not 15 minutes faster on foot");
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

const scienceHits = searchPlaces("科学馆");
expect(scienceHits.length === 1 && scienceHits[0].id === "science", scienceHits.map((item) => item.name).join(","));
const collegeHits = searchPlaces("书院");
expect(collegeHits.length > 1, `书院 should list several places, got ${collegeHits.length}`);
expect(searchPlaces("没有这个地方").length === 0, "unknown campus text has no local match");
const offCampus = typedPin(22.5, 114.3, "沙田站");
expect(offCampus.name === "沙田站" && offCampus.kind === "pin" && offCampus.lat === 22.5 && offCampus.lng === 114.3, "typed pin keeps the query and coordinates");
const campusGeocode = new URL(nominatimSearchUrl("沙田站", "campus"));
const hongKongGeocode = new URL(nominatimSearchUrl("沙田站", "hongkong"));
expect(campusGeocode.searchParams.get("q") === "沙田站", campusGeocode.search);
expect(campusGeocode.searchParams.get("bounded") === "1", campusGeocode.search);
expect(campusGeocode.searchParams.get("viewbox") === "114.195,22.433,114.218,22.408", campusGeocode.search);
expect(hongKongGeocode.searchParams.get("viewbox") === "113.83,22.56,114.44,22.15", hongKongGeocode.search);
expect(campusGeocode.searchParams.get("countrycodes") !== "hk", "countrycodes=hk returns nothing");
expect(!campusGeocode.searchParams.has("key") && !campusGeocode.search.includes("api_key"), "nominatim must not use an API key");

const apps = walkApps(placeById("univ-station"), placeById("srr"));
expect(apps.map((app) => app.label).join(",") === "苹果地图,高德地图,腾讯地图,百度地图,谷歌地图（有时无法正常使用）", apps.map((app) => app.label).join(","));
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

const ucDown = placeById("uc-down");
expect(walkApps(ucDown, ucDown).length === 0, "identical coordinates must not build a walk link");
expect(!walkEndsApart(ucDown, { ...ucDown, name: "同一点" }), "same coordinates are not apart");
const shawPair = [placeById("shaw-up"), placeById("shaw-down")] as const;
expect(walkApps(shawPair[0], shawPair[1]).length === 0, "shared stop coordinates must not build a walk link");
expect(walkApps(placeById("uc-up"), ucDown).length === 0, "ends within 15m must not build a walk link");
const directSame = advise(shawPair[0], shawPair[1], wedSoon);
expect(directSame.status === "walk" && directSame.because === "short", `same curb should say walk, got ${directSame.status}`);

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
  expect(Boolean(alightGoogle?.href.includes(`${legTrip.bus.alight.lat.toFixed(6)},${legTrip.bus.alight.lng.toFixed(6)}`)), alightGoogle?.href ?? "");
  expect(!alightGoogle?.href.includes(campusPin), `alight leg must not start at the campus center ${alightGoogle?.href}`);
  expect(!alightGoogle?.href.includes(`${start.lat.toFixed(6)},${start.lng.toFixed(6)}`), "alight leg must not start at the chosen start");
  console.log("google 下车站 → 终点", legTrip.bus.alight.name, "→", end.name, alightGoogle?.href);
}

console.log("recommend checks passed");
if (toSrr.status === "bus") {
  console.log("bus", "大学站 → 邵逸夫堂", toSrr.bus.routeId, `total ${toSrr.bus.total} walk ${toSrr.directMin}`);
}
if (walkMuchFaster.status === "bus") {
  console.log(
    "short and faster, bus stays",
    "康本园 → 大学站",
    walkMuchFaster.bus.routeId,
    `walk ${walkMuchFaster.directMin} bus ${walkMuchFaster.bus.total}`,
    walkMuchFaster.bus.board.name,
    "→",
    walkMuchFaster.bus.alight.name,
  );
}
if (fasterFar.status === "bus") {
  console.log(
    "faster over 500m, bus stays",
    "崇基教学楼 → 大学图书馆",
    fasterFar.bus.routeId,
    `walk ${fasterFar.directMin} bus ${fasterFar.bus.total}`,
    fasterFar.bus.board.name,
    "→",
    fasterFar.bus.alight.name,
  );
}
console.log("evening", routeOf(evening), evening.status === "bus" ? evening.bus.timetable : "");
console.log("saturday", routeOf(saturday));
console.log("special", routeOf(meet), meet.status === "bus" ? meet.bus.timetable : "");
console.log("close pair 邵逸夫堂–科学馆", Math.round(srrGap), "m");

const hans = messages("zh-Hans");
const hant = messages("zh-Hant");
const en = messages("en");
expect(hans.author === "作者 Dvgfcvggh" && hant.author === "作者 Dvgfcvggh" && en.author === "By Dvgfcvggh", en.author);
const stationToShaw = routeChoices(placeById("univ-station"), placeById("srr"), wedSoon);
expect(stationToShaw.length >= 1, "a running trip lists at least one route");
expect(new Set(stationToShaw.map((item) => item.routeId)).size === stationToShaw.length, "one option per route");
for (let index = 1; index < stationToShaw.length; index += 1) {
  expect((stationToShaw[index].total ?? 0) >= (stationToShaw[index - 1].total ?? 0), "choices are sorted by total time");
}
if (toSrr.status === "bus") {
  const recommended = stationToShaw.find((item) => item.routeId === toSrr.bus.routeId);
  expect(
    recommended?.board.id === toSrr.bus.board.id &&
      recommended.alight.id === toSrr.bus.alight.id &&
      recommended.total === toSrr.bus.total,
    `${recommended?.routeId} ${recommended?.board.id} ${recommended?.total}`,
  );
}
expect(hans.endsTitle === "起点和终点", hans.endsTitle);
expect(hant.endsTitle === "起點和終點", hant.endsTitle);
expect(en.endsTitle === "Start and end", en.endsTitle);
expect(hans.nearbyTitle === "最近三个校巴站" && hant.nearbyTitle === "最近三個校巴站" && en.nearbyTitle === "Three nearest bus stops", en.nearbyTitle);
expect(hans.routeStops === "沿线站点" && hant.routeStops === "沿線站點" && en.routeStops === "Stops in order", en.routeStops);
const gps = nearestStops(station.lat, station.lng, 3);
expect(gps.length === 3 && gps[0].stop.id === "univ-station", gps.map((item) => item.stop.id).join(","));
expect(gps[0].meters < 1 && gps[0].minutes === 2, `${gps[0].meters} ${gps[0].minutes}`);
expect(gps[1].meters >= gps[0].meters && gps[2].meters >= gps[1].meters, "nearest stops are sorted");
expect(hans.walkHint.startsWith("目前有bug。"), hans.walkHint);
expect(!hant.walkHint.includes("目前有bug"), hant.walkHint);
expect(en.walkHint === "If a map cannot open the route, try another one.", en.walkHint);
expect(hans.fineLive === "非实时，以交通处为准。", hans.fineLive);
expect(routeLabel("环回线", "en") === "环回线", "do not invent an English route name");
expect(routeLabel("环回线", "zh-Hant") === "環回線", routeLabel("环回线", "zh-Hant"));
expect(placeLabel(placeById("univ-station"), "en") === "大学站", "catalog has no English place name");
expect(placeLabel(placeById("univ-station"), "zh-Hant") === "大學站", placeLabel(placeById("univ-station"), "zh-Hant"));
const pin = currentPositionPoint(22.42, 114.2);
expect(pin.kind === "pin" && placeLabel(pin, "en") === pin.name && placeLabel(pin, "zh-Hant") === pin.name, "map pins keep their label");
const day = servicePicture(nationalDay);
expect(pictureText(day, "zh-Hans").summary === day.summary, "simplified service picture stays the original");
expect(pictureText(day, "zh-Hant").summary.includes("國慶日"), pictureText(day, "zh-Hant").summary);
expect(pictureText(day, "en").summary.includes("National Day") && pictureText(day, "en").summary.includes("假日线"), pictureText(day, "en").summary);
for (const route of ROUTES) {
  expect(routeWhenText(route, "zh-Hans") === routeWhen(route), `${route.id} ${routeWhenText(route, "zh-Hans")}`);
  expect(windowText(route, "zh-Hans") === route.windowLabel, `${route.id} window`);
}
expect(hans.app("google") === "谷歌地图（有时无法正常使用）", hans.app("google"));
expect(en.app("apple") === "Apple Maps" && en.app("google").startsWith("Google Maps"), en.app("google"));
const span = campusTileSpan(16);
expect(tileAllowed(16, span.x0 + 1, span.y0 + 1), "a campus tile is allowed");
expect(!tileAllowed(11, span.x0, span.y0), "zoom below the map is refused");
expect(!tileAllowed(20, span.x0, span.y0), "zoom above the map is refused");
expect(parseTilePath("16", "0", "0") === null, "tiles outside campus are refused");
expect(parseTilePath("16", String(span.x0 + 1), String(span.y0 + 1)) !== null, "campus path is accepted");
expect(parseTilePath("16", "../4", "1") === null, "tile path is not an open proxy");
