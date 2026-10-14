/**
 * Walking handoff. No API keys.
 * Every link carries both ends: WGS84 coordinates and a name.
 * Google uses saddr/daddr lat,lng+(name): the directions API rejects a name
 * glued onto origin=, and that form still opens both ends on foot.
 * Baidu is told the coordinates are WGS84 with coord_type=wgs84.
 * Amap and Tencent keep their given parameter order; names are encoded.
 */

export type WalkEnd = { lat: number; lng: number; name: string };

export type WalkApp = {
  id: "google" | "apple" | "amap" | "tencent" | "baidu";
  label: string;
  href: string;
};

function coord(value: number): string {
  return value.toFixed(6);
}

export function walkApps(origin: WalkEnd, destination: WalkEnd): WalkApp[] {
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
      id: "google",
      label: "Google 地图",
      href: `https://www.google.com/maps?saddr=${oLat},${oLng}+(${oName})&daddr=${dLat},${dLng}+(${dName})&dirflg=w`,
    },
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
  ];
}
