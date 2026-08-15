/* src/pages/RideGuide.tsx */
import { useState, useCallback, useRef, useEffect } from "react";
import GravelGuide from "../features/Discovery/GravelGuide";
import {
  useRideFinderEngine,
  RideFilterBar,
  RideResultGallery,
} from "../features/Discovery/components/RideFinder";
import GravelPopup from "../features/Discovery/components/GravelPopup";
import TacticalLeadForm from "../components/TacticalLeadForm";
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

  const [showModal, setShowModal] = useState(() => {
    return localStorage.getItem("rideguide_lead_submitted") !== "true";
  });

  // Layout Coordination Anchors
  const [isEnteringFullscreen, setIsEnteringFullscreen] =
    useState<boolean>(false);
  
  // 🎯 NEW STATE: Explicitly tracking active fullscreen layout configurations to sync the onboarding tour modal
  const [isDashboardViewActive, setIsDashboardViewActive] = useState<boolean>(false);

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
  const ignoreObserverRef = useRef<boolean>(false);

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

  // ─── UNIFIED STAGGERED ANIMATION ESCAPE OUTLET PIPELINE ───
  const handleExitFullscreen = useCallback(() => {
    ignoreObserverRef.current = true;

    document.body.classList.add("dashboard-view-exiting");

    setTimeout(() => {
      document.body.classList.remove(
        "dashboard-view-active",
        "dashboard-view-exiting",
      );
      // 🎯 STATE SYNC: Clears tracking hooks when exiting full-bleed desktop maps
      setIsDashboardViewActive(false);
      window.scrollTo({ top: 0 });
      ignoreObserverRef.current = false;
    }, 350);
  }, []);

  // ─── 📱 INSTANT MOBILE AREA AUTO-LOCK VIEWPORT ENGINE ───
  useEffect(() => {
    if (isMobile && !isWorkspaceLoading) {
      document.body.classList.add("dashboard-view-active");
      // 🎯 STATE SYNC: Asserts true for mobile viewports once map loading completes
      setIsDashboardViewActive(true);
    }
  }, [isMobile, isWorkspaceLoading]);

  // 🎯 DASHBOARD ROOT SCROLL SHIFT LOCK: Prevents internal scrollIntoView from shifting the top header strip
  useEffect(() => {
    const el = dashboardRef.current;
    if (!el) return;
    const handleRootScrollLock = () => {
      if (el.scrollTop !== 0) {
        el.scrollTop = 0;
      }
    };
    el.addEventListener("scroll", handleRootScrollLock, { passive: true });
    return () => el.removeEventListener("scroll", handleRootScrollLock);
  }, []);

  // ─── LOOP-PROOF SCROLL CAPTURE TRACKING ENGINE ───
  useEffect(() => {
    const handleScrollEntryTrigger = () => {
      if (ignoreObserverRef.current) return;
      if (isMobile) return; 
      if (document.body.classList.contains("dashboard-view-active")) return;

      const element = dashboardRef.current;
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      if (rect.top <= viewportHeight * 0.33 && rect.top > 0) {
        ignoreObserverRef.current = true;
        setIsEnteringFullscreen(true);

        setTimeout(() => {
          setIsEnteringFullscreen(false);
          document.body.classList.add("dashboard-view-active");
          // 🎯 STATE SYNC: Asserts true for desktop layouts once fullscreen transition settles
          setIsDashboardViewActive(true);
          ignoreObserverRef.current = false;
        }, 2500);
      }
    };

    window.addEventListener("scroll", handleScrollEntryTrigger, {
      passive: true,
    });
    return () => window.removeEventListener("scroll", handleScrollEntryTrigger);
  }, [isMobile]);

  const handleLeadSuccess = () => {
    localStorage.setItem("rideguide_lead_submitted", "true");
    setShowModal(false);
  };

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
      
      <LoadingOverlay
        isLoading={isEnteringFullscreen}
        progress={0}
        message="Entering Full Screen Mode"
        subtitle="Setting up the viewport..."
        hideProgress={true}
        isFullscreen={true}
      />

      {/* SHOWCASE BRAND MARKETING TOP ROW (DESKTOP ONLY) */}
      {!isMobile && (
        <section className="rg-inline-showcase-section" aria-label="Product Benefit Overview Section">
          <div className="rf-marketing-hero-banner">
          <h2>Plan Faster. Ride Smarter.</h2>
          <p>HIGH ACCURACY TERRAIN - CUSTOM ANALYTICS - WEATHER AWARE - GUIDE FOR YOUR RIDE</p>
        </div>

        <div className="rg-inline-funnel-container">
          <div className="prop-strip-matrix-bay tier-4-column-grid">
            <div className="prop-value-column-card">
              <div className="prop-card-header-strip">
                <div className="rg-preview-img-contain-rotated">
                  <img src="/data/assets/RideGuide_Sample.png" alt="RideGuide Premium PDF Pack" className="rg-mini-thumbnail-rotated" />
                </div>
                <span className="prop-card-header-title">Know Before You Go</span>
              </div>
              <p>High-resolution elevation mapping, route metrics, and surface saturation tracking dials, <strong className="text-prop-heavy">so you are prepared for every ride!</strong>.</p>
            </div>

            <div className="prop-value-column-card">
              <div className="prop-card-header-strip">
                <div className="prop-value-icon-box ng-prop-icon-offline">
                  <img src="data\assets\icon_no_cell_signal.svg" className="ng-prop-graphic-asset" alt="Offline Independent Icon" />
                </div>
                <span className="prop-card-header-title">Offline Independent</span>
              </div>
              <p>Pre-rendered field guides that load instantly without requiring <strong className="text-prop-heavy">cell network data or map syncs</strong>.</p>
            </div>

            <div className="prop-value-column-card">
              <div className="prop-card-header-strip">
                <div className="prop-value-icon-box window-icon ng-prop-icon-motor">
                  <img src="data\assets\icon_credit_card.svg" className="ng-prop-graphic-asset" alt="No Subscription Required Icon" />
                </div>
                <span className="prop-card-header-title">No Required Subscription</span>
              </div>
              <p>Don't get caught in subscription based route services. <strong className="text-prop-heavy">Buy only what you want, when you want.</strong></p>
            </div>

            <div className="prop-value-column-card">
              <div className="prop-card-header-strip">
                <div className="prop-value-icon-box ng-prop-icon-insurance">
                  <img src="data\assets\icon_safety.svg" className="ng-prop-graphic-asset" alt="Peace of Mind Icon" />
                </div>
                <span className="prop-card-header-title">Peace of Mind</span>
              </div>
              <p>The backcountry can be dangerous if you are not prepared. <strong className="text-prop-heavy">Understand your risk and ride safely.</strong></p>
            </div>
          </div>

          <div className="rg-conversion-banner-tier">
            {!showModal ? (
              <div className="capture-success-persistent-msg" role="status" aria-live="polite">
                ✓ Free 3-Pack Sample Unlocked! Check your email inbox for your instant backcountry download link.
              </div>
            ) : (
              <>
                <p className="rg-lead-magnet-pitch-text-center">
                  Planning your bike's maiden voyage? We've mapped out the the ultimate 3-pack sample series of Fire Service routes perfectly suited for this bike. Instant download package delivered straight to your email.
                </p>
                <div className="capture-form-full-width-container">
                  <TacticalLeadForm layout="row" sourceGroupTag="rides_page_capture" buttonLabel="Unlock Free Sample Maps ➔" onSuccess={handleLeadSuccess} />
                </div>
              </>
            )}
          </div>

          <div className="rg-horizontal-instructions-tier" role="region" aria-label="Application Usage Instructions">
            <div className="rg-instructions-micro-header">Get Your RideGuide in 3 Easy Steps...</div>
            <div className="rg-horizontal-steps-row">
              <div className="rg-step-column-item">
                <span className="rg-step-badge-number">1</span>
                <p className="rg-step-item-text"><strong>Filter routes</strong> by name, route class, distance, or grade using the RideFinder filtering controls.</p>
              </div>
              <div className="rg-step-step-divider" role="presentation">➔</div>
              <div className="rg-step-column-item">
                <span className="rg-step-badge-number">2</span>
                <p className="rg-step-item-text"><strong>Select your route</strong> by clicking on the list cards or targeting pins directly on the live map canvas.</p>
              </div>
              <div className="rg-step-step-divider" role="presentation">➔</div>
              <div className="rg-step-column-item">
                <span className="rg-step-badge-number">3</span>
                <p className="rg-step-item-text"><strong>Unlock your RideGuide</strong> pack to download full continuous telemetry, profiles, and safety matrices.</p>
              </div>
            </div>
            <div className="rg-instructions-micro-header-callout">Use the interactive map below to discover routes, then get your offline guide delivered to your inbox!</div>
          </div>
        </div>
        </section>
      )}

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
          onExitFullscreen={handleExitFullscreen}
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
                  onExitFullscreen={handleExitFullscreen}
                />
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