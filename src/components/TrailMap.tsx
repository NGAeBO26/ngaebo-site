import * as React from "react";
import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import type { Map as MaplibreMap } from "maplibre-gl";

import useFsRoads from "./TrailMap/useFsRoads";
import useFsRoadPopups from "./TrailMap/useFsRoadPopups";
import usePois from "./TrailMap/usePois";
import { usePoiPopups } from "./TrailMap/usePoiPopups";

import "../styles/trail-map.css";

const STYLE_URL = "/styles/ngaebo-style.json";

const TrailMap: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MaplibreMap | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let mounted = true;
    let createdMap: MaplibreMap | null = null;

    const createMapWithStyle = async () => {
      let styleObj: any = null;

      try {
        const res = await fetch(STYLE_URL, { cache: "no-store" });
        if (res && res.ok) {
          styleObj = await res.json();

          try {
            if (styleObj && Object.prototype.hasOwnProperty.call(styleObj, "projection")) {
              const p = styleObj.projection;
              const isValidProjection =
                p &&
                (typeof p === "string" ||
                  (typeof p === "object" && Object.keys(p).length > 0));

              if (!isValidProjection) {
                delete styleObj.projection;
                console.warn("TrailMap: removed malformed style.projection");
              }
            }
          } catch {
            try { delete styleObj.projection; } catch {}
          }
        } else {
          styleObj = null;
        }
      } catch {
        styleObj = null;
      }

      try {
        createdMap = new maplibregl.Map({
          container: containerRef.current as HTMLElement,
          style: styleObj || STYLE_URL,
          center: [-84.3, 34.2],
          zoom: 8,
        });

        try { (window as any).__ngaebo_map = createdMap; } catch {}

        mapRef.current = createdMap;

        createdMap.on("load", () => {
          if (!mounted) return;
          setMapReady(true);
          setTimeout(() => createdMap!.resize(), 50);
        });

        createdMap.on("error", (e: any) => {
          console.error("TrailMap: map error event", e?.error || e);
        });
      } catch (err) {
        console.error("TrailMap: failed to create map", err);
      }
    };

    createMapWithStyle();

    return () => {
      mounted = false;
      try { delete (window as any).__ngaebo_map; } catch {}
      try { createdMap?.remove(); } catch {}
      mapRef.current = null;
    };
  }, []);

  //
  // FS Roads
  //
  useFsRoads(mapRef.current ?? null, mapReady, { addLayers: true });
  useFsRoadPopups(mapRef.current ?? null);

  //
  // POIs
  //
  usePois(mapRef, mapReady);
  usePoiPopups(mapRef, mapReady);

  return (
    <div className="trail-map">
      <div
        ref={containerRef}
        id="map"
        style={{ width: "100%", height: "100%" }}
      />
      {!mapReady && (
        <div className="map-loading-overlay" aria-hidden>
          Loading map…
        </div>
      )}
    </div>
  );
};

export default TrailMap;