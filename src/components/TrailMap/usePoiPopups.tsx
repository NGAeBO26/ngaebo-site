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

    const m = map;

    function getPoiSymbolLayers() {
      const layers = m.getStyle().layers.map(l => l.id);
      return layers.filter(id => id.startsWith("poi-") && id.includes("symbol"));
    }

    function attach() {
      const poiSymbolLayers = getPoiSymbolLayers();

      // Wait until ALL POI symbol layers exist
      if (poiSymbolLayers.length < 6) {
        console.log("[usePoiPopups] Waiting for all POI symbol layers…", poiSymbolLayers);
        return null;
      }

      console.log("[usePoiPopups] Attaching to:", poiSymbolLayers);

      const popup = new maplibregl.Popup({
        closeButton: true,
        closeOnClick: false,
        offset: [0, -15], // default offset
      });

      const handlers: Array<() => void> = [];

      poiSymbolLayers.forEach(layerId => {
        const onEnter = () => {
          m.getCanvas().style.cursor = "pointer";
        };

        const onLeave = () => {
          m.getCanvas().style.cursor = "";
        };

        // suppress any other click behavior we don't control
        const stopDefault = (e: any) => {
          if (e.originalEvent) {
            e.originalEvent.cancelBubble = true;
          }
        };

        const onClick = (e: any) => {
          const feature = e.features?.[0];
          if (!feature) return;

          const props = feature.properties || {};
          const coords = e.lngLat;

          const name = props.name || props.title || "Point of Interest";
          const desc = props.description || "";

          // --- Per-type popup offset (typed as tuple) ---
          const popupOffset: [number, number] =
            props.poi_type === "camp"
              ? [0, -100]   // camp icons need more lift
              : [0, -15];  // default for all other POIs

          // --- Build popup HTML ---
          let html = `
            <div class="poi-popup">
              <strong>${name}</strong>
          `;

          // Custom CAMP popup with clean URL
          if (props.poi_type === "camp" && props.url) {
            const cleanUrl = props.url.replace(/^https?:\/\//, "");
            html += `
              <div class="poi-desc">
                <a href="${props.url}" target="_blank" rel="noopener noreferrer">
                  ${cleanUrl}
                </a>
              </div>
            `;
          } else if (desc) {
            html += `<div class="poi-desc">${desc}</div>`;
          }

          html += `</div>`;

          // 1) recenter map on the POI
          m.easeTo({
            center: coords,
            duration: 300,
          });

          // 2) after move completes, show popup at centered coords
          const onceMoveEnd = () => {
            m.off("moveend", onceMoveEnd);

            popup
              .setLngLat(m.getCenter())
              .setOffset(popupOffset)   // <-- tuple offset applied here
              .setHTML(html)
              .addTo(m);
          };

          m.on("moveend", onceMoveEnd);
        };

        m.on("mouseenter", layerId, onEnter);
        m.on("mouseleave", layerId, onLeave);
        m.on("click", layerId, stopDefault);
        m.on("click", layerId, onClick);

        handlers.push(() => {
          m.off("mouseenter", layerId, onEnter);
          m.off("mouseleave", layerId, onLeave);
          m.off("click", layerId, stopDefault);
          m.off("click", layerId, onClick);
        });
      });

      return () => {
        handlers.forEach(fn => fn());
        popup.remove();
      };
    }

    let cleanup = attach();
    if (cleanup) return cleanup;

    const onStyle = () => {
      cleanup = attach();
      if (cleanup) {
        m.off("styledata", onStyle);
        (m as any).__poiPopupCleanup = cleanup;
      }
    };

    m.on("styledata", onStyle);

    return () => {
      m.off("styledata", onStyle);
      const c = (m as any).__poiPopupCleanup;
      if (typeof c === "function") c();
    };
  }, [mapRef, mapReady]);
}
