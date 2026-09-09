/* src/components/RideGuide/widgets/RouteMap/useFsRoadsReport.tsx */
import { useEffect } from "react";
import proj4 from "proj4";
import type { Map as MaplibreMap, LngLatBoundsLike } from "maplibre-gl";

type GeoJSONFeatureCollection = {
  type: "FeatureCollection";
  features: any[];
  crs?: any;
  [k: string]: any;
};

const UTM_16N = "+proj=utm +zone=16 +datum=NAD83 +units=m +no_defs";
const WGS84 = "EPSG:4326";

function parseEpsgFromCrs(crs: any): string | null {
  try {
    if (!crs) return null;
    const name = crs.properties?.name || crs.name || null;
    if (!name) return null;
    const m = String(name).match(/EPSG[:]{0,2}[:]{0,2}(\d{4,5})/i) || String(name).match(/(\d{4,5})/);
    return m ? `EPSG:${m[1]}` : null;
  } catch { return null; }
}

function getRoadsBeforeLayerId(map: MaplibreMap): string | undefined {
  const style = map.getStyle?.();
  const layers = style?.layers ?? [];
  
  const poiLayer = layers.find((l: any) => /poi|cluster|marker/i.test(l.id));
  if (poiLayer) return poiLayer.id;
  
  const esriOverlayLayer = layers.find((l: any) => /transportation|overlay/i.test(l.id));
  if (esriOverlayLayer) {
    const activeIndex = layers.indexOf(esriOverlayLayer);
    if (activeIndex < layers.length - 1) {
      return layers[activeIndex + 1].id;
    }
  }
  
  return undefined;
}

