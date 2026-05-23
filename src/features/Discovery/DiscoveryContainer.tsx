/* src/features/Discovery/DiscoveryContainer.tsx */
import { useState, useCallback, useRef } from "react";
import GravelGuide from "./GravelGuide";
import { useRideFinderEngine, RideFilterBar, RideResultGallery } from "./components/RideFinder";
import GravelPopup from "./components/GravelPopup";

import "./DiscoveryContainer.css"; 

export default function DiscoveryContainer() {
  const [activeHoverId, setActiveHoverId] = useState<string | null>(null);
  const [masterRoutes, setMasterRoutes] = useState<any[]>([]);
  const [filteredRoutes, setFilteredRoutes] = useState<any[]>([]);
  
  const [selectedRouteFeature, setSelectedRouteFeature] = useState<any | null>(null);
  const [activeTakeoverRouteId, setActiveTakeoverRouteId] = useState<string | null>(null);
  const [isGalleryCollapsed, setIsGalleryCollapsed] = useState(false);

  const [isPopupClosing, setIsPopupClosing] = useState(false);
  const mapResetFnRef = useRef<(() => void) | null>(null);
  const mapZoomFnRef = useRef<((feature: any) => void) | null>(null);

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
      setIsGalleryCollapsed(true);

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
      setIsGalleryCollapsed(false); 
      setIsPopupClosing(false); // Reset tracking flag for next mount cycle

      if (mapResetFnRef.current) {
        mapResetFnRef.current();
      }
    }, 400); // Matches the 350ms duration of the popup-dismissing animation
  }, []);

  const filterEngine = useRideFinderEngine(masterRoutes, handleFilterUpdate);
  const isTakeoverCurrentlyActive = activeTakeoverRouteId !== null;

  return (
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
          // Pass the state class modifier straight through to the popup's top level element
          className={isPopupClosing ? "popup-dismissing" : "popup-entering"}
        />
      )}

      <div className="discovery-center-container">
        <main className="discovery-map-main-viewport">
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
        </main>

        <RideResultGallery 
          routes={filteredRoutes} 
          activeHoverId={activeHoverId}
          onHoverChange={setActiveHoverId}
          isCollapsed={isGalleryCollapsed}
          onToggleCollapse={() => setIsGalleryCollapsed(prev => !prev)}
          onRouteSelect={handleRouteSelect}
          isTakeoverActive={isTakeoverCurrentlyActive}
        />
      </div>
    </div>
  ); // FIXED: Trimmed away compiled trailing layout brace mismatch syntax errors cleanly
}