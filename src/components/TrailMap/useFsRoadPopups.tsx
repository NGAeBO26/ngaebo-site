import { useEffect } from "react";
import type { Map as MaplibreMap } from "maplibre-gl";

export default function useFsRoadPopups(map: MaplibreMap | null | undefined) {
  useEffect(() => {
    if (!map) return;

    let removeLoadListener: (() => void) | null = null;
    let attached = false;

    const attach = () => {
      if (attached) return;
      if (!map.getStyle || typeof map.getStyle !== "function" || !map.getStyle()) return;

      if (map.getLayer && map.getLayer("fs-roads-line")) {
        map.on("click", "fs-roads-line", (e: any) => {
          const props = e.features?.[0]?.properties || {};
          // Replace with your popup creation logic; logging keeps this safe and non-invasive.
          // eslint-disable-next-line no-console
          console.log("fs-roads click", props);
        });
        map.on("mouseenter", "fs-roads-line", () => { try { map.getCanvas().style.cursor = "pointer"; } catch {} });
        map.on("mouseleave", "fs-roads-line", () => { try { map.getCanvas().style.cursor = ""; } catch {} });
      }

      attached = true;
    };

    if (typeof map.isStyleLoaded === "function" && map.isStyleLoaded()) {
      attach();
    } else {
      const onLoad = () => attach();
      map.on("load", onLoad);
      removeLoadListener = () => { try { map.off("load", onLoad); } catch {} };
    }

    return () => {
      if (removeLoadListener) removeLoadListener();
      // If you add explicit listeners that need removal, remove them here.
    };
  }, [map]);
}