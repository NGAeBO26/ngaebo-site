import * as React from "react";
import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import type { Map as MaplibreMap, MapLayerMouseEvent } from "maplibre-gl";

import useFsRoads from "./TrailMap/useFsRoads";
import usePois from "./TrailMap/usePois";
import { usePoiPopups } from "./TrailMap/usePoiPopups";

import GravelPopup, { type GravelPopupData } from "./GravelPopup";

import "../styles/trail-map.css";

const STYLE_URL = "/styles/ngaebo-style.json";

const FS_ROADS_LAYER_ID = "fs-roads-line";
const FS_ROADS_HOVER_LAYER_ID = "fs-roads-hover";
const FS_ROADS_SELECTED_LAYER_ID = "fs-roads-selected";

const TrailMap: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MaplibreMap | null>(null);

  const [mapReady, setMapReady] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<GravelPopupData | null>(null);

  /* ---------------- MAP INITIALIZATION ---------------- */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let mounted = true;
    let createdMap: MaplibreMap | null = null;

    const createMapWithStyle = async () => {
      let styleObj: any = null;

      try {
        const res = await fetch(STYLE_URL, { cache: "no-store" });
        if (res && res.ok) {
          styleObj = await res.json();

          try {
            if (
              styleObj &&
              Object.prototype.hasOwnProperty.call(styleObj, "projection")
            ) {
              const p = styleObj.projection;
              const isValidProjection =
                p &&
                (typeof p === "string" ||
                  (typeof p === "object" && Object.keys(p).length > 0));

              if (!isValidProjection) {
                delete styleObj.projection;
              }
            }
          } catch {
            try {
              delete styleObj.projection;
            } catch {}
          }
        }
      } catch {
        styleObj = null;
      }

      try {
        createdMap = new maplibregl.Map({
          container: containerRef.current as HTMLElement,
          style: styleObj || STYLE_URL,
          center: [-84.3, 34.2],
          zoom: 8,
        });

        mapRef.current = createdMap;

        createdMap.on("load", () => {
          if (!mounted) return;
          setMapReady(true);
          setTimeout(() => createdMap!.resize(), 50);
        });
      } catch (err) {
        console.error("TrailMap: failed to create map", err);
      }
    };

    createMapWithStyle();

    return () => {
      mounted = false;
      try {
        createdMap?.remove();
      } catch {}
      mapRef.current = null;
    };
  }, []);

  /* ---------------- LOAD SOURCES & LAYERS ---------------- */
  useFsRoads(mapRef.current ?? null, mapReady, { addLayers: true });
  usePois(mapRef, mapReady);
  usePoiPopups(mapRef, mapReady);

  /* ---------------- INTERACTION HANDLERS ---------------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    if (!map.getLayer(FS_ROADS_LAYER_ID)) return;
    if (!map.getLayer(FS_ROADS_HOVER_LAYER_ID)) return;
    if (!map.getLayer(FS_ROADS_SELECTED_LAYER_ID)) return;

    let hoveredId: string | number | null = null;
    let selectedId: string | number | null = null;

    const setHoverFilter = (id: string | number | null) => {
      try {
        map.setFilter(
          FS_ROADS_HOVER_LAYER_ID,
          id == null ? ["==", ["id"], ""] : ["==", ["id"], id]
        );
      } catch {}
    };

    const setSelectedFilter = (id: string | number | null) => {
      try {
        map.setFilter(
          FS_ROADS_SELECTED_LAYER_ID,
          id == null ? ["==", ["id"], ""] : ["==", ["id"], id]
        );
      } catch {}
    };

    const onMouseMove = (e: MapLayerMouseEvent) => {
      const feature = e.features?.[0] as any;
      const id = feature?.id ?? null;

      map.getCanvas().style.cursor = feature ? "pointer" : "";

      if (id !== hoveredId) {
        hoveredId = id;
        setHoverFilter(hoveredId);
      }
    };

    const onMouseLeave = () => {
      map.getCanvas().style.cursor = "";
      hoveredId = null;
      setHoverFilter(null);
    };

    const onRouteClick = (e: MapLayerMouseEvent) => {
      const feature = e.features?.[0] as any;
      if (!feature) return;

      selectedId = feature.id ?? null;
      setSelectedFilter(selectedId);

      const popupData = featureToPopupData(feature);
      setSelectedRoute(popupData);

      const bounds = getFeatureBounds(feature);
      if (bounds) {
        map.fitBounds(bounds, {
          padding: { top: 40, right: 40, bottom: 260, left: 40 },
          duration: 700,
        });
      }
    };

    const onMapClick = (e: maplibregl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: [FS_ROADS_LAYER_ID],
      });

      if (!features.length) {
        selectedId = null;
        setSelectedFilter(null);
        setSelectedRoute(null);
      }
    };

    map.on("mousemove", FS_ROADS_LAYER_ID, onMouseMove);
    map.on("mouseleave", FS_ROADS_LAYER_ID, onMouseLeave);
    map.on("click", FS_ROADS_LAYER_ID, onRouteClick);
    map.on("click", onMapClick);

    return () => {
      map.off("mousemove", FS_ROADS_LAYER_ID, onMouseMove);
      map.off("mouseleave", FS_ROADS_LAYER_ID, onMouseLeave);
      map.off("click", FS_ROADS_LAYER_ID, onRouteClick);
      map.off("click", onMapClick);
    };
  }, [mapReady]);

  /* ---------------- RENDER ---------------- */
  return (
    <div
      className="trail-map"
      style={{ position: "relative", width: "100%", height: "100%" }}
    >
      <div
        ref={containerRef}
        id="map"
        style={{ width: "100%", height: "100%" }}
      />

      {!mapReady && (
        <div className="map-loading-overlay" aria-hidden>
          Loading map…
        </div>
      )}

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 20,
          pointerEvents: "none",
        }}
      >
        <div style={{ pointerEvents: "auto" }}>
          <GravelPopup
            route={selectedRoute}
            onClose={() => {
              const map = mapRef.current;
              if (map?.getLayer(FS_ROADS_SELECTED_LAYER_ID)) {
                try {
                  map.setFilter(FS_ROADS_SELECTED_LAYER_ID, ["==", ["id"], ""]);
                } catch {}
              }
              setSelectedRoute(null);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default TrailMap;

/* ---------------- HELPERS ---------------- */

function featureToPopupData(feature: any): GravelPopupData {
  const p = feature?.properties ?? {};

  return {
    roadId: String(p.ID ?? p.road_id ?? p.ref ?? p.id ?? "FS"),
    roadName: String(p.NAME ?? p.road_name ?? p.name ?? "Unnamed Road"),
    maintenanceLevel: String(
      p.OPER_MAINT_LEVEL ?? p.maintenance_level ?? p.level ?? "Unknown"
    ),
    surfaceType: String(
      p.SURFACE_TYP ?? p.surface_type ?? p.surface ?? "unknown"
    ),
    status: String(p.STATUS ?? p.status ?? "Open"),
    meanSlope: Number(p.MEAN_SLOPE ?? p.mean_slope ?? 0),
    maxSlope: Number(p.MAX_SLOPE ?? p.max_slope ?? 0),
    ascentPerKm: Number(p.ASCENT_KM ?? p.ascent_per_km ?? p.climb ?? 0),
    precip24h: Number(p.PRECIP_24H ?? p.precip_24h ?? 0),
    tractionImpact: String(
      p.TRACTION_IMPACT ??
        p.traction_impact ??
        "Traction varies with moisture and grade."
    ),
    classRecommendation: String(
      p.CLASS_RECOMMENDATION ??
        p.class_recommendation ??
        "Class 1 / 2 recommended"
    ),
    elevationProfile: parseElevationProfile(
      p.ELEVATION_PROFILE ?? p.elevation_profile
    ),
    baseScore: Number(p.BASE_SCORE ?? p.base_score ?? 50),
    suitability: String(p.SUITABILITY ?? p.suitability ?? ""),
  };
}

function parseElevationProfile(value: unknown): number[] {
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

    const split = value
      .split(",")
      .map((v) => Number(v.trim()))
      .filter((n) => Number.isFinite(n));

    if (split.length) return split;
  }

  return [
    210, 220, 230, 240, 250, 245, 260, 275, 290, 280, 270, 285, 300, 290, 275,
  ];
}

function getFeatureBounds(
  feature: any
): maplibregl.LngLatBoundsLike | null {
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

  return [
    [minX, minY],
    [maxX, maxY],
  ];
}