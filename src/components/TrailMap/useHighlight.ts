// src/components/TrailMap/useHighlight.ts
import { useEffect } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";

export function useHighlight(
  mapRef: React.RefObject<MapLibreMap | null>,
  mapReady: boolean
) {
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    const map = mapRef.current;

    const HIGHLIGHT_LAYER_ID = "pois-highlight";

    const highlightLayerDef: any = {
      id: HIGHLIGHT_LAYER_ID,
      type: "circle",
      source: "pois",
      paint: {
        "circle-radius": 10,
        "circle-color": "#ffcc00",
        "circle-opacity": 0.9,
        "circle-stroke-color": "#222",
        "circle-stroke-width": 2,
      },
      filter: ["==", ["get", "id"], ""],
    };

    let mounted = true;

    function safeAddLayer() {
      try {
        if (!mounted) return;
        if (map.getLayer(HIGHLIGHT_LAYER_ID)) return;

        // Ensure the source exists and is ready
        const src = map.getSource("pois");
        if (!src) {
          return;
        }

        // Choose a safe insert-before anchor
        const preferredAnchors = [
          "pois-unclustered",
          "pois-clusters",
          "pois-cluster-count",
          "road",
          "building",
          "water",
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
        // Do not throw; log for debugging
        // eslint-disable-next-line no-console
        console.warn("useHighlight: addLayer failed", err);
      }
    }

    // Handler for source load events
    function onSourceData(e: any) {
      try {
        if (!mounted) return;
        if (e.sourceId === "pois" && e.isSourceLoaded) {
          safeAddLayer();
        }
      } catch (err) {
        // ignore
      }
    }

    // Ensure layer exists now if source already present and loaded
    if (map.getSource("pois")) {
      safeAddLayer();
    }

    // Listen for source load and style reloads
    map.on("sourcedata", onSourceData);
    map.on("styledata", safeAddLayer);

    return () => {
      mounted = false;
      try {
        map.off("sourcedata", onSourceData);
        map.off("styledata", safeAddLayer);
        if (map.getLayer(HIGHLIGHT_LAYER_ID)) map.removeLayer(HIGHLIGHT_LAYER_ID);
      } catch (err) {
        // ignore cleanup errors
      }
    };
  }, [mapRef, mapReady]);
}