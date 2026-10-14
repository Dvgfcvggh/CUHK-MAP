/**
 * Campus places and walk times.
 * Coordinates come from OpenStreetMap via Nominatim (October 2026),
 * preferring nodes tagged as bus stops. Walk minutes are campus-zone
 * estimates, not straight-line distance.
 */

export type Zone =
  | "station"
  | "lower"
  | "central"
  | "na"
  | "uc"
  | "west"
  | "east"
  | "hill";

export type PointKind = "stop" | "place" | "pin";

export type Point = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  zone: Zone;
  kind: PointKind;
};

type CatalogPlace = Point & { kind: "stop" | "place" };

const INTRA: Record<Zone, number> = {
  station: 4,
  lower: 6,
  central: 6,
  na: 4,
  uc: 5,
  west: 5,
  east: 5,
  hill: 6,
};

/** Minutes between zones. Symmetric. Includes stairs and slopes. */
const MATRIX: Record<Zone, Record<Zone, number>> = {
  station: { station: 4, lower: 8, central: 18, na: 28, uc: 30, west: 32, east: 22, hill: 40 },
  lower: { station: 8, lower: 6, central: 12, na: 22, uc: 26, west: 28, east: 16, hill: 32 },
  central: { station: 18, lower: 12, central: 6, na: 10, uc: 14, west: 16, east: 10, hill: 22 },
  na: { station: 28, lower: 22, central: 10, na: 4, uc: 8, west: 12, east: 12, hill: 16 },
  uc: { station: 30, lower: 26, central: 14, na: 8, uc: 5, west: 6, east: 14, hill: 14 },
  west: { station: 32, lower: 28, central: 16, na: 12, uc: 6, west: 5, east: 14, hill: 12 },
  east: { station: 22, lower: 16, central: 10, na: 12, uc: 14, west: 14, east: 5, hill: 14 },
  hill: { station: 40, lower: 32, central: 22, na: 16, uc: 14, west: 12, east: 14, hill: 6 },
};

function place(
  id: string,
  name: string,
  lat: number,
  lng: number,
  zone: Zone,
  kind: "stop" | "place",
): CatalogPlace {
  return { id, name, lat, lng, zone, kind };
}

/**
 * Shuttle stops. Up/down pairs that OSM only marks once share that node.
 * 三、四苑 uses the bus stops OSM labels as 伍宜孙书院上/下行: they sit beside
 * University Residence 3, which is where this route actually stops.
 */
export const STOPS: CatalogPlace[] = [
  place("univ-station", "大学站", 22.412646, 114.210526, "station", "stop"),
  place("station-piazza", "大学站广场", 22.413801, 114.209619, "station", "stop"),
  place("yiap", "康本园", 22.415973, 114.210832, "lower", "stop"),
  place("chung-chi", "崇基教学楼", 22.416036, 114.208359, "lower", "stop"),
  place("sh-ho", "善衡书院", 22.418042, 114.20985, "lower", "stop"),
  place("sports", "大学体育中心", 22.417812, 114.210482, "lower", "stop"),
  place("srr", "邵逸夫堂", 22.419841, 114.206942, "central", "stop"),
  place("science", "科学馆", 22.41983, 114.207342, "central", "stop"),
  place("admin", "大学行政楼", 22.418798, 114.205528, "central", "stop"),
  place("fkh", "冯景禧楼", 22.419864, 114.203032, "central", "stop"),
  place("na", "新亚书院", 22.421271, 114.207559, "na", "stop"),
  place("na-circle", "新亚坊", 22.421446, 114.207329, "na", "stop"),
  place("uc-up", "联合书院（上行）", 22.42039, 114.205394, "uc", "stop"),
  place("uc-down", "联合书院（下行）", 22.420302, 114.205465, "uc", "stop"),
  place("res15", "十五苑", 22.423716, 114.206598, "west", "stop"),
  place("uc-staff", "联合苑", 22.423259, 114.20513, "west", "stop"),
  place("cch", "陈震夏宿舍", 22.421812, 114.204612, "west", "stop"),
  place("shaw-up", "逸夫书院（上行）", 22.422486, 114.201315, "east", "stop"),
  place("shaw-down", "逸夫书院（下行）", 22.422486, 114.201315, "east", "stop"),
  place("res34-up", "三、四苑（上行）", 22.421331, 114.203471, "east", "stop"),
  place("res34-down", "三、四苑（下行）", 22.421199, 114.203521, "east", "stop"),
  place("cc-east-up", "环回东站（上行）", 22.419282, 114.212973, "east", "stop"),
  place("cc-east-down", "环回东站（下行）", 22.419282, 114.212973, "east", "stop"),
  place("pgh1", "研究生宿舍一座", 22.420248, 114.212171, "east", "stop"),
  place("cwc-up", "敬文书院（上行）", 22.425557, 114.206218, "hill", "stop"),
  place("cwc-down", "敬文书院（下行）", 22.425557, 114.206218, "hill", "stop"),
  place("area39-up", "39区（上行）", 22.427631, 114.204351, "hill", "stop"),
  place("area39-down", "39区（下行）", 22.427631, 114.204351, "hill", "stop"),
  place("cc-north", "环回北站", 22.425628, 114.206373, "hill", "stop"),
];

