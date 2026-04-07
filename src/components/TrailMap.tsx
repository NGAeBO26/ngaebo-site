import * as React from "react";
import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import type { Map as MaplibreMap, MapLayerMouseEvent } from "maplibre-gl";
window.maplibregl = maplibregl;

import useFsRoads from "./TrailMap/useFsRoads";
import usePois from "./TrailMap/usePois";
import { usePoiPopups, type PoiPopupState } from "./TrailMap/usePoiPopups";
import { PoiPopup } from "./TrailMap/PoiPopup";
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
  const [poiPopup, setPoiPopup] = useState<PoiPopupState | null>(null);

  const handlePoiOpen = useCallback((state: PoiPopupState) => {
    setPoiPopup(state);
  }, []);

  const handlePoiClose = useCallback(() => {
    setPoiPopup(null);
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let mounted = true;
    let createdMap: MaplibreMap | null = null;

    const createMapWithStyle = async () => {
      let styleObj: any = null;

      try {
        const res = await fetch(STYLE_URL, { cache: "no-store" });
        if (res.ok) {
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
                console.warn("[TrailMap] removed malformed style.projection");
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
          maxBounds: [
            [-86.05, 33.95],
            [-83.05, 35.15],
          ],
          minZoom: 8,
          maxZoom: 15,
        });

        window.realMap = createdMap;
        mapRef.current = createdMap;

        try {
          (window as any).__ngaebo_map = createdMap;
        } catch {}

        createdMap.on("load", () => {
          if (!mounted) return;
          console.log("[TrailMap] map loaded");
          setMapReady(true);
          setTimeout(() => {
            try {
              createdMap?.resize();
            } catch {}
          }, 50);
        });

        createdMap.on("error", (e: any) => {
          console.error("[TrailMap] map error", e?.error || e);
        });
      } catch (err) {
        console.error("[TrailMap] failed to create map", err);
      }
    };

    createMapWithStyle();

    return () => {
      mounted = false;
      try {
        delete (window as any).__ngaebo_map;
      } catch {}
      try {
        createdMap?.remove();
      } catch {}
      mapRef.current = null;
    };
  }, []);

  useFsRoads(mapRef.current ?? null, mapReady, { addLayers: true });
  usePois(mapRef, mapReady);
  usePoiPopups(mapRef, mapReady, handlePoiOpen, handlePoiClose);

  useEffect(() => {
    console.log("[TrailMap] selectedRoute changed:", selectedRoute);
  }, [selectedRoute]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    let cleanup: (() => void) | null = null;
    let cancelled = false;
    let tries = 0;

    const attachInteractionsWhenReady = () => {
      if (cancelled) return;

      const hasSource = !!map.getSource("fs-roads");
      const hasBase = !!map.getLayer(FS_ROADS_LAYER_ID);
      const hasHover = !!map.getLayer(FS_ROADS_HOVER_LAYER_ID);
      const hasSelected = !!map.getLayer(FS_ROADS_SELECTED_LAYER_ID);

      console.log("[TrailMap] waiting for fs roads wiring", {
        tries,
        hasSource,
        hasBase,
        hasHover,
        hasSelected,
      });

      if (!hasSource || !hasBase || !hasHover || !hasSelected) {
        tries += 1;
        if (tries < 30) {
          window.setTimeout(attachInteractionsWhenReady, 250);
        } else {
          console.warn("[TrailMap] fs roads layers never became ready");
        }
        return;
      }

      console.log("[TrailMap] attaching FS road interactions");

      let hoveredId: string | number | null = null;
      let selectedId: string | number | null = null;

      const setHoverFilter = (id: string | number | null) => {
        try {
          map.setFilter(
            FS_ROADS_HOVER_LAYER_ID,
            id == null ? ["==", ["id"], ""] : ["==", ["id"], id]
          );
          console.log("[TrailMap] hover filter set:", id);
        } catch (err) {
          console.error("[TrailMap] failed to set hover filter", err);
        }
      };

      const setSelectedFilter = (id: string | number | null) => {
        try {
          map.setFilter(
            FS_ROADS_SELECTED_LAYER_ID,
            id == null ? ["==", ["id"], ""] : ["==", ["id"], id]
          );
          console.log("[TrailMap] selected filter set:", id);
        } catch (err) {
          console.error("[TrailMap] failed to set selected filter", err);
        }
      };

      const onMouseMove = (e: MapLayerMouseEvent) => {
        const feature = e.features?.[0] as any;
        const id = feature?.id ?? null;

        console.log("[TrailMap] hover feature:", feature);
        console.log("[TrailMap] hover feature id:", id);

        try {
          map.getCanvas().style.cursor = feature ? "pointer" : "";
        } catch {}

        if (id !== hoveredId) {
          hoveredId = id;
          setHoverFilter(hoveredId);
        }
      };

      const onMouseLeave = () => {
        console.log("[TrailMap] mouse left fs roads layer");
        try {
          map.getCanvas().style.cursor = "";
        } catch {}
        hoveredId = null;
        setHoverFilter(null);
      };

      const onRouteClick = (e: MapLayerMouseEvent) => {
        const feature = e.features?.[0] as any;
        console.log("[TrailMap] road clicked:", feature);

        if (!feature) return;

        selectedId = feature.id ?? null;
        setSelectedFilter(selectedId);

        const popupData = featureToPopupData(feature);
        console.log("[TrailMap] popup data:", popupData);
        setSelectedRoute(popupData);

        const bounds = getFeatureBounds(feature);
        console.log("[TrailMap] feature bounds:", bounds);

        if (bounds) {
          try {
            map.fitBounds(bounds, {
              padding: {
                top: 40,
                right: 40,
                bottom: 260,
                left: 40,
              },
              duration: 700,
            });
          } catch (err) {
            console.error("[TrailMap] fitBounds failed", err);
          }
        }
      };

      const onMapClick = (e: maplibregl.MapMouseEvent) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: [FS_ROADS_LAYER_ID],
        });

        if (!features.length) {
          console.log("[TrailMap] background clicked, clearing selection");
          selectedId = null;
          setSelectedFilter(null);
          setSelectedRoute(null);
        }
      };

      map.on("mousemove", FS_ROADS_LAYER_ID, onMouseMove);
      map.on("mouseleave", FS_ROADS_LAYER_ID, onMouseLeave);
      map.on("click", FS_ROADS_LAYER_ID, onRouteClick);
      map.on("click", onMapClick);

      cleanup = () => {
        try {
          map.off("mousemove", FS_ROADS_LAYER_ID, onMouseMove);
        } catch {}
        try {
          map.off("mouseleave", FS_ROADS_LAYER_ID, onMouseLeave);
        } catch {}
        try {
          map.off("click", FS_ROADS_LAYER_ID, onRouteClick);
        } catch {}
        try {
          map.off("click", onMapClick);
        } catch {}
      };
    };

    attachInteractionsWhenReady();

    return () => {
      cancelled = true;
      if (cleanup) cleanup();
    };
  }, [mapReady]);

  return (
    <div
      className="trail-map"
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
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

      {/* POI popup — pixel-positioned, bypasses MapLibre's projection matrix */}
      <PoiPopup
  mapRef={mapRef}
  popup={poiPopup}
  onClose={handlePoiClose}
/>

      {/* FS road popup — bottom sheet */}
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
    classExplanation: String(
      p.CLASS_EXPLANATION ??
        p.class_explanation ??
        "Class explanation text"
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

  return [210, 220, 230, 240, 250, 245, 260, 275, 290, 280, 270, 285, 300];
}

function getFeatureBounds(feature: any): maplibregl.LngLatBoundsLike | null {
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
