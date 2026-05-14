/* src/hooks/useWeatherData.ts */
import { useState, useEffect } from 'react';

// 1. GLOBAL TRACKING: Store the actual data and the pending promise outside the hook
const globalDataCache: Record<string, any> = {};
const globalPendingPromises: Record<string, Promise<any> | null> = {};

export function useWeatherData(routeID: string) {
  const [data, setData] = useState<any>(globalDataCache[routeID] || null);
  const [loading, setLoading] = useState(!globalDataCache[routeID]);

  const WEATHER_BASE = import.meta.env.VITE_WEATHER_DIR || '/data/weather';
  const COND_BASE = import.meta.env.VITE_CONDITIONS_DIR || '/data/conditions';

  useEffect(() => {
    if (!routeID) return;

    let isMounted = true;

    async function getSyncData() {
      // If we already have data in this session, use it immediately
      if (globalDataCache[routeID]) {
        if (isMounted) {
          setData(globalDataCache[routeID]);
          setLoading(false);
        }
        return;
      }

      // If a sync is already happening, WAIT for that specific promise to finish
      if (globalPendingPromises[routeID]) {
        console.log(`[JIT] Waiting for existing sync to finish for: ${routeID}`);
        const sharedData = await globalPendingPromises[routeID];
        if (isMounted) {
          setData(sharedData);
          setLoading(false);
        }
        return;
      }

      // NO SYNC IN PROGRESS: We are the "Leader" widget. Start the process.
      setLoading(true);
      
      const syncTask = (async () => {
        try {
          console.log(`[JIT] Leader starting sync for: ${routeID}`);
          const syncRes = await fetch(`/api/sync-weather/${routeID}`);
          if (!syncRes.ok) throw new Error(`Server Error: ${syncRes.status}`);
          
          const syncStatus = await syncRes.json();

          if (syncStatus.status === 'updated') {
            const t = Date.now();
            const [weatherRes, ssdiRes] = await Promise.all([
              fetch(`${WEATHER_BASE}/${routeID}_weather.json?t=${t}`),
              fetch(`${COND_BASE}/${routeID}_ssdi.json?t=${t}`)
            ]);

            const weather = await weatherRes.json();
            const ssdi = await ssdiRes.json();
            const finalData = { weather, ssdi };
            
            // Store in global cache so other components can grab it
            globalDataCache[routeID] = finalData;
            return finalData;
          }
        } catch (err) {
          console.error("Auto-JIT Sync Failed:", err);
          return null;
        } finally {
          // Clean up the task so a future refresh can re-trigger if needed
          globalPendingPromises[routeID] = null;
        }
      })();

      // Register our task globally so other widgets see it
      globalPendingPromises[routeID] = syncTask;
      
      const result = await syncTask;
      if (isMounted && result) {
        setData(result);
        setLoading(false);
      }
    }

    getSyncData();

    return () => { isMounted = false; };
  }, [routeID, WEATHER_BASE, COND_BASE]);

  return { data, loading };
}