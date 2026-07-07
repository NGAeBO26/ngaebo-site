/* src/features/Discovery/hooks/useHighlight.ts */
import { useEffect } from "react";
import type { Map, MapLayerMouseEvent } from "maplibre-gl";

export function useHighlight(
  mapRef: React.RefObject<Map | null>,
  mapReady: boolean,
) {
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    const map = mapRef.current;

    const HIGHLIGHT_LAYER_ID = "pois-highlight";
    const SOURCE_ID = "pois-all"; // Synchronized with usePois.ts
    let attached = false;

    const highlightLayerDef: any = {
      id: HIGHLIGHT_LAYER_ID,
      type: "circle",
      source: SOURCE_ID,
      paint: {
        "circle-radius": 36,           
        "circle-color": "#ffcc00",      
        "circle-opacity": 0.75,         
        "circle-blur": 0.85,            
        "circle-stroke-width": 0,
      },
      filter: ["==", ["id"], ""],
    };

    let mounted = true;

    // --- SELF-CONTAINED INTERACTIVE POI MOUSE HANDLERS ---
    const onPoiHover = (e: MapLayerMouseEvent) => {
      // 🎯 THE FLIGHT LOCK GATE: If the camera controller is executing a flight calculation,
      // halt instantly. This blocks lookups from passing down to map.setFilter during high-speed zooms.
      if ((map as any)._rgCameraFlying) return;

      map.getCanvas().style.cursor = "pointer";
      const f = e.features?.[0];
      if (!f) return;
      try {
        if (f.properties?.point_count) {
          if (map.getLayer(HIGHLIGHT_LAYER_ID)) {
            map.setFilter(HIGHLIGHT_LAYER_ID, ["==", ["id"], f.id ?? ""]);
          }
        } else {
          const fid = f.properties?.id ?? f.id ?? "";
          if (fid === "") return;
          if (map.getLayer(HIGHLIGHT_LAYER_ID)) {
            map.setFilter(HIGHLIGHT_LAYER_ID, ["==", ["get", "id"], fid]);
          }
          if (map.getLayer("poi-labels")) {
            map.setFilter("poi-labels", ["all", ["!", ["has", "point_count"]], ["==", ["get", "id"], fid]]);
          }
        }
      } catch {}
    };

    const onPoiLeave = () => {
      // 🎯 THE FLIGHT LOCK GATE: Block pointer-leave resets from forcing a tile tree calculation
      // while the camera projection metrics are shifting center targets.
      if ((map as any)._rgCameraFlying) return;

      map.getCanvas().style.cursor = "";
      try {
        if (map.getLayer(HIGHLIGHT_LAYER_ID)) {
          map.setFilter(HIGHLIGHT_LAYER_ID, ["==", ["id"], ""]);
        }
        if (map.getLayer("poi-labels")) {
          map.setFilter("poi-labels", ["all", ["!", ["has", "point_count"]], ["==", ["get", "id"], ""]]);
        }
      } catch {}
    };

    const onClusterClick = async (e: MapLayerMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, { layers: ["cluster-hitbox"] });
      if (!features || !features.length) return;
      const clusterId = features[0].properties?.cluster_id;
      const src = map.getSource(SOURCE_ID) as any;
      if (!src || typeof src.getClusterExpansionZoom !== "function") return;
      try {
        const zoom = await src.getClusterExpansionZoom(clusterId);
        const coords = (features[0].geometry as any).coordinates;
        map.easeTo({ center: [coords[0], coords[1]], zoom: zoom + 1.5, duration: 400, essential: true });
      } catch {}
    };

    function safeAddLayer() {
      try {
        if (!mounted) return;
        if (map.getLayer(HIGHLIGHT_LAYER_ID)) return;

        const src = map.getSource(SOURCE_ID);
        if (!src) return;

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

        bindPoiListeners();
      } catch (err) {
        console.warn("useHighlight: addLayer failed", err);
      }
    }

    function bindPoiListeners() {
      if (!map.getLayer("cluster-hitbox") || !map.getLayer("poi-hitbox")) {
        setTimeout(bindPoiListeners, 50);
        return;
      }
      if (attached) return;

      map.on("click", "cluster-hitbox", onClusterClick);
      map.on("mousemove", "cluster-hitbox", onPoiHover);
      map.on("mouseleave", "cluster-hitbox", onPoiLeave);
      map.on("mousemove", "poi-hitbox", onPoiHover);
      map.on("mouseleave", "poi-hitbox", onPoiLeave);
      attached = true;
    }

    function onSourceData(e: any) {
      try {
        if (!mounted) return;
        if (e.sourceId === SOURCE_ID && e.isSourceLoaded) {
          safeAddLayer();
        }
      } catch (err) { /* ignore */ }
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
        if (attached) {
          map.off("click", "cluster-hitbox", onClusterClick);
          map.off("mousemove", "cluster-hitbox", onPoiHover);
          map.off("mouseleave", "cluster-hitbox", onPoiLeave);
          map.off("mousemove", "poi-hitbox", onPoiHover);
          map.off("mouseleave", "poi-hitbox", onPoiLeave);
        }
        if (map.getLayer(HIGHLIGHT_LAYER_ID)) {
          map.removeLayer(HIGHLIGHT_LAYER_ID);
        }
      } catch (err) { /* ignore */ }
    };
  }, [mapRef, mapReady]);
}