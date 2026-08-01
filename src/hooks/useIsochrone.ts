/* src/hooks/useIsochrone.ts */
import { useState, useCallback } from "react";

export type DriveBand = "under_60" | "60_90" | "90_180" | "beyond";

export interface IsochroneBandResult {
  band: DriveBand;
  maxMinutes: number; // 60, 90, 180, or 999
  label: string;      // "📍 38 Mins", "🚗 72 Mins", "🏕️ 115 Mins", etc.
}

export interface RouteDriveTimeItem {
  id: string;
  durationSec: number | null;
  durationMins: number | null;
  durationText: string | null;
  distanceText: string | null;
}

// Helper to extract starting coordinate [lng, lat] from a route feature
export function getRouteStartCoordinates(routeFeature: any): [number, number] | null {
  if (!routeFeature) return null;

  const p = routeFeature.properties || {};

  // 1. Explicit properties fallback
  if (typeof p.lng === "number" && typeof p.lat === "number") {
    return [p.lng, p.lat];
  }
  if (typeof p.start_lng === "number" && typeof p.start_lat === "number") {
    return [p.start_lng, p.start_lat];
  }

  // 2. Extract from GeoJSON Geometry
  const geom = routeFeature.geometry;
  if (!geom || !geom.coordinates) return null;

  if (geom.type === "LineString" && geom.coordinates.length > 0) {
    const start = geom.coordinates[0];
    return [Number(start[0]), Number(start[1])];
  }

  if (geom.type === "MultiLineString" && geom.coordinates.length > 0 && geom.coordinates[0].length > 0) {
    const start = geom.coordinates[0][0];
    return [Number(start[0]), Number(start[1])];
  }

  return null;
}

function calculateBandResult(durationMins: number | null): IsochroneBandResult {
  if (durationMins === null || durationMins === undefined) {
    return { band: "beyond", maxMinutes: 999, label: "Beyond 3 Hrs" };
  }

  if (durationMins <= 60) {
    return { band: "under_60", maxMinutes: 60, label: `📍 ${durationMins} Mins` };
  } else if (durationMins <= 90) {
    return { band: "60_90", maxMinutes: 90, label: `🚗 ${durationMins} Mins` };
  } else if (durationMins <= 180) {
    return { band: "90_180", maxMinutes: 180, label: `🏕️ ${durationMins} Mins` };
  }

  return { band: "beyond", maxMinutes: 999, label: `Beyond 3 Hrs (${durationMins} Mins)` };
}

const OSRM_SERVER_BASE = "/osrm-api/table/v1/driving";

// 🎯 FREE GEOLOCATION LOOKUP VIA NOMINATIM WITH CANTON GA FALLBACK
async function geocodeAddressCoords(address: string): Promise<[number, number]> {
  const trimmed = address.trim();
  if (trimmed.toLowerCase().includes("canton")) {
    return [-84.4906, 34.2368];
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(trimmed)}&format=json&limit=1`
    );
    if (res.ok) {
      const data = await res.json();
      if (data && data.length > 0) {
        return [parseFloat(data[0].lon), parseFloat(data[0].lat)];
      }
    }
  } catch (err) {
    console.warn("⚠️ Geocoding failed, falling back to Canton, GA coordinates", err);
  }

  return [-84.4906, 34.2368];
}

export function useIsochrone() {
  const [driveTimesMap, setDriveTimesMap] = useState<Record<string, RouteDriveTimeItem>>({});
  const [isochroneFeatureCollection, setIsochroneFeatureCollection] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeOrigin, setActiveOrigin] = useState<string>("Canton, GA");

  // 🎯 FETCH DRIVE TIMES FROM PRIVATE DIGITALOCEAN OSRM SERVER
  const fetchIsochrones = useCallback(async (address: string, routes: any[] = []) => {
    if (!address || !address.trim()) return;

    setIsLoading(true);
    setError(null);
    setActiveOrigin(address);

    const destinations = (routes || [])
      .map((r) => {
        const id = String(r.properties?.profile_id || r.id || r.properties?.id || "");
        const coords = getRouteStartCoordinates(r);
        if (!id || !coords) return null;
        return { id, lng: coords[0], lat: coords[1] };
      })
      .filter((item): item is { id: string; lng: number; lat: number } => item !== null);

    if (destinations.length === 0) {
      setIsLoading(false);
      return;
    }

    try {
      const [originLng, originLat] = await geocodeAddressCoords(address);
      const newDriveTimesMap: Record<string, RouteDriveTimeItem> = {};

      // Batch destinations in chunks of 150 to keep URL lengths well within standard limits
      const BATCH_SIZE = 150;

      for (let i = 0; i < destinations.length; i += BATCH_SIZE) {
        const batch = destinations.slice(i, i + BATCH_SIZE);
        const coordsPath = `${originLng},${originLat};` + batch.map((d) => `${d.lng},${d.lat}`).join(";");
        const url = `${OSRM_SERVER_BASE}/${coordsPath}?sources=0`;

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`OSRM request failed with status ${response.status}`);
        }

        const data = await response.json();

        if (data.code === "Ok" && data.durations && data.durations[0]) {
          const durationsRow = data.durations[0];
          batch.forEach((dest, idx) => {
            const durationSec = durationsRow[idx + 1];
            if (typeof durationSec === "number" && durationSec !== null) {
              const durationMins = Math.round(durationSec / 60);
              newDriveTimesMap[dest.id] = {
                id: dest.id,
                durationSec,
                durationMins,
                durationText: `${durationMins} mins`,
                distanceText: null,
              };
            }
          });
        }
      }

      setDriveTimesMap(newDriveTimesMap);
      setIsochroneFeatureCollection({ success: true, count: Object.keys(newDriveTimesMap).length });
    } catch (err: any) {
      console.error("❌ [useIsochrone OSRM] Fetch Error:", err);
      setError(err.message || "Failed to calculate OSRM drive times");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 🎯 EVALUATE ROUTE ID AGAINST GOOGLE DISTANCE MATRIX RESULTS
  const evaluateRouteProximity = useCallback(
    (routeFeature: any): IsochroneBandResult => {
      if (!routeFeature) {
        return { band: "beyond", maxMinutes: 999, label: "Beyond 3 Hrs" };
      }

      const id = String(
        routeFeature.properties?.profile_id ||
        routeFeature.id ||
        routeFeature.properties?.id ||
        ""
      );

      const item = driveTimesMap[id];
      if (!item || item.durationMins === null) {
        return { band: "beyond", maxMinutes: 999, label: "Beyond 3 Hrs" };
      }

      return calculateBandResult(item.durationMins);
    },
    [driveTimesMap]
  );

  return {
    fetchIsochrones,
    evaluateRouteProximity,
    isochroneFeatureCollection,
    driveTimesMap,
    isLoading,
    error,
    activeOrigin,
  };
}

export default useIsochrone;