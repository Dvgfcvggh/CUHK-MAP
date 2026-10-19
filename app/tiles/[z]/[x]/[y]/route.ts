import { connection } from "next/server";
import { OSM_TILE_REFERER, OSM_TILE_USER_AGENT, osmTileUrl, parseTilePath, subdomainOrder } from "@/lib/osm-tiles";

const TILE_CACHE = "public, max-age=604800, s-maxage=604800, stale-while-revalidate=86400";

async function fetchOsmTile(url: string): Promise<Response | null> {
  try {
    return await fetch(url, {
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(8000),
      headers: {
        "User-Agent": OSM_TILE_USER_AGENT,
        Referer: OSM_TILE_REFERER,
        Accept: "image/png,image/*;q=0.8",
      },
    });
  } catch {
    return null;
  }
}

function empty(status: number): Response {
  return new Response(null, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ z: string; x: string; y: string }> },
): Promise<Response> {
  await connection();
  const { z: zRaw, x: xRaw, y: yRaw } = await context.params;
  const tile = parseTilePath(zRaw, xRaw, yRaw);
  if (!tile) return empty(404);

  let lastStatus = 502;
  for (const subdomain of subdomainOrder(tile.z, tile.x, tile.y)) {
    const upstream = await fetchOsmTile(osmTileUrl(tile.z, tile.x, tile.y, subdomain));
    if (!upstream) continue;
    if (upstream.status >= 300 && upstream.status < 400) {
      lastStatus = 502;
      continue;
    }
    if (upstream.ok) {
      const type = upstream.headers.get("content-type") ?? "";
      if (!type.startsWith("image/")) {
        lastStatus = 502;
        continue;
      }
      const body = await upstream.arrayBuffer();
      if (body.byteLength === 0) {
        lastStatus = 502;
        continue;
      }
      return new Response(body, {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": TILE_CACHE,
          "CDN-Cache-Control": "public, s-maxage=604800, stale-while-revalidate=86400",
        },
      });
    }
    lastStatus = upstream.status;
    if (upstream.status === 429 || upstream.status === 403 || upstream.status >= 500) continue;
    break;
  }

  return empty(lastStatus === 429 || lastStatus === 403 ? 502 : lastStatus);
}
