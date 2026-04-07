// src/components/TrailMap/usePoiPopups.ts
import { useEffect, useRef } from "react";
import type { Map as MapLibreMap, MapLayerMouseEvent, GeoJSONSource } from "maplibre-gl";

export interface PoiPopupState {
  lngLat: { lng: number; lat: number };
  name: string;
  description?: string;
  url?: string;
  poi_type?: string;
}

export function usePoiPopups(
  mapRef: React.RefObject<MapLibreMap | null>,
  mapReady: boolean,
  onOpen: (state: PoiPopupState) => void,
  onClose: () => void
) {
  // Use a ref to track the last hovered ID to prevent "setData" flickering
  const lastHoveredId = useRef<string | number | null>(null);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    function getPoiSymbolLayers(): string[] {
      try {
        return map!.getStyle().layers
          .map(l => l.id)
          .filter(id => id.startsWith("poi-") && id.includes("symbol"));
      } catch { return []; }
    }

    function clearHighlight() {
      if (lastHoveredId.current === null) return;
      lastHoveredId.current = null;
      
      const hSrc = map!.getSource("pois-highlight-src") as any;
      const sSrc = map!.getSource("pois-symbol-highlight-src") as any;
      if (hSrc) hSrc.setData({ type: "FeatureCollection", features: [] });
      if (sSrc) sSrc.setData({ type: "FeatureCollection", features: [] });
    }

    function setHighlight(lng: number, lat: number, isSymbol: boolean, id: string | number) {
      if (lastHoveredId.current === id) return; // Skip if already highlighted
      lastHoveredId.current = id;

      const sourceId = isSymbol ? "pois-symbol-highlight-src" : "pois-highlight-src";
      const src = map!.getSource(sourceId) as any;
      if (src) {
        src.setData({
          type: "FeatureCollection",
          features: [{
            type: "Feature",
            geometry: { type: "Point", coordinates: [lng, lat] },
            properties: {},
          }],
        });
      }
    }

    function attach(): (() => void) | null {
      const symbolLayers = getPoiSymbolLayers();
      const poiLayers = ["pois-clusters", "pois-unclustered", ...symbolLayers];
      // Include roads in the cursor check to restore pointer behavior
      const allInteractive = [...poiLayers, "fs-roads-line"];

      if (symbolLayers.length < 6) return null;

      // ── MOUSE MOVE (Handles Pointer & Hover Glow) ───────────────────
      const onMouseMove = (e: MapLayerMouseEvent) => {
        let hit: any = null;
        
        try {
          const features = map!.queryRenderedFeatures(e.point, { layers: allInteractive });
          if (features.length > 0) hit = features[0];
        } catch (err) {
          // Silence MapLibre internal index errors
        }

        if (!hit) {
          map!.getCanvas().style.cursor = "";
          clearHighlight();
          return;
        }

        // Always show pointer for roads or POIs
        map!.getCanvas().style.cursor = "pointer";

        // Only trigger the "Glow" for POIs/Clusters (Roads have their own highlight)
        if (poiLayers.includes(hit.layer.id)) {
          const coords = (hit.geometry as any).coordinates;
          const isSymbol = symbolLayers.includes(hit.layer.id);
          const id = hit.id || hit.properties?.name || "temp-id";
          setHighlight(coords[0], coords[1], isSymbol, id);
        } else {
          clearHighlight();
        }
      };

      const onMouseLeave = () => {
        map!.getCanvas().style.cursor = "";
        clearHighlight();
      };

      // ── CLICK (Handles Zoom & Popup) ────────────────────────────────
      const onMapClick = async (e: MapLayerMouseEvent) => {
        let feature: any = null;
        for (const layerId of poiLayers) {
          try {
            const found = map!.queryRenderedFeatures(e.point, { layers: [layerId] });
            if (found.length > 0) { feature = found[0]; break; }
          } catch {}
        }

        if (!feature) { onClose(); return; }

        const props = feature.properties || {};
        const coords = (feature.geometry as any).coordinates;

        if (e.originalEvent) e.originalEvent.stopPropagation();

        if (props.cluster) {
          const source = map!.getSource("pois-all") as GeoJSONSource;
          try {
            const zoom = await (source as any).getClusterExpansionZoom(feature.id);
            map!.easeTo({ center: coords, zoom: zoom + 0.5, duration: 400 });
          } catch {
            map!.easeTo({ center: coords, zoom: map!.getZoom() + 2, duration: 400 });
          }
          return;
        }

        map!.easeTo({ center: coords, zoom: Math.max(map!.getZoom(), 14.5), duration: 400 });
        
        onOpen({
          lngLat: { lng: coords[0], lat: coords[1] },
          name: props.name || "Point of Interest",
          description: props.description,
          url: props.url,
          poi_type: props.poi_type,
        });
      };

      map!.on("mousemove", onMouseMove);
      map!.getCanvas().addEventListener("mouseleave", onMouseLeave);
      map!.on("click", onMapClick);

      return () => {
        map!.off("mousemove", onMouseMove);
        map!.getCanvas()?.removeEventListener("mouseleave", onMouseLeave);
        map!.off("click", onMapClick);
      };
    }

    let activeDetach: (() => void) | null = null;
    const interval = window.setInterval(() => {
      const result = attach();
      if (result) {
        activeDetach = result;
        window.clearInterval(interval);
      }
    }, 250);

    return () => {
      window.clearInterval(interval);
      if (activeDetach) (activeDetach as () => void)();
    };
  }, [mapRef, mapReady, onOpen, onClose]);
}