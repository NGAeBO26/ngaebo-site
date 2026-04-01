// src/components/TrailMap/useMapReady.ts
import { useEffect, useState } from "react";
import * as maplibregl from "maplibre-gl";

export function useMapReady(
  mapRef: React.RefObject<maplibregl.Map | null>
) {
  const [map, setMap] = useState<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const m = mapRef.current;

    // If the style is already loaded, promote immediately
    if (m.isStyleLoaded()) {
      setMap(m);
      return;
    }

    // Otherwise wait for the style to finish loading
    const onLoad = () => {
      setMap(m);
    };

    m.on("load", onLoad);

    return () => {
      m.off("load", onLoad);
    };
  }, [mapRef]);

  return map;
}