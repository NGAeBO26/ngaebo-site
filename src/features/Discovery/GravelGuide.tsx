/* src/features/Discovery/GravelGuide.tsx */
import { useRef, useMemo, useEffect } from "react"; 
import maplibregl from "maplibre-gl";
import type { Map as MaplibreMap } from "maplibre-gl";

import useFsRoads from "./hooks/useFsRoads";
import usePois from "./hooks/usePois"; 
import { useHighlight } from "./hooks/useHighlight"; 
import useMapController from "./hooks/useMapController"; 

import "../../styles/GravelGuide.css"; 
import NorthArrow from "../../components/RideGuide/widgets/RouteMap/NorthArrow";

window.maplibregl = maplibregl;

interface GravelGuideProps {
  activeHoverId?: string | null;
  activeRouteId?: string | null;
  filteredRoutes?: any[]; 
  onRouteSelect?: (route: any | null) => void;
  onRoutesLoaded?: (routes: any[]) => void;
  onRouteHover?: (id: string | null) => void;
  isTakeoverActive?: boolean;
  onRegisterResetFn?: (resetFn: () => void) => void;
  onRegisterZoomFn?: (zoomFn: (feature: any) => void) => void; 
  onExitFullscreen?: () => void; 
}

export default function GravelGuide({ 
  activeHoverId, 
  activeRouteId, 
  filteredRoutes = [], 
  onRouteSelect, 
  onRoutesLoaded,
  onRouteHover,
  isTakeoverActive = false,
  onRegisterResetFn,
  onRegisterZoomFn,
  onExitFullscreen
}: GravelGuideProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MaplibreMap | null>(null);

  const fsRoadsOptions = useMemo(() => {
    return { 
      addLayers: true,
      isTakeoverActive: isTakeoverActive,
      activeHoverId: activeHoverId,  
      selectedRouteId: isTakeoverActive ? activeRouteId : null, 
      onRouteSelect: onRouteSelect,
      onRouteHover: onRouteHover
    };
  }, [isTakeoverActive, activeHoverId, activeRouteId, onRouteSelect, onRouteHover]);

  const { routesData } = useFsRoads(mapRef.current ?? null, !!mapRef.current, fsRoadsOptions);

  const { mapReady } = useMapController({ 
    containerRef,
    mapRef,
    routesData,
    filteredRoutes,
    onRoutesLoaded,
    onRegisterResetFn,
    onRegisterZoomFn
  });

  // ─── 🎯 REFINED: LIVE GEO-WORKSPACE FILTER MAP SYNCHRONIZER ───
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !filteredRoutes) return;

    // 1. Gather all active profile_id values matching the current filter state
    const activeIds = filteredRoutes
      .map((route) => String(route.properties?.profile_id || route.id || route.properties?.id || ""))
      .filter(Boolean);

    // 2. Query all active visualization style layers currently mounted to the map canvas
    const style = map.getStyle();
    if (!style || !style.layers) return;

    // 3. Loop through layers to update base visibility while protecting selection states
    style.layers.forEach((layer) => {
      const isRouteLayer = 
        layer.id.includes("road") || 
        layer.id.includes("route") || 
        layer.id.includes("line") || 
        layer.id.includes("trail");

      const isInteractionLayer =
        layer.id.includes("highlight") || 
        layer.id.includes("hover") || 
        layer.id.includes("select") || 
        layer.id.includes("active");

      if (isRouteLayer && !isInteractionLayer) {
        if (activeIds.length === 0) {
          // Hide all features on the layer if there are no matches
          map.setFilter(layer.id, ["==", ["to-string", ["coalesce", ["get", "profile_id"], ["get", "id"], ""]], "____no_matches_found____"]);
        } else {
          // 🎯 FIXED: Casts feature identifiers strictly to strings using 'to-string' and 'coalesce'.
          // This allows features to safely re-appear on the map canvas as the array widens.
          map.setFilter(layer.id, [
            "in", 
            ["to-string", ["coalesce", ["get", "profile_id"], ["get", "id"], ""]], 
            ["literal", activeIds]
          ]);
        }
      }
    });
  }, [filteredRoutes, mapReady]);

  // ResizeObserver map layout rendering
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;

    const observer = new ResizeObserver((entries) => {
      if (entries.length > 0) {
        mapRef.current?.resize();
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [isTakeoverActive, mapReady]);

  usePois(mapRef, mapReady); 
  useHighlight(mapRef, mapReady); 

  return (
    <div 
      className="gravel-guide-container" 
      style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}
    >
      <NorthArrow map={mapRef.current} />
      
      <div ref={containerRef} id="map" style={{ width: "100%", height: "100%" }} /> 
      
      {!mapReady && <div className="map-loading-overlay">Loading Discovery Map...</div>}

      {/* ─── 🎯 CENTERED ATTACHED INTERACTION DECK ─── */}
      <div className="map-dashboard-attribution-overlay">
        <button 
          onClick={onExitFullscreen}
          className="btn-exit-fullscreen-pill"
          title="Restore global navigation menu layers and return to top"
        >
          Exit Fullscreen
        </button>
        <div className="powered-by-attribution"></div>
      </div>
    </div>
  );
}