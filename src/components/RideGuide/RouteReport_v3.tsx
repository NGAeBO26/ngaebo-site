/* RouteReport_v3.tsx - PRODUCTION UNIT CONTROLLER */

import { useState, useRef } from "react";
import "../../styles/RouteReport.css";
import "../../styles/RouteOverview.css";
import "../../styles/RouteMetrics.css"; 
import "../../styles/RouteGuide.css"; 

// Hooks
import { useRouteMetrics } from "../../hooks/useRouteMetrics";


// Widgets
import CurrentWeather from "./widgets/CurrentWeather";
import PrimeRideTime from "./widgets/PrimeRideTime";
import RouteConditions from "./widgets/RouteConditions";
import MetricsTiles from "./widgets/MetricsTiles";
import EffortTax from "./widgets/EffortTax";
import RiskRadar from "./widgets/RiskRadar";
import PlacesToSee from "./widgets/PlacesToSee";
import Sparkline from "./widgets/Sparkline";
import EmergencyServices from "./widgets/EmergencyServices";
import RouteMap from "./widgets/RouteMap/RouteMap";

export default function RouteReport_v3({ routeID: initialRouteID }: { routeID: string }) {
  // State to allow the map selection to update the entire report
  const [routeID, setRouteID] = useState<string>(initialRouteID);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncVersion, setSyncVersion] = useState(0);
  
  const syncLock = useRef(false);

  // Hook Data
  const { metrics } = useRouteMetrics(routeID);
  
  // Mapping metrics to geoData for your description slot
  const geoData = metrics;

  // FCS Badge Logic (Matches your Tier 1 requirement)
  // 1. Grab the dynamic path from the Switch
  const BADGES_BASE = import.meta.env.VITE_BADGES_DIR || '/images/badges/fcs';

  // 2. Identify the badge type from the metrics hook
  const badgeType = metrics?.v3_fcs_label?.toLowerCase() || 'default';

  // 3. Construct the dynamic asset path
  const fcsBadgePath = `${BADGES_BASE}/fcs-badge-${badgeType}.png`;

  // 1. Define the asset base from the environment for the legend and other static assets
  const ASSET_BASE = import.meta.env.VITE_ASSETS_DIR || '/data/assets';

  const triggerJitSync = async () => {
  if (syncLock.current) return;
  syncLock.current = true;
  setIsSyncing(true);

  try {
    // Audit: Use the relative path to let the proxy handle the port switch
    const response = await fetch(`/api/sync-weather/${routeID}`, {
      method: 'POST',
    });
    
    if (response.ok) {
      setSyncVersion(prev => prev + 1);
      console.log(`[JIT Sync] Success for ${routeID}. Version: ${syncVersion + 1}`);
    }
  } catch (error) {
    console.error("Sync failed:", error);
  } finally {
    setIsSyncing(false);
    syncLock.current = false;
  }
};

  return (
    <div className="rr-isolation-shell">
      <div className="rr-document-page">
        
        {/* TIER 1: HEADER & METADATA - RESTORED EXACTLY */}
        <div className="rr-header-blue-cap-bleed-node"></div>
        <header className="rr-title-bar-tier">
           <div className="rr-logo-slot">
              <img src="/images/RideGuide_embroid-v1.svg" className="rr-img-logo-v3" alt="Logo" />
           </div>
           <div className="rr-name-slot">
              <h1 className="rr-route-name-header-node">FS {metrics?.ID} - {metrics?.NAME || 'NIMBLEWILL'}</h1>
           </div>
           <div className="rr-badge-slot">
              <img src={fcsBadgePath} className="rr-img-badge-v3" alt="Badge" />
           </div>
        </header>

        <div className="rr-metadata-tier-root">
           <div className="rr-tag-slot">
              <div className="rr-tagline-centered-node">
                 HIGH ACCURACY TERRAIN - CUSTOM ANALYTICS - <br/> 
                 WEATHER AWARE - GUIDE FOR YOUR RIDE
              </div>
           </div>
           <div className="rr-desc-slot">
              <div className="rr-v3-route-description-text">
                  Route Type: <strong>{geoData?.v3_vibe}</strong><br/>
                  Surface Type: <strong>{geoData?.v3_surface}</strong>
              </div>
           </div>
        </div>

        {/* TIER 2: OVERVIEW */}
        <div className="rr-tier-overview-root">
          <div className="rr-overview-label-banner">
            <div>CURRENT CONDITIONS</div>
            <div>PRIME RIDE TIME</div>
            <div>TRAIL STATUS</div>
          </div>
          <div className="rr-overview-widget-container">
            <div className="rr-overview-module"><CurrentWeather routeID={routeID} /></div>
            <div className="rr-overview-module"><PrimeRideTime routeID={routeID} /></div>
            <div className="rr-overview-module"><RouteConditions routeID={routeID} /></div>
          </div>
        </div>

        {/* TIER 3: BODY */}
        <div className="rr-tier-body-root">
          <div className="rr-body-label-banner">
            <div>ROUTE METRICS</div>
            <div>INTERACTIVE ANALYSIS MAP</div>
            <div>ROUTE GUIDE</div>
          </div>
          
          <div className="rr-body-widget-container">
            <div className="rr-metrics-column-sidebar">
               <div style={{ height: '65mm' }}>
                 <MetricsTiles data={metrics} />
               </div>
               <div style={{ height: '25mm' }}>
                 <EffortTax routeID={routeID} />
               </div>
               <div style={{ height: '50mm' }}>
                 <RiskRadar routeID={routeID} syncVersion={syncVersion} />
               </div>
            </div>

            <div className="rr-map-main-box" style={{ width: '91.9mm', height: '140mm' }}>
               <RouteMap routeID={routeID} onRouteSelect={setRouteID} />
               <div className="rr-map-sync-overlay">
                  <button onClick={triggerJitSync} disabled={isSyncing} className="rr-sync-btn">
                    {isSyncing ? 'ANALYZING...' : 'SYNC GIS DATA'}
                  </button>
               </div>
            </div>

            <div className="rr-guide-column-sidebar">
                <div className="rr-guide-module-container" style={{ height: '65mm' }}>
                    <PlacesToSee routeID={routeID} />
                </div>
                <div className="rr-guide-module-container" style={{ height: '25mm' }}>
                    <EmergencyServices routeID={routeID} />
                </div>
                <div className="rr-guide-module-container" style={{ height: '50mm' }}>
                    <div className="rr-guide-module-header">MAP LEGEND</div>
                    <div className="rr-legend-main-content">
                        {/* DYNAMIC LEGEND PATH */}
                        <img src={`${ASSET_BASE}/rideguide-legend.svg`} className="rr-legend-svg-asset" alt="Legend" />
                    </div>
                </div>
            </div>
          </div>
        </div>

        {/* TIER 4: ELEVATION */}
        <div className="rr-tier-sparkline-root">
          <div className="rr-sparkline-label-banner">ELEVATION PROFILE</div>
          <div className="rr-sparkline-widget-container">
              <Sparkline routeID={routeID} />
          </div>
        </div>

{/* TIER 5: FOOTER */}
<footer className="rr-metadata-footer-bleed">
  <div className="rr-footer-grid">
    {/* Left Assets */}
    <div className="rr-footer-assets-left">
      <img src="/images/site-logo.png" className="rr-footer-logo" alt="Site Logo" />
    </div>

    {/* Center Stacked Text */}
    <div className="rr-footer-center-stack">
      <div className="rr-footer-line">ID: {routeID} - RideGuide V3 Analysis</div>
      <div className="rr-footer-line">Created: {new Date().toLocaleDateString()}</div>
    </div>

    {/* Right Assets */}
    <div className="rr-footer-assets-right">
      <img src="/data/assets/ngaebo-qr-code.png" className="rr-footer-qr" alt="QR Code" />
    </div>
  </div>
</footer>

      </div>
    </div>
  );
}