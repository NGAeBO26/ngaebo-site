/* src/components/RideGuide/widgets/RouteMap/RouteMap.tsx - AUDITED */
import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import useFsRoadsReport from "./useFsRoadsReport";
import usePoisReport from "./usePoisReport";

import "maplibre-gl/dist/maplibre-gl.css";

const STYLE_URL = "/styles/ngaebo-style.json";

interface RouteMapProps {
  routeID: string;
  onRouteSelect: (id: string) => void;
}

export default function RouteMap({ routeID, onRouteSelect }: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      center: [-84.15, 34.6], 
      zoom: 11,
      attributionControl: false,
      interactive: true,
    });

    mapRef.current = map;

    map.on("load", () => {
      let hoveredId: string | number | null = null;

      map.on("mousemove", "fs-roads-line", (e) => {
        if (e.features && e.features.length > 0) {
          map.getCanvas().style.cursor = "pointer";
          if (hoveredId !== null) {
            map.setFeatureState({ source: "fs-roads", id: hoveredId }, { hover: false });
          }
          hoveredId = e.features?.[0]?.id ?? null;
          if (hoveredId !== null) {
            map.setFeatureState({ source: "fs-roads", id: hoveredId }, { hover: true });
          }
        }
      });

      map.on("mouseleave", "fs-roads-line", () => {
        map.getCanvas().style.cursor = "";
        if (hoveredId !== null) {
          map.setFeatureState({ source: "fs-roads", id: hoveredId }, { hover: false });
        }
        hoveredId = null;
      });

      map.on("click", "fs-roads-line", (e) => {
        if (e.features && e.features.length > 0) {
          const feature = e.features[0];
          
          // --- AUDIT FIX: Use profile_id, NOT ID ---
          const clickedProfileID = feature.properties?.profile_id; 
          
          if (clickedProfileID) {
            console.log(`[Map Click] Shifting context to Profile: ${clickedProfileID}`);
            onRouteSelect(clickedProfileID.toString());
          }
        }
      });

      setTimeout(() => {
        if (mapRef.current) {
          setMapReady(true);
          mapRef.current.resize();
        }
      }, 100);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [onRouteSelect]);

  useFsRoadsReport(mapRef.current, mapReady, { addLayers: true, routeID });
  usePoisReport(mapRef, mapReady, routeID);

  return (
    <div className="rr-map-canvas-wrapper" style={{ width: '100%', height: '100%' }}>
      <div ref={containerRef} className="rr-map-libre-container" style={{ width: '100%', height: '100%' }} />
      {!mapReady && <div className="rr-map-loading">INITIALIZING GIS...</div>}
    </div>
  );
}