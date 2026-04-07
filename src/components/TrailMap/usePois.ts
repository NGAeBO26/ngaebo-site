// src/components/TrailMap/usePois.ts
// @ts-nocheck
import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import type { Map as MapLibreMap } from "maplibre-gl";

export default function usePois(
  mapRef: React.MutableRefObject<MapLibreMap | null>,
  mapReady: boolean
) {
  const registeredIconsRef = useRef<Record<string, { id: string; src: string }>>({});

  const ALL_SOURCE = "pois-all";
  const HIGHLIGHT_SRC = "pois-highlight-src";
  const SYMBOL_HIGHLIGHT_SRC = "pois-symbol-highlight-src";

  const loadPng = (url: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = url;
      img.onload = () => resolve(img);
      img.onerror = reject;
    });

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    let cancelled = false;

    async function initPois() {
      if (cancelled) return;

      let allGeojson: any = { type: "FeatureCollection", features: [] };
      try {
        const resp = await fetch("/data/pois.geojson");
        if (resp.ok) allGeojson = await resp.json();
      } catch {}

      if (!map.getSource(ALL_SOURCE)) {
        map.addSource(ALL_SOURCE, {
          type: "geojson",
          data: allGeojson,
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 40,
        });
      }

      // ── HIGHLIGHT SOURCES ───────────────────────────────────────────
      if (!map.getSource(HIGHLIGHT_SRC)) {
        map.addSource(HIGHLIGHT_SRC, {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
      }

      if (!map.getSource(SYMBOL_HIGHLIGHT_SRC)) {
        map.addSource(SYMBOL_HIGHLIGHT_SRC, {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
      }

      // ── UNIFIED HIGHLIGHT STYLING ───────────────────────────────────
      // Shared constants for visual matching
      const GLOW_COLOR = "#ffcc00";
      const GLOW_RADIUS = 35; // Increased radius
      //const RING_RADIUS = 24;
      const SYMBOL_VERTICAL_OFFSET = -18;

      // 1. Cluster Glow
      if (!map.getLayer("pois-highlight-glow")) {
        map.addLayer({
          id: "pois-highlight-glow",
          type: "circle",
          source: HIGHLIGHT_SRC,
          paint: {
            "circle-radius": GLOW_RADIUS,
            "circle-color": GLOW_COLOR,
            "circle-opacity": 0.5,
            "circle-blur": 1.5,
          },
        });
      }

      // 2. Cluster Ring
      if (!map.getLayer("pois-highlight-ring")) {
        map.addLayer({
          id: "pois-highlight-ring",
          type: "circle",
          source: HIGHLIGHT_SRC,
          paint: {
            //"circle-radius": RING_RADIUS,
            "circle-color": "transparent",
            "circle-stroke-color": GLOW_COLOR,
            "circle-stroke-width": 2,
          },
        });
      }

      // 3. Symbol Glow (Mirrored properties + Vertical Offset)
      if (!map.getLayer("pois-symbol-highlight-glow")) {
        map.addLayer({
          id: "pois-symbol-highlight-glow",
          type: "circle",
          source: SYMBOL_HIGHLIGHT_SRC,
          paint: {
            "circle-radius": GLOW_RADIUS,
            "circle-color": GLOW_COLOR,
            "circle-opacity": 0.5,
            "circle-blur": 1.5,
            "circle-translate": [0, SYMBOL_VERTICAL_OFFSET],
          },
        });
      }

      // 4. Symbol Ring (Mirrored properties + Vertical Offset)
      if (!map.getLayer("pois-symbol-highlight-ring")) {
        map.addLayer({
          id: "pois-symbol-highlight-ring",
          type: "circle",
          source: SYMBOL_HIGHLIGHT_SRC,
          paint: {
            //"circle-radius": RING_RADIUS,
            "circle-color": "transparent",
            "circle-stroke-color": GLOW_COLOR,
            "circle-stroke-width": 2,
            "circle-translate": [0, SYMBOL_VERTICAL_OFFSET],
          },
        });
      }

      // ── CORE POI LAYERS ─────────────────────────────────────────────
      if (!map.getLayer("pois-clusters")) {
        map.addLayer({
          id: "pois-clusters",
          type: "circle",
          source: ALL_SOURCE,
          filter: ["has", "point_count"],
          paint: {
            "circle-color": "#3f5a3c",
            "circle-radius": ["step", ["get", "point_count"], 14, 10, 18, 25, 24],
            "circle-stroke-width": 1.5,
            "circle-stroke-color": "#ffffff",
          },
        });
      }

      if (!map.getLayer("pois-cluster-count")) {
        map.addLayer({
          id: "pois-cluster-count",
          type: "symbol",
          source: ALL_SOURCE,
          filter: ["has", "point_count"],
          layout: { "text-field": ["get", "point_count"], "text-size": 9 },
          paint: { "text-color": "#ffffff" },
        });
      }

      const iconTypes = ["gap", "camp", "water", "scenic", "ranger", "hazard"];
      if (!map.getLayer("pois-unclustered")) {
        map.addLayer({
          id: "pois-unclustered",
          type: "circle",
          source: ALL_SOURCE,
          filter: [
            "all",
            ["!", ["has", "point_count"]],
            ["!", ["in", ["get", "poi_type"], ["literal", iconTypes]]],
          ],
          paint: {
            "circle-radius": 6,
            "circle-color": "#ff5722",
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": 1,
          },
        });
      }

      async function registerIcon(id: string, src: string, map: maplibregl.Map) {
        if (!map.hasImage(id)) {
          try {
            const img = await loadPng(src);
            map.addImage(id, img, { pixelRatio: 2 });
          } catch {}
        }
        const layerId = `poi-${id}-symbol`;
        if (!map.getLayer(layerId)) {
          map.addLayer({
            id: layerId,
            type: "symbol",
            source: ALL_SOURCE,
            filter: ["all", ["==", ["get", "poi_type"], id], ["!", ["has", "point_count"]]],
            layout: {
              "icon-image": id,
              "icon-size": 0.8,
              "icon-anchor": "bottom",
              "icon-offset": [0, -12],
              "icon-allow-overlap": true,
            },
          });
        }
      }

      await Promise.all([
        registerIcon("gap", "/icons/gap.png", map),
        registerIcon("camp", "/icons/camp.png", map),
        registerIcon("water", "/icons/water.png", map),
        registerIcon("scenic", "/icons/scenic.png", map),
        registerIcon("ranger", "/icons/ranger.png", map),
        registerIcon("hazard", "/icons/hazard.png", map)
      ]);
    }

    initPois();
    return () => { cancelled = true; };
  }, [mapRef, mapReady]);
}