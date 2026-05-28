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
// 📐 ORIENTATION-ADAPTIVE GEOMETRIC PROJECTION ENGINE
// Extracts raw geometry strings and computes precise coordinate boundaries
// ============================================================================
function calculateAdvancedTrackMetrics(feature: any): CalculatedTrackMetrics | null {
  if (!feature || !feature.geometry || !Array.isArray(feature.geometry.coordinates)) return null;

  const coords = feature.geometry.coordinates;
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  // Safe recursive array flattener to support both LineString and MultiLineString formats
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
    // ↔️ HORIZONTAL MULTIPLIERS (Extracted directly from your Spacebar telemetry snapshot)
    topCushion = originalLatDelta * 1;
    bottomCushion = originalLatDelta * 0.25;
    sideCushion = originalLngDelta * 0.15;
    
    // Apply your verified spatial axis center calibration shift
    finalLatCenter = latCenter + (originalLatDelta * 0.3504);
    targetZoom = 11.04;
  } else {
    // ↕️ VERTICAL MULTIPLIERS (Preserves tall aspect layouts below popup drawer overlays)
    const targetLngDeltaDegrees = originalLatDelta / cosFactor;
    const correction = targetLngDeltaDegrees - originalLngDelta;
    minLngValue -= (correction / 2);
    maxLngValue += (correction / 2);

    topCushion = originalLatDelta * 1;
    bottomCushion = originalLatDelta * 0.12;
    sideCushion = (maxLngValue - minLngValue) * 0.18;
    
    finalLatCenter = latCenter;
    targetZoom = 13.40; // Maintain standard close-up ceiling for tall segments
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
  const cameraTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activeGeometryCacheRef = useRef<CalculatedTrackMetrics | null>(null);

  useEffect(() => {
    stateRef.current = opts;
  }, [opts]);

  useEffect(() => {
    if (opts.routesData && opts.routesData.length > 0 && opts.onRoutesLoaded) {
      opts.onRoutesLoaded(opts.routesData);
    }
  }, [opts.routesData, opts.onRoutesLoaded]);

  // ==========================================================================
  // 🎨 HUD OVERLAY REPAINT CLEANUP
  // Cleanly strips out telemetry graphics boxes from the active WebGL timeline loop
  // ==========================================================================
  const repaintViewportHUDOverlay = useCallback(() => {
    const currentMap = stateRef.current.mapRef.current;
    if (!currentMap) return;

    // Direct DOM search pass instantly cleans away leftover telemetry layout frames
    const oldCanvas = document.getElementById('discovery-canvas-hud-overlay');
    if (oldCanvas) {
      oldCanvas.remove();
    }
  }, []);

  // ==========================================================================
  // 🚀 UNIFIED CAMERA MOVEMENT PIPELINE
  // Moves the viewport and handles target extents seamlessly on a single pass
  // ==========================================================================
  const fitRoutePadded = useCallback((incomingFeature: any) => {
    const currentMap = stateRef.current.mapRef.current;
    if (!currentMap || !incomingFeature) return;

    const targetId = String(incomingFeature.properties?.profile_id || incomingFeature.id || "");

    try { 
      currentMap.stop(); 
      currentMap.setPadding({ top: 0, right: 0, bottom: 0, left: 0 });
    } catch {}

    if (cameraTimeoutRef.current) {
      clearTimeout(cameraTimeoutRef.current);
      cameraTimeoutRef.current = null;
    }

    const masterFeatureMatch = stateRef.current.routesData.find(
      (r: any) => r && String(r.properties?.profile_id || r.id) === targetId
    );

    const activeTargetFeature = masterFeatureMatch || incomingFeature;
    const metrics = calculateAdvancedTrackMetrics(activeTargetFeature);
    if (!metrics) return;

    activeGeometryCacheRef.current = metrics;

    cameraTimeoutRef.current = setTimeout(() => {
      try {
        if (!currentMap) return;
        currentMap.resize();

        let targetCenter: maplibregl.LngLat = metrics.center;
        let finalZoom = metrics.targetZoom;

        if (!metrics.isHorizontal) {
          const computedCamera = currentMap.cameraForBounds(metrics.bounds, {
            padding: { top: 0, right: 0, bottom: 0, left: 0 }
          });
          if (computedCamera && computedCamera.center) {
            const convertedCenter = maplibregl.LngLat.convert(computedCamera.center);
            targetCenter = new maplibregl.LngLat(convertedCenter.lng, convertedCenter.lat);
            finalZoom = Math.min(computedCamera.zoom ?? 13.40, 13.40);
          }
        }

        // Precise programmatic track camera glide pass remains intact
        currentMap.easeTo({
          center: targetCenter,
          zoom: finalZoom,
          bearing: 0,
          pitch: 0,
          duration: 750, 
          essential: true
        });

        requestAnimationFrame(repaintViewportHUDOverlay);

      } catch (err) {
        console.error("Single pass viewport camera calculation crashed:", err);
      } finally {
        cameraTimeoutRef.current = null;
      }
    }, 65); 
  }, [repaintViewportHUDOverlay]);

  const resetToInitialExtent = useCallback(() => {
    const map = opts.mapRef.current;
    if (!map) return;

    if (cameraTimeoutRef.current) {
      clearTimeout(cameraTimeoutRef.current);
      cameraTimeoutRef.current = null;
    }

    activeGeometryCacheRef.current = null;
    const oldCanvas = document.getElementById('discovery-canvas-hud-overlay');
    if (oldCanvas) oldCanvas.remove();

    try {
      map.stop();
      map.setPadding({ top: 0, right: 0, bottom: 0, left: 0 });
      map.resize();
      
      map.easeTo({
        center: new maplibregl.LngLat(-84.3, 34.2),
        zoom: 8,
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

      // Hook listeners act as garbage collectors to immediately wipe canvas artifacts during interactions
      mapInstance.on('move', repaintViewportHUDOverlay);
      mapInstance.on('zoom', repaintViewportHUDOverlay);
      mapInstance.on('render', repaintViewportHUDOverlay);

    } catch (err) {
      console.error("Canvas instantiation crash caught safely:", err);
    }

    return () => {
      if (cameraTimeoutRef.current) clearTimeout(cameraTimeoutRef.current);
      
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