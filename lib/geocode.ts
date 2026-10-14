/**
 * Nominatim search, no API key.
 * Nominatim files Hong Kong under China, so countrycodes=hk returns nothing.
 * Prefer the campus box, then the rest of Hong Kong. bounded=1 on each box
 * keeps a Shenzhen hit named like a Hong Kong place from winning.
 */

const CAMPUS_VIEWBOX = "114.195,22.433,114.218,22.408";
const HONG_KONG_VIEWBOX = "113.83,22.56,114.44,22.15";

export type GeocodeArea = "campus" | "hongkong";

export function nominatimSearchUrl(query: string, area: GeocodeArea): string {
  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    limit: "1",
    viewbox: area === "campus" ? CAMPUS_VIEWBOX : HONG_KONG_VIEWBOX,
    bounded: "1",
  });
  return `https://nominatim.openstreetmap.org/search?${params}`;
}
