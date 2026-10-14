import { nominatimSearchUrl, type GeocodeArea } from "@/lib/geocode";

type NominatimHit = { lat?: string; lon?: string };

async function firstHit(query: string, area: GeocodeArea): Promise<{ lat: number; lng: number } | null> {
  const response = await fetch(nominatimSearchUrl(query, area), {
    headers: {
      "User-Agent": "cuhk-campus-bus/0.1 (campus shuttle planner)",
      Accept: "application/json",
      "Accept-Language": "zh-Hans,zh;q=0.9",
    },
    cache: "no-store",
  });
  if (!response.ok) return null;
  const hits = (await response.json()) as NominatimHit[];
  const lat = Number(hits[0]?.lat);
  const lng = Number(hits[0]?.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (!query) return Response.json({ found: false });

  try {
    const hit = (await firstHit(query, "campus")) ?? (await firstHit(query, "hongkong"));
    if (!hit) return Response.json({ found: false });
    return Response.json({ found: true, lat: hit.lat, lng: hit.lng });
  } catch {
    return Response.json({ found: false });
  }
}
