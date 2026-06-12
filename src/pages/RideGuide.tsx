/* src/pages/RideGuide.tsx */
import { useState, useCallback, useRef } from "react";
import GravelGuide from "../features/Discovery/GravelGuide";
import { useRideFinderEngine, RideFilterBar, RideResultGallery } from "../features/Discovery/components/RideFinder";
import GravelPopup from "../features/Discovery/components/GravelPopup";

// IMPORT PREMIUM E-COMMERCE SIDEBAR CARD NODE CONTEXTS
import PersistentLeftShopPanel from "../store/StorePanel";

// LOAD UNIFIED INTEGRATED STOREFRONT BOUNDARIES
import "../styles/store.css";
import "../features/Discovery/DiscoveryContainer.css"; 
import "../styles/RideGuide.css"; // 🎯 IMPORT NEW STYLESHEET

export default function RideGuide() {
  const [activeHoverId, setActiveHoverId] = useState<string | null>(null);
  const [masterRoutes, setMasterRoutes] = useState<any[]>([]);
  const [filteredRoutes, setFilteredRoutes] = useState<any[]>([]);
  
  const [selectedRouteFeature, setSelectedRouteFeature] = useState<any | null>(null);
  const [activeTakeoverRouteId, setActiveTakeoverRouteId] = useState<string | null>(null);

  const [isPopupClosing, setIsPopupClosing] = useState(false);
  const mapResetFnRef = useRef<(() => void) | null>(null);
  const mapZoomFnRef = useRef<((feature: any) => void) | null>(null);

  // 🎯 HOC CONTROLLER METHODS
  const handleFilterUpdate = useCallback((results: any[]) => {
    setFilteredRoutes(results);
  }, []);

  const handleRoutesLoaded = useCallback((routes: any[]) => {
    setMasterRoutes(routes);
    setFilteredRoutes(routes);
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
      
      {/* 🚀 TOP TAGLINE BANNER */}
      <div className="rf-marketing-hero-banner">
        <h2>Plan Faster. Ride Smarter.</h2>
        <p>HIGH ACCURACY TERRAIN - CUSTOM ANALYTICS - 
                 WEATHER AWARE - GUIDE FOR YOUR RIDE</p>
      </div>

      {/* 🧭 ORIGINAL WORKSPACE DECK CONTAINER */}
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
        <div className="discovery-center-container">
          <div className="rg-retail-map-workspace-layout-deck">
            
            {/* COLUMN 1: PERSISTENT LEFT STOREFRONT SIDEBAR CONTROLLER */}
            <aside className="rg-left-workspace-storefront-sidebar">
              <PersistentLeftShopPanel 
                activeRouteProperties={selectedRouteFeature ? selectedRouteFeature.properties : null} 
              />
            </aside>

            {/* COLUMN 2: CENTRAL RETAIL SPATIAL MAP VIEWPORT ANCHOR PLATFORM */}
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

            {/* COLUMN 3: 🔒 PERSISTENT RIGHT RESULTS FINDER GALLERY */}
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

      {/* 🛒 DEDICATED FEATURED PRODUCTS CONTAINER */}
      <div className="rf-featured-products-footer-container">
        <span className="rf-section-label">Featured Affiliate Gear</span>

        <div className="rf-product-cards-row">
          {/* PRODUCT CARD 1 */}
          <div className="rf-affiliate-product-card">
            <div className="rf-product-icon-wrapper">🚲</div>
            <div>
              <div className="rf-product-title">Maxxis Rambler 40c</div>
              <div className="rf-product-subtitle">Premium Gravel Tire</div>
            </div>
          </div>

          {/* PRODUCT CARD 2 */}
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