export default function useFsRoadsReport(
  map: MaplibreMap | null | undefined,
  mapReady: boolean | undefined,
  options: { addLayers?: boolean; routeID: string; isPopupContext?: boolean }
) {
  useEffect(() => {
    if (!map || !mapReady || !options.routeID || options.routeID === "null" || options.routeID === "undefined") return;

    let cancelled = false;

    const loadPng = (url: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = url;
        img.onload = () => resolve(img);
        img.onerror = reject;
      });

    const cleanupHighlightLayers = () => {
      try {
        if (map.getLayer("rr-legend-poi-labels")) map.removeLayer("rr-legend-poi-labels");
        if (map.getLayer("rr-legend-poi-icons")) map.removeLayer("rr-legend-poi-icons");
        if (map.getSource("rr-legend-poi-source")) map.removeSource("rr-legend-poi-source");
        if (map.getLayer("fs-roads-selected")) map.removeLayer("fs-roads-selected");
        if (map.getLayer("fs-roads-casing")) map.removeLayer("fs-roads-casing");
        if (map.getSource("fs-roads")) map.removeSource("fs-roads");
      } catch (e) {}
    };

    const ensureSourceAndMaybeLayers = async () => {
      try {
        let roadMinLng = Infinity, roadMinLat = Infinity, roadMaxLng = -Infinity, roadMaxLat = -Infinity;
        let roadBoundsValid = false;

        const locationsDir = '/data/locations';
        const segmentsDir = '/data/segments';
        
        // ----------------------------------------------------------------------------
        // 💾 PHASE 1: FETCH DATASET PAYLOADS (WITH EXTENSION FALLBACKS)
        // ----------------------------------------------------------------------------
        let poiMetaRes: Response | null = null;
        try {
          poiMetaRes = await fetch(`${locationsDir}/${options.routeID}_pois.json`, { cache: "no-store" });
          if (!poiMetaRes.ok) {
            poiMetaRes = await fetch(`${locationsDir}/${options.routeID}_pois.geojson`, { cache: "no-store" });
          }
        } catch (e) {}

        let segmentsRes: Response | null = null;
        const segmentCandidates = [
          `${segmentsDir}/${options.routeID}_segments.json`,
          `${segmentsDir}/${options.routeID}_segments.geojson`,
          `${segmentsDir}/${options.routeID}_segment.json`,
          `${segmentsDir}/${options.routeID}_segment.geojson`
        ];

        for (const candidateUrl of segmentCandidates) {
          try {
            const res = await fetch(candidateUrl, { cache: "no-store" });
            if (res.ok) {
              segmentsRes = res;
              break;
            }
          } catch (e) {}
        }
        
        if (!segmentsRes || !segmentsRes.ok) return;

        const geo: GeoJSONFeatureCollection = await segmentsRes.json();
        if (!geo || geo.type !== "FeatureCollection" || !Array.isArray(geo.features)) return;

        if (cancelled) return;
        cleanupHighlightLayers();

        // ----------------------------------------------------------------------------
        // 🗺️ PHASE 2: INJECT TRAIL RIBBON LINEWORK
        // ----------------------------------------------------------------------------
        const epsg = parseEpsgFromCrs(geo.crs || (geo as any).properties?.crs);
        let finalGeo = geo;
        
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

        map.addSource("fs-roads", { 
          type: "geojson", 
          data: finalGeo as any, 
          generateId: false 
        });

        if (options.addLayers) {
          const baseAnchorId = getRoadsBeforeLayerId(map);
          
          if (!map.getLayer("fs-roads-casing")) {
            map.addLayer({
              id: "fs-roads-casing",
              type: "line",
              source: "fs-roads",
              layout: {
                "line-join": "round",
                "line-cap": "round"
              },
              paint: {
                "line-color": "#333", 
                "line-width": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  9,  7.5,
                  11, 6.0,
                  13, 4.5,
                  15, 4.0
                ]
              }
            }, baseAnchorId);
          }

          if (!map.getLayer("fs-roads-selected")) {
            map.addLayer({
              id: "fs-roads-selected",
              type: "line",
              source: "fs-roads",
              layout: {
                "line-join": "miter",
                "line-cap": "butt",
                "line-miter-limit": 1.5
              },
              paint: {
                "line-color": [
                  "step",
                  ["get", "grade"],
                  "#236ea0",
                  -4, "#4a5d23",
                  0, "#1b7f3a",
                  4, "#ebc850",
                  8, "#e66e00",
                  12, "#a52d23"
                ],
                "line-width": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  9,  6.0,
                  11, 4.5,
                  13, 3.0,
                  15, 2.5
                ]
              }
            }, baseAnchorId);
          }
        }

        // ----------------------------------------------------------------------------
        // 📍 PHASE 3: INJECT POI SYMBOLS AND TEXT OVERLAYS
        // ----------------------------------------------------------------------------
        let highlightGeoJson: GeoJSONFeatureCollection = {
          type: "FeatureCollection",
          features: []
        };
        let poiCoordsList: [number, number][] = [];

        if (poiMetaRes && poiMetaRes.ok) {
          try {
            const poiMetaData = await poiMetaRes.json();
            const locationsList = (poiMetaData.locations || []).slice(0, 5);

            locationsList.forEach((loc: any, idx: number) => {
              if (loc.lat !== undefined && loc.lng !== undefined) {
                const lngNum = Number(loc.lng);
                const latNum = Number(loc.lat);
                const indexMarker = String(idx + 1);

                if (!isNaN(lngNum) && !isNaN(latNum) && Math.abs(latNum) <= 90) {
                  let cleanIconKey = "scenic";
                  const typeStr = String(loc.type || '').toLowerCase();
                  if (typeStr.includes("gap")) cleanIconKey = "gap";
                  else if (typeStr.includes("camp")) cleanIconKey = "camp";
                  else if (typeStr.includes("water") || typeStr.includes("fall")) cleanIconKey = "water";
                  else if (typeStr.includes("trail")) cleanIconKey = "trailhead";

                  highlightGeoJson.features.push({
                    type: "Feature",
                    id: Number(indexMarker),
                    geometry: { type: "Point", coordinates: [lngNum, latNum] },
                    properties: {
                      legend_index: indexMarker,
                      icon_image_id: `icon-${cleanIconKey}`
                    }
                  });
                  poiCoordsList.push([lngNum, latNum]);
                }
              }
            });
          } catch (e) {}
        }

        if (highlightGeoJson.features.length > 0 && !cancelled) {
          const iconTypes = ["gap", "camp", "water", "scenic", "trailhead"];
          for (const type of iconTypes) {
            const iconId = `icon-${type}`;
            if (!map.hasImage(iconId)) {
              try {
                const img = await loadPng(`/icons/${type}.png`);
                if (!cancelled) map.addImage(iconId, img, { pixelRatio: 2 });
              } catch (e) {}
            }
          }

          if (cancelled) return;

          map.addSource("rr-legend-poi-source", {
            type: "geojson",
            data: highlightGeoJson as any,
            cluster: false
          });

          map.addLayer({
            id: "rr-legend-poi-icons",
            type: "symbol",
            source: "rr-legend-poi-source",
            layout: {
              "icon-image": ["get", "icon_image_id"],
              "icon-size": ["interpolate", ["linear"], ["zoom"], 11, 0.45, 14, 0.80],
              "icon-allow-overlap": true,
              "icon-ignore-placement": true,
              "icon-anchor": "center"
            }
          });

          map.addLayer({
            id: "rr-legend-poi-labels",
            type: "symbol",
            source: "rr-legend-poi-source",
            layout: {
              "text-field": ["concat", "[", ["get", "legend_index"], "]"],
              "text-size": ["interpolate", ["linear"], ["zoom"], 11, 10, 14, 13],
              "text-anchor": "top",
              "text-offset": ["interpolate", ["linear"], ["zoom"], 11, ["literal", [0, 0.5]], 14, ["literal", [0, 0.9]]],
              "text-allow-overlap": true,
              "text-ignore-placement": true,
              "text-justify": "center"
            },
            paint: {
              "text-color": "#e66e00",
              "text-halo-width": 3.0,
              "text-halo-color": "#ffffff"
            }
          });
        }

        // ----------------------------------------------------------------------------
        // 📐 PHASE 4: BOUNDING BOX COMPUTATION & CAMERA FIT
        // ----------------------------------------------------------------------------
        map.resize();

        finalGeo.features.forEach((feat: any) => {
          if (feat.geometry && feat.geometry.coordinates) {
            const rawCoords = feat.geometry.coordinates;
            const extractPoints = (arr: any) => {
              if (typeof arr[0] === 'number' && typeof arr[1] === 'number') {
                const lng = Number(arr[0]);
                const lat = Number(arr[1]);
                if (!isNaN(lng) && !isNaN(lat) && Math.abs(lat) <= 90) {
                  if (lng < roadMinLng) roadMinLng = lng;
                  if (lat < roadMinLat) roadMinLat = lat;
                  if (lng > roadMaxLng) roadMaxLng = lng;
                  if (lat > roadMaxLat) roadMaxLat = lat;
                  roadBoundsValid = true;
                }
                return;
              }
              if (Array.isArray(arr)) {
                for (let i = 0; i < arr.length; i++) { extractPoints(arr[i]); }
              }
            };
            extractPoints(rawCoords);
          }
        });

        if (roadBoundsValid && Number.isFinite(roadMinLng)) {
          let finalMinLng = roadMinLng;
          let finalMinLat = roadMinLat;
          let finalMaxLng = roadMaxLng;
          let finalMaxLat = roadMaxLat;

          const roadDeltaLng = roadMaxLng - roadMinLng;
          const roadDeltaLat = roadMaxLat - roadMinLat;
          const maxExpansionThresholdLng = roadDeltaLng * 0.15;
          const maxExpansionThresholdLat = roadDeltaLat * 0.15;

          poiCoordsList.forEach(([pLng, pLat]) => {
            if (pLng < finalMinLng) finalMinLng = Math.max(pLng, roadMinLng - maxExpansionThresholdLng);
            if (pLat < finalMinLat) finalMinLat = Math.max(pLat, roadMinLat - maxExpansionThresholdLat);
            if (pLng > finalMaxLng) finalMaxLng = Math.min(pLng, roadMaxLng + maxExpansionThresholdLng);
            if (pLat > finalMaxLat) finalMaxLat = Math.min(pLat, roadMaxLat + maxExpansionThresholdLat);
          });

          const boundsArray = [[finalMinLng, finalMinLat], [finalMaxLng, finalMaxLat]];
          const deltaLng = Math.abs(finalMaxLng - finalMinLng);
          const deltaLat = Math.abs(finalMaxLat - finalMinLat);

          // 🎯 ORIENTATION-AWARE ROTATION ENGINE (VERTICAL MAP VIEWPORT MATCH):
          // In tall vertical map viewports (both Report and GravelPopup middle column),
          // horizontal routes (deltaLng > deltaLat) rotate by -90deg to orient vertically.
          const dynamicBearing = deltaLng > deltaLat ? -90 : 0;

          map.fitBounds(boundsArray as LngLatBoundsLike, {
            bearing: dynamicBearing,
            pitch: 0,
            padding: options.isPopupContext
              ? { top: 25, right: 25, bottom: 25, left: 25 }
              : { top: 50, right: 50, bottom: 50, left: 50 },
            duration: 600,
            essential: true
          });
        }
      } catch (err) { 
        console.error("useFsRoadsReport load error", err);
      }
    };

    const handleStyleSync = () => {
      if (map.isStyleLoaded()) {
        ensureSourceAndMaybeLayers();
        map.off("styledata", handleStyleSync); 
      }
    };

    if (map.isStyleLoaded()) {
      ensureSourceAndMaybeLayers();
    } else {
      map.on("styledata", handleStyleSync);
    }

    return () => { 
      cancelled = true; 
      cleanupHighlightLayers();
      map.off("styledata", handleStyleSync);
    };
  }, [map, mapReady, options.routeID, options.addLayers, options.isPopupContext]);
}