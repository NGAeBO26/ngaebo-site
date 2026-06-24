/* src/pages/RideGuide.tsx */
import { useState, useCallback, useRef, useEffect } from "react"; // 🎯 ADDED: useEffect hook extraction
import GravelGuide from "../features/Discovery/GravelGuide";
import { useRideFinderEngine, RideFilterBar, RideResultGallery } from "../features/Discovery/components/RideFinder";
import GravelPopup from "../features/Discovery/components/GravelPopup";
import TacticalLeadForm from "../components/TacticalLeadForm";

// IMPORT LOADING ANIMATION MODULES
import { LoadingOverlay } from "../components/LoadingOverlay";

// IMPORT PREMIUM E-COMMERCE SIDEBAR CARD NODE CONTEXTS
import PersistentLeftShopPanel from "../store/StorePanel";

// LOAD UNIFIED INTEGRATED STOREFRONT BOUNDARIES
import "../styles/store.css";
import "../features/Discovery/DiscoveryContainer.css"; 
import "../styles/RideGuide.css"; 

export default function RideGuide() {
  const [activeHoverId, setActiveHoverId] = useState<string | null>(null);
  const [masterRoutes, setMasterRoutes] = useState<any[]>([]);
  const [filteredRoutes, setFilteredRoutes] = useState<any[]>([]);
  
  const [selectedRouteFeature, setSelectedRouteFeature] = useState<any | null>(null);
  const [activeTakeoverRouteId, setActiveTakeoverRouteId] = useState<string | null>(null);

  const [isPopupClosing, setIsPopupClosing] = useState(false);
  const mapResetFnRef = useRef<(() => void) | null>(null);
  const mapZoomFnRef = useRef<((feature: any) => void) | null>(null);

  // 🎯 ADDED: Active layout loading guards state machine
  const [isWorkspaceLoading, setIsWorkspaceLoading] = useState<boolean>(true);
  const [loadProgress, setLoadProgress] = useState<number>(0);

  const [showModal, setShowModal] = useState(() => {
    return localStorage.getItem("rideguide_lead_submitted") !== "true";
  });

  // 🎯 ADDED: Simulated incremental percentage progression engine
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

  const handleLeadSuccess = () => {
    localStorage.setItem("rideguide_lead_submitted", "true");
    setShowModal(false);
  };

  const handleFilterUpdate = useCallback((results: any[]) => {
    setFilteredRoutes(results);
  }, []);

  // 🎯 UPDATED: Releases workspace loading locks once map dataset hydrates successfully
  const handleRoutesLoaded = useCallback((routes: any[]) => {
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
      const primitiveId = String(props.profile_id || feature.id || props.id || "");
      
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
    <div className="ride-finder-page-container">
      
      {/* PERMANENT 3-TIER IN-PAGE ONBOARDING FLOW */}
      <section className="rg-inline-showcase-section">
        <div className="rf-marketing-hero-banner">
          <h2>Plan Faster. Ride Smarter.</h2>
          <p>HIGH ACCURACY TERRAIN - CUSTOM ANALYTICS - WEATHER AWARE - GUIDE FOR YOUR RIDE</p>
        </div>

        <div className="rg-inline-funnel-container">
          {/* TIER 1: INTEGRATED 4-COLUMN TRUST & PREVIEW STRIP */}
          <div className="prop-strip-matrix-bay tier-4-column-grid">
            <div className="prop-value-column-card">
              <div className="prop-card-header-strip">
                <div className="rg-preview-img-contain-rotated">
                  <img src="/data/assets/RideGuide_Sample.png" alt="RideGuide Premium PDF Pack" className="rg-mini-thumbnail-rotated" />
                </div>
                <h5>Know Before You Go</h5>
              </div>
              <p>High-resolution elevation mapping, route metrics, and surface saturation tracking dials, <strong className="text-prop-heavy">so you are prepared for every ride!</strong>.</p>
            </div>

            <div className="prop-value-column-card">
              <div className="prop-card-header-strip">
                <div className="prop-value-icon-box ng-prop-icon-offline">
                  <img src="data\assets\icon_no_cell_signal.svg" className="ng-prop-graphic-asset" alt="Offline Independent" />
                </div>
                <h5>Offline Independent</h5>
              </div>
              <p>Pre-rendered field guides that load instantly without requiring <strong className="text-prop-heavy">cell network data or map syncs</strong>.</p>
            </div>

            <div className="prop-value-column-card">
              <div className="prop-card-header-strip">
                <div className="prop-value-icon-box window-icon ng-prop-icon-motor">
                  <img src="data\assets\icon_credit_card.svg" className="ng-prop-graphic-asset" alt="No Subscription Required" />
                </div>
                <h5>No Required Subscription </h5>
              </div>
              <p>Don't get caught in subscription based route services. <strong className="text-prop-heavy">Buy only what you want, when you want.</strong></p>
            </div>

            <div className="prop-value-column-card">
              <div className="prop-card-header-strip">
                <div className="prop-value-icon-box ng-prop-icon-insurance">
                  <img src="data\assets\icon_safety.svg" className="ng-prop-graphic-asset" alt="Peace of Mind" />
                </div>
                <h5>Peace of Mind</h5>
              </div>
              <p>The backcountry can be dangerous if you are not prepared. <strong className="text-prop-heavy">Understand your risk and ride safely.</strong></p>
            </div>
          </div>

          {/* TIER 2: FULL-WIDTH CONVERSION BANNER */}
          <div className="rg-conversion-banner-tier">
            {!showModal ? (
              <div className="capture-success-persistent-msg">
                ✓ Free 3-Pack Sample Unlocked! Check your email inbox for your instant backcountry download link.
              </div>
            ) : (
              <>
                <p className="rg-lead-magnet-pitch-text-center">
                  Planning your bike's maiden voyage? We've mapped out the ultimate 3-pack sample series of Fire Service routes perfectly suited for this bike. Instant download package delivered straight to your email.
                </p>
                <div className="capture-form-full-width-container">
                  <TacticalLeadForm
                    layout="row"
                    sourceGroupTag="rides_page_capture"
                    buttonLabel="Unlock Free Sample Maps ➔"
                    onSuccess={handleLeadSuccess}
                  />
                </div>      
              </>
            )}
          </div>

          {/* TIER 3: HORIZONTAL ONBOARDING ROW & MICRO-HEADER */}
          <div className="rg-horizontal-instructions-tier">
            <div className="rg-instructions-micro-header">Get Your RideGuide in 3 Easy Steps...</div>
            <div className="rg-horizontal-steps-row">
              <div className="rg-step-column-item">
                <span className="rg-step-badge-number">1</span>
                <p className="rg-step-item-text"><strong>Filter routes</strong> by name, route class, distance, or grade using the RideFinder filtering controls.</p>
              </div>
              <div className="rg-step-step-divider">➔</div>
              <div className="rg-step-column-item">
                <span className="rg-step-badge-number">2</span>
                <p className="rg-step-item-text"><strong>Select your route</strong> by clicking on the list cards or targeting pins directly on the live map canvas.</p>
              </div>
              <div className="rg-step-step-divider">➔</div>
              <div className="rg-step-column-item">
                <span className="rg-step-badge-number">3</span>
                <p className="rg-step-item-text"><strong>Unlock your RideGuide</strong> pack to download full continuous telemetry, profiles, and safety matrices.</p>
              </div>
            </div>
            <h4 className="rg-instructions-micro-header">
              Use the interactive map below to discover routes, then get your offline guide delivered to your inbox!
            </h4>
          </div>
        </div>
      </section>

      {/* ORIGINAL WORKSPACE DECK CONTAINER */}
      <div className="discovery-dashboard-root">
        
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

        {/* THREE-COLUMN WORKSPACE FRAME CONTAINER */}
        <div className="discovery-center-container" style={{ position: "relative" }}>
          {/* 🎯 ADDED: High-performance branding spinner takeover guard */}
          <LoadingOverlay 
            isLoading={isWorkspaceLoading} 
            progress={loadProgress} 
            message="Loading Map Data..."
          />

          <div className="rg-retail-map-workspace-layout-deck">
            
          
            
            {/* COLUMN 1: PERSISTENT LEFT STOREFRONT SIDEBAR CONTROLLER */}
            <aside className="rg-left-workspace-storefront-sidebar">
              {/* 🎯 FIXED: Equipped panel with the live master dataset prop reference */}
              <PersistentLeftShopPanel 
                activeRouteProperties={selectedRouteFeature ? selectedRouteFeature.properties : null} 
                allRoutes={masterRoutes}
              />
            </aside>

            {/* COLUMN 2: CENTRAL MAP Viewport ANCHOR PLATFORM */}
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
              />
            </div>

            {/* COLUMN 3: PERSISTENT RIGHT RESULTS FINDER GALLERY */}
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

      {/* DEDICATED FEATURED PRODUCTS CONTAINER */}
      <div className="rf-featured-products-footer-container">
        <span className="rf-section-label">Featured Affiliate Gear</span>
        <div className="rf-product-cards-row">
          <div className="rf-affiliate-product-card">
            <div className="rf-product-icon-wrapper">🚲</div>
            <div>
              <div className="rf-product-title">Maxxis Rambler 40c</div>
              <div className="rf-product-subtitle">Premium Gravel Tire</div>
            </div>
          </div>

          <div className="rf-affiliate-product-card">
            <div className="rf-product-icon-wrapper">📟</div>
            <div>
              <div className="rf-product-title">Garmin Edge 540</div>
              <div className="rf-product-subtitle">GPS Mapping Computer</div>
            </div>
          </div>
        </div>
      </div>
        
    </div>
  ); 
}