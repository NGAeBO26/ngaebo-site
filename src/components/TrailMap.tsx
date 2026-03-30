// src/components/TrailMap.tsx
import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "../styles/trail-map.css";

/** Utility: simple HTML escape to avoid injecting raw properties into popup */
function escapeHtml(input: any) {
  if (input === null || input === undefined) return "";
  return String(input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

type IconConfig = {
  id: string;
  src: string;
  pixelRatio?: number;
  iconSize?: number;
  clusterMaxZoom?: number;
  clusterRadius?: number;
  shadowRadiusStops?: number[] | null;
  shadowBlurStops?: number[] | null;
  shadowOpacity?: number;
};

export default function TrailMap() {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const registeredIconsRef = useRef<IconConfig[]>([]);

  // Helper: update the merged clustered source from anywhere in the component
  function updatePoisAllFromRef(updatedFeaturesArray: any[]) {
    const m = mapRef.current as any;
    if (!m) {
      console.warn("map not initialized yet");
      return;
    }
    const src = m.getSource("pois-all") as any;
    if (src && typeof src.setData === "function") {
      src.setData({
        type: "FeatureCollection",
        features: updatedFeaturesArray,
      });
    } else {
      console.warn("pois-all source not found or not a GeoJSON source");
    }
  }

  // Expose helper for dev console (optional)
  (window as any).updatePoisAllFromRef = updatePoisAllFromRef;

  async function loadPng(url: string): Promise<HTMLImageElement> {
    const img = new Image();
    img.src = url;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    });
    return img;
  }

  function addImageWhenReady(
    map: maplibregl.Map,
    name: string,
    image: HTMLImageElement | ImageBitmap | ImageData | any,
    options?: any,
  ) {
    const tryAdd = () => {
      if (!map || !map.isStyleLoaded()) {
        requestAnimationFrame(tryAdd);
        return;
      }
      try {
        if (!map.hasImage(name)) {
          map.addImage(name, image as any, options);
        }
      } catch {
        requestAnimationFrame(tryAdd);
      }
    };
    tryAdd();
  }

  // Return a guaranteed [lng, lat] tuple or null
  function getFeatureCoords(feature: any, e: any): [number, number] | null {
    if (!feature) return null;
    const geom: any = feature.geometry;
    if (geom && Array.isArray((geom as any).coordinates)) {
      const coords = (geom as any).coordinates;
      if (typeof coords[0] === "number" && typeof coords[1] === "number") {
        return [coords[0], coords[1]];
      }
      if (
        Array.isArray(coords[0]) &&
        typeof coords[0][0] === "number" &&
        typeof coords[0][1] === "number"
      ) {
        return [coords[0][0], coords[0][1]];
      }
    }
    if (
      e &&
      e.lngLat &&
      typeof e.lngLat.lng === "number" &&
      typeof e.lngLat.lat === "number"
    ) {
      return [e.lngLat.lng, e.lngLat.lat];
    }
    return null;
  }

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // hover state
    let lastHoverClusterId: number | null = null;
    let hoverTimer: number | null = null;
    let onMapMouseMove: ((e: any) => void) | null = null;
    let onStyleImageMissing: ((e: any) => Promise<void>) | null = null;

    const HIGHLIGHT_SOURCE_ID = "pois-all-cluster-highlight-src";
    const HIGHLIGHT_LAYER_ID = "pois-all-cluster-highlight";

    const init = setTimeout(() => {
      const map = new maplibregl.Map({
        container: "trail-map",
        style: {
          version: 8,
          sources: {
            ngaebo: {
              type: "raster",
              // switched from local /tiles/... to the Spaces CDN so the browser requests the actual PNGs
              tiles: [
                "https://ngaebo-maptiles.nyc3.cdn.digitaloceanspaces.com/tiles/{z}/{x}/{y}.png",
              ],
              tileSize: 256,
            },
          },
          layers: [
            {
              id: "ngaebo-basemap",
              type: "raster",
              source: "ngaebo",
            },
          ],
        },
        center: [-84.5, 34.5],
        zoom: 9,
        minZoom: 8,
        maxZoom: 15,
        maxBounds: [
          [-86.05, 33.95],
          [-83.05, 35.15],
        ],
      });

      mapRef.current = map;
      (window as any).map = map;

      // styleimagemissing fallback: try /icons/{id}.png
      onStyleImageMissing = async (e: any) => {
        try {
          if (!e || !e.id) return;
          const fallbackUrl = `/icons/${e.id}.png`;
          try {
            const img = await loadPng(fallbackUrl);
            addImageWhenReady(map, e.id, img, { pixelRatio: 2 });
            return;
          } catch {
            // ignore fallback failure
          }
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error("styleimagemissing handler error", err);
        }
      };
      map.on("styleimagemissing", onStyleImageMissing);

      map.on("load", async () => {
        // Load full GeoJSON once so we can split into per-icon sources
        let allGeojson: any = null;
        try {
          const resp = await fetch("/data/pois.geojson");
          if (!resp.ok)
            throw new Error(
              `Failed to fetch /data/pois.geojson: ${resp.status}`,
            );
          allGeojson = await resp.json();
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error("Failed to load /data/pois.geojson", err);
          allGeojson = { type: "FeatureCollection", features: [] };
        }

        // Create pois-all: A single clustered source for all POIs
        const ALL_SOURCE_ID = "pois-all";
        if (!map.getSource(ALL_SOURCE_ID)) {
          map.addSource(ALL_SOURCE_ID, {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: allGeojson.features || [],
            },
            cluster: true,
            clusterMaxZoom: 14,
            clusterRadius: 40,
          } as any);
        } else {
          (map.getSource(ALL_SOURCE_ID) as any).setData({
            type: "FeatureCollection",
            features: allGeojson.features || [],
          });
        }

        updatePoisAllFromRef(allGeojson.features || []);

        // Cluster circle + count layers for the combined source
        if (!map.getLayer("pois-all-clusters")) {
          map.addLayer({
            id: "pois-all-clusters",
            type: "circle",
            source: ALL_SOURCE_ID,
            filter: ["has", "point_count"],
            paint: {
              "circle-color": "#3f5a3c",
              "circle-radius": [
                "step",
                ["get", "point_count"],
                14,
                10,
                18,
                25,
                24,
              ],
              "circle-stroke-width": 1.5,
              "circle-stroke-color": "#ffffff",
            },
          });
        }
        if (!map.getLayer("pois-all-cluster-count")) {
          map.addLayer({
            id: "pois-all-cluster-count",
            type: "symbol",
            source: ALL_SOURCE_ID,
            filter: ["has", "point_count"],
            layout: {
              "text-field": ["get", "point_count"],
              "text-size": 9,
            },
            paint: { "text-color": "#ffffff" },
          });
        }

        // Highlight source + stroke-only layer (transparent fill, visible stroke)
        if (!map.getSource(HIGHLIGHT_SOURCE_ID)) {
          map.addSource(HIGHLIGHT_SOURCE_ID, {
            type: "geojson",
            data: { type: "FeatureCollection", features: [] },
          } as any);
        }

        // Insert highlight before the first symbol layer that matches our naming convention (poi-*-symbol),
        // otherwise before cluster count as fallback.
        const styleLayers = map.getStyle().layers || [];
        const firstSymbolLayer = styleLayers.find(
          (l: any) => typeof l.id === "string" && /^poi-.*-symbol$/.test(l.id),
        );
        const fallbackBefore = map.getLayer("pois-all-cluster-count")
          ? "pois-all-cluster-count"
          : undefined;
        const insertBefore = firstSymbolLayer
          ? firstSymbolLayer.id
          : fallbackBefore;

        if (!map.getLayer(HIGHLIGHT_LAYER_ID)) {
          const highlightLayer: any = {
            id: HIGHLIGHT_LAYER_ID,
            type: "circle",
            source: HIGHLIGHT_SOURCE_ID,
            paint: {
              "circle-opacity": 0,
              "circle-stroke-color": "#ffcc00",
              "circle-stroke-width": 2,
              "circle-radius": [
                "step",
                ["get", "point_count"],
                18,
                10,
                22,
                25,
                26,
              ],
            },
          };
          try {
            if (insertBefore) map.addLayer(highlightLayer, insertBefore);
            else map.addLayer(highlightLayer);
          } catch {
            try {
              map.addLayer(highlightLayer);
            } catch {}
          }
        }

        // Combined mousemove handler: prefer icon hits (unclustered POIs) for cursor,
        // otherwise highlight clusters by updating the single-feature highlight source.
        onMapMouseMove = (e: any) => {
          const clusterLayers = ["pois-all-clusters", "pois-all-cluster-count"];
          const clusterFeatures = map.queryRenderedFeatures(e.point, {
            layers: clusterLayers,
          });

          // compute icon layer ids present in the style that match our naming convention
          const styleNow = map.getStyle().layers || [];
          const iconLayerIds = styleNow
            .map((l: any) => l.id)
            .filter((id: string) => /^poi-.*-symbol$/.test(id));

          // If pointer is over an icon feature, prefer icon cursor and clear cluster highlight
          if (iconLayerIds.length) {
            const iconHits = map.queryRenderedFeatures(e.point, {
              layers: iconLayerIds,
            });
            if (iconHits && iconHits.length) {
              map.getCanvas().style.cursor = "pointer";
              try {
                const highlightSrc = map.getSource(HIGHLIGHT_SOURCE_ID) as any;
                if (
                  highlightSrc &&
                  typeof highlightSrc.setData === "function"
                ) {
                  highlightSrc.setData({
                    type: "FeatureCollection",
                    features: [],
                  });
                }
              } catch {}
              if (hoverTimer !== null) {
                window.clearTimeout(hoverTimer);
              }
              hoverTimer = window.setTimeout(() => {
                hoverTimer = null;
              }, 250);
              lastHoverClusterId = null;
              return;
            }
          }

          // If pointer is over a cluster, highlight that cluster
          if (clusterFeatures && clusterFeatures.length) {
            const cluster = clusterFeatures[0];
            const props = cluster.properties || {};
            const clusterId =
              props.cluster_id ?? props.clusterId ?? props.cluster;

            if (clusterId === lastHoverClusterId) {
              map.getCanvas().style.cursor = "pointer";
              return;
            }
            lastHoverClusterId = clusterId;
            map.getCanvas().style.cursor = "pointer";

            // Build single-feature GeoJSON for highlight
            let feature: any = null;
            const geomCoords = (cluster.geometry as any)?.coordinates;
            if (
              Array.isArray(geomCoords) &&
              typeof geomCoords[0] === "number" &&
              typeof geomCoords[1] === "number"
            ) {
              feature = {
                type: "Feature",
                geometry: {
                  type: "Point",
                  coordinates: [geomCoords[0], geomCoords[1]],
                },
                properties: {
                  point_count: props.point_count ?? props.cluster ?? 0,
                },
              };
            } else {
              feature = {
                type: "Feature",
                geometry: {
                  type: "Point",
                  coordinates: [e.lngLat.lng, e.lngLat.lat],
                },
                properties: {
                  point_count: props.point_count ?? props.cluster ?? 0,
                },
              };
            }

            try {
              const highlightSrc = map.getSource(HIGHLIGHT_SOURCE_ID) as any;
              if (highlightSrc && typeof highlightSrc.setData === "function") {
                highlightSrc.setData({
                  type: "FeatureCollection",
                  features: [feature],
                });
              }
            } catch {}

            if (hoverTimer !== null) {
              window.clearTimeout(hoverTimer);
            }
            hoverTimer = window.setTimeout(() => {
              hoverTimer = null;
            }, 250);

            return;
          }

          // nothing under pointer: clear cursor and highlight
          lastHoverClusterId = null;
          map.getCanvas().style.cursor = "";
          try {
            const highlightSrc = map.getSource(HIGHLIGHT_SOURCE_ID) as any;
            if (highlightSrc && typeof highlightSrc.setData === "function") {
              highlightSrc.setData({ type: "FeatureCollection", features: [] });
            }
          } catch {}
          if (hoverTimer !== null) {
            window.clearTimeout(hoverTimer);
            hoverTimer = null;
          }
        };

        if (onMapMouseMove) map.on("mousemove", onMapMouseMove);

        // Helper: create/update clustered source for a subset of features (per-icon)
        function addClusteredSourceForId(
          sourceId: string,
          features: any[],
          clusterMaxZoom: number,
          clusterRadius: number,
        ) {
          if (map.getSource(sourceId)) {
            (map.getSource(sourceId) as any).setData({
              type: "FeatureCollection",
              features,
            });
            return sourceId;
          }

          map.addSource(sourceId, {
            type: "geojson",
            data: { type: "FeatureCollection", features },
            cluster: true,
            clusterMaxZoom: clusterMaxZoom,
            clusterRadius: clusterRadius,
          } as any);

          return sourceId;
        }

        // registerIconType now creates per-icon clustered sources and icon/shadow layers
        async function registerIconType(cfg: IconConfig) {
          const {
            id,
            src,
            pixelRatio = 2,
            iconSize = 0.75,
            clusterMaxZoom = 14,
            clusterRadius = 40,
            shadowRadiusStops = null,
            shadowBlurStops = null,
            shadowOpacity = 0.35,
          } = cfg;

          registeredIconsRef.current.push({
            ...cfg,
            pixelRatio,
            iconSize,
            clusterMaxZoom,
            shadowRadiusStops,
            shadowBlurStops,
            shadowOpacity,
          });

          // Filter features for this poi_type from the global GeoJSON
          const featuresForId = (allGeojson.features || []).filter((f: any) => {
            const idProp = f && f.properties && f.properties.poi_type;
            return idProp === id;
          });

          // Add per-icon clustered source (keeps per-type cluster settings)
          const perSourceId = `pois-${id}`;
          addClusteredSourceForId(
            perSourceId,
            featuresForId,
            clusterMaxZoom,
            clusterRadius,
          );

          // shadow circle layer (reads from per-icon source, shows only unclustered features)
          const shadowLayerId = `poi-${id}-shadow`;
          if (!map.getLayer(shadowLayerId)) {
            const radiusStops =
              Array.isArray(shadowRadiusStops) && shadowRadiusStops.length >= 6
                ? shadowRadiusStops
                : [8, 12, 12, 20, 15, 34];
            const blurStops =
              Array.isArray(shadowBlurStops) && shadowBlurStops.length >= 2
                ? shadowBlurStops
                : [8, 0.8];

            const paint: any = {
              "circle-color": "#000000",
              "circle-opacity": shadowOpacity,
              "circle-blur": [
                "interpolate",
                ["linear"],
                ["zoom"],
                blurStops[0],
                blurStops[1],
                15,
                Math.max(1.2, blurStops[1] + 0.6),
              ],
              "circle-radius": [
                "interpolate",
                ["linear"],
                ["zoom"],
                radiusStops[0],
                radiusStops[1],
                radiusStops[2],
                radiusStops[3],
                radiusStops[4],
                radiusStops[5],
              ],
            };

            map.addLayer({
              id: shadowLayerId,
              type: "circle",
              source: perSourceId,
              filter: [
                "all",
                ["==", ["get", "poi_type"], id],
                ["!", ["has", "point_count"]],
              ],
              paint,
            } as any);
          }

          // Load and register PNG icon
          try {
            const img = await loadPng(src);
            addImageWhenReady(map, id, img, { pixelRatio });
          } catch (err) {
            // eslint-disable-next-line no-console
            console.error(
              `Failed to load/register icon ${id} from ${src}`,
              err,
            );
          }

          // Add symbol layer for the icon (reads from per-icon source)
          const iconLayerId = `poi-${id}-symbol`;
          if (!map.getLayer(iconLayerId)) {
            map.addLayer({
              id: iconLayerId,
              type: "symbol",
              source: perSourceId,
              filter: [
                "all",
                ["==", ["get", "poi_type"], id],
                ["!", ["has", "point_count"]],
              ],
              layout: {
                "icon-image": id,
                "icon-size": iconSize,
                "icon-allow-overlap": true,
                "icon-ignore-placement": true,
              },
            });
          }

          // Attach cursor handlers for this newly added icon layer (defensive)
          try {
            map.on("mouseenter", iconLayerId, () => {
              map.getCanvas().style.cursor = "pointer";
            });
            map.on("mouseleave", iconLayerId, () => {
              map.getCanvas().style.cursor = "";
            });
          } catch {}

          // After adding an icon layer, ensure highlight remains below icons so icons keep pointer events.
          try {
            const styleLayersNow = map.getStyle().layers || [];
            const firstSymbolNow = styleLayersNow.find(
              (l: any) =>
                typeof l.id === "string" && /^poi-.*-symbol$/.test(l.id),
            );
            if (firstSymbolNow && map.getLayer(HIGHLIGHT_LAYER_ID)) {
              map.moveLayer(HIGHLIGHT_LAYER_ID, firstSymbolNow.id);
            }
          } catch {}
        }

        // Example registrations (tweak clusterMaxZoom/clusterRadius per icon)
        await registerIconType({
          id: "gap",
          src: "/icons/gap.png",
          pixelRatio: 2,
          iconSize: 0.75,
          clusterMaxZoom: 12,
          clusterRadius: 40,
          shadowRadiusStops: [8, 12, 12, 20, 15, 34],
          shadowBlurStops: [8, 0.8],
          shadowOpacity: 0.35,
        });

        await registerIconType({
          id: "camp",
          src: "/icons/camp.png",
          pixelRatio: 2,
          iconSize: 0.8,
          clusterMaxZoom: 12,
          clusterRadius: 30,
          shadowRadiusStops: [8, 12, 12, 20, 15, 34],
          shadowBlurStops: [8, 0.9],
          shadowOpacity: 0.32,
        });

        await registerIconType({
          id: "water",
          src: "/icons/water.png",
          pixelRatio: 2,
          iconSize: 0.8,
          clusterMaxZoom: 12,
          clusterRadius: 40,
          shadowRadiusStops: [8, 12, 12, 20, 15, 34],
          shadowBlurStops: [8, 0.9],
          shadowOpacity: 0.32,
        });

        await registerIconType({
          id: "scenic",
          src: "/icons/scenic.png",
          pixelRatio: 2,
          iconSize: 0.8,
          clusterMaxZoom: 12,
          clusterRadius: 40,
          shadowRadiusStops: [8, 12, 12, 20, 15, 34],
          shadowBlurStops: [8, 0.9],
          shadowOpacity: 0.32,
        });

        await registerIconType({
          id: "ranger",
          src: "/icons/ranger.png",
          pixelRatio: 2,
          iconSize: 0.8,
          clusterMaxZoom: 12,
          clusterRadius: 40,
          shadowRadiusStops: [8, 12, 12, 20, 15, 34],
          shadowBlurStops: [8, 0.9],
          shadowOpacity: 0.32,
        });

        // Popup / tooltip behavior for individual POIs
        const closePopup = () => {
          if (popupRef.current) {
            popupRef.current.remove();
            popupRef.current = null;
          }
        };

        // Unified click handler: clusters first, then icons
        map.on("click", (e: any) => {
          const clusterLayerIds = [
            "pois-all-clusters",
            "pois-all-cluster-count",
          ];
          const clusterFeatures = map.queryRenderedFeatures(e.point, {
            layers: clusterLayerIds,
          });
          if (clusterFeatures && clusterFeatures.length) {
            const clusterFeature = clusterFeatures[0];
            const source =
              clusterFeature.source ||
              (clusterFeature.layer && clusterFeature.layer.source);
            const clusterId =
              clusterFeature.properties &&
              (clusterFeature.properties.cluster_id ??
                clusterFeature.properties.clusterId ??
                clusterFeature.properties.cluster);
            if (clusterId === undefined || clusterId === null) return;

            const src = map.getSource(source) as any;
            if (!src || typeof src.getClusterExpansionZoom !== "function") {
              const fallbackZoom = Math.min(map.getZoom() + 2, 15);
              const center = getFeatureCoords(clusterFeature, e);
              if (center)
                map.easeTo({ center: center as any, zoom: fallbackZoom });
              return;
            }

            let called = false;
            const fallbackTimer = setTimeout(() => {
              if (!called) {
                const fallbackZoom = Math.min(map.getZoom() + 2, 15);
                const center = getFeatureCoords(clusterFeature, e);
                if (center)
                  map.easeTo({ center: center as any, zoom: fallbackZoom });
              }
            }, 500);

            src.getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
              called = true;
              clearTimeout(fallbackTimer);
              if (err) {
                const fallbackZoom = Math.min(map.getZoom() + 2, 15);
                const center = getFeatureCoords(clusterFeature, e);
                if (center)
                  map.easeTo({ center: center as any, zoom: fallbackZoom });
                return;
              }
              const currentZoom = map.getZoom();
              const targetZoom =
                typeof zoom === "number"
                  ? Math.max(zoom, Math.min(currentZoom + 1, 15))
                  : Math.min(currentZoom + 2, 15);
              const center = getFeatureCoords(clusterFeature, e);
              if (center) {
                map.easeTo({ center: center as any, zoom: targetZoom });
              } else {
                map.easeTo({ zoom: targetZoom });
              }
            });

            return; // cluster handled
          }

          // Not a cluster: check icon layers for a feature to show popup
          const styleLayersNow = map.getStyle().layers || [];
          const iconLayerIds = styleLayersNow
            .map((l: any) => l.id)
            .filter((id: string) => /^poi-.*-symbol$/.test(id));
          const iconFeatures = map.queryRenderedFeatures(e.point, {
            layers: iconLayerIds,
          });
          if (!iconFeatures || !iconFeatures.length) return;

          closePopup();
          const feature = iconFeatures[0];
          const coords = getFeatureCoords(feature, e);
          if (!coords) return;
          const props = feature.properties || {};

          const title =
            props.name || props.title || props.label || "Point of interest";
          const description = props.description || props.desc || "";
          const type = props.poi_type || "";
          const difficulty = props.difficulty
            ? `<div>Difficulty: ${escapeHtml(props.difficulty)}</div>`
            : "";
          const length = props.length
            ? `<div>Length: ${escapeHtml(props.length)}</div>`
            : "";
          const elevation = props.elevation
            ? `<div>Elevation: ${escapeHtml(props.elevation)}</div>`
            : "";

          const html = [
            `<div style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; font-size:13px; line-height:1.2; max-width:260px;">`,
            `<strong style="display:block; margin-bottom:6px;">${escapeHtml(title)}</strong>`,
            description
              ? `<div style="margin-bottom:6px;">${escapeHtml(description)}</div>`
              : "",
            `<div style="color:#666; font-size:12px; margin-bottom:6px;">Type: ${escapeHtml(type)}</div>`,
            difficulty,
            length,
            elevation,
            `</div>`,
          ].join("");

          const popup = new maplibregl.Popup({
            offset: 12,
            closeButton: true,
            closeOnClick: true,
          })
            .setLngLat(coords as maplibregl.LngLatLike)
            .setHTML(html)
            .addTo(map);

          popupRef.current = popup;
        });
      }); // end map.on("load")

      // cleanup on unmount
      (map as any).__cleanup = () => {
        if (onStyleImageMissing)
          map.off("styleimagemissing", onStyleImageMissing);
        try {
          if (onMapMouseMove) map.off("mousemove", onMapMouseMove);
        } catch {}
        try {
          if (map.getLayer(HIGHLIGHT_LAYER_ID))
            map.removeLayer(HIGHLIGHT_LAYER_ID);
          if (map.getSource(HIGHLIGHT_SOURCE_ID))
            map.removeSource(HIGHLIGHT_SOURCE_ID);
        } catch {}
        try {
          if (hoverTimer !== null) {
            window.clearTimeout(hoverTimer);
            hoverTimer = null;
          }
          if (popupRef.current) {
            popupRef.current.remove();
            popupRef.current = null;
          }
        } catch {}
      };
    }, 0);

    return () => {
      clearTimeout(init);
      if (mapRef.current) {
        try {
          const m = mapRef.current as any;
          if (m.__cleanup) m.__cleanup();
        } catch {}
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // If external data changes, update the combined source
  useEffect(() => {
    const maybe = (window as any).__externalPois;
    if (Array.isArray(maybe)) {
      updatePoisAllFromRef(maybe);
    }
  }, []);

  return <div id="trail-map" className="trail-map" />;
  //TOUCH
}
