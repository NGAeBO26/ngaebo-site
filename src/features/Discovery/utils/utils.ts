/* src/features/Discovery/utils/utils.ts */
import * as maplibregl from "maplibre-gl";
//import { type GravelPopupData } from "../components/GravelPopup";

// --- Data Transformation Helpers ---

/**
 * Safely parses elevation JSON or CSV strings into a number array
 */
export function parseElevationProfile(value: unknown): number[] {
  if (Array.isArray(value)) {
    return value.map(Number).filter((n) => Number.isFinite(n));
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map(Number).filter((n) => Number.isFinite(n));
      }
    } catch {}
    const split = value.split(",").map((v) => Number(v.trim())).filter((n) => Number.isFinite(n));
    if (split.length) return split;
  }
  return [210, 220, 230, 240, 250, 245, 260, 275, 290, 280, 270, 285, 300];
}

/**
 * Calculates a bounding box for a line feature to zoom the map correctly
 */
export function getFeatureBounds(feature: any): maplibregl.LngLatBoundsLike | null {
  const geometry = feature?.geometry;
  if (!geometry) return null;

  const coords: number[][] =
    geometry.type === "LineString"
      ? geometry.coordinates
      : geometry.type === "MultiLineString"
      ? geometry.coordinates.flat()
      : [];

  if (!coords.length) return null;

  let minX = coords[0][0];
  let minY = coords[0][1];
  let maxX = coords[0][0];
  let maxY = coords[0][1];

  for (const [x, y] of coords) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }

  return [[minX, minY], [maxX, maxY]];
}

// --- Generic Map Helpers ---

export function escapeHtml(input: any) {
  if (input === null || input === undefined) return "";
  return String(input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function loadPng(url: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.src = url;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
  });
  return img;
}

export function getFeatureCoords(feature: any, e: any): [number, number] | null {
  if (!feature) return null;
  const geom: any = feature.geometry;
  if (geom && Array.isArray(geom.coordinates)) {
    const coords = geom.coordinates;
    if (typeof coords[0] === "number" && typeof coords[1] === "number") {
      return [coords[0], coords[1]];
    }
    if (Array.isArray(coords[0]) && typeof coords[0][0] === "number" && typeof coords[0][1] === "number") {
      return [coords[0][0], coords[0][1]];
    }
  }
  if (e?.lngLat) return [e.lngLat.lng, e.lngLat.lat];
  return null;
}

