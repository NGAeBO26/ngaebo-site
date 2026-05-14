/* useRouteMetrics.ts */
import { useState, useEffect } from 'react';

export function useRouteMetrics(routeID: string) {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // DYNAMIC PATH: Pull from .env with the hardcoded fallback
  const GEOJSON_PATH = import.meta.env.VITE_METRICS_GEOJSON || '/data/v3_large_sample_testfeatures.geojson';

  useEffect(() => {
    let isMounted = true;
    async function fetchMetrics() {
      setLoading(true);
      try {
        const response = await fetch(GEOJSON_PATH);
        const geojson = await response.json();
        
        if (!isMounted) return;

        const feature = geojson.features.find(
          (f: any) => f.properties.profile_id === routeID
        );

        if (feature) {
          setMetrics(feature.properties);
        }
      } catch (err) {
        console.error("Error loading GeoJSON metrics:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (routeID) fetchMetrics();
    return () => { isMounted = false; };
  }, [routeID, GEOJSON_PATH]);

  return { metrics, loading };
}