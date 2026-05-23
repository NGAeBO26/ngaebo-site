/* src/features/Discovery/components/GravelPopup.tsx */
import Sparkline from "../../../components/RideGuide/widgets/Sparkline";
import MetricsTiles from "../../../components/RideGuide/widgets/MetricsTiles";

interface GravelPopupProps {
  feature: any;
  onClose: () => void;
  className?: string; // FIXED: Support the conditional entering/dismissing animation class strings
}

export default function GravelPopup({ feature, onClose, className = "popup-entering" }: GravelPopupProps) {
  if (!feature) return null;

  const geoData = feature.properties ?? {};
  const routeID = String(geoData.profile_id || geoData.id || feature.id || "");
  
  const routeName = geoData.NAME || "Unknown Route";
  const routeVibe = geoData.v3_vibe || "Explore backcountry trails";
  const routeSurface = geoData.v3_surface || "Gravel / Dirt";

  const handleCtaClick = () => {
    if (routeID) window.open(`/report/${routeID}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={`takeover-hud-drop-down-tray-wrapper ${className}`}>
      
      {/* INTEGRATED DEEP BLUE NAVIGATION RECTANGLE BAR */}
      <div className="hud-integrated-blue-header-capsule">
        <div className="hud-header-text-stack">
          <h1 className="hud-route-title-node">FS {routeName}</h1>
          
          <button className="hud-header-centered-cta-btn" onClick={handleCtaClick}>
            Get Today's Full RideGuide
          </button>
          
          <p className="hud-route-metadata-subtext">
            Route Type: <strong>{routeVibe}</strong>
            <span className="hud-metadata-inline-divider">|</span>
            Surface Type: <strong>{routeSurface}</strong>
          </p>
        </div>

        {/* RE-POSITIONED UPWARD CHEVRON TOGGLE ARROW */}
        <button
          onClick={onClose}
          className="takeover-hud-tray-up-chevron-btn"
          title="Close Drawer"
          aria-label="Close Drawer"
        >
          ▲
        </button>
      </div>

      {/* COMPACT INTERACTIVE METRICS BODY CHIPS AND SPARKLINE GRAPH */}
      <div className="takeover-hud-drop-down-tray-body">
        
        {/* SECTION 1: ROUTE METRICS */}
        <div className="hud-console-section section-metrics-row">
          <div className="takeover-report-label-banner">
            <span>Route Metrics</span>
          </div>
          <div className="hud-section-body horizontal-metrics-grid-bay">
            <MetricsTiles data={geoData} />
          </div>
        </div>

        {/* SECTION 2: ELEVATION TIMELINE PROFILE */}
        <div className="hud-console-section section-elevation-graph">
          <div className="takeover-report-label-banner">
            <span>Elevation Profile</span>
          </div>
          <div className="hud-section-body sparkline-viewport-containment">
            <Sparkline routeID={routeID} />
          </div>
        </div>

      </div>
    </div>
  );
}