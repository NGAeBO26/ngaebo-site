/* src/features/Discovery/hooks/useMapController.tsx */
import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import type { Map as MaplibreMap, LngLatBoundsLike } from "maplibre-gl";

const STYLE_URL = "/styles/ngaebo-style.json";

interface CalculatedTrackMetrics {
  bounds: LngLatBoundsLike;
  rawSW: [number, number];
  rawNE: [number, number];
  paddedSW: [number, number];
  paddedNE: [number, number];
  center: maplibregl.LngLat;
  targetZoom: number;
  isHorizontal: boolean;
}

// ============================================================================
// 🗺️ ORIENTATION-ADAPTIVE GEOMETRIC PROJECTION ENGINE
// Extracts raw geometry strings and computes precise coordinate boundaries
// ============================================================================
function calculateAdvancedTrackMetrics(feature: any): CalculatedTrackMetrics | null {
  if (!feature || !feature.geometry || !Array.isArray(feature.geometry.coordinates)) return null;

  const coords = feature.geometry.coordinates;
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  const flattenCoordinates = (arr: any) => {
    if (typeof arr[0] === 'number' && typeof arr[1] === 'number') {
      const [lng, lat] = arr;
      if (lng < minLng) minLng = lng;
      if (lat < minLat) minLat = lat;
      if (lng > maxLng) maxLng = lng;
      if (lat > maxLat) maxLat = lat;
      return;
    }
    for (let i = 0; i < arr.length; i++) {
      if (Array.isArray(arr[i])) flattenCoordinates(arr[i]);
    }
  };

  flattenCoordinates(coords);

  if (minLng === Infinity || minLat === Infinity) return null;

  const originalLngDelta = maxLng - minLng;
  const originalLatDelta = maxLat - minLat;

  const latCenter = (minLat + maxLat) / 2;
  const lngCenter = (minLng + maxLng) / 2;
  const cosFactor = Math.cos((latCenter * Math.PI) / 180);

  const heightMeters = originalLatDelta * 111132;
  const widthMeters = originalLngDelta * 111132 * cosFactor;
  const isHorizontal = widthMeters > heightMeters;

  let minLngValue = minLng, maxLngValue = maxLng, minLatValue = minLat, maxLatValue = maxLat;
  let topCushion: number;
  let bottomCushion: number;
  let sideCushion: number;
  let finalLatCenter: number;
  let targetZoom: number;

  if (isHorizontal) {
    topCushion = originalLatDelta * 1;
    bottomCushion = originalLatDelta * 0.25;
    sideCushion = originalLngDelta * 0.15;
    
    finalLatCenter = latCenter + (originalLatDelta * 0.3504);
    targetZoom = 11.04;
  } else {
    const targetLngDeltaDegrees = originalLatDelta / cosFactor;
    const correction = targetLngDeltaDegrees - originalLngDelta;
    minLngValue -= (correction / 2);
    maxLngValue += (correction / 2);

    topCushion = originalLatDelta * 1;
    bottomCushion = originalLatDelta * 0.12;
    sideCushion = (maxLngValue - minLngValue) * 0.18;
    
    finalLatCenter = latCenter;
    targetZoom = 13.40; 
  }

  const finalCalculatedBounds: LngLatBoundsLike = [
    [minLngValue - sideCushion, minLatValue - bottomCushion],
    [maxLngValue + sideCushion, maxLatValue + topCushion]
  ];

  return {
    bounds: finalCalculatedBounds,
    rawSW: [minLng, minLat],
    rawNE: [maxLng, maxLat],
    paddedSW: [minLngValue - sideCushion, minLatValue - bottomCushion],
    paddedNE: [maxLngValue + sideCushion, maxLatValue + topCushion],
    center: new maplibregl.LngLat(lngCenter, finalLatCenter),
    targetZoom,
    isHorizontal
  };
}

