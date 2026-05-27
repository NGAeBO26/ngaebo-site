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
    <div 
      className="rr-map-north-arrow-hud"
      style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        zIndex: 99,
        pointerEvents: 'none',
        width: '32px',
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `rotate(${bearing}deg)`,
        transition: 'transform 0.08s ease-out'
      }}
    >
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ overflow: 'visible' }}>
        <circle cx="16" cy="16" r="13" stroke="#e66e00" strokeWidth="1.8" fill="rgba(255,255,255,0.92)" />
        <path d="M16 5L21 14H11L16 5Z" fill="#e66e00" stroke="#e66e00" strokeWidth="0.5" />
        <path d="M16 27V14" stroke="#e66e00" strokeWidth="1.8" strokeLinecap="round" />
        <text x="16" y="21" fill="#e66e00" fontSize="8" fontWeight="900" fontFamily="system-ui, sans-serif" textAnchor="middle">N</text>
      </svg>
    </div>
  );
}