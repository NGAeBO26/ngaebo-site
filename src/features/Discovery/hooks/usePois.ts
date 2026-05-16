// src/features/Discovery/hooks/usePois.ts
// @ts-nocheck
import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import proj4 from "proj4";
import type { Map as MapLibreMap } from "maplibre-gl";

proj4.defs("EPSG:26916", "+proj=utm +zone=16 +ellps=GRS80 +datum=NAD83 +units=m +no_defs");

export default function usePois(
  mapRef: React.MutableRefObject<MapLibreMap | null>,
  mapReady: boolean,
) {
  const ALL_SOURCE = "pois-all";
  const HIGHLIGHT_LAYER_ID = "pois-highlight";
  
  // Helper to load images into map memory
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
        // FIX: Match your actual filename
        const resp = await fetch("/data/pois-all.geojson");
        if (!resp.ok) return;
        const rawData = await resp.json();

        // REPROJECTION LOGIC
        const features = rawData.features.map((f: any) => {
          const [x, y] = f.geometry.coordinates;
          const [lng, lat] = proj4("EPSG:26916", "EPSG:4326", [x, y]);
          return { ...f, geometry: { ...f.geometry, coordinates: [lng, lat] } };
        });

        const geojson = { type: "FeatureCollection", features };

        

        if (cancelled) return;

        // SAFE SOURCE ADDITION
        if (!map.getSource(ALL_SOURCE)) {
          map.addSource(ALL_SOURCE, {
            type: "geojson",
            data: geojson,
            cluster: true,
            clusterMaxZoom: 14,
            clusterRadius: 40,
            generateId: true,
          });
        }

        // 1. Define your dynamic SVG generation helper
        const createClusterSvg = (color: string) => `
          <svg width="40" height="50" viewBox="0 0 40 50" fill="none" xmlns="http://www.w3.org/2000/svg">
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

        // 2. Register the Cluster Icons (Add this before creating layers)
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

        // // 1. CLUSTER LAYER (Circles)
        // if (!map.getLayer("clusters")) {
        //   map.addLayer({
        //     id: "clusters",
        //     type: "circle",
        //     source: ALL_SOURCE,
        //     filter: ["has", "point_count"],
        //     paint: {
        //       "circle-color": "#2e7d32",
        //       "circle-radius": ["step", ["get", "point_count"], 15, 10, 20, 50, 25],
        //       "circle-stroke-width": 2,
        //       "circle-stroke-color": "#ffffff"
        //     },
        //   });
        // }

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
                "icon-anchor": "bottom", // Pin point rests on the coordinate
              }
            });
          }
        });

        // 4. Adjust your existing cluster-count text layer position
        if (!map.getLayer("cluster-count")) {
          map.addLayer({
            id: "cluster-count",
            type: "symbol",
            source: ALL_SOURCE,
            filter: ["has", "point_count"],
            layout: {
              "text-field": ["get", "point_count_abbreviated"],
              "text-font": ["Montserrat SemiBold", "Arial Unicode MS Regular"],
              "text-size": 12,
              "text-anchor": "center",
              // CRITICAL: Offset upward because the icon-anchor is "bottom"
              // The white circle center is roughly 30px up from the tip of a 50px tall pin
              "text-offset": [0, -2.1] 
            },
            paint: {
              "text-color": "#1b4332" // Dark green text inside the white circle
            }
          });
        }

        // 3. REGISTER CUSTOM ICONS & SYMBOL LAYERS
        const iconTypes = ["gap", "camp", "water", "scenic", "trailhead"];
        
        for (const type of iconTypes) {
          const iconId = `icon-${type}`;
          const layerId = `poi-layer-${type}`;

          // Load PNG into map if not exists
          if (!map.hasImage(iconId)) {
            try {
              const img = await loadPng(`/icons/${type}.png`);
              map.addImage(iconId, img, { pixelRatio: 2 });
            } catch (e) {
              console.warn(`Could not load icon: ${type}`);
            }
          }

          // Create unique symbol layer for this POI type
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
                "icon-anchor": "center",
                // --- NEW LABEL SETTINGS ---
                "text-field": ["get", "name"],
                "text-font": ["Montserrat SemiBold", "Arial Unicode MS Regular"],
                // --- SMALL CAPS EMULATION ---
                "text-transform": "uppercase", // Force all caps
                "text-letter-spacing": 0.1,    // Adding space makes uppercase easier to read
                "text-size": [
                  "interpolate", ["linear"], ["zoom"],
                  10, 8,  // Slightly smaller base size for uppercase
                  12, 10
                ],
                "text-offset": [0, 1.2],    // Positions text below the anchor point
                "text-anchor": "top",
                "text-optional": true,      // Hide text if it collides with icons
                // Only show text if zoom is >= 12
                "text-allow-overlap": false,
              },

              paint: {
                "text-color": "#333333",
                "text-halo-color": "#ffffff",
                "text-halo-width": 1.5,
                // Opacity expression: 0 below zoom 12, fades in to 1 at zoom 12.5
                "text-opacity": [
                  "interpolate", ["linear"], ["zoom"],
                  11.5, 0,
                  12, 1
                ]
              }


            });
          }
        }

      } catch (err) {
        console.error("POI System Error:", err);
      }
    }

    initPois();
    return () => { cancelled = true; };
  }, [mapReady]);
}