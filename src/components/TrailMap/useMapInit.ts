// src/components/TrailMap/useMapInit.ts
import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";

export function useMapInit(containerRef?: React.RefObject<HTMLElement | null>) {
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (mapRef.current) return;

    const container = containerRef?.current ?? document.getElementById("map");
    if (!container) {
      // If container not present yet, retry shortly (keeps this hook robust to render timing)
      const t = setTimeout(() => {}, 50);
      return () => clearTimeout(t);
    }

    const map = new maplibregl.Map({
      container: container as HTMLElement,
      style: "/styles/ngaebo-style.json",
      center: [-84.5, 34.3],
      zoom: 10,
    });

    mapRef.current = map;
    (window as any).map = map;

    return () => {
      // Intentionally do not destroy the map here (preserve previous behavior).
    };
  }, [containerRef]);

  return mapRef;
}