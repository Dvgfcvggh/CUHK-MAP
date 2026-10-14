import { distanceMeters } from "@/lib/places";

/**
 * Walking handoff. No API keys.
 * Both ends are WGS84. Coordinates decide the route; a name is only a label.
 * A leg whose ends are the same point, or within 15 metres, is not a route.
 * Callers should say 已经在这里 and must not open a map for that pair.
 * Google's directions API snaps a campus coordinate to a nearby place, often
 * "The Chinese University of Hong Kong", so the alighting stop is lost.
 * A path of loc:lat,lng is searched as the word "loc". Instead each end is a
 * dropped pin: place id 0x0:0x0 plus longitude then latitude, and 3e2 is walking.
 * Apple keeps name@lat,lng, where the coordinate after @ is the place.
 * Amap puts lng,lat before the name. Tencent routes on fromcoord/tocoord.
 * Baidu prefers latlng over name. Those four still carry both.
 * Baidu is told the coordinates are WGS84 with coord_type=wgs84.
 */

export type WalkEnd = { lat: number; lng: number; name: string };

export type WalkApp = {
  id: "google" | "apple" | "amap" | "tencent" | "baidu";
  label: string;
  href: string;
};

/** Ends this close are the same curb. Do not build a walking link. */
export const SAME_WALK_METERS = 15;

function coord(value: number): string {
  return value.toFixed(6);
}

function sameCoordinates(origin: WalkEnd, destination: WalkEnd): boolean {
  return coord(origin.lat) === coord(destination.lat) && coord(origin.lng) === coord(destination.lng);
}

/** False when the two ends are one point, or within SAME_WALK_METERS. */
export function walkEndsApart(origin: WalkEnd, destination: WalkEnd): boolean {
  if (sameCoordinates(origin, destination)) return false;
  return distanceMeters(origin.lat, origin.lng, destination.lat, destination.lng) > SAME_WALK_METERS;
}

export function walkApps(origin: WalkEnd, destination: WalkEnd): WalkApp[] {
  if (!walkEndsApart(origin, destination)) return [];
  const oLat = coord(origin.lat);
  const oLng = coord(origin.lng);
  const dLat = coord(destination.lat);
  const dLng = coord(destination.lng);
  const oName = encodeURIComponent(origin.name);
  const dName = encodeURIComponent(destination.name);
  const baiduFrom = `latlng:${oLat},${oLng}|name:${oName}`;
  const baiduTo = `latlng:${dLat},${dLng}|name:${dName}`;

  return [
    {
      id: "apple",
      label: "苹果地图",
      href: `https://maps.apple.com/?saddr=${oName}@${oLat},${oLng}&daddr=${dName}@${dLat},${dLng}&dirflg=w`,
    },
    {
      id: "amap",
      label: "高德地图",
      href: `https://uri.amap.com/navigation?from=${oLng},${oLat},${oName}&to=${dLng},${dLat},${dName}&mode=walk&callnative=1`,
    },
    {
      id: "tencent",
      label: "腾讯地图",
      href: `https://apis.map.qq.com/uri/v1/routeplan?type=walk&from=${oName}&fromcoord=${oLat},${oLng}&to=${dName}&tocoord=${dLat},${dLng}`,
    },
    {
      id: "baidu",
      label: "百度地图",
      href: `https://api.map.baidu.com/direction?origin=${baiduFrom}&destination=${baiduTo}&mode=walking&region=${encodeURIComponent("香港")}&output=html&coord_type=wgs84&src=webapp.cuhk.campusbus`,
    },
    {
      id: "google",
      label: "谷歌地图（有时无法正常使用）",
      href: `https://www.google.com/maps/dir/${oLat},${oLng}/${dLat},${dLng}/data=!3m1!4b1!4m14!4m13!1m5!1m1!1s0x0:0x0!2m2!1d${oLng}!2d${oLat}!1m5!1m1!1s0x0:0x0!2m2!1d${dLng}!2d${dLat}!3e2`,
    },
  ];
}
