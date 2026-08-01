/* src/features/Discovery/GravelGuide.tsx */
import { useRef, useMemo, useEffect } from "react"; 
import maplibregl from "maplibre-gl";
import type { Map as MaplibreMap } from "maplibre-gl";

import useFsRoads from "./hooks/useFsRoads";
import usePois from "./hooks/usePois"; 
import { useHighlight } from "./hooks/useHighlight"; 
import useMapController from "./hooks/useMapController"; 
import useFsRoadsReport from "../../components/RideGuide/widgets/RouteMap/useFsRoadsReport";

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
  isPopupContext?: boolean;
  onRegisterResetFn?: (resetFn: () => void) => void;
  onRegisterZoomFn?: (zoomFn: (feature: any) => void) => void; 
  onExitFullscreen?: () => void; 
  onReopenTour?: () => void;
}

export default function GravelGuide({ 
  activeHoverId, 
  activeRouteId, 
  filteredRoutes = [], 
  onRouteSelect, 
  onRoutesLoaded,
  onRouteHover,
  isTakeoverActive = false,
  isPopupContext = false,
  onRegisterResetFn,
  onRegisterZoomFn,
  onExitFullscreen,
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

  // Master network file (fs-roads-v3.geojson) is ONLY loaded on the main discovery view
  const { routesData } = useFsRoads(mapRef.current ?? null, !isPopupContext && !!mapRef.current, fsRoadsOptions);

  const { mapReady } = useMapController({ 
    containerRef,
    mapRef,
    routesData: isPopupContext ? filteredRoutes : routesData,
    filteredRoutes,
    onRoutesLoaded,
    onRegisterResetFn,
    onRegisterZoomFn
  });

  // Loads ONLY the single route segment payload (/data/segments/${activeRouteId}_segments.geojson) for Popup View
  useFsRoadsReport(
    mapRef.current, 
    mapReady && isPopupContext, 
    { addLayers: true, routeID: activeRouteId || "", isPopupContext: true }
  );

  // Excludes "fs-roads-" segment layers from the profile_id filter loop
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || isPopupContext) return;

    const activeIds = filteredRoutes
      .map((route) => String(route.properties?.profile_id || route.id || route.properties?.id || ""))
      .filter(Boolean);

    const style = map.getStyle();
    if (!style || !style.layers) return;

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
        layer.id.includes("active") ||
        layer.id.startsWith("fs-roads-");

      if (isRouteLayer && !isInteractionLayer) {
        if (activeIds.length === 0) {
          map.setFilter(layer.id, ["==", ["to-string", ["coalesce", ["get", "profile_id"], ["get", "id"], ""]], "____no_matches_found____"]);
        } else {
          map.setFilter(layer.id, [
            "in", 
            ["to-string", ["coalesce", ["get", "profile_id"], ["get", "id"], ""]], 
            ["literal", activeIds]
          ]);
        }
      }
    });
  }, [filteredRoutes, mapReady, isPopupContext]);

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

  usePois(mapRef, mapReady && !isPopupContext); 
  useHighlight(mapRef, mapReady && !isPopupContext); 

  return (
    <div 
      className="gravel-guide-container" 
      style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}
    >
      <NorthArrow map={mapRef.current} />
      
      {!isPopupContext && (
        <button 
          type="button"
          className="rg-map-tour-reopen-floating-trigger"
          onClick={() => window.dispatchEvent(new Event("rg-open-onboarding-tour"))}
          title="Reopen map interface onboarding guide overview"
          aria-label="Reopen onboarding guide modal"
        >
          ?
        </button>
      )}
      
      <div ref={containerRef} id="map" style={{ width: "100%", height: "100%" }} /> 
      
      {!mapReady && <div className="map-loading-overlay">Loading Discovery Map...</div>}

      {!isPopupContext && (
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
      )}
    </div>
  );
}