/* src/components/RideGuide/widgets/RouteMap/RouteMap.tsx */
import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import useFsRoadsReport from "./useFsRoadsReport";
import usePois from "../../../../features/Discovery/hooks/usePois"; 

import "maplibre-gl/dist/maplibre-gl.css";

interface RouteMapProps {
  routeID: string;
  onRouteSelect: (id: string) => void;
}

// ============================================================================
// 🎨 PRODUCTION-GRADE GRAYSCALE TOPOGRAPHIC STYLING SPECIFICATION
// Declares font stack repositories globally to pass MapLibre v4 vector layer rules
// ============================================================================
const printStyleConfig: maplibregl.StyleSpecification = {
  version: 8,
  // FIXED: Declared font glyph server layout values inline on constructor setup parameters
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  sources: {
    "contours-usgs-raster-source": {
      type: "raster",
      tiles: [
        "https://carto.nationalmap.gov/arcgis/rest/services/contours/MapServer/export?bbox={bbox-epsg-3857}&size=256,256&format=png32&transparent=true&f=image"
      ],
      tileSize: 256
    },
    "transportation-esri-raster-source": {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}"
      ],
      tileSize: 256
    }
  },
  layers: [
    {
      id: "contours-raster-base-layer",
      type: "raster",
      source: "contours-usgs-raster-source",
      paint: {
        "raster-opacity": 0.85,
        "raster-saturation": -1.0,      // Client-side monochrome grayscale rendering conversion loop
        "raster-contrast": 0.35,        // Sharpens your contour lines and text elevation labels
        "raster-brightness-min": 0.05
      }
    },
    {
      id: "transportation-raster-overlay-layer",
      type: "raster",
      source: "transportation-esri-raster-source",
      paint: { 
        "raster-opacity": 0.40,
        "raster-saturation": -1.0,      // Syncs road label typography to match the gray style
        "raster-contrast": 0.15
      }
    }
  ]
};

export default function RouteMap({ routeID, onRouteSelect }: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Build map instance with hardware gesture interactions completely locked out for clean document layout printing
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: printStyleConfig, 
      center: [-84.15, 34.6], 
      zoom: 11,
      attributionControl: false,
      
      // Pin interactions completely locked to safeguard printable layouts
      boxZoom: false,
      scrollZoom: false,
      dragPan: false,
      doubleClickZoom: false,
      touchZoomRotate: false,
      interactive: true, 
    });

    mapRef.current = map;

    map.on("load", () => {
      // EXPOSE WORKSPACE HANDLE TO BROWSERS FOR REAL-TIME F12 PANEL RUNTIME INSPECTION
      (window as any).map = map;
      
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

  // Execute processing steps natively within the mount loop
  useFsRoadsReport(mapRef.current, mapReady, { addLayers: true, routeID });
  usePois(mapRef, mapReady);

  return (
    <div className="rr-map-canvas-wrapper" style={{ width: '100%', height: '100%' }}>
      <div ref={containerRef} className="rr-map-libre-container" style={{ width: '100%', height: '100%' }} />
      {!mapReady && <div className="rr-map-loading">INITIALIZING GIS INFRASTRUCTURE...</div>}
    </div>
  );
}