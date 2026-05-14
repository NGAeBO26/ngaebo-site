/* src/components/RideGuide/widgets/EmergencyServices.tsx */
import { useState, useEffect } from "react";

export default function EmergencyServices({ routeID }: { routeID: string }) {
  const [rescue, setRescue] = useState<any>(null);

  // DYNAMIC PATH: Reusing the existing locations directory from .env
  const LOCATIONS_BASE = import.meta.env.VITE_LOCATIONS_DIR || '/data/locations';

  useEffect(() => {
    let isMounted = true;

    fetch(`${LOCATIONS_BASE}/${routeID}_pois.json`)
      .then(res => res.json())
      .then(data => {
        if (isMounted) {
          setRescue(data.rescue_anchor || null);
        }
      })
      .catch(err => console.error("Rescue Data Error:", err));

    return () => { isMounted = false; };
  }, [routeID, LOCATIONS_BASE]);

  return (
    <div className="rr-guide-module-container" style={{ height: '25mm' }}>
      <div className="rr-guide-module-header">EMERGENCY SERVICES</div>
      <div className="rr-rescue-content">
        {rescue ? (
          <>
            <div className="rr-rescue-main">
              <span className="rr-rescue-icon">✚</span>
              {rescue.name}
            </div>
            <div className="rr-rescue-meta">
              <b>{rescue.phone}</b> | {rescue.dist_mi} mi
            </div>
            <div className="rr-rescue-address">{rescue.address}</div>
          </>
        ) : (
          <div className="rr-guide-placeholder-content">DATA PENDING</div>
        )}
      </div>
    </div>
  );
}