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

    const m =
      String(name).match(/EPSG[:]{0,2}[:]{0,2}(\d{4,5})/i) ||
      String(name).match(/(\d{4,5})/);

    return m ? `EPSG:${m[1]}` : null;
  } catch {
    return null;
  }
}

function getRoadsBeforeLayerId(map: MaplibreMap): string | undefined {
  try {
    const style = map.getStyle?.();
    const layers = style?.layers ?? [];

    // Prefer placing roads directly below POI/cluster layers.
    const poiLayer = layers.find((l: any) =>
      /poi|cluster|marker/i.test(l.id)
    );
    if (poiLayer?.id) return poiLayer.id;

    // Fallback: place below labels/symbol-heavy layers if present.
    const labelLayer = layers.find((l: any) =>
      /label|symbol/i.test(l.id)
    );
    if (labelLayer?.id) return labelLayer.id;

    return undefined;
  } catch {
    return undefined;
  }
}

function normalizeFeatureIds(
  geo: GeoJSONFeatureCollection
): GeoJSONFeatureCollection {
  return {
    ...geo,
    features: geo.features.map((f: any, i: number) => {
      if (f?.id != null) return f;
      const props = f?.properties ?? {};

      return {
        ...f,
        id:
          props.road_id ??
          props.ref ??
          props.id ??
          props.name ??
          `fs-road-${i}`,
      };
    }),
  };
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

    const ensureSourceAndMaybeLayers = async (
      addLayers = !!options?.addLayers
    ) => {
      try {
        const res = await fetch("/data/fs-roads-fcs-web.geojson", {
          cache: "no-store",
        });

        if (!res || !res.ok) {
          console.warn("fs-roads: fetch failed", res && res.status);
          return;
        }

        const geo: GeoJSONFeatureCollection = await res.json();

        if (!geo || !Array.isArray(geo.features)) {
          const empty: GeoJSONFeatureCollection = {
            type: "FeatureCollection",
            features: [],
          };

          const existing = map.getSource("fs-roads") as
            | GeoJSONSource
            | undefined;

          if (existing && typeof existing.setData === "function") {
            try {
              existing.setData(empty);
            } catch {
              try {
                map.removeSource("fs-roads");
                map.addSource("fs-roads", { type: "geojson", data: empty });
              } catch {}
            }
          } else {
            try {
              map.addSource("fs-roads", { type: "geojson", data: empty });
            } catch {}
          }

          console.warn("fs-roads: geojson empty or missing features");
          return;
        }

        const crs = geo.crs || (geo as any).properties?.crs || null;
        const epsg = parseEpsgFromCrs(crs);

        let finalGeo = geo;

        if (epsg && epsg !== "EPSG:4326") {
          try {
            if (epsg === "EPSG:26917") {
              const hasDef = Boolean(
                (proj4 as any).defs && (proj4 as any).defs[epsg]
              );

              if (!hasDef) {
                (proj4 as any).defs(
                  epsg,
                  "+proj=utm +zone=17 +datum=NAD83 +units=m +no_defs"
                );
              }
            }
          } catch {}

          const reprojectCoords = (coords: any): any => {
            if (!Array.isArray(coords)) return coords;

            if (
              typeof coords[0] === "number" &&
              typeof coords[1] === "number"
            ) {
              try {
                return proj4(epsg, "EPSG:4326", coords);
              } catch {
                return coords;
              }
            }

            return coords.map(reprojectCoords);
          };

          finalGeo = JSON.parse(JSON.stringify(geo));

          finalGeo.features = finalGeo.features.map((f: any) => {
            if (f?.geometry?.coordinates) {
              try {
                f.geometry.coordinates = reprojectCoords(
                  f.geometry.coordinates
                );
              } catch {}
            }
            return f;
          });

          console.warn(
            `fs-roads: reprojection applied from ${epsg} to EPSG:4326`
          );
        }

        finalGeo = normalizeFeatureIds(finalGeo);

        if (cancelled) return;

        try {
          const src = map.getSource("fs-roads") as GeoJSONSource | undefined;

          if (src && typeof src.setData === "function") {
            try {
              src.setData(finalGeo as any);
            } catch {
              try {
                map.removeSource("fs-roads");
                map.addSource("fs-roads", {
                  type: "geojson",
                  data: finalGeo as any,
                  generateId: true,
                });
              } catch {}
            }
          } else {
            try {
              map.addSource("fs-roads", {
                type: "geojson",
                data: finalGeo as any,
                generateId: true,
              });
            } catch {}
          }
        } catch (e) {
          console.error("fs-roads: failed to set source data", e);
          return;
        }

        if (cancelled) return;

        if (addLayers) {
          try {
            const beforeId = getRoadsBeforeLayerId(map);

            if (!map.getLayer("fs-roads-line")) {
              map.addLayer(
                {
                  id: "fs-roads-line",
                  type: "line",
                  source: "fs-roads",
                  filter: [
                    "any",
                    ["==", ["geometry-type"], "LineString"],
                    ["==", ["geometry-type"], "MultiLineString"],
                  ],
                  layout: {
                    "line-join": "round",
                    "line-cap": "round",
                  },
                  paint: {
                    "line-color": "#d97706",
                    "line-width": [
                      "interpolate",
                      ["linear"],
                      ["zoom"],
                      6,
                      1.2,
                      10,
                      2.4,
                      13,
                      4.2,
                    ],
                    "line-opacity": 0.8,
                  },
                },
                beforeId
              );
            }

            if (!map.getLayer("fs-roads-hover")) {
              map.addLayer(
                {
                  id: "fs-roads-hover",
                  type: "line",
                  source: "fs-roads",
                  filter: ["==", ["id"], ""],
                  layout: {
                    "line-join": "round",
                    "line-cap": "round",
                  },
                  paint: {
                    "line-color": "#facc15",
                    "line-width": [
                      "interpolate",
                      ["linear"],
                      ["zoom"],
                      6,
                      2.5,
                      10,
                      4.5,
                      13,
                      7,
                    ],
                    "line-opacity": 0.95,
                  },
                },
                beforeId
              );
            }

            if (!map.getLayer("fs-roads-selected")) {
              map.addLayer(
                {
                  id: "fs-roads-selected",
                  type: "line",
                  source: "fs-roads",
                  filter: ["==", ["id"], ""],
                  layout: {
                    "line-join": "round",
                    "line-cap": "round",
                  },
                  paint: {
                    "line-color": "#1d4ed8",
                    "line-width": [
                      "interpolate",
                      ["linear"],
                      ["zoom"],
                      6,
                      3,
                      10,
                      5,
                      13,
                      8,
                    ],
                    "line-opacity": 1,
                  },
                },
                beforeId
              );
            }

            // Reinforce ordering if POI layers got added before this hook ran.
            for (const layerId of [
              "fs-roads-line",
              "fs-roads-hover",
              "fs-roads-selected",
            ]) {
              if (map.getLayer(layerId)) {
                try {
                  const currentBeforeId = getRoadsBeforeLayerId(map);
                  if (currentBeforeId && currentBeforeId !== layerId) {
                    map.moveLayer(layerId, currentBeforeId);
                  }
                } catch {}
              }
            }
          } catch (err) {
            console.warn("useFsRoads: failed to add layers", err);
          }
        }

        onSourceData = (e: any) => {
          if (!e || e.sourceId !== "fs-roads" || !e.isSourceLoaded) return;

          try {
            map.resize();
          } catch {}

          try {
            const coords: number[][] = [];

            finalGeo.features.forEach((f: any) => {
              const g = f.geometry;
              if (!g) return;

              if (g.type === "Point") coords.push(g.coordinates);
              else if (g.type === "LineString") coords.push(...g.coordinates);
              else if (g.type === "MultiLineString") {
                g.coordinates.forEach((arr: any) => coords.push(...arr));
              }
            });

            if (coords.length) {
              const lons = coords.map((c) => c[0]);
              const lats = coords.map((c) => c[1]);

              const sw: [number, number] = [
                Math.min(...lons),
                Math.min(...lats),
              ];
              const ne: [number, number] = [
                Math.max(...lons),
                Math.max(...lats),
              ];

              try {
                map.fitBounds([sw, ne], { padding: 40 });
              } catch {}
            }
          } catch {}

          if (onSourceData) map.off("sourcedata", onSourceData);
        };

        map.on("sourcedata", onSourceData);
      } catch (err) {
        console.error("useFsRoads load error", err);
      }
    };

    if (typeof map.isStyleLoaded === "function" && map.isStyleLoaded()) {
      ensureSourceAndMaybeLayers();
    } else {
      const onLoad = () => {
        if (
          !map.getStyle ||
          typeof map.getStyle !== "function" ||
          !map.getStyle()
        ) {
          setTimeout(() => {
            if (map.isStyleLoaded && map.isStyleLoaded()) {
              ensureSourceAndMaybeLayers();
            }
          }, 50);
          return;
        }

        ensureSourceAndMaybeLayers();
      };

      map.on("load", onLoad);

      removeLoadListener = () => {
        try {
          map.off("load", onLoad);
        } catch {}
      };
    }

    return () => {
      cancelled = true;

      if (onSourceData) {
        try {
          map.off("sourcedata", onSourceData);
        } catch {}
      }

      if (removeLoadListener) removeLoadListener();
    };
  }, [map, mapReady, options?.addLayers]);
}