interface MapControllerOptions {
  containerRef: React.MutableRefObject<HTMLDivElement | null>;
  mapRef: React.MutableRefObject<MaplibreMap | null>;
  routesData: any[];
  filteredRoutes: any[]; 
  onRoutesLoaded?: (routes: any[]) => void;
  onRegisterResetFn?: (resetFn: () => void) => void;
  onRegisterZoomFn?: (zoomFn: (feature: any) => void) => void;
}

export default function useMapController(opts: MapControllerOptions) {
  const [mapReady, setMapReady] = useState(false);
  const stateRef = useRef(opts);
  const activeGeometryCacheRef = useRef<CalculatedTrackMetrics | null>(null);

  useEffect(() => {
    stateRef.current = opts;
  }, [opts]);

  useEffect(() => {
    if (opts.routesData && opts.routesData.length > 0 && opts.onRoutesLoaded) {
      opts.onRoutesLoaded(opts.routesData);
    }
  }, [opts.routesData, opts.onRoutesLoaded]);

  const repaintViewportHUDOverlay = useCallback(() => {
    const currentMap = stateRef.current.mapRef.current;
    if (!currentMap) return;

    const oldCanvas = document.getElementById('discovery-canvas-hud-overlay');
    if (oldCanvas) {
      oldCanvas.remove();
    }
  }, []);

  // ==========================================================================
  // 🎯 SYNCHRONOUS CAMERA MOVEMENT PIPELINE (ANTI-THRASING PROJECTION ENGINE)
  // Lock container dimensions inline to protect the canvas from parent layout shifts.
  // ==========================================================================
  const fitRoutePadded = useCallback((incomingFeature: any) => {
    const currentMap = stateRef.current.mapRef.current;
    if (!currentMap || !incomingFeature) return;

    (currentMap as any)._rgCameraFlying = true;

    const mapContainer = currentMap.getContainer();
    const mapCanvas = currentMap.getCanvas();
    
    // ─── 🛑 THE BOUNDARY SHIELD ───
    // Read current pixel constraints and lock them inline. This stops incoming layout panel
    // insertions from shifting the container height and causing a context reset flash.
    if (mapContainer) {
      const rect = mapContainer.getBoundingClientRect();
      mapContainer.style.width = `${rect.width}px`;
      mapContainer.style.height = `${rect.height}px`;
      mapContainer.style.flex = "none";
      mapContainer.style.pointerEvents = "none";
    }
    if (mapCanvas) mapCanvas.style.pointerEvents = "none";

    // Safely restore responsive styling parameters once the flight settles smoothly
    currentMap.once('moveend', () => {
      (currentMap as any)._rgCameraFlying = false;
      if (mapContainer) {
        mapContainer.style.width = "100%";
        mapContainer.style.height = "100%";
        mapContainer.style.flex = "";
        mapContainer.style.pointerEvents = "auto";
      }
      if (mapCanvas) mapCanvas.style.pointerEvents = "auto";
    });

    const targetId = String(incomingFeature.properties?.profile_id || incomingFeature.id || "");

    const isMobileViewport = window.matchMedia('(max-width: 767px)').matches;
    const retailLayoutPadding = isMobileViewport
      ? { top: 40, right: 16, bottom: 280, left: 16 }
      : { top: 24, right: 260, bottom: 24, left: 260 };

    const masterFeatureMatch = stateRef.current.routesData.find(
      (r: any) => r && String(r.properties?.profile_id || r.id) === targetId
    );

    const activeTargetFeature = masterFeatureMatch || incomingFeature;
    const metrics = calculateAdvancedTrackMetrics(activeTargetFeature);
    
    if (!metrics) {
      (currentMap as any)._rgCameraFlying = false;
      if (mapContainer) {
        mapContainer.style.width = "100%"; mapContainer.style.height = "100%"; mapContainer.style.flex = ""; mapContainer.style.pointerEvents = "auto";
      }
      if (mapCanvas) mapCanvas.style.pointerEvents = "auto";
      return;
    }

    activeGeometryCacheRef.current = metrics;

    try {
      let targetCenter: maplibregl.LngLat = metrics.center;
      let finalZoom = metrics.targetZoom;

      const computedCamera = currentMap.cameraForBounds(metrics.bounds, {
        padding: { top: 0, right: 0, bottom: 0, left: 0 }
      });

      if (computedCamera && computedCamera.center) {
        const convertedCenter = maplibregl.LngLat.convert(computedCamera.center);
        targetCenter = new maplibregl.LngLat(convertedCenter.lng, convertedCenter.lat);
        
        const maxZoomCap = metrics.isHorizontal ? 13.80 : 13.40;
        finalZoom = Math.min(computedCamera.zoom ?? maxZoomCap, maxZoomCap);
      }

      const zoomOffsetCushion = isMobileViewport ? 0.35 : 0.20;

      currentMap.easeTo({
        center: targetCenter,
        zoom: finalZoom - zoomOffsetCushion,
        padding: retailLayoutPadding, 
        bearing: 0,
        pitch: 0,
        duration: 750,
        essential: true
      });

      requestAnimationFrame(repaintViewportHUDOverlay);

    } catch (err) {
      console.error("Single pass viewport camera calculation crashed:", err);
      (currentMap as any)._rgCameraFlying = false;
      if (mapContainer) {
        mapContainer.style.width = "100%"; mapContainer.style.height = "100%"; mapContainer.style.flex = ""; mapContainer.style.pointerEvents = "auto";
      }
      if (mapCanvas) mapCanvas.style.pointerEvents = "auto";
    }
  }, [repaintViewportHUDOverlay]);

  const resetToInitialExtent = useCallback(() => {
    const map = opts.mapRef.current;
    if (!map) return;

    activeGeometryCacheRef.current = null;
    const oldCanvas = document.getElementById('discovery-canvas-hud-overlay');
    if (oldCanvas) oldCanvas.remove();

    try {
      const isMobileViewport = window.matchMedia('(max-width: 767px)').matches;
      const initialPadding = isMobileViewport
        ? { top: 40, right: 16, bottom: 280, left: 16 }
        : { top: 0, right: 260, bottom: 0, left: 260 };

      map.easeTo({
        center: new maplibregl.LngLat(-84.3, 34.2),
        zoom: 8,
        padding: initialPadding,
        pitch: 0,
        bearing: 0,
        duration: 800,
        essential: true
      });
    } catch (err) {
      console.error("Extent reset operation dropped:", err);
    }
  }, [opts.mapRef]);

  // ==========================================================================
  // VIEWPORT LIFECYCLE HOOK BINDINGS
  // ==========================================================================
  useEffect(() => {
    if (!opts.containerRef.current || opts.mapRef.current) return;

    let mapInstance: maplibregl.Map | null = null;

    try {
      mapInstance = new maplibregl.Map({
        container: opts.containerRef.current,
        style: STYLE_URL,
        center: [-84.3, 34.2],
        maxBounds: [[-86.05, 33.95], [-83.05, 35.45]],
        minZoom: 8,
        maxZoom: 18,
      });

      opts.mapRef.current = mapInstance;

      (window as any)._debugMapInstance = mapInstance;
      (window as any).map = mapInstance; 

      mapInstance.on("load", () => {
        setMapReady(true);
        if (stateRef.current.onRegisterResetFn) stateRef.current.onRegisterResetFn(resetToInitialExtent);
        if (stateRef.current.onRegisterZoomFn) stateRef.current.onRegisterZoomFn(fitRoutePadded);
      });

      mapInstance.on('move', repaintViewportHUDOverlay);
      mapInstance.on('zoom', repaintViewportHUDOverlay);

    } catch (err) {
      console.error("Canvas instantiation crash caught safely:", err);
    }

    return () => {
      if (opts.mapRef.current) {
        try { opts.mapRef.current.remove(); } catch {}
        opts.mapRef.current = null;
        
        delete (window as any)._debugMapInstance;
        delete (window as any).map;
        
        setMapReady(false);
      }
    };
  }, [opts.containerRef, opts.mapRef, fitRoutePadded, resetToInitialExtent, repaintViewportHUDOverlay]);

  return { mapReady };
}