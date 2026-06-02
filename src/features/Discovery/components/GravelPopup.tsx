/* src/features/Discovery/components/GravelPopup.tsx */
import Sparkline from "../../../components/RideGuide/widgets/Sparkline";
import MetricsTiles from "../../../components/RideGuide/widgets/MetricsTiles";
/* 🎯 CLEANED: Removed the unused useUnlockModal import statement */

interface GravelPopupProps {
  feature: any;
  onClose: () => void;
  className?: string;
}

export default function GravelPopup({ feature, onClose, className = "popup-entering" }: GravelPopupProps) {
  if (!feature) return null;

  /* 🎯 SOLVED: Removed the unused 'useUnlockModal' destructuring hook to eliminate TS error 6198 */

  const geoData = feature.properties ?? {};
  const routeID = String(geoData.profile_id || geoData.id || feature.id || "");
  
  const routeName = geoData.NAME || "Unknown Route";
  const routeVibe = geoData.v3_vibe || "Explore backcountry trails";
  const routeSurface = geoData.v3_surface || "Gravel / Dirt";

  return (
    <div className={`takeover-hud-drop-down-tray-wrapper ${className}`}>
      <div className="hud-integrated-blue-header-capsule">
        <div className="hud-header-text-stack">
          <h1 className="hud-route-title-node">FS {routeName}</h1>
          
          <p className="hud-route-metadata-subtext">
            Route Type: <strong>{routeVibe}</strong>
            <span className="hud-metadata-inline-divider">|</span>
            Surface Type: <strong>{routeSurface}</strong>
          </p>
        </div>

        <button onClick={onClose} className="takeover-hud-tray-up-chevron-btn" title="Close Drawer" aria-label="Close Drawer">
          ▲
        </button>
      </div>

      <div className="takeover-hud-drop-down-tray-body">
        <div className="hud-console-section section-metrics-row">
          <div className="takeover-report-label-banner"><span>Route Metrics</span></div>
          <div className="hud-section-body horizontal-metrics-grid-bay">
            <MetricsTiles data={geoData} />
          </div>
        </div>

        <div className="hud-console-section section-elevation-graph">
          <div className="takeover-report-label-banner"><span>Elevation Profile</span></div>
          <div className="hud-section-body sparkline-viewport-containment">
            <Sparkline routeID={routeID} />
          </div>
        </div>
      </div>
    </div>
  );
}