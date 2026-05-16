/* src/features/Discovery/GravelGuide.tsx */
import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import type { Map as MaplibreMap, MapLayerMouseEvent } from "maplibre-gl";

import useFsRoads from "./hooks/useFsRoads";
import usePois from "./hooks/usePois";
import { useHighlight } from "./hooks/useHighlight";
import { usePoiPopups, type PoiPopupState } from "./hooks/usePoiPopups";
import { PoiPopup } from "./components/PoiPopup";
import GravelPopup, { type GravelPopupData } from "./components/GravelPopup";
import { getFeatureBounds, featureToPopupData } from "./utils/utils";

import "../../styles/trail-map.css";

const STYLE_URL = "/styles/ngaebo-style.json";
const FS_ROADS_LAYER_ID = "fs-roads-line";
const FS_ROADS_HOVER_LAYER_ID = "fs-roads-hover";
const FS_ROADS_SELECTED_LAYER_ID = "fs-roads-selected";

window.maplibregl = maplibregl;

export default function GravelGuide() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MaplibreMap | null>(null);

  const [mapReady, setMapReady] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<GravelPopupData | null>(null);
  const [poiPopup, setPoiPopup] = useState<PoiPopupState | null>(null);

  const handlePoiOpen = useCallback((state: PoiPopupState) => setPoiPopup(state), []);
  const handlePoiClose = useCallback(() => setPoiPopup(null), []);

  // Hook initializations using the split ref pattern
  useFsRoads(mapRef.current ?? null, mapReady, { addLayers: true });
  usePois(mapRef, mapReady);
  useHighlight(mapRef, mapReady);
  usePoiPopups(mapRef, mapReady, handlePoiOpen, handlePoiClose);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let mounted = true;

    const createMapWithStyle = async () => {
      let styleObj: any = null;
      try {
        const res = await fetch(STYLE_URL, { cache: "no-store" });
        if (res.ok) styleObj = await res.json();
      } catch { styleObj = null; }

      const createdMap = new maplibregl.Map({
        container: containerRef.current as HTMLElement,
        style: styleObj || STYLE_URL,
        center: [-84.3, 34.2],
        maxBounds: [[-86.05, 33.95], [-83.05, 35.15]],
        minZoom: 8,
        maxZoom: 15,
      });

      mapRef.current = createdMap;
      (window as any).m = createdMap; // Global debug access

      createdMap.on("load", () => {
        if (!mounted) return;
        setMapReady(true);
        setTimeout(() => createdMap?.resize(), 50);
      });
    };

    createMapWithStyle();
    return () => { mounted = false; mapRef.current?.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    const attachInteractionsWhenReady = () => {
      if (cancelled) return;

  // Inside attachInteractionsWhenReady in GravelGuide.tsx
  const onClusterClick = async (e: MapLayerMouseEvent) => {
    const features = map.queryRenderedFeatures(e.point, { layers: ["cluster-layer-cluster-small", "cluster-layer-cluster-medium", "cluster-layer-cluster-large"] });
    if (!features || !features.length) return;

    const feature = features[0];
    const clusterId = feature.properties?.cluster_id;
    const source = map.getSource("pois-all") as maplibregl.GeoJSONSource;

    if (!source || typeof source.getClusterExpansionZoom !== "function") {
      console.error("Source 'pois-all' is not a clustered GeoJSON source.");
      return;
    }

    try {
      // FIX: getClusterExpansionZoom accepts only 1 argument and returns a Promise
      const expansionZoom = await source.getClusterExpansionZoom(clusterId);
      
      const coordinates = (feature.geometry as any).coordinates;

      map.easeTo({
        center: [coordinates[0], coordinates[1]],
        zoom: expansionZoom + 1.5, // Buffer to confidently break the cluster open
        duration: 400,
        essential: true
      });
    } catch (err) {
      console.error("Cluster expansion failed:", err);
    }
  };

      // --- ROAD BEHAVIOR ---
      const onMouseMove = (e: MapLayerMouseEvent) => {
        map.getCanvas().style.cursor = "pointer";
        const f = e.features?.[0];
        if (f) map.setFilter(FS_ROADS_HOVER_LAYER_ID, ["==", ["id"], f.id || ""]);
      };

      const onMouseLeave = () => {
        map.getCanvas().style.cursor = "";
        map.setFilter(FS_ROADS_HOVER_LAYER_ID, ["==", ["id"], ""]);
      };

      const onRouteClick = (e: MapLayerMouseEvent) => {
        const f = e.features?.[0] as any;
        if (!f) return;
        const routeID = f.properties?.profile_id;
        if (routeID) window.open(`/report/${routeID}`, '_blank', 'noopener,noreferrer');
        
        map.setFilter(FS_ROADS_SELECTED_LAYER_ID, ["==", ["id"], f.id ?? ""]);
        setSelectedRoute(featureToPopupData(f));
        const bounds = getFeatureBounds(f);
        if (bounds) map.fitBounds(bounds, { padding: { top: 40, right: 40, bottom: 260, left: 40 }, duration: 700 });
      };

      // --- POI BEHAVIOR ---
      // Layers matching usePois.ts
      const POI_LAYERS = [
        "cluster-layer-cluster-small",
        "cluster-layer-cluster-medium",
        "cluster-layer-cluster-large",
        "poi-layer-gap", 
        "poi-layer-camp", 
        "poi-layer-water", 
        "poi-layer-scenic", 
        "poi-layer-trailhead"
      ];

      const bindPoiListeners = () => {
        const clusterLayers = ["cluster-layer-cluster-small", "cluster-layer-cluster-medium", "cluster-layer-cluster-large"];

        clusterLayers.forEach(layerId => {
          if (map.getLayer(layerId)) {
            map.off("click", layerId, onClusterClick);
            map.on("click", layerId, onClusterClick);
          }
        });
        POI_LAYERS.forEach(id => {
          // MapLibre allows multiple 'on' calls, but it's cleaner to check 
          // if the layer exists before trying to bind to it.
          if (map.getLayer(id)) {
            map.off("mousemove", id, onPoiHover); // prevent double-binding
            map.on("mousemove", id, onPoiHover);
            map.off("mouseleave", id, onPoiLeave);
            map.on("mouseleave", id, onPoiLeave);
            map.on("click", "clusters", onClusterClick);
          }
        });
      };

      bindPoiListeners();
      map.on("data", bindPoiListeners);

      

      // --- POI HIGHLIGHT BEHAVIOR ---
      const onPoiHover = (e: MapLayerMouseEvent) => {
        const f = e.features?.[0];
        if (!f) return;
        
        map.getCanvas().style.cursor = "pointer";
        // Since we enabled generateId: true in usePois, f.id is populated for all POIs
        if (f.id !== undefined) {
          map.setFilter("pois-highlight", ["==", ["id"], f.id]);
        }
      };

      const onPoiLeave = () => {
        map.getCanvas().style.cursor = "";
        map.setFilter("pois-highlight", ["==", ["id"], ""]);
      };

    

      

      map.on("mousemove", FS_ROADS_LAYER_ID, onMouseMove);
      map.on("mouseleave", FS_ROADS_LAYER_ID, onMouseLeave);
      map.on("click", FS_ROADS_LAYER_ID, onRouteClick);
      
      map.on("click", "clusters", onClusterClick);

      POI_LAYERS.forEach(id => {
        if (map.getLayer(id)) {
          map.on("mousemove", id, onPoiHover);
          map.on("mouseleave", id, onPoiLeave);
        }
      });

      cleanup = () => {
        map.off("data", bindPoiListeners);
        map.off("click", "clusters", onClusterClick);
        map.off("mousemove", FS_ROADS_LAYER_ID, onMouseMove);
        map.off("mouseleave", FS_ROADS_LAYER_ID, onMouseLeave);
        map.off("click", FS_ROADS_LAYER_ID, onRouteClick);
       
        map.off("click", "clusters", onClusterClick);
        POI_LAYERS.forEach(id => {
          map.off("mousemove", id, onPoiHover);
          map.off("mouseleave", id, onPoiLeave);
        });
      };
    };

    attachInteractionsWhenReady();
    return () => { cancelled = true; cleanup?.(); };
  }, [mapReady]);

  return (
    <div className="gravel-guide-container" style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      <div ref={containerRef} id="map" style={{ width: "100%", height: "100%" }} />
      {!mapReady && <div className="map-loading-overlay">Loading Discovery Map…</div>}
      <PoiPopup mapRef={mapRef} popup={poiPopup} onClose={handlePoiClose} />
      {selectedRoute && (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 10 }}>
          <GravelPopup route={selectedRoute} onClose={() => setSelectedRoute(null)} />
        </div>
      )}
    </div>
  );
}