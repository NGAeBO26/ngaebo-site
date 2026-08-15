import React, { useState, useEffect, useRef } from "react";
import GravelGuide from "../GravelGuide";
import MobileRideBuilder from "./MobileRideBuilder";
import MobileGravelPopup from "./MobileGravelPopup";
import { RideResultGallery } from "./RideFinder";
import CartDropdown from "../../../components/CartDropdown";
import { LoadingOverlay } from "../../../components/LoadingOverlay";

interface MobileRideGuideProps {
  filterEngine: any;
  masterRoutes: any[];
  filteredRoutes: any[];
  selectedRouteFeature: any | null;
  isTakeoverCurrentlyActive: boolean;
  onRouteSelect: (feature: any) => void;
  onExitTakeover: () => void;
  isWorkspaceLoading: boolean;
  loadProgress: number;
  activeHoverId: string | null;
  onHoverChange: (id: string | null) => void;
  onRoutesLoaded: (routes: any[]) => void;
  onExitFullscreen: () => void;
  mapResetFnRef: React.MutableRefObject<(() => void) | null>;
  mapZoomFnRef: React.MutableRefObject<((feature: any) => void) | null>;
  cartItems: any[];
}

export default function MobileRideGuide({
  filterEngine,
  masterRoutes,
  filteredRoutes,
  selectedRouteFeature,
  isTakeoverCurrentlyActive,
  onRouteSelect,
  onExitTakeover,
  isWorkspaceLoading,
  loadProgress,
  activeHoverId,
  onHoverChange,
  onRoutesLoaded,
  onExitFullscreen,
  mapResetFnRef,
  mapZoomFnRef,
  cartItems,
}: MobileRideGuideProps) {
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState<boolean>(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState<boolean>(false);
  const [isSiteNavMenuOpen, setIsSiteNavMenuOpen] = useState<boolean>(false);
  const [isBottomDrawerExpanded, setIsBottomDrawerExpanded] = useState<boolean>(false);

  const rootRef = useRef<HTMLDivElement | null>(null);

  // 🎯 DASHBOARD ROOT SCROLL SHIFT LOCK: Prevents internal scrollIntoView from shifting the top header strip
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const handleRootScrollLock = () => {
      if (el.scrollTop !== 0) {
        el.scrollTop = 0;
      }
    };
    el.addEventListener("scroll", handleRootScrollLock, { passive: true });
    return () => el.removeEventListener("scroll", handleRootScrollLock);
  }, []);

  // 📱 VIEWPORT MEDIA QUERY & QUIZ EVENT LISTENERS
  useEffect(() => {
    const handleOpenQuizMobile = () => {
      setIsFilterDrawerOpen(true);
      setIsMobileCartOpen(false);
      setIsSiteNavMenuOpen(false);
    };

    window.addEventListener("open-ride-builder", handleOpenQuizMobile);
    window.addEventListener("flash-mega-button", handleOpenQuizMobile);

    return () => {
      window.removeEventListener("open-ride-builder", handleOpenQuizMobile);
      window.removeEventListener("flash-mega-button", handleOpenQuizMobile);
    };
  }, []);

  return (
    <div className="discovery-dashboard-root" ref={rootRef}>
      {/* 📱 MOBILE APP HEADER STRIP */}
      <div className="rg-mobile-app-header-strip">
        <div className="rg-mobile-header-top-seam-mask" />
        <div className="rg-mobile-header-bottom-seam-mask" />

        <div className="rg-mobile-header-left-actions-dock">
          <button
            type="button"
            className="rg-mobile-hamburger-drawer-trigger"
            onClick={() => {
              const nextFilterState = !isFilterDrawerOpen;
              setIsFilterDrawerOpen(nextFilterState);
              setIsMobileCartOpen(false);
              setIsSiteNavMenuOpen(false);

              if (nextFilterState) {
                setIsBottomDrawerExpanded(false);
              }
            }}
            aria-expanded={isFilterDrawerOpen}
            aria-label="Toggle Route Filtering Controls Drawer"
          >
            {isFilterDrawerOpen ? (
              "✕"
            ) : (
              <img src="/data/assets/icon-filter.svg" alt="Filter Controls" />
            )}
          </button>

          <button
            type="button"
            className="rg-drawer-reset-filters-btn"
            onClick={(e) => {
              e.stopPropagation();
              if (isTakeoverCurrentlyActive) {
                onExitTakeover();
              } else {
                if (filterEngine) {
                  filterEngine.resetFilters();
                }
                if (mapResetFnRef.current) {
                  mapResetFnRef.current();
                }
              }
            }}
            title={
              isTakeoverCurrentlyActive
                ? "Clear Selected Route"
                : "Reset All Active Search Filters"
            }
            aria-label={
              isTakeoverCurrentlyActive
                ? "Clear currently selected route metrics overview"
                : "Clear all filtering parameters and return to master backcountry checklist"
            }
          >
            <img src="/data/assets/icon-reset.svg" alt="Reset Filters" />
          </button>
        </div>

        <div
          className="rg-mobile-app-centered-branding"
          onClick={onExitFullscreen}
          title="Minimize workspace map view layer"
        >
          <img src="/images/rideatlas-logo.svg" alt="RideAtlas Logo" />
        </div>

        <div className="rg-mobile-header-right-actions-dock">
          <button
            type="button"
            className={`rg-mobile-header-icon-action-btn ${
              isMobileCartOpen ? "action-active" : ""
            }`}
            onClick={() => {
              const nextCartState = !isMobileCartOpen;
              setIsMobileCartOpen(nextCartState);
              setIsFilterDrawerOpen(false);
              setIsSiteNavMenuOpen(false);

              if (nextCartState) {
                setIsBottomDrawerExpanded(false);
              }
            }}
            aria-expanded={isMobileCartOpen}
            aria-label="Toggle Shopping Cart Dropdown Menu Drawer"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>

            {cartItems && cartItems.length > 0 && (
              <span className="rg-header-cart-badge">{cartItems.length}</span>
            )}
          </button>

          <button
            type="button"
            className={`rg-mobile-sitenav-drawer-trigger ${
              isSiteNavMenuOpen ? "action-active" : ""
            }`}
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
          <nav
            className="rg-mobile-sitenav-dropdown-overlay-tray"
            aria-label="Mobile Site Navigation Menu Links"
          >
            <a href="/" className="rg-mobile-nav-link-item">
              Home
            </a>
            <a
              href="/rides"
              className="rg-mobile-nav-link-item active-destination"
            >
              RideGuides
            </a>
            <a href="/shop" className="rg-mobile-nav-link-item">
              Shop Gear
            </a>
            <a href="/about" className="rg-mobile-nav-link-item">
              About Us
            </a>
          </nav>
        )}

        <CartDropdown
          isOpen={isMobileCartOpen}
          allRoutes={masterRoutes}
          isMobile={true}
          onActionTriggered={() => setIsMobileCartOpen(false)}
        />
      </div>

      {/* HAMBURGER SLIDEOUT DROPDOWN TRAY FILTER CONTROLS */}
      {!isMobileCartOpen && !isSiteNavMenuOpen && (
        <div
          className={`finder-header-row ${
            isFilterDrawerOpen ? "is-expanded" : "is-collapsed"
          }`}
        >
          <MobileRideBuilder
            isOpen={isFilterDrawerOpen}
            onToggleOpen={() => {
              setIsFilterDrawerOpen((prev) => {
                const nextState = !prev;
                if (nextState) {
                  setIsBottomDrawerExpanded(false);
                }
                return nextState;
              });
            }}
            onClose={() => setIsFilterDrawerOpen(false)}
            engine={filterEngine}
            routesData={masterRoutes}
            totalCount={masterRoutes.length}
            onApplyQuiz={() => {
              setIsFilterDrawerOpen(false);
              setIsBottomDrawerExpanded(true);
            }}
            onRouteSelect={onRouteSelect}
          />
        </div>
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
          {/* Immersive WebGL Mapping Backplane Canvas Viewport */}
          <div className="discovery-map-main-viewport">
            <GravelGuide
              activeHoverId={activeHoverId}
              onRouteHover={onHoverChange}
              activeRouteId={
                isTakeoverCurrentlyActive
                  ? String(
                      selectedRouteFeature?.properties?.profile_id ||
                        selectedRouteFeature?.id ||
                        selectedRouteFeature?.properties?.id ||
                        ""
                    )
                  : null
              }
              onRouteSelect={onRouteSelect}
              isTakeoverActive={isTakeoverCurrentlyActive}
              filteredRoutes={filteredRoutes}
              onRoutesLoaded={onRoutesLoaded}
              onRegisterResetFn={(fn) => {
                mapResetFnRef.current = fn;
              }}
              onRegisterZoomFn={(fn) => {
                mapZoomFnRef.current = fn;
              }}
              onExitFullscreen={onExitFullscreen}
            />
          </div>

          {/* 📱 APPROVED ADAPTIVE MOBILE OVERLAY LOWER DRAWER CONTROLLER */}
          <div
            className={`rg-mobile-unified-bottom-drawer ${
              isBottomDrawerExpanded ? "drawer-expanded" : "drawer-minimized"
            } ${isTakeoverCurrentlyActive ? "has-active-selection" : ""}`}
          >
            {/* INTERACTIVE DRAG HANDLE ROW */}
            <div
              className="rg-mobile-drawer-drag-handle-bar"
              onClick={() => {
                const nextExpandedState = !isBottomDrawerExpanded;
                setIsBottomDrawerExpanded(nextExpandedState);

                if (nextExpandedState) {
                  setIsMobileCartOpen(false);
                }
              }}
            >
              <div className="rg-drawer-horizontal-pill-indicator" />

              <div className="rg-drawer-toggle-arrow-indicator">
                {isBottomDrawerExpanded ? "▼" : "▲"}
              </div>

              <div className="rg-drawer-status-title-text-wrapper">
                <span className="rg-drawer-status-title-text">
                  {isWorkspaceLoading || masterRoutes.length === 0
                    ? "Available RideGuides"
                    : isTakeoverCurrentlyActive &&
                      selectedRouteFeature?.properties
                    ? `FS ${
                        selectedRouteFeature.properties.ID ||
                        selectedRouteFeature.properties.id ||
                        ""
                      } - ${
                        selectedRouteFeature.properties.NAME ||
                        selectedRouteFeature.properties.title ||
                        "Selected Route"
                      }`
                    : `Available RideGuides (${filteredRoutes.length})`}
                </span>
                  {isTakeoverCurrentlyActive &&
                    selectedRouteFeature?.properties?.v3_fcs_label && (
                      <img
                        src={`/images/badges/fcs/fcs-badge-${String(
                          selectedRouteFeature.properties.v3_fcs_label
                        ).toLowerCase()}.png`}
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
                    <MobileGravelPopup
                      feature={selectedRouteFeature}
                      onActionTriggered={() => setIsMobileCartOpen(false)}
                    />
                  </aside>
                ) : (
                  <RideResultGallery
                    routes={filteredRoutes}
                    activeHoverId={activeHoverId}
                    onHoverChange={onHoverChange}
                    isCollapsed={false}
                    onToggleCollapse={() => {}}
                    onRouteSelect={onRouteSelect}
                    isTakeoverActive={false}
                    sortBy={filterEngine.sortBy}
                    onSortChange={filterEngine.setSortBy}
                    sortOrder={filterEngine.sortOrder}
                    onToggleSortOrder={filterEngine.toggleSortOrder}
                    evaluateRouteProximity={filterEngine.evaluateRouteProximity}
                    selectedRideDay={
                      filterEngine.activeQuizSelections?.selectedRideDay
                    }
                    activeQuizSelections={filterEngine.activeQuizSelections}
                    driveTimesMap={filterEngine.driveTimesMap}
                  />
                )}
              </div>

              {/* 🎯 THE PERSISTENT SYSTEM BEZEL FOOTER */}
              <div className="rg-mobile-drawer-system-bezel-footer">
                <div className="rg-bezel-hardware-line" />
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}