/** Buildings that are not themselves a single shuttle stop. */
export const LANDMARKS: CatalogPlace[] = [
  place("uc-college", "联合书院", 22.421976, 114.205425, "uc", "place"),
  place("library", "大学图书馆", 22.419544, 114.204777, "central", "place"),
  place("shaw-college", "逸夫书院", 22.422995, 114.201462, "east", "place"),
  place("morningside", "晨兴书院", 22.419079, 114.210436, "lower", "place"),
  place("lee-woo", "和声书院", 22.422424, 114.204338, "east", "place"),
  place("wys", "伍宜孙书院", 22.4222, 114.202621, "east", "place"),
  place("cwc-college", "敬文书院", 22.425253, 114.206473, "hill", "place"),
];

const CATALOG: CatalogPlace[] = [...STOPS, ...LANDMARKS];

const BY_ID = new Map(CATALOG.map((item) => [item.id, item]));

export function placeById(id: string): Point {
  const found = BY_ID.get(id);
  if (!found) {
    throw new Error(`Unknown place: ${id}`);
  }
  return found;
}

export const COMMON_PLACE_IDS = [
  "univ-station",
  "station-piazza",
  "srr",
  "chung-chi",
  "na",
  "uc-college",
  "science",
  "library",
  "shaw-college",
  "sh-ho",
  "yiap",
  "uc-staff",
  "res15",
  "cch",
  "morningside",
  "lee-woo",
  "wys",
  "cwc-college",
  "pgh1",
] as const;

export function commonPlaces(): Point[] {
  return COMMON_PLACE_IDS.map((id) => placeById(id));
}

export function otherStops(): Point[] {
  const common = new Set<string>(COMMON_PLACE_IDS);
  return STOPS.filter((stop) => !common.has(stop.id));
}

export function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const r = 6371000;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lng2 - lng1) * Math.PI) / 180;
  const h = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * r * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Walk time by campus zone. A pair under 45 metres is treated as the same
 * curb (fixed 2 minutes), not scaled by the metre count.
 */
export function walkMinutes(a: Point, b: Point): number {
  if (a.id === b.id) return 0;
  if (distanceMeters(a.lat, a.lng, b.lat, b.lng) < 45) return 2;
  if (a.zone === b.zone) return INTRA[a.zone];
  return MATRIX[a.zone][b.zone];
}

export function pointFromMap(lat: number, lng: number): Point {
  let nearest = STOPS[0];
  let nearestMeters = Infinity;
  for (const stop of STOPS) {
    const meters = distanceMeters(lat, lng, stop.lat, stop.lng);
    if (meters < nearestMeters) {
      nearest = stop;
      nearestMeters = meters;
    }
  }
  if (nearestMeters <= 45) return nearest;

  let zonePoint = CATALOG[0];
  let zoneMeters = Infinity;
  for (const item of CATALOG) {
    const meters = distanceMeters(lat, lng, item.lat, item.lng);
    if (meters < zoneMeters) {
      zonePoint = item;
      zoneMeters = meters;
    }
  }
  return {
    id: `pin:${lat.toFixed(5)},${lng.toFixed(5)}`,
    name: "地图上的位置",
    lat,
    lng,
    zone: zonePoint.zone,
    kind: "pin",
  };
}

/** Other shuttle stops within `withinMeters`, nearest first. The point itself is left out. */
export function nearbyStops(
  point: { id: string; lat: number; lng: number },
  withinMeters: number,
): { stop: Point; meters: number }[] {
  return STOPS.filter((stop) => stop.id !== point.id)
    .map((stop) => ({
      stop,
      meters: distanceMeters(point.lat, point.lng, stop.lat, stop.lng),
    }))
    .filter((item) => item.meters <= withinMeters)
    .sort((a, b) => a.meters - b.meters);
}

export const CAMPUS_CENTER = { lat: 22.419, lng: 114.207 };
