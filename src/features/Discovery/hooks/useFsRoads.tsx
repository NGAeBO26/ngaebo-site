// src/features/Discovery/hooks/useFsRoads.tsx
import { useEffect, useState, useRef } from "react";
import proj4 from "proj4";
import type { Map as MaplibreMap, GeoJSONSource, MapLayerMouseEvent } from "maplibre-gl";

// ============================================================================
// 🎨 CENTRALIZED HOVER GLOW DESIGN SYSTEM
// Tweaking these values here updates your line-string aesthetics everywhere!
// ============================================================================
const HOVER_GLOW_STYLE = {
  color: "#1d4ed8",
  
  // Outer Halo Specifications
  outer: {
    width: ["interpolate", ["linear"], ["zoom"], 6, 4, 10, 6, 13, 8] as any,
    opacity: 1,
  },
  
  // Inner Core Specifications
  inner: {
    width: ["interpolate", ["linear"], ["zoom"], 6, 2, 10, 3, 13, 4] as any,
    opacity: .5,
  }
};

type GeoJSONFeatureCollection = {
  type: "FeatureCollection";
  features: any[];
  crs?: any;
  [k: string]: any;
};

function parseEpsgFromCrs(crs: any): string | null {
  try {
    if (!crs) return null;
    const name = crs.properties?.name || crs.name || null;
    if (!name) return null;

    const m =
      String(name).match(/EPSG[:]{0,2}[:]{0,2}(\d{4,5})/i) ||
      String(name).match(/(\d{4,5})/);

    return m ? `EPSG:${m[1]}` : null;
  } catch {
    return null;
  }
}

function getRoadsBeforeLayerId(map: MaplibreMap): string | undefined {
  try {
    const style = map.getStyle?.();
    const layers = style?.layers ?? [];

    const pointInteractionLayer = layers.find((l: any) =>
      /poi|cluster|marker|hitbox/i.test(l.id)
    );
    if (pointInteractionLayer?.id) return pointInteractionLayer.id;

    const labelLayer = layers.find((l: any) =>
      /label|symbol/i.test(l.id)
    );
    if (labelLayer?.id) return labelLayer.id;

    return undefined;
  } catch {
    return undefined;
  }
}

function normalizeFeatureIds(
  geo: GeoJSONFeatureCollection
): GeoJSONFeatureCollection {
  return {
    ...geo,
    features: geo.features.map((f: any, i: number) => {
      if (f?.id != null) return f;
      const props = f?.properties ?? {};

      return {
        ...f,
        id:
          props.road_id ??
          props.ref ??
          props.id ??
          props.name ??
          `fs-road-${i}`,
      };
    }),
  };
}

interface FsRoadsOptions {
  addLayers?: boolean;
  isTakeoverActive?: boolean;
  activeHoverId?: string | null;
  selectedRouteId?: string | null;
  onRouteSelect?: (route: any | null) => void;
  onRouteHover?: (id: string | null) => void;
}

