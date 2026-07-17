/* src/components/RideGuide/widgets/RouteMap/NorthArrow.tsx */
import { useEffect, useState } from "react";
import type { Map as MaplibreMap } from "maplibre-gl";

export default function NorthArrow({ map }: { map: MaplibreMap | null | undefined }) {
  const [bearing, setBearing] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // 🧭 MAP HUDS LOGIC: Synced Map Rotation Listener
  useEffect(() => {
    if (!map) return;

    const syncCompass = () => {
      setBearing(-map.getBearing());
    };

    map.on("rotate", syncCompass);
    map.on("move", syncCompass);
    
    setBearing(-map.getBearing());

    return () => {
      map.off("rotate", syncCompass);
      map.off("move", syncCompass);
    };
  }, [map]);

  // 📱 VIEWPORT LISTENER: Dynamic media listener matching global mobile layout bounds
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    setIsMobile(mediaQuery.matches);

    const handleViewportChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };

    mediaQuery.addEventListener("change", handleViewportChange);
    return () => mediaQuery.removeEventListener("change", handleViewportChange);
  }, []);

  return (
    // Outer HUD Parent Frame covers the map space to manage clean absolute layouts
    <div 
      className="rr-map-hud-overlay-container"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 99,
        pointerEvents: 'none',
        userSelect: 'none'
      }}
    >
      {/* ============================================================================
          🧭 COMPASS CORNER: ROTATING NORTH ARROW
          ============================================================================ */}
      <div
        className="rr-map-north-arrow-needle"
        style={{
          position: 'absolute',
          top: isMobile ? '28px' : '12px',
          left: '12px',
          width: isMobile ? '34px' : '40px',
          height: isMobile ? '34px' : '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `rotate(${bearing}deg)`,
          transition: 'transform 0.08s ease-out',
          zIndex: 2
        }}
      >
        <img 
          src="/data/assets/agl-north-arrow.svg"
          alt="North Compass Indicator"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain'
          }}
        />
      </div>

      {/* ============================================================================
          🏷️ SYMMETRIC ATTRIBUTION BAR: 3-COLUMN GEOMETRIC CENTER ENGINE
          ============================================================================ */}
      <div 
        className="rr-map-signature-attribution-bar"
        style={{
          position: 'absolute',
          top: isMobile ? 0 : 'auto',
          bottom: isMobile ? 'auto' : 0,
          left: 0,
          right: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.5)', 
          padding: '3px 0', 
          
          // 🎯 THE CENTERING CRADLE: Swapped from flex to a balanced 3-part grid track
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          
          borderTop: isMobile ? 'none' : '1px solid rgba(0, 0, 0, 0.12)',
          borderBottom: isMobile ? '1px solid rgba(0, 0, 0, 0.12)' : 'none',
          fontSize: '10px',
          fontFamily: 'Oswald, sans-serif',
          fontWeight: 600,
          color: '#343a40',
          letterSpacing: '0.04em',
          textShadow: '0px 1px 1px rgba(255, 255, 255, 0.8)',
          zIndex: 1
        }}
      >
        {/* LEFT COLUMN: Right-aligned text anchors exactly balanced from center */}
        <span style={{ textAlign: 'right', paddingRight: '8px' }}>Powered by:</span>
        
        {/* CENTER COLUMN: Perfectly isolated branding wordmark logo asset */}
        <img 
          src="/data/assets/alg-wordmark.svg" 
          alt="Adventure GeoLab LLC Logo" 
          style={{
            height: '18px',
            display: 'block',
            margin: '0 auto', // Locks the vector layer inline within the center grid cell
            objectFit: 'contain',
            filter: `
              drop-shadow(1px 0px 0px #ffffff) 
              drop-shadow(-1px 0px 0px #ffffff) 
              drop-shadow(0px 1px 0px #ffffff) 
              drop-shadow(0px -1px 0px #ffffff)
              drop-shadow(0px 1px 1px rgba(0,0,0,0.15))
            `
          }}
        />
        
        {/* RIGHT COLUMN: Left-aligned text anchors exactly balanced from center */}
        <span style={{ textAlign: 'left', paddingLeft: '8px' }}>© 2026</span>
      </div>
    </div>
  );
}