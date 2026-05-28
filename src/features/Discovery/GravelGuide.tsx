/* src/features/Discovery/GravelGuide.tsx */
import { useRef, useMemo } from "react";
import maplibregl from "maplibre-gl";
import type { Map as MaplibreMap } from "maplibre-gl";

import useFsRoads from "./hooks/useFsRoads";
import usePois from "./hooks/usePois"; //
import { useHighlight } from "./hooks/useHighlight"; //
import useMapController from "./hooks/useMapController"; //

import "../../styles/trail-map.css";
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
  onRegisterZoomFn 
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

  // ============================================================================
  // 🎮 SYNC LIFE CYCLES
  // We extract "mapReady" from useMapController below and pass it straight into 
  // your feature hooks to synchronize layer initialization cleanly.
  // ============================================================================
  const { mapReady } = useMapController({ //
    containerRef,
    mapRef,
    routesData,
    filteredRoutes,
    onRoutesLoaded,
    onRegisterResetFn,
    onRegisterZoomFn
  });

  // FIXED: Replaced "!!mapRef.current" with the reactive "mapReady" state token
  usePois(mapRef, mapReady); 
  useHighlight(mapRef, mapReady); 

  return (
    <div className="gravel-guide-container" style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      <NorthArrow map={mapRef.current} />
      <div ref={containerRef} id="map" style={{ width: "100%", height: "100%" }} /> //
      {!mapReady && <div className="map-loading-overlay">Loading Discovery Map...</div>}
    </div>
  );
}