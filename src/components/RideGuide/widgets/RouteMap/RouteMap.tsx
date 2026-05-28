/* src/components/RideGuide/widgets/RouteMap/RouteMap.tsx */
import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import maplibregl from "maplibre-gl";
import useFsRoadsReport from "./useFsRoadsReport";
import NorthArrow from "./NorthArrow";

import "maplibre-gl/dist/maplibre-gl.css";

interface RouteMapProps {
  routeID: string;
  onRouteSelect: (id: string) => void;
}

const baseStyleSpecification: maplibregl.StyleSpecification = {
  version: 8,
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  sources: {
    "custom-rideguide-raster-source": {
      type: "raster",
      tiles: [
        "https://ngaebo-maptiles.nyc3.cdn.digitaloceanspaces.com/rideguide_tiles/{z}/{x}/{y}.png"
      ],
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

// 🎯 Ref-forwarded component to allow direct DOM snapshot targeting
const RouteMap = forwardRef<HTMLDivElement, RouteMapProps>(
  ({ routeID, onRouteSelect: _onRouteSelect }, ref) => {
    const internalContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const [mapReady, setMapReady] = useState(false);

    // Synchronize the external forwarded ref hook with our internal wrapper node
    useImperativeHandle(ref, () => internalContainerRef.current!);

    useEffect(() => {
      if (!internalContainerRef.current) return;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        setMapReady(false);
      }

      const map = new maplibregl.Map({
        container: internalContainerRef.current,
        style: baseStyleSpecification, 
        center: [-84.15, 34.6], 
        zoom: 11,
        preserveDrawingBuffer: true, // Flawlessly retained for canvas capturing
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
      <div 
        ref={internalContainerRef} 
        id="route-report-static-map" 
        className="rr-map-canvas-wrapper" 
        style={{ position: 'relative', width: '100%', height: '100%' }}
      >
        <NorthArrow map={mapRef.current} />
        {!mapReady && <div className="rr-map-loading">INITIALIZING GIS INFRASTRUCTURE...</div>}
      </div>
    );
  }
);

RouteMap.displayName = "RouteMap";
export default RouteMap;