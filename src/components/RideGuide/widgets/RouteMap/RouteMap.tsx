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

// Production Map Stylesheet Specification pointing to your exact DigitalOcean Spaces configuration path
const baseStyleSpecification: maplibregl.StyleSpecification = {
  version: 8,
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  sources: {
    "custom-rideguide-raster-source": {
      type: "raster",
      tiles: [
        // 🎯 FIXED URL PATH: Removes the extra directory segment to fetch your files cleanly
        "https://ngaebo-maptiles.nyc3.cdn.digitaloceanspaces.com/rideguide_tiles/{z}/{x}/{y}.png"
      ],
      // Enforces high-DPI retina rendering by double-sampling the 256px raw inputs
      tileSize: 128, 
      maxzoom: 15
    }
  },
  layers: [
    {
      id: "custom-basemap-layer",
      type: "raster",
      source: "custom-rideguide-raster-source",
      paint: {
        "raster-opacity": 1.0
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
      preserveDrawingBuffer: true,
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

    map.on("load", () => {
      (window as any).map = map;
      setMapReady(true);
      map.resize();
    });

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
    <div className="rr-map-canvas-wrapper" style={{ position: 'relative', width: '100%', height: '100%' }}>
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