export default function useFsRoads(
  map: MaplibreMap | null | undefined,
  mapReady?: boolean,
  options?: FsRoadsOptions
) {
  const [routesData, setRoutesData] = useState<any[]>([]);
  const optionsRef = useRef(options);
  const blinkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Handle active selection styling & blinking via options criteria updates
  useEffect(() => {
    if (!map || !mapReady) return;

    if (blinkIntervalRef.current) {
      clearInterval(blinkIntervalRef.current);
      blinkIntervalRef.current = null;
    }

    const opts = optionsRef.current;

    // --- 1. MANAGE THE STATIC SOLID BLUE SELECTION LAYER ---
    if (map.getLayer("fs-roads-selected")) {
      try {
        map.setPaintProperty("fs-roads-selected", "line-width", ["interpolate", ["linear"], ["zoom"], 6, 3, 10, 5, 13, 8]);
        map.setPaintProperty("fs-roads-selected", "line-blur", 0);
        map.setPaintProperty("fs-roads-selected", "line-opacity", 1.0);
        map.setPaintProperty("fs-roads-selected", "line-color", HOVER_GLOW_STYLE.color);

        if (opts?.isTakeoverActive && opts?.selectedRouteId) {
          map.setFilter("fs-roads-selected", ["==", ["get", "profile_id"], opts.selectedRouteId]);
        } else {
          map.setFilter("fs-roads-selected", ["==", ["get", "profile_id"], ""]);
        }
      } catch (err) {
        console.warn("Static selection filter assignment failed:", err);
      }
    }

    // --- 2. MANAGE THE ANIMATED SOFT BLUE HOVER GLOW LAYER ---
    const hoverLayers = ["fs-roads-hover-outer", "fs-roads-hover-inner"];
    
    try {
      if (opts?.activeHoverId && routesData.length > 0) {
        if (opts?.isTakeoverActive && opts?.activeHoverId === opts?.selectedRouteId) {
          hoverLayers.forEach(id => { if (map.getLayer(id)) map.setFilter(id, ["==", ["get", "profile_id"], ""]); });
          return;
        }

        const match = routesData.find((r: any) => r && String(r.properties?.profile_id || r.id) === String(opts.activeHoverId));
        if (match?.properties) {
          const uniqueId = match.properties.profile_id || String(match.id);
          
          // Apply the active hover filter to both layers simultaneously
          hoverLayers.forEach(id => {
            if (map.getLayer(id)) {
              map.setFilter(id, ["==", ["get", "profile_id"], uniqueId]);
            }
          });
          return;
        }
      } else {
        // Clear filters cleanly when mouse leaves interactive hitboxes
        hoverLayers.forEach(id => {
          if (map.getLayer(id)) {
            map.setFilter(id, ["==", ["get", "profile_id"], ""]);
          }
        });
      }
    } catch (err) {
      console.warn("Dynamic hover layer filter assignment failed:", err);
    }

    return () => {
      // Cleaned up completely - no more interval clearing leaks!
    };
  }, [map, mapReady, options?.activeHoverId, options?.selectedRouteId, routesData, options?.isTakeoverActive]);

  useEffect(() => {
    if (!map) return;
    if (mapReady === false) return;

    let cancelled = false;
    let onSourceData: ((e: any) => void) | null = null;
    let removeLoadListener: (() => void) | null = null;
    let attached = false;

    const onMouseMove = (e: MapLayerMouseEvent) => {
      const opts = optionsRef.current;
      map.getCanvas().style.cursor = "pointer";
      
      const f = e.features?.[0];
      if (!f) return;

      const uniqueId = f.properties?.profile_id || String(f.id);

      if (opts?.isTakeoverActive && uniqueId === opts?.selectedRouteId) {
        map.setFilter("fs-roads-hover-outer", ["==", ["get", "profile_id"], ""]);
        map.setFilter("fs-roads-hover-inner", ["==", ["get", "profile_id"], ""]);
        if (opts?.onRouteHover) opts.onRouteHover(uniqueId);
        return;
      }

      map.setFilter("fs-roads-hover-outer", ["==", ["get", "profile_id"], uniqueId]);
      map.setFilter("fs-roads-hover-inner", ["==", ["get", "profile_id"], uniqueId]);
      
      if (f.properties && opts?.onRouteHover) {
        opts.onRouteHover(uniqueId);
      }
    };

    const onMouseLeave = () => {
      const opts = optionsRef.current;
      map.getCanvas().style.cursor = "";
      
      map.setFilter("fs-roads-hover-outer", ["==", ["get", "profile_id"], ""]);
      map.setFilter("fs-roads-hover-inner", ["==", ["get", "profile_id"], ""]);
      if (opts?.onRouteHover) opts.onRouteHover(null);
    };

    const onRouteClick = (e: MapLayerMouseEvent) => {
      if (!e.features || e.features.length === 0) return;
      const f = e.features[0];
      const opts = optionsRef.current;
      const uniqueId = f.properties?.profile_id || String(f.id);

      try {
        if (map.getLayer("fs-roads-selected")) {
          map.setFilter("fs-roads-selected", ["==", ["get", "profile_id"], uniqueId]);
        }
        map.setFilter("fs-roads-hover-outer", ["==", ["get", "profile_id"], ""]);
        map.setFilter("fs-roads-hover-inner", ["==", ["get", "profile_id"], ""]);
      } catch (err) {
        console.warn("Synchronous route filter crash guarded:", err);
      }

      if (opts?.onRouteSelect) {
        opts.onRouteSelect(f);
      }
    };

    const bindRouteListeners = () => {
      if (!map.getLayer("fs-roads-hitbox")) {
        setTimeout(bindRouteListeners, 50);
        return;
      }
      if (attached) return;

      map.on("mousemove", "fs-roads-hitbox", onMouseMove);
      map.on("mouseleave", "fs-roads-hitbox", onMouseLeave);
      map.on("click", "fs-roads-hitbox", onRouteClick);
      attached = true;
    };

    const ensureSourceAndMaybeLayers = async (
      addLayers = !!options?.addLayers
    ) => {
      try {
        const res = await fetch("/data/v3_large_sample_testfeatures.geojson", {
          cache: "no-store",
        });

        if (!res || !res.ok) return;
        const geo: GeoJSONFeatureCollection = await res.json();
        if (!geo || !Array.isArray(geo.features)) return;

        const crs = geo.crs || (geo as any).properties?.crs || null;
        const epsg = parseEpsgFromCrs(crs);

        let finalGeo = geo;

        if (epsg && epsg !== "EPSG:4326") {
          finalGeo = JSON.parse(JSON.stringify(geo));
          const reprojectCoords = (coords: any): any => {
            proj4.defs("EPSG:26916", "+proj=utm +zone=16 +ellps=GRS80 +datum=NAD83 +units=m +no_defs");
            proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs");
            if (!Array.isArray(coords)) return coords;
            if (typeof coords[0] === "number" && typeof coords[1] === "number") {
              try { return proj4(epsg, "EPSG:4326", coords); } catch { return coords; }
            }
            return coords.map(reprojectCoords);
          };

          finalGeo.features = finalGeo.features.map((f: any) => {
            if (f?.geometry?.coordinates) {
              try { f.geometry.coordinates = reprojectCoords(f.geometry.coordinates); } catch {}
            }
            return f;
          });
        }

        finalGeo = normalizeFeatureIds(finalGeo);
        if (cancelled) return;

        setRoutesData(finalGeo.features);

        try {
          const src = map.getSource("fs-roads") as GeoJSONSource | undefined;
          if (src && typeof src.setData === "function") {
            src.setData(finalGeo as any);
          } else {
            map.addSource("fs-roads", {
              type: "geojson",
              data: finalGeo as any,
              generateId: true,
              // Restores high-performance background caching
              tolerance: 0.375,
              buffer: 64
            });
          }
        } catch (e) { return; }

        if (cancelled) return;

        if (addLayers) {
          try {
            const beforeId = getRoadsBeforeLayerId(map);

            if (!map.getLayer("fs-roads-casing")) {
              map.addLayer({
                id: "fs-roads-casing",
                type: "line",
                source: "fs-roads",
                filter: ["any", ["==", ["geometry-type"], "LineString"], ["==", ["geometry-type"], "MultiLineString"]],
                layout: { 
                  "line-join": "round", // FIXED: Eradicates miter spike exploded vertices!
                  "line-cap": "round" 
                },
                paint: {
                  "line-color": "#6e7c7c", 
                  "line-width": ["interpolate", ["linear"], ["zoom"], 6, 2.5, 10, 4.5, 13, 7.5],
                  "line-opacity": 0.9,
                },
              }, beforeId);
            }

            if (!map.getLayer("fs-roads-hitbox")) {
              map.addLayer({
                id: "fs-roads-hitbox",
                type: "line",
                source: "fs-roads",
                layout: { "line-join": "round", "line-cap": "round" },
                paint: { "line-color": "#000000", "line-width": 14, "line-opacity": 0.0 },
              }, beforeId);
            }

            if (!map.getLayer("fs-roads-line")) {
              map.addLayer({
                id: "fs-roads-line",
                type: "line",
                source: "fs-roads",
                filter: ["any", ["==", ["geometry-type"], "LineString"], ["==", ["geometry-type"], "MultiLineString"]],
                layout: { 
                  "line-join": "round", // FIXED: Smooths out the base layer's jagged sharp corners!
                  "line-cap": "round"   // FIXED: Prevents boxy clipping artifacts on track termination nodes
                },
                paint: {
                  "line-color": "#d97706", 
                  "line-width": ["interpolate", ["linear"], ["zoom"], 6, 1.2, 10, 2.4, 13, 4.2],
                  "line-opacity": 1.0, 
                },
              }, beforeId);
            }

            // 2. INTERACTIVE HOVER GLOW LAYER UPGRADE
           // ================================================================
            // 2A. INTERACTIVE HOVER LAYER - OUTER HALO (WIDE & FAINT)
            // ================================================================
            if (!map.getLayer("fs-roads-hover-outer")) {
              map.addLayer({
                id: "fs-roads-hover-outer",
                type: "line",
                source: "fs-roads",
                filter: ["==", ["get", "profile_id"], ""],
                layout: { "line-join": "round", "line-cap": "round" ,"line-miter-limit": 1.0},
                paint: {
                  "line-color": HOVER_GLOW_STYLE.color,
                  "line-width": HOVER_GLOW_STYLE.outer.width,
                  "line-opacity": HOVER_GLOW_STYLE.outer.opacity,
                  "line-blur": 0                 
                },
              }, beforeId);
            }

            // ================================================================
            // 2B. INTERACTIVE HOVER LAYER - INNER CORE (TIGHT & SOLID)
            // ================================================================
            if (!map.getLayer("fs-roads-hover-inner")) {
              map.addLayer({
                id: "fs-roads-hover-inner",
                type: "line",
                source: "fs-roads",
                filter: ["==", ["get", "profile_id"], ""],
                layout: { "line-join": "round", "line-cap": "round","line-miter-limit": 1.0},
                paint: {
                  "line-color": HOVER_GLOW_STYLE.color,
                  "line-width": HOVER_GLOW_STYLE.inner.width,
                  "line-opacity": HOVER_GLOW_STYLE.inner.opacity,
                  "line-blur": 0
                  
                },
              }, beforeId);
            }

            // 3. SELECTION LAYER UPGRADE
            if (!map.getLayer("fs-roads-selected")) {
              map.addLayer({
                id: "fs-roads-selected",
                type: "line",
                source: "fs-roads",
                filter: ["==", ["get", "profile_id"], ""],
                layout: { 
                  "line-join": "round", // FIXED: Keeps selected routes completely smooth
                  "line-cap": "round" 
                },
                paint: {
                  "line-color": HOVER_GLOW_STYLE.color,
                  "line-width": ["interpolate", ["linear"], ["zoom"], 6, 3, 10, 5, 13, 8],
                  "line-opacity": 1,
                  "line-blur": 0
                },
              }, beforeId);
            }

            bindRouteListeners();
          } catch (err) {
            console.warn("useFsRoads: layer addition failed", err);
          }
        }

        onSourceData = (e: any) => {
          if (!e || e.sourceId !== "fs-roads" || !e.isSourceLoaded) return;
          if (optionsRef.current?.isTakeoverActive) return;
          try { map.resize(); } catch {}
          if (onSourceData) map.off("sourcedata", onSourceData);
        };

        map.on("sourcedata", onSourceData);
      } catch (err) {
        console.error("useFsRoads load error", err);
      }
    };

    if (typeof map.isStyleLoaded === "function" && map.isStyleLoaded()) {
      ensureSourceAndMaybeLayers();
    } else {
      const onLoad = () => {
        if (!map.getStyle || typeof map.getStyle !== "function" || !map.getStyle()) {
          setTimeout(() => { if (map.isStyleLoaded && map.isStyleLoaded()) ensureSourceAndMaybeLayers(); }, 50);
          return;
        }
        ensureSourceAndMaybeLayers();
      };
      map.on("load", onLoad);
      removeLoadListener = () => { try { map.off("load", onLoad); } catch {} };
    }

    return () => {
      cancelled = true;
      if (onSourceData) { try { map.off("sourcedata", onSourceData); } catch {} }
      if (removeLoadListener) removeLoadListener();
      if (attached) {
        try {
          map.off("mousemove", "fs-roads-hitbox", onMouseMove);
          map.off("mouseleave", "fs-roads-hitbox", onMouseLeave);
          map.off("click", "fs-roads-hitbox", onRouteClick);
        } catch {}
      }
    };
  }, [map, mapReady, options?.addLayers]);

  return { routesData };
}