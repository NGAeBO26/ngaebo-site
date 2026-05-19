/* src/features/Discovery/DiscoveryContainer.tsx */
import { useState, useCallback } from "react";
import GravelGuide from "./GravelGuide";
import { useRideFinderEngine, RideFilterBar, RideResultGallery } from "./components/RideFinder";

import "./DiscoveryContainer.css"; 

export default function DiscoveryContainer() {
  const [activeHoverId, setActiveHoverId] = useState<string | null>(null);
  const [masterRoutes, setMasterRoutes] = useState<any[]>([]);
  const [filteredRoutes, setFilteredRoutes] = useState<any[]>([]);

  const handleFilterUpdate = useCallback((results: any[]) => {
    setFilteredRoutes(results);
  }, []);

  const handleRoutesLoaded = useCallback((routes: any[]) => {
    setMasterRoutes(routes);
    setFilteredRoutes(routes);
  }, []);

  const filterEngine = useRideFinderEngine(masterRoutes, handleFilterUpdate);

  return (
    <div className="discovery-dashboard-root">
      {/* TIER 1: TOP FILTERS ROW MODULE */}
      <RideFilterBar engine={filterEngine} totalCount={masterRoutes.length} />

      {/* CENTER WORKSPACE: MAP VIEWPORT AND SLIDE PANEL SIDE-BY-SIDE */}
      <div className="discovery-center-container">
        <main className="discovery-map-main-viewport">
          {/* FIXED: Now takes the active filtered data sets down into map gl contexts */}
          <GravelGuide 
            activeHoverId={activeHoverId} 
            filteredRoutes={filteredRoutes}
            onRoutesLoaded={handleRoutesLoaded}
            onRouteHover={setActiveHoverId} 
          />
        </main>

        {/* DRAWER CONTAINER HOUSING VERTICAL RESULT LIST */}
        <RideResultGallery 
          routes={filteredRoutes} 
          activeHoverId={activeHoverId} 
          setActiveHoverId={setActiveHoverId} 
        />
      </div>
    </div>
  );
}