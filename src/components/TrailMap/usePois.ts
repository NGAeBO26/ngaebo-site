// @ts-nocheck
import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import type { Map as MapLibreMap } from "maplibre-gl";

export default function usePois(
  mapRef: React.MutableRefObject<MapLibreMap | null>,
  mapReady: boolean
) {
  const registeredIconsRef = useRef<Record<string, { id: string; src: string }>>({});

  const ALL_SOURCE = "pois-all";
  const HIGHLIGHT_SRC = "pois-highlight-src";

  const getCoords = (f: any, e: any) =>
    f?.geometry?.coordinates?.[0] ? f.geometry.coordinates : [e.lngLat.lng, e.lngLat.lat];

  const getPointCoords = (f: any) =>
    f?.geometry?.type === "Point" ? f.geometry.coordinates : [0, 0];

  const loadPng = (url: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = url;
      img.onload = () => resolve(img);
      img.onerror = reject;
    });

  const escapeHtml = (s: any) =>
    String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  //
  // LOAD SOURCES + LAYERS
  //
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    let cancelled = false;

    async function initPois() {
      if (cancelled) return;

      let allGeojson: any = { type: "FeatureCollection", features: [] };
      try {
        const resp = await fetch("/data/pois.geojson");
        if (resp.ok) allGeojson = await resp.json();
      } catch {}

      if (!map.getSource(ALL_SOURCE)) {
        map.addSource(ALL_SOURCE, {
          type: "geojson",
          data: allGeojson,
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 40,
        });
      }

      if (!map.getLayer("pois-clusters")) {
        map.addLayer({
          id: "pois-clusters",
          type: "circle",
          source: ALL_SOURCE,
          filter: ["has", "point_count"],
          paint: {
            "circle-color": "#3f5a3c",
            "circle-radius": ["step", ["get", "point_count"], 14, 10, 18, 25, 24],
            "circle-stroke-width": 1.5,
            "circle-stroke-color": "#ffffff",
          },
        });
      }

      if (!map.getLayer("pois-cluster-count")) {
        map.addLayer({
          id: "pois-cluster-count",
          type: "symbol",
          source: ALL_SOURCE,
          filter: ["has", "point_count"],
          layout: { "text-field": ["get", "point_count"], "text-size": 9 },
          paint: { "text-color": "#ffffff" },
        });
      }

      const iconTypes = ["gap", "camp", "water", "scenic", "ranger", "hazard"];

      if (!map.getLayer("pois-unclustered")) {
        map.addLayer({
          id: "pois-unclustered",
          type: "circle",
          source: ALL_SOURCE,
          filter: [
            "all",
            ["!", ["has", "point_count"]],
            ["!", ["in", ["get", "poi_type"], ["literal", iconTypes]]],
          ],
          paint: {
            "circle-radius": 6,
            "circle-color": "#ff5722",
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": 1,
          },
        });
      }

      if (!map.getSource(HIGHLIGHT_SRC)) {
        map.addSource(HIGHLIGHT_SRC, {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
      }

      if (!map.getLayer("pois-highlight")) {
        map.addLayer({
          id: "pois-highlight",
          type: "circle",
          source: HIGHLIGHT_SRC,
          paint: {
            "circle-opacity": 0,
            "circle-stroke-color": "#ffcc00",
            "circle-stroke-width": 2,
            "circle-radius": ["step", ["get", "point_count"], 18, 10, 22, 25, 26],
          },
        });
      }

      async function registerIcon(id: string, src: string) {
        registeredIconsRef.current[id] = { id, src };

        const perSource = `pois-${id}`;
        const features = allGeojson.features.filter(
          (f: any) => f.properties?.poi_type === id
        );

        if (!map.getSource(perSource)) {
          map.addSource(perSource, {
            type: "geojson",
            data: { type: "FeatureCollection", features },
            cluster: true,
            clusterMaxZoom: 14,
            clusterRadius: 40,
          });
        }

        if (!map.hasImage(id)) {
          try {
            const img = await loadPng(src);
            map.addImage(id, img, { pixelRatio: 2 });
          } catch {}
        }

        if (!map.getLayer(`poi-${id}-symbol`)) {
          map.addLayer({
            id: `poi-${id}-symbol`,
            type: "symbol",
            source: perSource,
            filter: [
              "all",
              ["==", ["get", "poi_type"], id],
              ["!", ["has", "point_count"]],
            ],
            layout: {
              "icon-image": id,
              "icon-size": 0.8,
              "icon-allow-overlap": true,
              "icon-ignore-placement": true,
            },
          });
        }
      }

      await registerIcon("gap", "/icons/gap.png");
      await registerIcon("camp", "/icons/camp.png");
      await registerIcon("water", "/icons/water.png");
      await registerIcon("scenic", "/icons/scenic.png");
      await registerIcon("ranger", "/icons/ranger.png");
      await registerIcon("hazard", "/icons/hazard.png");

      //
      // LAYER ORDERING: FS ROADS UNDER POI CLUSTERS
      //
      try {
        const roadLayerIds = ["fs-roads-line", "fs-roads-casing"];
        const anchorLayerId = "pois-clusters";

        if (map.getLayer(anchorLayerId)) {
          roadLayerIds.forEach((roadId) => {
            if (map.getLayer(roadId)) {
              map.moveLayer(roadId, anchorLayerId);
            }
          });
        }
      } catch {}
    }

    initPois();

    return () => {
      cancelled = true;
    };
  }, [mapRef, mapReady]);

  //
  // CLICK HANDLER
  //
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const m = map;

    function handleClick(e: any) {
      const iconLayerIds = Object.keys(registeredIconsRef.current)
        .map((id) => `poi-${id}-symbol`)
        .filter((layerId) => !!m.getLayer(layerId));

      let iconHits: any[] = [];
      if (iconLayerIds.length) {
        try {
          iconHits = m.queryRenderedFeatures(e.point, { layers: iconLayerIds });
        } catch {
          iconHits = [];
        }
      }

      if (iconHits.length) {
        const f = iconHits[0];
        const coords = getCoords(f, e);
        const p = f.properties || {};
        const safeName = escapeHtml(p.name || "Point of interest");

        // new maplibregl.Popup({ offset: 12 })
        //   .setLngLat(coords)
        //   .setHTML(`<strong>${safeName}</strong>`)
        //   .addTo(m);

        // return;
      }

      let unclusteredHits: any[] = [];
      try {
        unclusteredHits = m.queryRenderedFeatures(e.point, { layers: ["pois-unclustered"] });
      } catch {
        unclusteredHits = [];
      }

      if (unclusteredHits.length) {
        const f = unclusteredHits[0];
        const coords = getCoords(f, e);
        const p = f.properties || {};
        const safeName = escapeHtml(p.name || "Point of interest");

        // new maplibregl.Popup({ offset: 12 })
        //   .setLngLat(coords)
        //   .setHTML(`<strong>${safeName}</strong>`)
        //   .addTo(m);

        // return;
      }

      let clusterHits: any[] = [];
      try {
        clusterHits = m.queryRenderedFeatures(e.point, {
          layers: ["pois-clusters", "pois-cluster-count"],
        });
      } catch {
        clusterHits = [];
      }

      if (clusterHits.length) {
        let cluster = clusterHits[0];
        if (cluster.layer && cluster.layer.id === "pois-cluster-count") {
          let circleHit: any[] = [];
          try {
            circleHit = m.queryRenderedFeatures(e.point, { layers: ["pois-clusters"] });
          } catch {
            circleHit = [];
          }
          if (circleHit.length) cluster = circleHit[0];
        }

        const props = cluster.properties || {};
        const clusterIdRaw = props.cluster_id ?? props.clusterId ?? props.cluster;
        const clusterId =
          typeof clusterIdRaw === "string" ? parseInt(clusterIdRaw, 10) : clusterIdRaw;

        const source = m.getSource(ALL_SOURCE) as any;
        const coords = (cluster.geometry && cluster.geometry.coordinates) || getPointCoords(cluster);

        if (source && typeof source.getClusterExpansionZoom === "function") {
          try {
            const maybePromise = source.getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
              if (!err && typeof zoom === "number") {
                m.easeTo({ center: coords, zoom });
              } else {
                m.easeTo({ center: coords, zoom: Math.min(m.getZoom() + 2, 15) });
              }
            });

            if (maybePromise && typeof maybePromise.then === "function") {
              maybePromise
                .then((zoom: number) => {
                  if (typeof zoom === "number") m.easeTo({ center: coords, zoom });
                  else m.easeTo({ center: coords, zoom: Math.min(m.getZoom() + 2, 15) });
                })
                .catch(() => {
                  m.easeTo({ center: coords, zoom: Math.min(m.getZoom() + 2, 15) });
                });
            }
          } catch {
            m.easeTo({ center: coords, zoom: Math.min(m.getZoom() + 2, 15) });
          }
        } else {
          m.easeTo({ center: coords, zoom: Math.min(m.getZoom() + 2, 15) });
        }

        return;
      }
    }

    m.on("click", handleClick);
    return () => m.off("click", handleClick);
  }, [mapRef, mapReady]);

  //
  // UPDATED HOVER HANDLER (FIXED)
  //
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const m = map;

    function attachHover() {
      let lastHoverClusterId: any = null;

      function handleMove(e: any) {
        const clusterLayers = ["pois-clusters", "pois-cluster-count"].filter((id) =>
          m.getLayer(id)
        );

        const iconLayerIds = Object.keys(registeredIconsRef.current)
          .map((id) => `poi-${id}-symbol`)
          .filter((layerId) => m.getLayer(layerId));

        let iconHits: any[] = [];
        if (iconLayerIds.length) {
          try {
            iconHits = m.queryRenderedFeatures(e.point, { layers: iconLayerIds });
          } catch {
            iconHits = [];
          }
        }

        if (iconHits.length) {
          m.getCanvas().style.cursor = "pointer";
          m.getSource(HIGHLIGHT_SRC)?.setData({
            type: "FeatureCollection",
            features: [],
          });
          lastHoverClusterId = null;
          return;
        }

        let clusterFeatures: any[] = [];
        if (clusterLayers.length) {
          try {
            clusterFeatures = m.queryRenderedFeatures(e.point, {
              layers: clusterLayers,
            });
          } catch {
            clusterFeatures = [];
          }
        }

        if (clusterFeatures.length) {
          const cluster = clusterFeatures[0];
          const props = cluster.properties || {};
          const clusterId = props.cluster_id ?? props.clusterId ?? props.cluster;

          if (clusterId === lastHoverClusterId) {
            m.getCanvas().style.cursor = "pointer";
            return;
          }

          lastHoverClusterId = clusterId;
          m.getCanvas().style.cursor = "pointer";

          const coords = getPointCoords(cluster);

          m.getSource(HIGHLIGHT_SRC)?.setData({
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                geometry: { type: "Point", coordinates: coords },
                properties: { point_count: props.point_count },
              },
            ],
          });

          return;
        }

        lastHoverClusterId = null;
        m.getCanvas().style.cursor = "";
        m.getSource(HIGHLIGHT_SRC)?.setData({
          type: "FeatureCollection",
          features: [],
        });
      }

      m.on("mousemove", handleMove);
      return () => m.off("mousemove", handleMove);
    }

    if (map.getLayer("pois-clusters")) {
      return attachHover();
    }

    function onStyle() {
      if (m.getLayer("pois-clusters")) {
        m.off("styledata", onStyle);
        attachHover();
      }
    }

    m.on("styledata", onStyle);
    return () => m.off("styledata", onStyle);
  }, [mapRef, mapReady]);
}