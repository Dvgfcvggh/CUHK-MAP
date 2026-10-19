/**
 * Campus box. The map cannot be panned outside it.
 * Order matches Leaflet: [[south, west], [north, east]].
 */
export const CAMPUS_LATLNG_BOUNDS: [[number, number], [number, number]] = [
  [22.408, 114.195],
  [22.433, 114.218],
];

export const CAMPUS_SOUTH = CAMPUS_LATLNG_BOUNDS[0][0];
export const CAMPUS_WEST = CAMPUS_LATLNG_BOUNDS[0][1];
export const CAMPUS_NORTH = CAMPUS_LATLNG_BOUNDS[1][0];
export const CAMPUS_EAST = CAMPUS_LATLNG_BOUNDS[1][1];

/**
 * Zoom the campus map actually requests.
 * A short window can fit this box only at zoom 12. The phone layout fits at 13.
 * The tile layer stops at zoom 19.
 */
export const TILE_MIN_ZOOM = 12;
export const TILE_MAX_ZOOM = 19;
