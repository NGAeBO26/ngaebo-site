/* src/features/Discovery/GravelGuide.tsx */
import { useRef, useMemo, useEffect } from "react"; // 🎯 ADDED EFFECT LISTENER HERE
import maplibregl from "maplibre-gl";
import type { Map as MaplibreMap } from "maplibre-gl";

import useFsRoads from "./hooks/useFsRoads";
import usePois from "./hooks/usePois"; 
import { useHighlight } from "./hooks/useHighlight"; 
import useMapController from "./hooks/useMapController"; 

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

  const { mapReady } = useMapController({ 
    containerRef,
    mapRef,
    routesData,
    filteredRoutes,
    onRoutesLoaded,
    onRegisterResetFn,
    onRegisterZoomFn
  });

  // ============================================================================
  // 🎯 UPDATE: ANCHORED RESIZE INTERCEPTOR & DIAGNOSTIC OBSERVATION HOOK
  // Listens to layout changes. Automatically captures bounding canvas tracking
  // metrics while prompting an asset redraw to completely clear rendering bugs.
  // ============================================================================
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;

    // 📊 CONSOLE DIAGNOSTIC TRACKER: Hooks directly into browser runtime layout mutations
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        console.log(`📊 [DIAGNOSTIC] Map bounding box shifted metrics to: ${width}px × ${height}px`);
        // Forces the internal MapLibre canvas engine layer to adapt coordinate paths instantly
        mapRef.current?.resize();
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    // Small 500ms fallback transition timeout tracking manual state transformations
    const resizeTimer = setTimeout(() => {
      console.log("🗺️ Layout transition detected. Redrawing MapLibre view bounding matrix tracks...");
      mapRef.current?.resize();
    }, 500);

    // Clean execution pipelines safely tearing down listeners on unmount
    return () => {
      observer.disconnect();
      clearTimeout(resizeTimer);
    };
  }, [isTakeoverActive, mapReady]); // Fires tracking triggers whenever shop columns shift space parameters

  usePois(mapRef, mapReady); 
  useHighlight(mapRef, mapReady); 

  return (
    <div className="gravel-guide-container" style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      <NorthArrow map={mapRef.current} />
      <div ref={containerRef} id="map" style={{ width: "100%", height: "100%" }} /> 
      {!mapReady && <div className="map-loading-overlay">Loading Discovery Map...</div>}
    </div>
  );
}