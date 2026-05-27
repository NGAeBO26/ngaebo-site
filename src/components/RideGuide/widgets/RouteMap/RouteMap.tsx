/* src/components/RideGuide/widgets/RouteMap/RouteMap.tsx */
import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import useFsRoadsReport from "./useFsRoadsReport";
import NorthArrow from "./NorthArrow";

import "maplibre-gl/dist/maplibre-gl.css";

interface RouteMapProps {
  routeID: string;
  onRouteSelect: (id: string) => void;
}

// Optimized Core Map Specifications Layout
const baseStyleSpecification: maplibregl.StyleSpecification = {
  version: 8,
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
      tileSize: 256,
      maxzoom: 13
    }
  },
  layers: [
    {
      id: "contours-raster-base-layer",
      type: "raster",
      source: "contours-usgs-raster-source",
      paint: {
        "raster-opacity": 0.85,
        "raster-saturation": -1.0,      
        "raster-contrast": 0.35,        
        "raster-brightness-min": 0.05
      }
    },
    {
      id: "transportation-raster-overlay-layer",
      type: "raster",
      source: "transportation-esri-raster-source",
      paint: { 
        "raster-opacity": 0.40,
        "raster-saturation": -1.0,      
        "raster-contrast": 0.15
      }
    }
  ]
};

export default function RouteMap({ routeID, onRouteSelect: _onRouteSelect }: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
      setMapReady(false);
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: baseStyleSpecification, 
      center: [-84.15, 34.6], 
      zoom: 11,
      attributionControl: false,
      boxZoom: false,
      scrollZoom: false,
      dragPan: false,
      doubleClickZoom: false,
      touchZoomRotate: false,
      interactive: true,
      
      transformRequest: (url: string, resourceType: any) => {
        const typeStr = String(resourceType || '').toLowerCase();
        if (typeStr === 'sprite' && url.includes('@2x')) {
          return { url: url.replace('@2x', '') };
        }
        return { url };
      }
    });

    mapRef.current = map;

    // Direct event listener context pass synchronization hotfix
    map.on("load", () => {
      (window as any).map = map;
      setMapReady(true);
      map.resize();
    });

    // Handle styling state changes cleanly on rapid URL switches
    map.on("styledata", () => {
      if (!map.getSource("fs-roads") && map.isStyleLoaded()) {
        setMapReady(false);
        setTimeout(() => setMapReady(true), 50);
      }
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        setMapReady(false);
      }
    };
  }, [routeID]); 

  useFsRoadsReport(mapRef.current, mapReady, { addLayers: true, routeID });

  return (
    <div className="rr-map-canvas-wrapper" style={{ width: '100%', height: '100%' }}>
      <NorthArrow map={mapRef.current} />
      <div 
        ref={containerRef} 
        id="route-report-static-map" 
        style={{ width: '100%', height: '100%' }} 
      />
      {!mapReady && <div className="rr-map-loading">INITIALIZING GIS INFRASTRUCTURE...</div>}
    </div>
  );
}