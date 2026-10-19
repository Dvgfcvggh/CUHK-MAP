import { CAMPUS_EAST, CAMPUS_NORTH, CAMPUS_SOUTH, CAMPUS_WEST, TILE_MAX_ZOOM, TILE_MIN_ZOOM } from "@/lib/campus-bounds";

/** One extra tile around the campus so Leaflet's edge padding still hits the proxy. */
const TILE_PAD = 1;

const SUBDOMAINS = ["a", "b", "c"] as const;

export const OSM_TILE_USER_AGENT = "cuhk-campus-bus/0.1 (+https://cuhkmap.vercel.app; campus shuttle map)";
export const OSM_TILE_REFERER = "https://cuhkmap.vercel.app/";

function lonToX(lng: number, zoom: number): number {
  return ((lng + 180) / 360) * 2 ** zoom;
}

function latToY(lat: number, zoom: number): number {
  const sine = Math.sin((lat * Math.PI) / 180);
  const y = 0.5 - Math.log((1 + sine) / (1 - sine)) / (4 * Math.PI);
  return y * 2 ** zoom;
}

export function campusTileSpan(zoom: number): { x0: number; x1: number; y0: number; y1: number } {
  const limit = 2 ** zoom;
  const x0 = Math.max(0, Math.floor(lonToX(CAMPUS_WEST, zoom)) - TILE_PAD);
  const x1 = Math.min(limit - 1, Math.floor(lonToX(CAMPUS_EAST, zoom)) + TILE_PAD);
  const y0 = Math.max(0, Math.floor(latToY(CAMPUS_NORTH, zoom)) - TILE_PAD);
  const y1 = Math.min(limit - 1, Math.floor(latToY(CAMPUS_SOUTH, zoom)) + TILE_PAD);
  return { x0, x1, y0, y1 };
}

export function tileAllowed(zoom: number, x: number, y: number): boolean {
  if (!Number.isInteger(zoom) || zoom < TILE_MIN_ZOOM || zoom > TILE_MAX_ZOOM) return false;
  if (!Number.isInteger(x) || !Number.isInteger(y)) return false;
  const span = campusTileSpan(zoom);
  return x >= span.x0 && x <= span.x1 && y >= span.y0 && y <= span.y1;
}

function plainIndex(value: string): number | null {
  if (!/^[0-9]+$/.test(value) || value.length > 7) return null;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) return null;
  return parsed;
}

/** Only z/x/y for campus tiles. Anything else is refused, so this is not an open proxy. */
export function parseTilePath(zRaw: string, xRaw: string, yRaw: string): { z: number; x: number; y: number } | null {
  const z = plainIndex(zRaw);
  const x = plainIndex(xRaw);
  const y = plainIndex(yRaw);
  if (z === null || x === null || y === null) return null;
  if (!tileAllowed(z, x, y)) return null;
  return { z, x, y };
}

export function osmTileUrl(z: number, x: number, y: number, subdomain: (typeof SUBDOMAINS)[number]): string {
  return `https://${subdomain}.tile.openstreetmap.org/${z}/${x}/${y}.png`;
}

export function subdomainOrder(z: number, x: number, y: number): (typeof SUBDOMAINS)[number][] {
  const start = Math.abs(x + y + z) % SUBDOMAINS.length;
  return [0, 1, 2].map((step) => SUBDOMAINS[(start + step) % SUBDOMAINS.length]);
}
