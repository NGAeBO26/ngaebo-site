/* src/components/RideGuide/widgets/RouteMap/usePoisReport.ts */
import { useEffect } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";

export default function usePoisReport(
  mapRef: React.MutableRefObject<MapLibreMap | null>,
  mapReady: boolean,
  routeID: string
) {
  const ALL_SOURCE = "pois-all";

  const loadPng = (url: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = url;
      img.onload = () => resolve(img);
      img.onerror = reject;
    });

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    let cancelled = false;

    async function registerIcon(id: string, src: string) {
      if (!map) return; // Null Guard
      if (!map.hasImage(id)) {
        try {
          const img = await loadPng(src);
          map.addImage(id, img, { pixelRatio: 2 });
        } catch (e) { return; }
      }
      const layerId = `poi-${id}-symbol`;
      if (!map.getLayer(layerId)) {
        map.addLayer({
          id: layerId,
          type: "symbol",
          source: ALL_SOURCE,
          filter: ["all", ["==", ["get", "poi_type"], id], ["!", ["has", "point_count"]]],
          layout: {
            "icon-image": id,
            "icon-size": 0.8,
            "icon-anchor": "bottom",
            "icon-offset": [0, -12],
            "icon-allow-overlap": true,
          },
        });
      }
    }

    async function initPois() {
      if (cancelled || !map) return; // Null Guard

      let allGeojson: any = { type: "FeatureCollection", features: [] };
      try {
        const resp = await fetch("/data/pois.geojson");
        if (resp.ok) allGeojson = await resp.json();
      } catch {}

      if (!map.getSource(ALL_SOURCE)) {
        map.addSource(ALL_SOURCE, {
          type: "geojson",
          data: allGeojson,
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 40,
        });
      }

      await Promise.all([
        registerIcon("gap", "/icons/gap.png"),
        registerIcon("camp", "/icons/camp.png"),
        registerIcon("water", "/icons/water.png"),
        registerIcon("scenic", "/icons/scenic.png"),
        registerIcon("ranger", "/icons/ranger.png"),
        registerIcon("hazard", "/icons/hazard.png")
      ]);
    }

    initPois();
    return () => { cancelled = true; };
  }, [mapRef, mapReady, routeID]);
}