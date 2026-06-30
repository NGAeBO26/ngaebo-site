/* src/features/Discovery/DiscoveryContainer.tsx */
import { useState, useCallback, useRef, useEffect } from "react";
import GravelGuide from "./GravelGuide";
import {
  useRideFinderEngine,
  RideFilterBar,
  RideResultGallery,
} from "./components/RideFinder";
import GravelPopup from "./components/GravelPopup";
import PersistentLeftShopPanel from "../../store/StorePanel";
import { LoadingOverlay } from "../../components/LoadingOverlay";

import "../../styles/StorePanel.css";
import "./DiscoveryContainer.css";

export default function DiscoveryContainer() {
  const [activeHoverId, setActiveHoverId] = useState<string | null>(null);
  const [masterRoutes, setMasterRoutes] = useState<any[]>([]);
  const [filteredRoutes, setFilteredRoutes] = useState<any[]>([]);

  const [selectedRouteFeature, setSelectedRouteFeature] = useState<any | null>(
    null,
  );
  const [activeTakeoverRouteId, setActiveTakeoverRouteId] = useState<
    string | null
  >(null);

  const [isPopupClosing, setIsPopupClosing] = useState(false);
  const mapResetFnRef = useRef<(() => void) | null>(null);
  const mapZoomFnRef = useRef<((feature: any) => void) | null>(null);

  const [isWorkspaceLoading, setIsWorkspaceLoading] = useState<boolean>(true);
  const [loadProgress, setLoadProgress] = useState<number>(0);

  // Simulated progressive loader baseline sync
  useEffect(() => {
    if (!isWorkspaceLoading) return;

    const progressTimer = setInterval(() => {
      setLoadProgress((prev) => {
        if (prev >= 85) {
          clearInterval(progressTimer);
          return prev;
        }
        return prev + 5;
      });
    }, 90);

    return () => clearInterval(progressTimer);
  }, [isWorkspaceLoading]);

  // 🎯 PARENT STATE TELEMETRY DISPATCH: Exposes orchestration variables directly to DevTools
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).parentMasterRoutes = masterRoutes;
      (window as any).parentFilteredRoutes = filteredRoutes;
    }
  }, [masterRoutes, filteredRoutes]);

  const handleFilterUpdate = useCallback((results: any[]) => {
    setFilteredRoutes(results);
  }, []);

  const handleRoutesLoaded = useCallback((routes: any[]) => {
    console.log("=== 🗺️ MAP ENGINE DISPATCHED DATA ===");
    console.log(
      `Successfully received ${routes.length} features from MapLibre canvas layers.`,
    );

    setMasterRoutes(routes);
    setFilteredRoutes(routes);

    setLoadProgress(100);
    setTimeout(() => {
      setIsWorkspaceLoading(false);
    }, 200);
  }, []);

  const handleRouteSelect = useCallback((feature: any | null) => {
    setSelectedRouteFeature(feature);
    if (feature) {
      const props = feature.properties || {};
      const primitiveId = String(
        props.profile_id || feature.id || props.id || "",
      );

      setIsPopupClosing(false);
      setActiveTakeoverRouteId(primitiveId);

      if (mapZoomFnRef.current) {
        mapZoomFnRef.current(feature);
      }
    } else {
      setActiveTakeoverRouteId(null);
    }
  }, []);

  const handleExitTakeover = useCallback(() => {
    setIsPopupClosing(true);

    setTimeout(() => {
      setSelectedRouteFeature(null);
      setActiveTakeoverRouteId(null);
      setIsPopupClosing(false);

      if (mapResetFnRef.current) {
        mapResetFnRef.current();
      }
    }, 400);
  }, []);

  const filterEngine = useRideFinderEngine(masterRoutes, handleFilterUpdate);
  const isTakeoverCurrentlyActive = activeTakeoverRouteId !== null;

  return (
    <div className="discovery-dashboard-root" style={{ position: "relative" }}>
      <LoadingOverlay
        isLoading={isWorkspaceLoading}
        progress={loadProgress}
        message="Hydrating Backcountry Telemetry..."
      />

      <RideFilterBar
        engine={filterEngine}
        totalCount={masterRoutes.length}
        isTakeoverActive={isTakeoverCurrentlyActive}
      />

      {isTakeoverCurrentlyActive && selectedRouteFeature && (
        <GravelPopup
          feature={selectedRouteFeature}
          onClose={handleExitTakeover}
          className={isPopupClosing ? "popup-dismissing" : "popup-entering"}
        />
      )}

      <div className="discovery-center-container">
        <div className="rg-retail-map-workspace-layout-deck">
          <aside className="rg-left-workspace-storefront-sidebar">
            <PersistentLeftShopPanel
              activeRouteProperties={
                selectedRouteFeature ? selectedRouteFeature.properties : null
              }
              allRoutes={masterRoutes}
            />
          </aside>

          <div className="discovery-map-main-viewport">
            <GravelGuide
              activeHoverId={activeHoverId}
              onRouteHover={setActiveHoverId}
              activeRouteId={activeTakeoverRouteId}
              onRouteSelect={handleRouteSelect}
              isTakeoverActive={isTakeoverCurrentlyActive}
              filteredRoutes={filteredRoutes}
              onRoutesLoaded={handleRoutesLoaded}
              onRegisterResetFn={(fn) => {
                mapResetFnRef.current = fn;
              }}
              onRegisterZoomFn={(fn) => {
                mapZoomFnRef.current = fn;
              }}
            />
          </div>

          <RideResultGallery
            routes={filteredRoutes}
            activeHoverId={activeHoverId}
            onHoverChange={setActiveHoverId}
            isCollapsed={false}
            onToggleCollapse={() => {}}
            onRouteSelect={handleRouteSelect}
            isTakeoverActive={false}
          />
        </div>
      </div>
    </div>
  );
}
