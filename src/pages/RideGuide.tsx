/* src/pages/RideGuide.tsx */
import { useState, useCallback, useRef, useEffect } from "react";
import GravelGuide from "../features/Discovery/GravelGuide";
import {
  useRideFinderEngine,
  RideFilterBar,
  RideResultGallery,
} from "../features/Discovery/components/RideFinder";
import GravelPopup from "../features/Discovery/components/GravelPopup";

import { LoadingOverlay } from "../components/LoadingOverlay";
import PersistentLeftShopPanel from "../store/StorePanel";
import { useShopifyCart } from "../store/ShopifyCartContext"; 
import MapGuideOverlay from "../components/modal/MapGuideOverlay";
import MobileRideGuide from "../features/Discovery/components/MobileRideGuide";

import "../styles/StorePanel.css";
import "../features/Discovery/DiscoveryContainer.css";
import "../styles/RideGuide.css";
import "../styles/mobile/DesktopOverrides.css";
import "../styles/mobile/MobileHeader.css";
import "../styles/mobile/MobileRideBuilder.css";
import "../styles/mobile/MobileDrawer.css";
import "../styles/mobile/MobileModals.css";

export default function RideGuide() {
  const { cartItems } = useShopifyCart();
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

  // 🎯 NEW STATE: Explicitly tracking active fullscreen layout configurations to sync the onboarding tour modal
  const [isDashboardViewActive, setIsDashboardViewActive] = useState<boolean>(false);
  const [showNavMenu, setShowNavMenu] = useState<boolean>(false);
  const navMenuRef = useRef<HTMLDivElement | null>(null);

  // ─── 📱 APPROVED MOBILE APPLICATION STATE LAYER CONTROLLERS ───
  const [isMobile, setIsMobile] = useState<boolean>(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches
  );

  // 🎯 ADDED: Desktop gallery grid expansion state definition
  const [isGalleryExpanded, setIsGalleryExpanded] = useState<boolean>(false);

  // ─── 🔍 DIAGNOSTIC LIFECYCLE EXECUTION TRACE ───
  useEffect(() => {
    const logTrace = (phase: string) => {
      const drawer = document.querySelector('.rg-mobile-unified-bottom-drawer');
      const rootContainer = document.querySelector('.discovery-dashboard-root');
      
      console.log(`============= [TRACE: ${phase}] =============`);
      console.log(`isWorkspaceLoading state is currently: ${isWorkspaceLoading}`);
      
      if (!drawer) {
        console.warn("⚠️ [TRACE] Drawer element not found in the DOM!");
      } else {
        const drawerRect = drawer.getBoundingClientRect();
        const parentRect = rootContainer?.getBoundingClientRect();
        
        console.log(`📁 Drawer Active Classes: "${drawer.className}"`);
        console.log(`📐 Drawer Rendered Geometry:`, {
          top: drawerRect.top,
          bottom: drawerRect.bottom,
          height: drawerRect.height,
          computedHeightStyle: window.getComputedStyle(drawer).height,
          computedTransform: window.getComputedStyle(drawer).transform
        });
        
        if (parentRect) {
          console.log(`🖥️ Parent Container Box Geometry:`, {
            parentHeight: parentRect.height,
            parentTop: parentRect.top,
            parentBottom: parentRect.bottom
          });
        }
      }
    };

    logTrace(isWorkspaceLoading ? "LOADING OVERLAY ACTIVE" : "LOADER UNMOUNTED");
  }, [isWorkspaceLoading]);

  // 🎯 REGRESSION FIREWALL & ROOT SAFARI ENGINE TINT
  useEffect(() => {
    document.body.classList.add("rg-page-mounted");
    
    const originalHtmlBg = document.documentElement.style.backgroundColor;
    document.documentElement.style.backgroundColor = "#236ea0";
    
    return () => {
      document.body.classList.remove("rg-page-mounted");
      document.documentElement.style.backgroundColor = originalHtmlBg;
    };
  }, []);

  // 📱 VIEWPORT MEDIA QUERY EVENT LISTENER
  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    setIsMobile(mediaQuery.matches);

    const handleViewportChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };

    mediaQuery.addEventListener("change", handleViewportChange);

    return () => {
      mediaQuery.removeEventListener("change", handleViewportChange);
    };
  }, []);

  const dashboardRef = useRef<HTMLDivElement | null>(null);

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

  const handleNavToggle = useCallback(() => {
    setShowNavMenu((prev) => !prev);
  }, []);

  useEffect(() => {
    if (!showNavMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        navMenuRef.current?.contains(target) ||
        target?.closest('.map-dashboard-attribution-overlay, .btn-exit-fullscreen-pill, .map-exit-fullscreen-btn, .exit-fullscreen-btn, button[class*="exit"]')
      ) {
        return;
      }
      setShowNavMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNavMenu]);

  // ─── 📱 // ─── INSTANT FULLSCREEN DASHBOARD AUTO-LOCK ENGINE ───
  useEffect(() => {
    if (!isWorkspaceLoading) {
      document.body.classList.add("dashboard-view-active");
      setIsDashboardViewActive(true);
    }
  }, [isWorkspaceLoading]);

  const handleFilterUpdate = useCallback((results: any[]) => {
    setFilteredRoutes(results);
  }, []);

  // ─── UNIFIED DATA & MAP PAINT SYNCHRONIZATION BACKPLANE ───
  const handleRoutesLoaded = useCallback((routes: any[]) => {
    setMasterRoutes(routes);
    setFilteredRoutes(routes);

    let watchdogTicks = 0;
    const maxWatchdogTicks = 20; 

    const mapPaintStabilizer = setInterval(() => {
      watchdogTicks++;
      const isCanvasFullyPainted = (window as any).mapLoaded === true;
      
      if (isCanvasFullyPainted || watchdogTicks >= maxWatchdogTicks) {
        clearInterval(mapPaintStabilizer);
        setLoadProgress(100);
        
        setTimeout(() => {
          setIsWorkspaceLoading(false);
        }, 100);

        if (watchdogTicks >= maxWatchdogTicks && !isCanvasFullyPainted) {
          console.warn("⚠️ Map paint event timed out. Watchdog bypassed overlay locks safely.");
        }
      }
    }, 100); 
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
      setIsGalleryExpanded(false); // 🎯 Reset expanded grid when GravelPopup opens

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

  // 🎯 AUTO-CLOSE GRAVEL POPUP WHEN GALLERY EXPANDS TO GRID VIEW
  useEffect(() => {
    if (isGalleryExpanded && isTakeoverCurrentlyActive) {
      handleExitTakeover();
    }
  }, [isGalleryExpanded, isTakeoverCurrentlyActive, handleExitTakeover]);

  return (
    <div className={`ride-finder-page-container ${isMobile ? "is-mobile-device" : ""}`}>
      
      {/* 🎯 CONTEXTUAL ONBOARDING CORE INTERCEPTOR: Fires strictly according to map and viewport animations */}
      <MapGuideOverlay 
        isMapReady={!isWorkspaceLoading}
        isDesktopTakeoverActive={isDashboardViewActive}
        isMobile={isMobile}
      />

      <h1 style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: '0',
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: '0'
      }}>
        North Georgia Backcountry Route Explorer and Telemetry Workspace
      </h1>
      
      

      {/* CONSOLE MODULE WRAPPER PLATFORM */}
      {isMobile ? (
        <MobileRideGuide
          filterEngine={filterEngine}
          masterRoutes={masterRoutes}
          filteredRoutes={filteredRoutes}
          selectedRouteFeature={selectedRouteFeature}
          isTakeoverCurrentlyActive={isTakeoverCurrentlyActive}
          onRouteSelect={handleRouteSelect}
          onExitTakeover={handleExitTakeover}
          isWorkspaceLoading={isWorkspaceLoading}
          loadProgress={loadProgress}
          activeHoverId={activeHoverId}
          onHoverChange={setActiveHoverId}
          onRoutesLoaded={handleRoutesLoaded}
          onExitFullscreen={handleNavToggle}
          mapResetFnRef={mapResetFnRef}
          mapZoomFnRef={mapZoomFnRef}
          cartItems={cartItems}
        />
      ) : (
        <div className="discovery-dashboard-root" ref={dashboardRef}>
          <RideFilterBar
            engine={filterEngine}
            totalCount={masterRoutes.length}
            routesData={masterRoutes}
            isTakeoverActive={isTakeoverCurrentlyActive}
            onSelectionComplete={() => {
              setIsGalleryExpanded(true);
            }}
            onMegaOpen={() => {
              handleExitTakeover();
              setIsGalleryExpanded(false);
            }}
            onRouteSelect={handleRouteSelect}
          />

          {isTakeoverCurrentlyActive && selectedRouteFeature && (
            <GravelPopup
              feature={selectedRouteFeature}
              onClose={handleExitTakeover}
              className={isPopupClosing ? "popup-dismissing" : "popup-entering"}
            />
          )}

          <div
            className="discovery-center-container"
            style={{ position: "relative" }}
          >
            <LoadingOverlay
              isLoading={isWorkspaceLoading}
              progress={loadProgress}
              message="Loading Map Data..."
            />

            <div className="rg-retail-map-workspace-layout-deck">
              {/* Desktop Left Store Sidebar Container Block */}
              <aside className="rg-left-workspace-storefront-sidebar">
                <PersistentLeftShopPanel
                  activeRouteProperties={
                    selectedRouteFeature ? selectedRouteFeature.properties : null
                  }
                  allRoutes={masterRoutes}
                  aria-label="Route Telemetry Workspace Data Feed"
                />
              </aside>

              {/* Immersive WebGL Mapping Backplane Canvas Viewport */}
              <div className={`discovery-map-main-viewport ${showNavMenu ? "nav-tray-open" : ""}`}>
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
                  onExitFullscreen={handleNavToggle}
                />

                <div
                  className={`rg-desktop-sitenav-dropdown-overlay-tray ${showNavMenu ? "is-open" : ""}`}
                  ref={navMenuRef}
                >
                  <a href="/" className="rg-mobile-nav-link-item">
                    Home
                  </a>
                  <a href="/rides" className="rg-mobile-nav-link-item active-destination">
                    RideGuides
                  </a>
                  <a href="/shop" className="rg-mobile-nav-link-item">
                    Shop Gear
                  </a>
                  <a href="/community" className="rg-mobile-nav-link-item">
                    About Us
                  </a>
                </div>
              </div>

              {/* Desktop Right Rail Asset Gallery Container Block */}
              <RideResultGallery
                routes={filteredRoutes}
                activeHoverId={activeHoverId}
                onHoverChange={setActiveHoverId}
                isCollapsed={false}
                onToggleCollapse={() => {}}
                onRouteSelect={handleRouteSelect}
                isTakeoverActive={isTakeoverCurrentlyActive}
                activeRouteId={activeTakeoverRouteId}
                sortBy={filterEngine.sortBy}
                onSortChange={filterEngine.setSortBy}
                sortOrder={filterEngine.sortOrder}
                onToggleSortOrder={filterEngine.toggleSortOrder}
                isExpanded={isGalleryExpanded}
                onToggleExpand={() =>
                  setIsGalleryExpanded((prev: boolean) => !prev)
                }
                evaluateRouteProximity={filterEngine.evaluateRouteProximity}
                selectedRideDay={
                  filterEngine.activeQuizSelections?.selectedRideDay
                }
                activeQuizSelections={filterEngine.activeQuizSelections}
                driveTimesMap={filterEngine.driveTimesMap}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}