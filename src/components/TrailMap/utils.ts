// src/components/TrailMap/utils.ts
import * as maplibregl from "maplibre-gl";

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

export function addImageWhenReady(
  map: maplibregl.Map,
  name: string,
  image: HTMLImageElement | ImageBitmap | ImageData | any,
  options?: any,
) {
  const tryAdd = () => {
    if (!map || !map.isStyleLoaded()) {
      requestAnimationFrame(tryAdd);
      return;
    }
    try {
      if (!map.hasImage(name)) {
        map.addImage(name, image as any, options);
      }
    } catch {
      requestAnimationFrame(tryAdd);
    }
  };
  tryAdd();
}

export function getFeatureCoords(feature: any, e: any): [number, number] | null {
  if (!feature) return null;
  const geom: any = feature.geometry;
  if (geom && Array.isArray(geom.coordinates)) {
    const coords = geom.coordinates;
    if (typeof coords[0] === "number" && typeof coords[1] === "number") {
      return [coords[0], coords[1]];
    }
    if (
      Array.isArray(coords[0]) &&
      typeof coords[0][0] === "number" &&
      typeof coords[0][1] === "number"
    ) {
      return [coords[0][0], coords[0][1]];
    }
  }
  if (e?.lngLat) {
    return [e.lngLat.lng, e.lngLat.lat];
  }
  return null;
}