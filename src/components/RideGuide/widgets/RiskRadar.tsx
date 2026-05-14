/* src/components/RideGuide/widgets/RiskRadar.tsx */
import '../../../styles/RouteMetrics.css';

export default function RiskRadar({ routeID, syncVersion }: any) {
  // DYNAMIC PATH: Pull from .env with fallback
  const RADAR_BASE = import.meta.env.VITE_RADAR_DIR || '/data/visualization';
  
  // CONSTRUCTED PATH: Combines base, ID, and the sync version for caching
  const svgPath = `${RADAR_BASE}/${routeID}_spider.svg?v=${syncVersion}`;

  return (
    <div className="rr-risk-radar-container">
      <div className="rr-risk-radar-header">RISK RADAR</div>
      
      <div className="rr-risk-radar-main">
        <div className="rr-radar-stack-context">
          
          {/* SVG Background Layer */}
          <div className="rr-risk-radar-gauge-box">
            <img src={svgPath} alt="Risk Radar" className="rr-risk-radar-svg" />
          </div>

          {/* Floating UI Layer (z-index 10) */}
          <div className="rr-radar-label rr-label-top">VERTICAL TAX</div>
          <div className="rr-radar-label rr-label-vertical rr-label-left">ISOLATION</div>
          <div className="rr-radar-label rr-label-vertical rr-label-right">SLIP HAZARD</div>
          <div className="rr-radar-label rr-label-bottom-left">EXPOSURE</div>
          <div className="rr-radar-label rr-label-bottom-right">ENERGY DRAIN</div>
          
        </div>
      </div>
    </div>
  );
}