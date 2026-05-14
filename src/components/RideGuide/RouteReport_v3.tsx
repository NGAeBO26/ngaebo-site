/* RouteReport_v3.tsx - PRODUCTION UNIT CONTROLLER */
import { useState } from 'react';
import "../../styles/RouteReport.css";
import "../../styles/RouteOverview.css";
import "../../styles/RouteMetrics.css"; 
import "../../styles/RouteGuide.css"; 

// Hooks
import { useRouteMetrics } from "../../hooks/useRouteMetrics";
import { useWeatherData } from "../../hooks/useWeatherData";

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
  // 1. STATE & DATA HOOKS
  const [routeID, setRouteID] = useState<string>(initialRouteID);

  // GIS Metrics (Instant local JSON)
  const { metrics: geoData } = useRouteMetrics(routeID);
  
  // JIT Weather Sync (15-20s Python Engine)
  // We keep 'weatherData' here to ensure the hook manages the lifecycle, 
  // even if individual widgets still fetch by routeID for now.
  const { loading } = useWeatherData(routeID);

  // 2. CONSTANTS
  const BADGES_BASE = import.meta.env.VITE_BADGES_DIR || '/images/badges/fcs';
  const ASSET_BASE = import.meta.env.VITE_ASSETS_DIR || '/data/assets';
  const badgeType = geoData?.v3_fcs_label?.toLowerCase() || 'default';
  const fcsBadgePath = `${BADGES_BASE}/fcs-badge-${badgeType}.png`;

  // 3. LOADING SKELETON (The "Wait" Screen)
  if (loading) {
    return (
      <div className="animate-pulse space-y-6 p-8 max-w-7xl mx-auto bg-slate-900 min-h-screen">
        <div className="h-[400px] bg-slate-800/50 rounded-xl border border-slate-700 flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-400 font-medium tracking-widest uppercase text-sm">Initializing Geospatial Engine...</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 bg-slate-800/30 rounded-xl border border-slate-700" />
          <div className="h-64 bg-slate-800/30 rounded-xl border border-slate-700" />
          <div className="h-64 bg-slate-800/30 rounded-xl border border-slate-700" />
        </div>
      </div>
    );
  }

  // 4. PRODUCTION RENDER
  return (
    <div className="rr-isolation-shell">
      <div className="rr-document-page">
        
        <div className="rr-header-blue-cap-bleed-node"></div>
        <header className="rr-title-bar-tier">
           <div className="rr-logo-slot">
              <img src="/images/RideGuide_embroid-v1.svg" className="rr-img-logo-v3" alt="Logo" />
           </div>
           <div className="rr-name-slot">
              <h1 className="rr-route-name-header-node">FS {geoData?.ID} - {geoData?.NAME || 'NIMBLEWILL'}</h1>
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

        <div className="rr-tier-body-root">
          <div className="rr-body-label-banner">
            <div>ROUTE METRICS</div>
            <div>ROUTE MAP</div>
            <div>ROUTE GUIDE</div>
          </div>
          
          <div className="rr-body-widget-container">
            <div className="rr-metrics-column-sidebar">
               <div style={{ height: '65mm' }}>
                 <MetricsTiles data={geoData} />
               </div>
               <div style={{ height: '25mm' }}>
                 <EffortTax routeID={routeID} />
               </div>
               <div style={{ height: '50mm' }}>
                 <RiskRadar routeID={routeID} />
               </div>
            </div>

            <div className="rr-map-main-box" style={{ width: '91.9mm', height: '140mm' }}>
               <RouteMap routeID={routeID} onRouteSelect={setRouteID} />
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
                        <img src={`${ASSET_BASE}/rideguide-legend.svg`} className="rr-legend-svg-asset" alt="Legend" />
                    </div>
                </div>
            </div>
          </div>
        </div>

        <div className="rr-tier-sparkline-root">
          <div className="rr-sparkline-label-banner">ELEVATION PROFILE</div>
          <div className="rr-sparkline-widget-container">
              <Sparkline routeID={routeID} />
          </div>
        </div>

        <footer className="rr-metadata-footer-bleed">
          <div className="rr-footer-grid">
            <div className="rr-footer-assets-left">
              <img src="/images/site-logo.png" className="rr-footer-logo" alt="Site Logo" />
            </div>
            <div className="rr-footer-center-stack">
              <div className="rr-footer-line">ID: {routeID} - RideGuide V3 Analysis</div>
              <div className="rr-footer-line">Created: {new Date().toLocaleDateString()}</div>
            </div>
            <div className="rr-footer-assets-right">
              <img src="/data/assets/ngaebo-qr-code.png" className="rr-footer-qr" alt="QR Code" />
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}