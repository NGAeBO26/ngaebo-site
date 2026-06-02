/* src/features/Shop/InlineBlueprintExplorer.tsx */
import { useState } from "react";
import TelemetryTooltip from "../components/RideGuide/TelemetryTooltip";
import "../styles/modal.css"; // Reuses existing clean element metrics

export default function InlineBlueprintExplorer() {
  // Starts directly on "intro" state per conversion strategy rules
  const [activeKey, setActiveKey] = useState("intro");

  const responsiveZones = [
    { key: "currentweather",   top: "15.2%", left: "4.6%",   width: "23.2%", height: "10.8%" },
    { key: "primeridetime",    top: "15.2%", left: "28.7%",  width: "42.6%", height: "10.8%" },
    { key: "routeconditions",  top: "15.2%", left: "72.2%",  width: "23.2%", height: "10.8%" },
    { key: "routemetrics",     top: "29.5%", left: "4.6%",   width: "23.2%", height: "23.3%" },
    { key: "efforttax",        top: "53.3%", left: "4.6%",   width: "23.2%", height: "9.0%"  },
    { key: "riskradar",        top: "61.8%", left: "4.6%",   width: "23.2%", height: "17.9%" },
    { key: "placestosee",      top: "29.5%", left: "72.2%",  width: "23.2%", height: "23.3%" },
    { key: "emergencyservices",top: "53.3%", left: "72.2%",  width: "23.2%", height: "9.0%"  },
    { key: "elevationprofile", top: "80.2%", left: "4.6%",   width: "90.8%", height: "12.5%" } 
  ];

  return (
    <div className="rg-blueprint-interaction-deck">
      
      {/* COLUMN 1: INTRO BACKGROUND SPLASH OR LIVE TOOLTIP DECK */}
      <div className="rg-gutter-tooltip-slot rg-left-legend">
        {activeKey === "intro" ? (
          <div className="rg-modal-intro-card">
            <span className="rg-intro-tagline-accent" style={{ color: "#236ea0", fontWeight: 700, fontSize: "8.5px", textTransform: "uppercase", letterSpacing: "1px" }}>
              Ecosystem Overview
            </span>
            <h4 className="rg-intro-main-title">The Digital RideGuide</h4>
            
            <p className="rg-intro-main-desc">
              Powered by AdventureGEOLAB's outdoor analytics platform. Our data pipeline compiles thousands of real-time topographical and weather data-points to provide off-road riders with unmatched situational awareness.
            </p>

            <div className="rg-intro-highlights-list">
              <div className="rg-intro-highlight-item">
                🗺️ <strong>Intended Uses:</strong> Track weather windows, visualize route steepness vectors, inspect substrate traction, and understand dynamic risk factors.
              </div>
              <div className="rg-intro-highlight-item">
                ⚡ <strong>Core Highlights:</strong> Live multi-axis meteorological analysis, high-density terrain modeling, and custom engine calculations for energy expenditure.
              </div>
            </div>

            <div className="rg-tooltip-bullet-box rg-intro-explorer-cta-block">
              <strong className="rg-tooltip-bullet-header" style={{ color: "#236ea0", marginBottom: "4px" }}>
                Interactive Explorer:
              </strong>
              <span style={{ fontSize: "10.5px", color: "#1e293b", lineHeight: "1.4", display: "block", fontWeight: "500" }}>
                Hover over any widget on the sample RideGuide to preview how our system works!
              </span>
            </div>
          </div>
        ) : (
          <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <TelemetryTooltip 
              widgetKey={activeKey} 
              isVisible={true} 
              cardPosition="left" 
              cardOffsetTop="0px" 
              isModalRender={true} 
            />
            <button onClick={() => setActiveKey("intro")} className="rg-intro-return-action-trigger">
              ← Return to Introduction Overview
            </button>
          </div>
        )}
      </div>

      {/* COLUMN 2: INLINE RENDER VIEWPORT IMAGE CONTAINER */}
      <div className="rg-mini-blueprint-viewport">
        <img 
          src="/data/assets/RideGuide_Sample.svg" 
          className="rg-mini-blueprint-img-bg"
          alt="RideGuide Field Specimen Page"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/data/assets/RideGuide_Sample.png";
          }}
        />

        {responsiveZones.map((zone) => (
          <div
            key={zone.key}
            onMouseEnter={() => setActiveKey(zone.key)}
            className={`rg-mini-hotspot ${activeKey === zone.key ? 'active' : ''}`}
            style={{
              top: zone.top,
              left: zone.left,
              width: zone.width,
              height: zone.height,
            }}
          />
        ))}
      </div>

    </div>
  );
}