/* src/components/RideGuide/widgets/RouteMap/useFsRoadsReport.tsx */
import { useEffect } from "react";
import proj4 from "proj4";
import type { Map as MaplibreMap } from "maplibre-gl";

type GeoJSONFeatureCollection = {
  type: "FeatureCollection";
  features: any[];
  crs?: any;
  [k: string]: any;
};

// Define the UTM Zone 16N projection string for proj4
const UTM_16N = "+proj=utm +zone=16 +datum=NAD83 +units=m +no_defs";
const WGS84 = "EPSG:4326";

/* --- HELPER FUNCTIONS --- */
function parseEpsgFromCrs(crs: any): string | null {
  try {
    if (!crs) return null;
    const name = crs.properties?.name || crs.name || null;
    if (!name) return null;
    const m = String(name).match(/EPSG[:]{0,2}[:]{0,2}(\d{4,5})/i) || String(name).match(/(\d{4,5})/);
    return m ? `EPSG:${m[1]}` : null;
  } catch { return null; }
}

function normalizeFeatureIds(geo: GeoJSONFeatureCollection): GeoJSONFeatureCollection {
  return {
    ...geo,
    features: geo.features.map((f, i) => ({
      ...f,
      id: f.id !== undefined ? f.id : (f.properties?.fid !== undefined ? f.properties.fid : i),
    })),
  };
}

function getRoadsBeforeLayerId(map: MaplibreMap): string | undefined {
  const style = map.getStyle?.();
  const layers = style?.layers ?? [];
  const poiLayer = layers.find((l: any) => /poi|cluster|marker/i.test(l.id));
  return poiLayer?.id;
}

export default function useFsRoadsReport(
  map: MaplibreMap | null | undefined,
  mapReady: boolean | undefined,
  options: { addLayers?: boolean; routeID: string }
) {
  useEffect(() => {
    if (!map || !mapReady) return;

    let cancelled = false;

    const ensureSourceAndMaybeLayers = async () => {
      try {
        // FETCHING YOUR SPECIFIC TEST DATA
        const res = await fetch("/data/v3_large_sample_testfeatures.geojson", { cache: "no-store" });
        if (!res || !res.ok) return;

        const geo: GeoJSONFeatureCollection = await res.json();
        const epsg = parseEpsgFromCrs(geo.crs || (geo as any).properties?.crs);

        let finalGeo = geo;
        
        // REPROJECTION LOGIC FOR UTM ZONE 16N (EPSG:26916)
        if (epsg === "EPSG:26916" || (geo as any).name?.includes("26916")) {
            try {
                finalGeo.features.forEach((f: any) => {
                    if (f.geometry.type === "LineString") {
                        f.geometry.coordinates = f.geometry.coordinates.map((c: any) => proj4(UTM_16N, WGS84, c));
                    } else if (f.geometry.type === "MultiLineString") {
                        f.geometry.coordinates = f.geometry.coordinates.map((line: any) => 
                          line.map((c: any) => proj4(UTM_16N, WGS84, c))
                        );
                    }
                });
            } catch (e) { console.warn("Reprojection error", e); }
        }

        finalGeo = normalizeFeatureIds(finalGeo);
        if (cancelled) return;

        // Initialize Source
        if (!map.getSource("fs-roads")) {
          map.addSource("fs-roads", { 
            type: "geojson", 
            data: finalGeo as any, 
            generateId: true 
          });
        }

        if (options.addLayers) {
          const beforeId = getRoadsBeforeLayerId(map);
          
          // 1. BASE LINE LAYER
          if (!map.getLayer("fs-roads-line")) {
            map.addLayer({
              id: "fs-roads-line",
              type: "line",
              source: "fs-roads",
              paint: { 
                "line-color": "#236ea0", 
                "line-width": 2.5,
                "line-opacity": 0.5 
              },
            }, beforeId);
          }

          // 2. HOVER HIGHLIGHT
          if (!map.getLayer("fs-roads-hover")) {
            map.addLayer({
              id: "fs-roads-hover",
              type: "line",
              source: "fs-roads",
              paint: {
                "line-color": "#236ea0",
                "line-width": 5,
                "line-opacity": ["case", ["boolean", ["feature-state", "hover"], false], 1, 0]
              }
            }, beforeId);
          }

          // 3. SELECTED ROUTE (Heritage Orange)
          if (!map.getLayer("fs-roads-selected")) {
            map.addLayer({
              id: "fs-roads-selected",
              type: "line",
              source: "fs-roads",
              paint: {
                "line-color": "#e66e00", 
                "line-width": 5.5
              },
              filter: ["==", ["get", "ID"], options.routeID]
            }, beforeId);
          }
        }

        // Fit bounds to reprojected data
        const coords: number[][] = [];
        finalGeo.features.forEach((f: any) => {
          if (f.geometry.type === "LineString") coords.push(...f.geometry.coordinates);
          else if (f.geometry.type === "MultiLineString") f.geometry.coordinates.forEach((l: any) => coords.push(...l));
        });
        if (coords.length) {
          const lons = coords.map(c => c[0]);
          const lats = coords.map(c => c[1]);
          map.fitBounds([[Math.min(...lons), Math.min(...lats)], [Math.max(...lons), Math.max(...lats)]], { padding: 50 });
        }

      } catch (err) { console.error("useFsRoads load error", err); }
    };

    if (map.isStyleLoaded()) ensureSourceAndMaybeLayers();
    else map.on("load", ensureSourceAndMaybeLayers);

    return () => { cancelled = true; };
  }, [map, mapReady, options.routeID, options.addLayers]);
}