"use client";

import { useEffect, useRef } from "react";
import type { LayerGroup, Map as LeafletMap } from "leaflet";
import { CAMPUS_LATLNG_BOUNDS } from "@/lib/campus-bounds";
import { STOPS, pointFromMap, type Point } from "@/lib/places";

type CampusMapProps = {
  start: Point | null;
  end: Point | null;
  boardId?: string;
  alightId?: string;
  onPick: (point: Point) => void;
};

type LeafletNs = typeof import("leaflet");

type MapView = {
  start: Point | null;
  end: Point | null;
  boardId?: string;
  alightId?: string;
};

function inCampus(lat: number, lng: number): boolean {
  const [[south, west], [north, east]] = CAMPUS_LATLNG_BOUNDS;
  return lat >= south && lat <= north && lng >= west && lng <= east;
}

function shifted(lat: number, lng: number, index: number): [number, number] {
  if (index === 0) return [lat, lng];
  return [lat - index * 0.00012, lng + index * 0.00014];
}

function drawOverlays(
  map: LeafletMap,
  layer: LayerGroup,
  L: LeafletNs,
  view: MapView,
  fitKeyRef: { current: string },
  onPick: (point: Point) => void,
) {
  layer.clearLayers();
  const seen = new Map<string, number>();
  for (const stop of STOPS) {
    const key = `${stop.lat.toFixed(5)},${stop.lng.toFixed(5)}`;
    const index = seen.get(key) ?? 0;
    seen.set(key, index + 1);
    const [lat, lng] = shifted(stop.lat, stop.lng, index);
    const highlighted = stop.id === view.boardId || stop.id === view.alightId;
    const marker = L.circleMarker([lat, lng], {
      radius: highlighted ? 9 : 6,
      color: "#ffffff",
      weight: 2,
      fillColor: highlighted ? "#9a3412" : "#57534e",
      fillOpacity: 0.95,
    });
    marker.on("click", (event) => {
      L.DomEvent.stopPropagation(event);
      onPick(stop);
    });
    marker.addTo(layer);
  }

  const pin = (place: Point | null, color: string) => {
    if (!place) return;
    L.circleMarker([place.lat, place.lng], {
      radius: 11,
      color: "#ffffff",
      weight: 2,
      fillColor: color,
      fillOpacity: 1,
    }).addTo(layer);
  };
  pin(view.start, "#1b7f4a");
  pin(view.end, "#b42318");

  if (!view.start || !view.end) return;
  if (!inCampus(view.start.lat, view.start.lng) || !inCampus(view.end.lat, view.end.lng)) return;
  const fitKey = `${view.start.lat.toFixed(5)},${view.start.lng.toFixed(5)}|${view.end.lat.toFixed(5)},${view.end.lng.toFixed(5)}`;
  if (fitKey === fitKeyRef.current) return;
  fitKeyRef.current = fitKey;
  map.fitBounds(
    L.latLngBounds(
      [view.start.lat, view.start.lng],
      [view.end.lat, view.end.lng],
    ),
    { padding: [36, 36], maxZoom: 17 },
  );
}

export function CampusMap({ start, end, boardId, alightId, onPick }: CampusMapProps) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);
  const leafletRef = useRef<LeafletNs | null>(null);
  const onPickRef = useRef(onPick);
  const viewRef = useRef<MapView>({ start, end, boardId, alightId });
  const fitKeyRef = useRef("");

  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  useEffect(() => {
    viewRef.current = { start, end, boardId, alightId };
    const map = mapRef.current;
    const layer = layerRef.current;
    const L = leafletRef.current;
    if (!map || !layer || !L) return;
    drawOverlays(map, layer, L, viewRef.current, fitKeyRef, (point) => onPickRef.current(point));
  }, [start, end, boardId, alightId]);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;
    let disposed = false;
    let map: LeafletMap | null = null;

    const linkId = "cuhk-leaflet-css";
    if (!document.getElementById(linkId)) {
      const link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      link.href = "/leaflet.css";
      document.head.appendChild(link);
    }

    (async () => {
      const imported = await import("leaflet");
      const L = (imported.default ?? imported) as LeafletNs;
      if (disposed) return;
      leafletRef.current = L;
      const campus = L.latLngBounds(CAMPUS_LATLNG_BOUNDS);
      map = L.map(node, {
        zoomControl: true,
        maxBounds: campus,
        maxBoundsViscosity: 1,
      });
      const fitCampus = () => {
        if (!map) return;
        map.setMinZoom(0);
        map.fitBounds(campus);
        map.setMinZoom(map.getZoom());
      };
      fitCampus();
      L.tileLayer("/tiles/{z}/{x}/{y}", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      map.on("click", (event) => {
        if (!campus.contains(event.latlng)) return;
        onPickRef.current(pointFromMap(event.latlng.lat, event.latlng.lng));
      });
      const layer = L.layerGroup().addTo(map);
      layerRef.current = layer;
      mapRef.current = map;
      drawOverlays(map, layer, L, viewRef.current, fitKeyRef, (point) => onPickRef.current(point));
      requestAnimationFrame(() => {
        if (!map) return;
        map.invalidateSize();
        const view = viewRef.current;
        if (!view.start || !view.end) fitCampus();
      });
    })();

    return () => {
      disposed = true;
      map?.remove();
      mapRef.current = null;
      layerRef.current = null;
      leafletRef.current = null;
    };
  }, []);

  return (
    <div className="relative h-full overflow-hidden rounded-xl border border-border bg-card">
      <div ref={nodeRef} className="h-full w-full" />
    </div>
  );
}
