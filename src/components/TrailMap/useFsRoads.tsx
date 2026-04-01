import { useEffect } from "react";
import proj4 from "proj4";
import type { Map as MaplibreMap, GeoJSONSource } from "maplibre-gl";

type GeoJSONFeatureCollection = {
  type: "FeatureCollection";
  features: any[];
  crs?: any;
  [k: string]: any;
};

function parseEpsgFromCrs(crs: any): string | null {
  try {
    if (!crs) return null;
    const name = crs.properties?.name || crs.name || null;
    if (!name) return null;
    const m = String(name).match(/EPSG[:]{0,2}[:]{0,2}(\d{4,5})/i) || String(name).match(/(\d{4,5})/);
    return m ? `EPSG:${m[1]}` : null;
  } catch {
    return null;
  }
}

export default function useFsRoads(
  map: MaplibreMap | null | undefined,
  mapReady?: boolean,
  options?: { addLayers?: boolean }
) {
  useEffect(() => {
    if (!map) return;
    if (mapReady === false) return;

    let cancelled = false;
    let onSourceData: ((e: any) => void) | null = null;
    let removeLoadListener: (() => void) | null = null;

    const ensureSourceAndMaybeLayers = async (addLayers = !!options?.addLayers) => {
      try {
        const res = await fetch("/data/fs-roads-fcs.geojson", { cache: "no-store" });
        if (!res || !res.ok) {
          // eslint-disable-next-line no-console
          console.warn("fs-roads: fetch failed", res && res.status);
          return;
        }

        const geo: GeoJSONFeatureCollection = await res.json();

        if (!geo || !Array.isArray(geo.features)) {
          const empty: GeoJSONFeatureCollection = { type: "FeatureCollection", features: [] };
          const existing = map.getSource("fs-roads") as GeoJSONSource | undefined;
          if (existing && typeof existing.setData === "function") {
            try { existing.setData(empty); } catch {
              try { map.removeSource("fs-roads"); map.addSource("fs-roads", { type: "geojson", data: empty }); } catch {}
            }
          } else {
            try { map.addSource("fs-roads", { type: "geojson", data: empty }); } catch {}
          }
          // eslint-disable-next-line no-console
          console.warn("fs-roads: geojson empty or missing features");
          return;
        }

        const crs = geo.crs || (geo as any).properties?.crs || null;
        const epsg = parseEpsgFromCrs(crs);

        let finalGeo = geo;

        if (epsg && epsg !== "EPSG:4326") {
          try {
            if (epsg === "EPSG:26917") {
              const hasDef = Boolean((proj4 as any).defs && (proj4 as any).defs[epsg]);
              if (!hasDef) {
                (proj4 as any).defs(epsg, "+proj=utm +zone=17 +datum=NAD83 +units=m +no_defs");
              }
            }
          } catch {}

          const reprojectCoords = (coords: any): any => {
            if (!Array.isArray(coords)) return coords;
            if (typeof coords[0] === "number" && typeof coords[1] === "number") {
              try { return proj4(epsg, "EPSG:4326", coords); } catch { return coords; }
            }
            return coords.map(reprojectCoords);
          };

          finalGeo = JSON.parse(JSON.stringify(geo));
          finalGeo.features = finalGeo.features.map((f: any) => {
            if (f && f.geometry && f.geometry.coordinates) {
              try { f.geometry.coordinates = reprojectCoords(f.geometry.coordinates); } catch {}
            }
            return f;
          });

          // eslint-disable-next-line no-console
          console.warn(`fs-roads: reprojection applied from ${epsg} to EPSG:4326`);
        }

        if (cancelled) return;

        try {
          const src = map.getSource("fs-roads") as GeoJSONSource | undefined;
          if (src && typeof src.setData === "function") {
            try { src.setData(finalGeo); } catch {
              try { map.removeSource("fs-roads"); map.addSource("fs-roads", { type: "geojson", data: finalGeo }); } catch {}
            }
          } else {
            try { map.addSource("fs-roads", { type: "geojson", data: finalGeo }); } catch {}
          }
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error("fs-roads: failed to set source data", e);
          return;
        }

        if (cancelled) return;

        if (addLayers) {
          try {
            // Insert line layer above many base layers; if your style has a specific layer to insert before,
            // replace 'waterway-label' with that id. Guards prevent duplicates.
            if (!map.getLayer("fs-roads-line")) {
              // find a sensible beforeId: try to place above labels but below UI; fallback to top
              const style = map.getStyle && map.getStyle();
              const beforeId = (style && Array.isArray(style.layers) && style.layers.find(l => /label|road|waterway/i.test(l.id))?.id) || undefined;
              map.addLayer({
                id: "fs-roads-line",
                type: "line",
                source: "fs-roads",
                layout: { "line-join": "round", "line-cap": "round" },
                paint: {
                  "line-color": "#ff7a00",
                  "line-width": ["interpolate", ["linear"], ["zoom"], 6, 1, 12, 3],
                  "line-opacity": 0.95
                }
              }, beforeId);
            }

            if (!map.getLayer("fs-poi-symbol")) {
              map.addLayer({
                id: "fs-poi-symbol",
                type: "symbol",
                source: "fs-roads",
                filter: ["==", ["geometry-type"], "Point"],
                layout: {
                  "icon-image": "marker-15",
                  "icon-size": 1,
                  "text-field": ["coalesce", ["get", "name"], ["get", "title"]],
                  "text-offset": [0, 1.2],
                  "text-anchor": "top"
                },
                paint: { "text-color": "#06203a" }
              });
            }
          } catch (err) {
            // eslint-disable-next-line no-console
            console.warn("useFsRoads: failed to add layers", err);
          }
        }

        onSourceData = (e: any) => {
          if (!e || e.sourceId !== "fs-roads" || !e.isSourceLoaded) return;
          try { map.resize(); } catch {}
          try {
            const coords: number[][] = [];
            finalGeo.features.forEach((f: any) => {
              const g = f.geometry;
              if (!g) return;
              if (g.type === "Point") coords.push(g.coordinates);
              else if (g.type === "LineString") coords.push(...g.coordinates);
              else if (g.type === "MultiLineString") g.coordinates.forEach((arr: any) => coords.push(...arr));
            });
            if (coords.length) {
              const lons = coords.map(c => c[0]);
              const lats = coords.map(c => c[1]);
              const sw: [number, number] = [Math.min(...lons), Math.min(...lats)];
              const ne: [number, number] = [Math.max(...lons), Math.max(...lats)];
              try { map.fitBounds([sw, ne], { padding: 40 }); } catch {}
            }
          } catch {}
          if (onSourceData) map.off("sourcedata", onSourceData);
        };

        map.on("sourcedata", onSourceData);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("useFsRoads load error", err);
      }
    };

    if (typeof map.isStyleLoaded === "function" && map.isStyleLoaded()) {
      ensureSourceAndMaybeLayers();
    } else {
      const onLoad = () => {
        if (!map.getStyle || typeof map.getStyle !== "function" || !map.getStyle()) {
          setTimeout(() => { if (map.isStyleLoaded && map.isStyleLoaded()) ensureSourceAndMaybeLayers(); }, 50);
          return;
        }
        ensureSourceAndMaybeLayers();
      };
      map.on("load", onLoad);
      removeLoadListener = () => { try { map.off("load", onLoad); } catch {} };
    }

    return () => {
      cancelled = true;
      if (onSourceData) {
        try { map.off("sourcedata", onSourceData); } catch {}
      }
      if (removeLoadListener) removeLoadListener();
    };
  }, [map, mapReady, options?.addLayers]);
}