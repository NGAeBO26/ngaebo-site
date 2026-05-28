/* src/components/RideGuide/widgets/RouteMap/NorthArrow.tsx */
import { useEffect, useState } from "react";
import type { Map as MaplibreMap } from "maplibre-gl";

export default function NorthArrow({ map }: { map: MaplibreMap | null | undefined }) {
  const [bearing, setBearing] = useState(0);

  useEffect(() => {
    if (!map) return;

    const syncCompass = () => {
      // Invert the map bearing value so the HUD graphic tracks true North
      setBearing(-map.getBearing());
    };

    map.on("rotate", syncCompass);
    map.on("move", syncCompass);
    
    // Initialize orientation match instantly
    setBearing(-map.getBearing());

    return () => {
      map.off("rotate", syncCompass);
      map.off("move", syncCompass);
    };
  }, [map]);

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
          🧭 COMPASS CORNER: ROTATING NORTH ARROW (Top Right)
          ============================================================================ */}
      <div
        className="rr-map-north-arrow-needle"
        style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `rotate(${bearing}deg)`,
          transition: 'transform 0.08s ease-out'
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
          🏷️ FULL-WIDTH ATTRIBUTION BAR: SNUG BOTTOM ANCHOR (Pure Opacity Image Style)
          ============================================================================ */}
      <div 
        className="rr-map-signature-attribution-bar"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.5)', // 50% clean transparent baseline visibility
          padding: '3px 0', 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          borderTop: '1px solid rgba(0, 0, 0, 0.12)',
          fontSize: '10px',
          fontFamily: 'Oswald, sans-serif',
          fontWeight: 600,
          color: '#343a40',
          letterSpacing: '0.04em',
          textShadow: '0px 1px 1px rgba(255, 255, 255, 0.8)'
        }}
      >
        <span>Powered by:</span>
        
        {/* ============================================================================
            🎯 CUSTOM BRAND WORDMARK SVG VECTOR BLIT
            Renders your native corporate graphics asset directly in line within the ribbon
            ============================================================================ */}
        <img 
          src="/data/assets/alg-wordmark.svg" 
          alt="Adventure GeoLab LLC Logo" 
          style={{
            height: '18px', // Snug sizing matches the text line height profile seamlessly
            display: 'inline-block',
            objectFit: 'contain',
            verticalAlign: 'middle',
            margin: '0 6px 0 4px',
            filter: `
              drop-shadow(1px 0px 0px #ffffff) 
              drop-shadow(-1px 0px 0px #ffffff) 
              drop-shadow(0px 1px 0px #ffffff) 
              drop-shadow(0px -1px 0px #ffffff)
              drop-shadow(0px 1px 1px rgba(0,0,0,0.15))
            `
          }}
        />
        <span>© 2026</span>
      </div>
    </div>
  );
}