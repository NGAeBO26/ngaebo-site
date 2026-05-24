// src/features/Discovery/hooks/usePois.ts
// @ts-nocheck
import { useEffect } from "react";
import proj4 from "proj4";
import type { Map as MapLibreMap } from "maplibre-gl";

proj4.defs("EPSG:26916", "+proj=utm +zone=16 +ellps=GRS80 +datum=NAD83 +units=m +no_defs");

export default function usePois(
  mapRef: React.MutableRefObject<MapLibreMap | null>,
  mapReady: boolean,
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

    async function initPois() {
      if (cancelled) return;

      try {
        const resp = await fetch("/data/pois-all.geojson");
        if (!resp.ok) return;
        const rawData = await resp.json();

        // FIXED: Enforce absolute, guaranteed identity fields across properties
        const features = rawData.features.map((f: any, index: number) => {
          const [x, y] = f.geometry.coordinates;
          const [lng, lat] = proj4("EPSG:26916", "EPSG:4326", [x, y]);
          
          // Extracts any variety of ID, falls back to a sequential string token if missing
          const nativeProps = f.properties ?? {};
          const reliableId = f.id ?? nativeProps.id ?? nativeProps.ID ?? nativeProps.fid ?? nativeProps.FID ?? `poi-${index}`;

          return { 
            ...f, 
            id: reliableId, // Sets the top-level feature ID element
            geometry: { ...f.geometry, coordinates: [lng, lat] },
            properties: {
              ...nativeProps,
              id: String(reliableId) // FIXED: Forces a reliable string property key for ["get", "id"] matches
            }
          };
        });

        const geojson = { type: "FeatureCollection", features };

        if (cancelled) return;

        if (!map.getSource(ALL_SOURCE)) {
          map.addSource(ALL_SOURCE, {
            type: "geojson",
            data: geojson,
            cluster: true,
            clusterMaxZoom: 14,
            clusterRadius: 40,
            generateId: false, // FIXED: Set to false so MapLibre respects our synchronized feature IDs
          });
        }

        const createClusterSvg = (color: string) => `
          <svg width="30" height="40" viewBox="0 0 40 50" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="20" cy="46" rx="8" ry="3" fill="rgba(0,0,0,0.2)" />
            <path d="M20 0C8.954 0 0 8.954 0 20C0 32.5 20 48 20 48C20 48 40 32.5 40 20C40 8.954 31.046 0 20 0Z" fill="${color}"/>
            <circle cx="20" cy="20" r="12" fill="#FFFFFF"/>
          </svg>
        `;

        const loadSvgToImage = (svgString: string): Promise<HTMLImageElement> => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
            const url = URL.createObjectURL(svgBlob);
            img.src = url;
            img.onload = () => {
              URL.revokeObjectURL(url);
              resolve(img);
            };
            img.onerror = reject;
          });
        };

        const clusterTiers = [
          { id: "cluster-small", color: "#40916c", filter: ["<", ["get", "point_count"], 10] },
          { id: "cluster-medium", color: "#2d6a4f", filter: ["all", [">=", ["get", "point_count"], 10], ["<", ["get", "point_count"], 20]] },
          { id: "cluster-large", color: "#1b4332", filter: [">=", ["get", "point_count"], 20] }
        ];

        for (const tier of clusterTiers) {
          if (!map.hasImage(tier.id)) {
            try {
              const svgStr = createClusterSvg(tier.color);
              const img = await loadSvgToImage(svgStr);
              map.addImage(tier.id, img);
            } catch (e) {
              console.warn(`Failed to generate SVG cluster image: ${tier.id}`, e);
            }
          }
        }

        clusterTiers.forEach(tier => {
          const layerId = `cluster-layer-${tier.id}`;
          if (!map.getLayer(layerId)) {
            map.addLayer({
              id: layerId,
              type: "symbol",
              source: ALL_SOURCE,
              filter: ["all", ["has", "point_count"], tier.filter],
              layout: {
                "icon-image": tier.id,
                "icon-size": 0.85,
                "icon-allow-overlap": true,
                "icon-anchor": "center", 
              }
            });
          }
        });

        if (!map.getLayer("cluster-count")) {
          map.addLayer({
            id: "cluster-count",
            type: "symbol",
            source: ALL_SOURCE,
            filter: ["has", "point_count"],
            layout: {
              "text-field": ["get", "point_count_abbreviated"],
              // FIXED: Swapped out Montserrat for universally compiled open-source text maps
              "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
              "text-size": 10,
              "text-anchor": "center",
              "text-offset": [0, -0.25],
              "text-allow-overlap": true,
              "text-ignore-placement": true
            },
            paint: {
              "text-color": "#1b4332" // White coloring provides clear contrast inside your dark green ovals
            }
          });
        }

        const iconTypes = ["gap", "camp", "water", "scenic", "trailhead"];
        
        for (const type of iconTypes) {
          const iconId = `icon-${type}`;
          const layerId = `poi-layer-${type}`;

          if (!map.hasImage(iconId)) {
            try {
              const img = await loadPng(`/icons/${type}.png`);
              map.addImage(iconId, img, { pixelRatio: 2 });
            } catch (e) {
              console.warn(`Could not load icon: ${type}`);
            }
          }

          if (!map.getLayer(layerId)) {
            map.addLayer({
              id: layerId,
              type: "symbol",
              source: ALL_SOURCE,
              filter: ["all", ["==", ["get", "poi_type"], type], ["!", ["has", "point_count"]]],
              layout: {
                "icon-image": iconId,
                "icon-size": 0.75,
                "icon-allow-overlap": true,
                "icon-anchor": "center"
              }
            });
          }
        }

        // ==========================================
        // SYNCHRONIZED LAYER ORDER PLACEMENT STACK
        // Hitbox targets are injected at the bottom of initPois so they mount 
        // cleanly above visual graphics layers
        // ==========================================

        if (!map.getLayer("cluster-hitbox")) {
          map.addLayer({
            id: "cluster-hitbox",
            type: "circle",
            source: ALL_SOURCE,
            filter: ["has", "point_count"],
            paint: {
              "circle-radius": 16, 
              "circle-opacity": 0.0, 
            }
          });
        }

        if (!map.getLayer("poi-hitbox")) {
          map.addLayer({
            id: "poi-hitbox",
            type: "circle",
            source: ALL_SOURCE,
            filter: ["!", ["has", "point_count"]],
            paint: {
              "circle-radius": 12, // Forgiving radius that overrides the background route line corridors completely
              "circle-opacity": 0.0,
            }
          });
        }

        if (!map.getLayer("poi-labels")) {
          map.addLayer({
            id: "poi-labels",
            type: "symbol",
            source: ALL_SOURCE,
            filter: ["all", ["!", ["has", "point_count"]], ["==", ["get", "id"], ""]], 
            layout: {
              "text-field": ["get", "name"],
              // FIXED: Swapped out Montserrat for universally compiled open-source text maps
              "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
              "text-transform": "uppercase", 
              "text-letter-spacing": 0.1,    
              "text-size": [
                "interpolate", ["linear"], ["zoom"],
                10, 8,  
                12, 10
              ],
              "text-offset": [0, 1.2],    
              "text-anchor": "top",
              "text-allow-overlap": true, 
            },
            paint: {
              "text-color": "#333333",
              "text-halo-color": "#ffffff",
              "text-halo-width": 1.5,
              "text-opacity": 1.0
            }
          });
        }

      } catch (err) {
        console.error("POI System Error:", err);
      }
    }

    initPois();
    return () => { cancelled = true; };
  }, [mapReady]);
}