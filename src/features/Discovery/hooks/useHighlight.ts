// src/features/Discovery/hooks/useHighlight.ts
import { useEffect } from "react";
import type { Map } from "maplibre-gl";

export function useHighlight(
  mapRef: React.RefObject<Map | null>,
  mapReady: boolean,
) {
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    const map = mapRef.current;

    const HIGHLIGHT_LAYER_ID = "pois-highlight";
    const SOURCE_ID = "pois-all"; // Synchronized with usePois.ts

    const highlightLayerDef: any = {
      id: HIGHLIGHT_LAYER_ID,
      type: "circle",
      source: SOURCE_ID,
      paint: {
        // Soft Glow Configurations
        "circle-radius": 24,           // Expanded to let the bloom spill outward cleanly
        "circle-color": "#ffcc00",      // High-visibility golden yellow
        "circle-opacity": 0.75,         // Kept vibrant but translucent
        "circle-blur": 0.85,            // Higher value = softer radial gradient edge
        
        // Remove strokes entirely so it doesn't render a solid ring around the glow
        "circle-stroke-width": 0,
      },
      // Target the top-level feature/cluster ID assigned by generateId
      filter: ["==", ["id"], ""],
    };

    let mounted = true;

    function safeAddLayer() {
      try {
        if (!mounted) return;
        if (map.getLayer(HIGHLIGHT_LAYER_ID)) return;

        // Verify the source is alive
        const src = map.getSource(SOURCE_ID);
        if (!src) return;

        // Position the glow behind everything except basic map layers
        const preferredAnchors = [
          "cluster-count",
          "cluster-layer-cluster-small",
          "cluster-layer-cluster-medium",
          "cluster-layer-cluster-large",
          "poi-layer-gap",
          "poi-layer-camp",
          "poi-layer-water",
          "poi-layer-scenic",
          "poi-layer-trailhead"
        ];

        let insertBefore: string | undefined;
        for (const a of preferredAnchors) {
          if (map.getLayer(a)) {
            insertBefore = a;
            break;
          }
        }

        if (insertBefore) map.addLayer(highlightLayerDef, insertBefore);
        else map.addLayer(highlightLayerDef);
      } catch (err) {
        console.warn("useHighlight: addLayer failed", err);
      }
    }

    // Process background thread source availability updates
    function onSourceData(e: any) {
      try {
        if (!mounted) return;
        if (e.sourceId === SOURCE_ID && e.isSourceLoaded) {
          safeAddLayer();
        }
      } catch (err) {
        // ignore
      }
    }

    if (map.getSource(SOURCE_ID)) {
      safeAddLayer();
    }

    map.on("sourcedata", onSourceData);
    map.on("styledata", safeAddLayer);

    return () => {
      mounted = false;
      try {
        map.off("sourcedata", onSourceData);
        map.off("styledata", safeAddLayer);
        if (map.getLayer(HIGHLIGHT_LAYER_ID)) {
          map.removeLayer(HIGHLIGHT_LAYER_ID);
        }
      } catch (err) {
        // ignore
      }
    };
  }, [mapRef, mapReady]);
}