/* src/features/Discovery/GravelGuide.tsx */
import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import type { Map as MaplibreMap, MapLayerMouseEvent } from "maplibre-gl";

import useFsRoads from "./hooks/useFsRoads";
import usePois from "./hooks/usePois";
import { useHighlight } from "./hooks/useHighlight";
import GravelPopup, { type GravelPopupData } from "./components/GravelPopup";
import { getFeatureBounds, featureToPopupData } from "./utils/utils";

import "../../styles/trail-map.css";

const STYLE_URL = "/styles/ngaebo-style.json";
const FS_ROADS_LAYER_ID = "fs-roads-line";
const FS_ROADS_HOVER_LAYER_ID = "fs-roads-hover";
const FS_ROADS_SELECTED_LAYER_ID = "fs-roads-selected";

window.maplibregl = maplibregl;

interface GravelGuideProps {
  activeHoverId?: string | null;
  filteredRoutes?: any[]; 
  onRouteSelect?: (route: any | null) => void;
  onRoutesLoaded?: (routes: any[]) => void;
  onRouteHover?: (id: string | null) => void;
}

export default function GravelGuide({ 
  activeHoverId, 
  filteredRoutes = [], 
  onRouteSelect, 
  onRoutesLoaded,
  onRouteHover 
}: GravelGuideProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MaplibreMap | null>(null);
  const blinkIntervalRef = useRef<NodeJS.Timeout | null>(null); 

  const [mapReady, setMapReady] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<GravelPopupData | null>(null);
  const [clickedProperties, setClickedProperties] = useState<{ NAME: string; GIS_MILES: string } | null>(null);

  const { routesData } = useFsRoads(mapRef.current ?? null, mapReady, { addLayers: true });
  usePois(mapRef, mapReady);
  useHighlight(mapRef, mapReady);

  // Syncs hovers, handles persistent map clicks, and implements a rhythmic blinking opacity loop on card hover
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;

    if (blinkIntervalRef.current) {
      clearInterval(blinkIntervalRef.current);
      blinkIntervalRef.current = null;
    }

    try {
      if (map.getLayer(FS_ROADS_SELECTED_LAYER_ID)) {
        if (activeHoverId && routesData && routesData.length > 0) {
          const hoveredRouteData = routesData.find((r: any) => r && String(r.id) === String(activeHoverId));
          
          if (hoveredRouteData && hoveredRouteData.properties) {
            const props = hoveredRouteData.properties;
            
            map.setFilter(FS_ROADS_SELECTED_LAYER_ID, [
              "all",
              ["==", ["get", "NAME"], props.NAME ?? ""],
              ["==", ["get", "GIS_MILES"], props.GIS_MILES ?? "0"]
            ]);

            let animationStep = 0;
            
            blinkIntervalRef.current = setInterval(() => {
              if (!map.getLayer(FS_ROADS_SELECTED_LAYER_ID)) return;
              
              animationStep++;
              if (animationStep % 3 === 1) {
                map.setPaintProperty(FS_ROADS_SELECTED_LAYER_ID, "line-width", 8); 
                map.setPaintProperty(FS_ROADS_SELECTED_LAYER_ID, "line-blur", 1.5);
                map.setPaintProperty(FS_ROADS_SELECTED_LAYER_ID, "line-opacity", 0.75);
              } else {
                map.setPaintProperty(FS_ROADS_SELECTED_LAYER_ID, "line-width", 10);
                map.setPaintProperty(FS_ROADS_SELECTED_LAYER_ID, "line-blur", 1);
                map.setPaintProperty(FS_ROADS_SELECTED_LAYER_ID, "line-opacity", 1.0);
              }
            }, 180);

            return; 
          }
        }
        
        map.setPaintProperty(FS_ROADS_SELECTED_LAYER_ID, "line-width", [
          "interpolate",
          ["linear"],
          ["zoom"],
          6, 3,
          10, 5,
          13, 8,
        ]);
        map.setPaintProperty(FS_ROADS_SELECTED_LAYER_ID, "line-blur", 0);
        map.setPaintProperty(FS_ROADS_SELECTED_LAYER_ID, "line-opacity", 1.0);

        if (clickedProperties) {
          map.setFilter(FS_ROADS_SELECTED_LAYER_ID, [
            "all",
            ["==", ["get", "NAME"], clickedProperties.NAME],
            ["==", ["get", "GIS_MILES"], clickedProperties.GIS_MILES]
          ]);
        } else {
          map.setFilter(FS_ROADS_SELECTED_LAYER_ID, ["==", ["get", "NAME"], ""]);
        }
      }
    } catch (e) {
      console.warn("Card list hover sync and blur animation cycle crash intercepted:", e);
    }

    return () => {
      if (blinkIntervalRef.current) {
        clearInterval(blinkIntervalRef.current);
        blinkIntervalRef.current = null;
      }
    };
  }, [activeHoverId, routesData, clickedProperties, mapReady]);

  // Dynamic Map Filter Sync Pass (Manages core orange fill route lines)
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;

    try {
      if (map.getLayer(FS_ROADS_LAYER_ID)) {
        if (!filteredRoutes || filteredRoutes.length === 0) {
          map.setFilter(FS_ROADS_LAYER_ID, ["==", ["get", "NAME"], ""]);
        } 
        else if (routesData && filteredRoutes.length === routesData.length) {
          map.setFilter(FS_ROADS_LAYER_ID, ["has", "NAME"]);
        } 
        else {
          const matchFilterExpression: any = [
            "any",
            ...filteredRoutes.map((route: any) => {
              const props = route.properties ?? {};
              return [
                "all",
                ["==", ["get", "NAME"], props.NAME ?? ""],
                ["==", ["get", "GIS_MILES"], props.GIS_MILES ?? "0"]
              ];
            })
          ];
          map.setFilter(FS_ROADS_LAYER_ID, matchFilterExpression as maplibregl.FilterSpecification);
        }
      }
    } catch (e) {
      console.warn("Dynamic map filter update failed:", e);
    }
  }, [filteredRoutes, routesData, mapReady]);

  useEffect(() => {
    if (routesData && routesData.length > 0 && onRoutesLoaded) {
      onRoutesLoaded(routesData);
    }
  }, [routesData, onRoutesLoaded]);

  const onRouteClick = useCallback(
    (e: MapLayerMouseEvent) => {
      if (!mapRef.current || !e.features || e.features.length === 0) return;
      const map = mapRef.current;
      const f = e.features[0];

      const routeID = f.properties?.profile_id;
      if (routeID) window.open(`/report/${routeID}`, '_blank', 'noopener,noreferrer');

      const popupData = featureToPopupData(f);
      setSelectedRoute(popupData);

      if (f.properties) {
        setClickedProperties({
          NAME: f.properties.NAME ?? "",
          GIS_MILES: f.properties.GIS_MILES ?? "0"
        });
      }

      if (onRouteSelect) {
        onRouteSelect(f);
      }

      const bounds = getFeatureBounds(f);
      if (bounds) {
        try {
          map.fitBounds(bounds, { padding: { top: 40, right: 40, bottom: 260, left: 40 }, duration: 700 });
        } catch {}
      }
    },
    [onRouteSelect]
  );

  const onPoiHover = useCallback((e: MapLayerMouseEvent) => {
    if (!mapRef.current || !e.features || e.features.length === 0) return;
    const map = mapRef.current;
    map.getCanvas().style.cursor = "pointer";
    
    const f = e.features[0];
    if (!f) return;

    const isCluster = f.properties && !!f.properties.point_count;

    try {
      if (isCluster) {
        if (map.getLayer("pois-highlight")) {
          map.setFilter("pois-highlight", ["==", ["id"], f.id ?? ""]);
        }
      } else {
        const featureId = f.properties?.id ?? f.id ?? "";
        if (featureId === "") return;

        if (map.getLayer("pois-highlight")) {
          map.setFilter("pois-highlight", ["==", ["get", "id"], featureId]);
        }
        if (map.getLayer("poi-labels")) {
          map.setFilter("poi-labels", ["all", ["!", ["has", "point_count"]], ["==", ["get", "id"], featureId]]);
        }
      }
    } catch (err) {
      console.warn("POI Hover evaluation failed:", err);
    }
  }, []);

  const onPoiLeave = useCallback(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    map.getCanvas().style.cursor = "";

    try {
      if (map.getLayer("pois-highlight")) {
        map.setFilter("pois-highlight", ["==", ["id"], ""]);
      }
      if (map.getLayer("poi-labels")) {
        map.setFilter("poi-labels", ["all", ["!", ["has", "point_count"]], ["==", ["get", "id"], ""]]);
      }
    } catch (err) {
      console.warn("POI Leave context reset failed:", err);
    }
  }, []);

  const onClusterClick = useCallback(async (e: MapLayerMouseEvent) => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    const layers = ["cluster-hitbox"];
    const features = map.queryRenderedFeatures(e.point, { layers });
    if (!features || !features.length) return;

    const feature = features[0];
    const clusterId = feature.properties?.cluster_id;
    
    const source = map.getSource("pois-all") as maplibregl.GeoJSONSource;
    if (!source || typeof source.getClusterExpansionZoom !== "function") return;

    try {
      const expansionZoom = await source.getClusterExpansionZoom(clusterId);
      const coordinates = (feature.geometry as any).coordinates;

      map.easeTo({
        center: [coordinates[0], coordinates[1]],
        zoom: expansionZoom + 1.5,
        duration: 400,
        essential: true
      });
    } catch (err) {
      console.error("Cluster expansion failed:", err);
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let map: maplibregl.Map | null = null;

    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: STYLE_URL,
        center: [-84.3, 34.2],
        maxBounds: [
          [-86.05, 33.95],
          [-83.05, 35.15],
        ],
        minZoom: 8,
        maxZoom: 15,
      });

      mapRef.current = map;

      map.on("load", () => {
        setMapReady(true);
        if (mapRef.current) {
          try {
            mapRef.current.resize();
          } catch {}
        }
      });

      map.on("error", (e) => {
        if (e.error && e.error.message && e.error.message.includes("projection")) {
          console.warn("Recovered from internal MapLibre projection state mismatch.");
        } else {
          console.error("MapLibre initialization warning:", e);
        }
      });

    } catch (err) {
      console.error("Map rendering crash prevented cleanly:", err);
    }

    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch {}
        mapRef.current = null;
        setMapReady(false);
      }
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;
    let cleanup: (() => void) | null = null;

    const onMouseMove = (e: MapLayerMouseEvent) => {
      if (!mapRef.current) return;
      mapRef.current.getCanvas().style.cursor = "pointer";
      const f = e.features?.[0];
      if (!f) return;

      map.setFilter(FS_ROADS_HOVER_LAYER_ID, ["==", ["id"], f.id || ""]);

      if (f.properties && routesData && routesData.length > 0 && onRouteHover) {
        const match = routesData.find((r: any) => 
          r && r.properties && 
          r.properties.NAME === f.properties.NAME && 
          r.properties.GIS_MILES === f.properties.GIS_MILES
        );
        if (match) {
          onRouteHover(String(match.id));
        }
      }
    };

    const onMouseLeave = () => {
      if (!mapRef.current) return;
      mapRef.current.getCanvas().style.cursor = "";
      mapRef.current.setFilter(FS_ROADS_HOVER_LAYER_ID, ["==", ["id"], ""]);
      if (onRouteHover) onRouteHover(null);
    };

    // FIXED: Bind event listeners directly onto target hitbox layers outside 
    // of an unreliable nested dynamic source event loop handler
    const attachInteractionsWhenReady = () => {
      if (!map.getLayer("fs-roads-hitbox") || !map.getLayer("cluster-hitbox") || !map.getLayer("poi-hitbox")) {
        setTimeout(attachInteractionsWhenReady, 100);
        return;
      }

      // Bind Route Map Events
      map.on("mousemove", "fs-roads-hitbox", onMouseMove);
      map.on("mouseleave", "fs-roads-hitbox", onMouseLeave);
      map.on("click", "fs-roads-hitbox", onRouteClick);

      // Bind Cluster Events
      map.on("click", "cluster-hitbox", onClusterClick);
      map.on("mousemove", "cluster-hitbox", onPoiHover);
      map.on("mouseleave", "cluster-hitbox", onPoiLeave);

      // Bind Single POI Events
      map.on("mousemove", "poi-hitbox", onPoiHover);
      map.on("mouseleave", "poi-hitbox", onPoiLeave);

      cleanup = () => {
        map.off("mousemove", "fs-roads-hitbox", onMouseMove);
        map.off("mouseleave", "fs-roads-hitbox", onMouseLeave);
        map.off("click", "fs-roads-hitbox", onRouteClick);
       
        map.off("click", "cluster-hitbox", onClusterClick);
        map.off("mousemove", "cluster-hitbox", onPoiHover);
        map.off("mouseleave", "cluster-hitbox", onPoiLeave);

        map.off("mousemove", "poi-hitbox", onPoiHover);
        map.off("mouseleave", "poi-hitbox", onPoiLeave);
      };
    };

    attachInteractionsWhenReady();
    return () => { cleanup?.(); };
  }, [mapReady, routesData, onRouteHover, onClusterClick, onPoiHover, onPoiLeave, onRouteClick]);

  return (
    <div className="gravel-guide-container" style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      <div ref={containerRef} id="map" style={{ width: "100%", height: "100%" }} />
      {!mapReady && <div className="map-loading-overlay">Loading Discovery Map...</div>}

      {selectedRoute && (
        <div className="absolute top-4 left-4 z-50 max-w-sm">
          <GravelPopup
            route={selectedRoute}
            onClose={() => {
              setSelectedRoute(null);
              setClickedProperties(null); 
            }}
          />
        </div>
      )}
    </div>
  );
}