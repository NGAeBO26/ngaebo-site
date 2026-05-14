/* src/components/RideGuide/widgets/PlacesToSee.tsx */
import { useState, useEffect } from "react";

export default function PlacesToSee({ routeID }: { routeID: string }) {
  const [pois, setPois] = useState<any[]>([]);

  // DYNAMIC PATH: Pull from .env with local fallback
  const LOCATIONS_BASE = import.meta.env.VITE_LOCATIONS_DIR || '/data/locations';

  useEffect(() => {
    let isMounted = true;
    
    fetch(`${LOCATIONS_BASE}/${routeID}_pois.json`)
      .then(res => res.json())
      .then(data => {
        if (isMounted) {
          setPois(data.locations || []);
        }
      })
      .catch(err => console.error("POI Fetch Error:", err));

    return () => { isMounted = false; };
  }, [routeID, LOCATIONS_BASE]);

  return (
    <div className="rr-guide-module-container" style={{ height: '70mm' }}>
      <div className="rr-guide-module-header">PLACES TO SEE</div>
      <div className="rr-poi-list-content">
        {pois.slice(0, 5).map((poi, idx) => (
          <div key={idx} className="rr-poi-item">
            <div className="rr-poi-main-row">
              - {poi.label} <span className="rr-poi-type-tag">[{poi.type}]</span>
            </div>
            <div className="rr-poi-via-row">
              <b>{poi.dist}</b> mi. via <b>{poi.via}</b>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}