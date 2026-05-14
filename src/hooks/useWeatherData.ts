/* src/hooks/useWeatherData.ts */
import { useState, useEffect } from 'react';

export function useWeatherData(routeID: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Dynamic paths from .env
  const WEATHER_BASE = import.meta.env.VITE_WEATHER_DIR || '/data/weather';
  const COND_BASE = import.meta.env.VITE_CONDITIONS_DIR || '/data/conditions';

  useEffect(() => {
    let isMounted = true;

    async function syncAndFetch() {
      setLoading(true);
      try {
        // 1. Trigger the Python engine via your API proxy
        const syncRes = await fetch(`/api/sync-weather/${routeID}`);
        const syncStatus = await syncRes.json();

        if (syncStatus.status === 'updated' && isMounted) {
          // 2. Fetch the fresh JSON files Python just wrote
          const t = Date.now(); // Cache busting
          const [weatherRes, ssdiRes] = await Promise.all([
            fetch(`${WEATHER_BASE}/${routeID}_weather.json?t=${t}`),
            fetch(`${COND_BASE}/${routeID}_ssdi.json?t=${t}`)
          ]);

          const weather = await weatherRes.json();
          const ssdi = await ssdiRes.json();

          setData({ weather, ssdi });
        }
      } catch (err) {
        console.error("Auto-JIT Sync Failed:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (routeID) syncAndFetch();
    return () => { isMounted = false; };
  }, [routeID, WEATHER_BASE, COND_BASE]);

  return { data, loading };
}