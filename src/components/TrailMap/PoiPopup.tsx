// src/components/TrailMap/PoiPopup.tsx
import * as React from "react";
import { useEffect, useRef, useState } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";
import type { PoiPopupState } from "./usePoiPopups";

interface Props {
  mapRef: React.RefObject<MapLibreMap | null>;
  popup: PoiPopupState | null;
  onClose: () => void;
}

export const PoiPopup: React.FC<Props> = ({ mapRef, popup, onClose }) => {
  const [pixel, setPixel] = useState<{ x: number; y: number } | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !popup) {
      setPixel(null);
      return;
    }

    const updatePosition = () => {
      // projecting exact feature coordinates
      const p = map.project([popup.lngLat.lng, popup.lngLat.lat]);
      setPixel({ x: p.x, y: p.y });
    };

    // 'render' is smoother than 'move' during zoom animations
    map.on("render", updatePosition);
    updatePosition();

    return () => {
      map.off("render", updatePosition);
    };
  }, [mapRef, popup]);

  if (!popup || !pixel) return null;

  const { name, description, url, poi_type } = popup;

  return (
    <div
      className="poi-custom-popup"
      style={{
        position: "absolute",
        left: pixel.x,
        // -45px clears the icon image completely
        top: pixel.y - 45, 
        transform: "translateX(-50%) translateY(-100%)",
        zIndex: 100,
        pointerEvents: "auto",
        transition: "none",
      }}
    >
      <div ref={popupRef} className="poi-custom-popup__content">
        <button
          className="poi-custom-popup__close"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          ×
        </button>

        <strong className="poi-custom-popup__name">{name}</strong>

        {poi_type === "camp" && url ? (
          <div className="poi-custom-popup__desc">
            <a href={url} target="_blank" rel="noopener noreferrer">
              {url.replace(/^https?:\/\//, "")}
            </a>
          </div>
        ) : description ? (
          <div className="poi-custom-popup__desc">{description}</div>
        ) : null}

        <div className="poi-custom-popup__arrow" />
      </div>
    </div>
  );
};