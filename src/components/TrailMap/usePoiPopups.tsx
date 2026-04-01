import { useEffect } from "react";
import * as maplibregl from "maplibre-gl";
import type { Map as MapLibreMap } from "maplibre-gl";

export function usePoiPopups(
  mapRef: React.RefObject<MapLibreMap | null>,
  mapReady: boolean
) {
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    // capture a non-null local reference for nested handlers
    const m = map;

    function attach() {
      if (!m.getLayer("pois-unclustered")) return;

      const popup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
      });

      const onEnter = (e: any) => {
        m.getCanvas().style.cursor = "pointer";
        const feature = e.features && e.features[0];

        // robust coords: handle Point or wrapped arrays
        const coords = (feature && feature.geometry && feature.geometry.coordinates)
          ? (Array.isArray(feature.geometry.coordinates[0]) ? feature.geometry.coordinates[0] : feature.geometry.coordinates)
          : [e.lngLat.lng, e.lngLat.lat];

        const nameRaw = feature?.properties?.name ?? "POI";
        const escapeHtml = (s: any) =>
          String(s)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

        const safeName = escapeHtml(nameRaw);
        popup.setLngLat(coords).setHTML(`<div>${safeName}</div>`).addTo(m);
      };

      const onLeave = () => {
        m.getCanvas().style.cursor = "";
        popup.remove();
      };

      m.on("mouseenter", "pois-unclustered", onEnter);
      m.on("mouseleave", "pois-unclustered", onLeave);

      return () => {
        m.off("mouseenter", "pois-unclustered", onEnter);
        m.off("mouseleave", "pois-unclustered", onLeave);
        popup.remove();
      };
    }

    if (map.getLayer("pois-unclustered")) {
      const cleanup = attach();
      return cleanup;
    } else {
      const onStyle = () => {
        if (m.getLayer("pois-unclustered")) {
          m.off("styledata", onStyle);
          const cleanup = attach();
          (m as any).__poiPopupCleanup = cleanup;
        }
      };
      m.on("styledata", onStyle);
      return () => {
        m.off("styledata", onStyle);
        const c = (m as any).__poiPopupCleanup;
        if (typeof c === "function") c();
      };
    }
  }, [mapRef, mapReady]);
}