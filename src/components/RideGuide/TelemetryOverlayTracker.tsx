/* src/components/RideGuide/TelemetryOverlayTracker.tsx */
import { useState, useEffect } from "react";
import TelemetryTooltip from "./TelemetryTooltip";

interface HotspotZone {
  key: string;
  top: string;
  left: string;
  width: string;
  height: string;
  cardPosition: "left" | "right";
  cardOffsetTop: string;
}

export default function TelemetryOverlayTracker() {
  const [activeZone, setActiveZone] = useState<HotspotZone | null>(null);

  useEffect(() => {
    console.log("Compass DEBUG: Fully calibrated TelemetryOverlayTracker successfully initialized.");
  }, []);

  // 🎯 PRECISION MILLIMETER ALIGNMENT MATRIX
  // Mapped 1:1 against the physical container bounds of your RouteReport grid
  const zones: HotspotZone[] = [
    {
      key: "currentweather",
      top: "41.8mm",
      left: "10mm",
      width: "50mm",
      height: "30mm",
      cardPosition: "left",
      cardOffsetTop: "36mm"
    },
    {
      key: "primeridetime",
      top: "41.8mm",
      left: "62mm",         // Locked to exact CAD layout specification line math
      width: "91.9mm",      // 🛠️ FIXED: Re-anchored to match widget bounds precisely
      height: "30mm",
      cardPosition: "right",
      cardOffsetTop: "36mm"
    },
    {
      key: "routeconditions",
      top: "42.2mm",
      left: "155.9mm",      // Positioned right after the center map segment limits
      width: "50mm",
      height: "30mm",
      cardPosition: "right",
      cardOffsetTop: "36mm"
    },
    {
      key: "routemetrics",
      top: "81.8mm",
      left: "10mm",
      width: "50mm",
      height: "65mm",
      cardPosition: "left",
      cardOffsetTop: "79mm"
    },
    {
      key: "efforttax",
      top: "147mm",
      left: "10mm",
      width: "50mm",
      height: "25mm",
      cardPosition: "left",
      cardOffsetTop: "125mm"
    },
    {
      key: "riskradar",
      top: "172.1mm",
      left: "10mm",
      width: "50mm",
      height: "50mm",
      cardPosition: "left",
      cardOffsetTop: "145mm"
    },
    {
      key: "placestosee",
      top: "81.8mm",
      left: "155.9mm",
      width: "50mm",
      height: "65mm",
      cardPosition: "right",
      cardOffsetTop: "79mm"
    },
    {
      key: "emergencyservices",
      top: "147.1mm",
      left: "155.9mm",
      width: "50mm",
      height: "25mm",
      cardPosition: "right",
      cardOffsetTop: "125mm"
    },
    {
      key: "elevationprofile",
      top: "228.6mm",
      left: "10mm",
      width: "195.9mm",
      height: "35mm",
      cardPosition: "right",
      cardOffsetTop: "150mm"
    }
  ];

  return (
    <div 
      className="rg-blueprint-overlay-canvas"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "215.9mm",
        height: "279.4mm",
        zIndex: 9999,
        pointerEvents: "none"
      }}
    >
      {/* 🧭 INTERACTIVE MOUSE HOTSPOTS */}
      {zones.map((zone) => {
        const isThisZoneActive = activeZone?.key === zone.key;
        return (
          <div
            key={zone.key}
            onMouseEnter={() => setActiveZone(zone)}
            onMouseLeave={() => setActiveZone(null)}
            style={{
              position: "absolute",
              top: zone.top,
              left: zone.left,
              width: zone.width,
              height: zone.height,
              pointerEvents: "auto",
              cursor: "help",
              boxSizing: "border-box",
              backgroundColor: "transparent",
              border: isThisZoneActive ? "1px dashed #d88a3a" : "none",
              transition: "background-color 0.15s ease"
            }}
          >
            <span style={{ display: "none" }}>{zone.key}</span>
          </div>
        );
      })}

      {/* 🚀 TELEMETRY TOOLTIP CONTAINER */}
      {activeZone && (
        <TelemetryTooltip
          widgetKey={activeZone.key}
          isVisible={true}
          cardPosition={activeZone.cardPosition}
          cardOffsetTop={activeZone.cardOffsetTop}
        />
      )}
    </div>
  );
}