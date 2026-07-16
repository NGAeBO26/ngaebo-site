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
import CartDropdown from "../components/CartDropdown";
import { useShopifyCart } from "../store/ShopifyCartContext"; 

import "../styles/StorePanel.css";
import "../features/Discovery/DiscoveryContainer.css";
import "../styles/RideGuide.css";
import "../styles/mobile/DesktopOverrides.css";
import "../styles/mobile/MobileHeader.css";
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

  // ─── 📱 APPROVED MOBILE APPLICATION STATE LAYER CONTROLLERS ───
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState<boolean>(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState<boolean>(false);
  const [isSiteNavMenuOpen, setIsSiteNavMenuOpen] = useState<boolean>(false);
  const [isBottomDrawerExpanded, setIsBottomDrawerExpanded] = useState<boolean>(false);

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

    // Snapshot 1: Capture layout metrics while loading is true or false
    logTrace(isWorkspaceLoading ? "LOADING OVERLAY ACTIVE" : "LOADER UNMOUNTED");

  }, [isWorkspaceLoading]);

  // 🎯 REGRESSION FIREWALL: Mounts/unmounts an isolated body override signature scope to protect global styles
  useEffect(() => {
    document.body.classList.add("rg-page-mounted");
    return () => document.body.classList.remove("rg-page-mounted");
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    setIsMobile(mediaQuery.matches);

    const handleViewportChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };

    mediaQuery.addEventListener("change", handleViewportChange);
    return () => mediaQuery.removeEventListener("change", handleViewportChange);
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
      window.scrollTo({ top: 0 });
      ignoreObserverRef.current = false;
      setIsSiteNavMenuOpen(false);
      setIsMobileCartOpen(false);
    }, 350);
  }, []);

  // ─── 📱 INSTANT MOBILE AREA AUTO-LOCK VIEWPORT ENGINE ───
  useEffect(() => {
    if (isMobile && !isWorkspaceLoading) {
      document.body.classList.add("dashboard-view-active");
    }
  }, [isMobile, isWorkspaceLoading]);

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
    const maxWatchdogTicks = 20; // 20 * 100ms = 2.0 seconds maximum allowed wait window

    const mapPaintStabilizer = setInterval(() => {
      watchdogTicks++;
      const isCanvasFullyPainted = (window as any).mapLoaded === true;
      
      /* 🎯 THE WATCHDOG BREAKER: If the canvas paints early, clear instantly.
         If the canvas stalls or fails to flag window.mapLoaded, trip the fallback 
         breaker after 2 seconds so the user is never left stuck at 85%! */
      if (isCanvasFullyPainted || watchdogTicks >= maxWatchdogTicks) {
        clearInterval(mapPaintStabilizer);
        setLoadProgress(100);
        
        // Brief micro-buffer to let the state settle smoothly
        setTimeout(() => {
          setIsWorkspaceLoading(false);
        }, 100);

        if (watchdogTicks >= maxWatchdogTicks && !isCanvasFullyPainted) {
          console.warn("⚠️ Map paint event timed out. Watchdog bypassed initialization overlay locks safely.");
        }
      }
    }, 100); // Poll context state every 100ms
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

      if (window.matchMedia("(max-width: 767px)").matches) {
        setIsBottomDrawerExpanded(true);
        setIsFilterDrawerOpen(false);
        
        /* 🎯 STATE PROTECTION: Programmatically drops the mobile cart 
           dropdown overlay view frame when a new route card is selected */
        setIsMobileCartOpen(false);
      }

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
    <div className={`ride-finder-page-container ${isMobile ? "is-mobile-device" : ""}`}>
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

      {/* SHOWCASE BRAND MARKETING TOP ROW */}
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

      {/* CONSOLE MODULE WRAPPER PLATFORM */}
      <div className="discovery-dashboard-root" ref={dashboardRef}>
        
        {isMobile && (
          <div className="rg-mobile-app-header-strip">
            
            {/* 🎯 LEFT ACTIONS DOCK */}
            <div className="rg-mobile-header-left-actions-dock">
              <button 
                type="button" 
                className="rg-mobile-hamburger-drawer-trigger"
                onClick={() => {
                  const nextFilterState = !isFilterDrawerOpen;
                  setIsFilterDrawerOpen(nextFilterState);
                  setIsMobileCartOpen(false);
                  setIsSiteNavMenuOpen(false);
                  
                  /* 🎯 NEW STATE MANAGEMENT: If filters are opened during a route selection, collapse the route card */
                  if (nextFilterState && isTakeoverCurrentlyActive) {
                    setIsBottomDrawerExpanded(false);
                  }
                }}
                aria-expanded={isFilterDrawerOpen}
                aria-label="Toggle Route Filtering Controls Drawer"
              >
                {isFilterDrawerOpen ? (
                  "✕"
                ) : (
                  <img 
                    src="/data/assets/icon-filter.svg" 
                    alt="Filter Controls" 
                  />
                )}
              </button>

              <button 
                type="button"
                className="rg-drawer-reset-filters-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  if (isTakeoverCurrentlyActive) {
                    handleExitTakeover();
                  } else {
                    if (filterEngine) {
                      filterEngine.setSearchName("");
                      filterEngine.setSelectedClass("ALL");
                      filterEngine.setSearchDistance(30); 
                      filterEngine.setSearchGrade(25);    
                    }
                    setFilteredRoutes(masterRoutes);
                    if (mapResetFnRef.current) {
                      mapResetFnRef.current();
                    }
                    console.log("Mobile search filters and map constraints reset to defaults.");
                  }
                }}
                title={isTakeoverCurrentlyActive ? "Clear Selected Route" : "Reset All Active Search Filters"}
                aria-label={isTakeoverCurrentlyActive ? "Clear currently selected route metrics overview" : "Clear all filtering parameters and return to master backcountry checklist"}
              >
                <img 
                  src="/data/assets/icon-reset.svg" 
                  alt="Reset Filters" 
                />
              </button>
            </div>

            {/* 🎯 CENTERED BRANDING */}
            <div className="rg-mobile-app-centered-branding" onClick={handleExitFullscreen} title="Minimize workspace map view layer">
              <img 
                src="/images/RideGuide_embroid-v1.svg" 
                alt="RideGuide Logo" 
              />
              <span className="rg-mobile-header-subtitle">
                RideFinder Pro
              </span>
            </div>

            {/* 🎯 RIGHT ACTIONS DOCK */}
            <div className="rg-mobile-header-right-actions-dock">
              <button
                type="button"
                className={`rg-mobile-header-icon-action-btn ${isMobileCartOpen ? "action-active" : ""}`}
                onClick={() => {
                  const nextCartState = !isMobileCartOpen;
                  setIsMobileCartOpen(nextCartState);
                  setIsFilterDrawerOpen(false);
                  setIsSiteNavMenuOpen(false);
                  
                  /* 🎯 CO-ORDINATION FIX: Collapses the expanded route bottom drawer 
                    when opening the cart to prevent the dropdown layout from being covered */
                  if (nextCartState) {
                    setIsBottomDrawerExpanded(false);
                  }
                }}
                aria-expanded={isMobileCartOpen}
                aria-label="Toggle Shopping Cart Dropdown Menu Drawer"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>

                {/* 🎯 THE BADGE INJECTION: Dynamically fires only when items populate the context loop */}
                {cartItems && cartItems.length > 0 && (
                  <span className="rg-header-cart-badge">
                    {cartItems.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                className={`rg-mobile-sitenav-drawer-trigger ${isSiteNavMenuOpen ? "action-active" : ""}`}
                onClick={() => {
                  setIsSiteNavMenuOpen(!isSiteNavMenuOpen);
                  setIsFilterDrawerOpen(false);
                  setIsMobileCartOpen(false);
                }}
                aria-expanded={isSiteNavMenuOpen}
                aria-label="Toggle Global Site Destination Links Menu"
              >
                ☰
              </button>
            </div>

            {isSiteNavMenuOpen && (
              <nav className="rg-mobile-sitenav-dropdown-overlay-tray" aria-label="Mobile Site Navigation Menu Links">
                <a href="/" className="rg-mobile-nav-link-item">Home</a>
                <a href="/rides" className="rg-mobile-nav-link-item active-destination">RideGuides</a>
                <a href="/shop" className="rg-mobile-nav-link-item">Shop Gear</a>
                <a href="/about" className="rg-mobile-nav-link-item">About Us</a>
                
              </nav>
            )}

            {/* 🎯 CART DROPDOWN CLOSER INJECTION */}
            <CartDropdown 
              isOpen={isMobileCartOpen} 
              allRoutes={masterRoutes} 
              isMobile={true} 
              onActionTriggered={() => setIsMobileCartOpen(false)} 
            />
          </div>
        )}

       {/* HAMBURGER SLIDEOUT DRAPDOWN TRAY FILTER CONTROLS */}
        {(!isMobile || isFilterDrawerOpen) && (
          <RideFilterBar
            engine={filterEngine}
            totalCount={masterRoutes.length}
            /* 🎯 THE OVERRIDE FIX: Forces filter controls to display if the filter drawer is actively open */
            isTakeoverActive={isTakeoverCurrentlyActive && !isFilterDrawerOpen}
            onSelectionComplete={() => setIsBottomDrawerExpanded(true)}
          />
        )}

        {/* SHIELDED: GravelPopup is short-circuited to block rendering on mobile screen views */}
        {!isMobile && isTakeoverCurrentlyActive && selectedRouteFeature && (
          <GravelPopup
            feature={selectedRouteFeature}
            onClose={handleExitTakeover}
            className={isPopupClosing ? "popup-dismissing" : "popup-entering"}
          />
        )}

        <div className="discovery-center-container" style={{ position: "relative" }}>
          
          <LoadingOverlay isLoading={isWorkspaceLoading} progress={loadProgress} message="Loading Map Data..." />

          <div className="rg-retail-map-workspace-layout-deck">
            
            {/* Desktop Left Store Sidebar Container Block */}
            {!isMobile && (
              <aside className="rg-left-workspace-storefront-sidebar">
                <PersistentLeftShopPanel
                  activeRouteProperties={selectedRouteFeature ? selectedRouteFeature.properties : null}
                  allRoutes={masterRoutes}
                  aria-label="Route Telemetry Workspace Data Feed"
                />
              </aside>
            )}

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
                onRegisterResetFn={(fn) => { mapResetFnRef.current = fn; }}
                onRegisterZoomFn={(fn) => { mapZoomFnRef.current = fn; }}
                onExitFullscreen={handleExitFullscreen}
              />
            </div>

            {/* Desktop Right Rail Asset Gallery Container Block */}
            {!isMobile && (
              <RideResultGallery
                routes={filteredRoutes}
                activeHoverId={activeHoverId}
                onHoverChange={setActiveHoverId}
                isCollapsed={false}
                onToggleCollapse={() => {}}
                onRouteSelect={handleRouteSelect}
                isTakeoverActive={false}
              />
            )}

            {/* ─── 📱 APPROVED ADAPTIVE MOBILE OVERLAY LOWER DRAWER CONTROLLER ─── */}
            {/* Hidden during loading to prevent empty frames from flashing before vector data finishes compiling */}
            {isMobile && !isWorkspaceLoading && (
              <div className={`rg-mobile-unified-bottom-drawer ${isBottomDrawerExpanded ? "drawer-expanded" : "drawer-minimized"} ${isTakeoverCurrentlyActive ? "has-active-selection" : ""}`}>
                
                {/* INTERACTIVE DRAG HANDLE ROW */}
                <div 
                  className="rg-mobile-drawer-drag-handle-bar"
                  onClick={() => {
                    const nextExpandedState = !isBottomDrawerExpanded;
                    setIsBottomDrawerExpanded(nextExpandedState);
                    
                    /* 🎯 CO-ORDINATION FIX: If the user explicitly expands the lower sheet 
                       by tapping the handle bar, collapse the mobile cart dropdown tray */
                    if (nextExpandedState) {
                      setIsMobileCartOpen(false);
                    }
                  }}
                >
                  <div className="rg-drawer-horizontal-pill-indicator"></div>
                  
                  <div className="rg-drawer-toggle-arrow-indicator">
                    {isBottomDrawerExpanded ? '▼' : '▲'}
                  </div>

                  <div className="rg-drawer-status-title-text-wrapper">
                    <span className="rg-drawer-status-title-text">
                      {isTakeoverCurrentlyActive && selectedRouteFeature?.properties
                        ? `FS ${selectedRouteFeature.properties.ID || selectedRouteFeature.properties.id || ''} - ${selectedRouteFeature.properties.NAME || selectedRouteFeature.properties.title || "Selected Route"}`
                        : `Available RideGuides (${filteredRoutes.length})`
                      }
                    </span>
                    {isTakeoverCurrentlyActive && selectedRouteFeature?.properties?.v3_fcs_label && (
                      <img 
                        src={`/images/badges/fcs/fcs-badge-${String(selectedRouteFeature.properties.v3_fcs_label).toLowerCase()}.png`} 
                        alt="Difficulty Badge" 
                        className="rg-drawer-header-badge" 
                      />
                    )}
                  </div>
                </div>

                {/* THE ADAPTIVE CONTENT ACCORDION PANE */}
                <div className="rg-mobile-drawer-interior-scroll-pane">
                  {isTakeoverCurrentlyActive ? (
                    <aside className="rg-left-workspace-storefront-sidebar-mobile-portal">
                      <PersistentLeftShopPanel
                        activeRouteProperties={selectedRouteFeature ? selectedRouteFeature.properties : null}
                        allRoutes={masterRoutes}
                        isMobile={true} 
                        onActionTriggered={() => setIsMobileCartOpen(false)}
                      />
                    </aside>
                  ) : (
                    <RideResultGallery
                      routes={filteredRoutes}
                      activeHoverId={activeHoverId}
                      onHoverChange={setActiveHoverId}
                      isCollapsed={false}
                      onToggleCollapse={() => {}}
                      onRouteSelect={handleRouteSelect}
                      isTakeoverActive={false}
                    />
                  )}
                </div>

                {/* 🎯 THE PERSISTENT SYSTEM BEZEL FOOTER: Anchored directly below the content pane */}
                <div className="rg-mobile-drawer-system-bezel-footer">
                  <div className="rg-bezel-hardware-line" />
                </div>

              </div>
            )}
            

          </div>
        </div>
      </div>
    </div>
  );
}