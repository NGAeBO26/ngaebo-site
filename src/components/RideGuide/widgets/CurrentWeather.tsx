/* src/components/RideGuide/widgets/CurrentWeather.tsx */
import { useWeatherData } from '../../../hooks/useWeatherData';

interface WeatherProps {
  routeID: string;
}

export default function CurrentWeather({ routeID }: WeatherProps) {
  const { data, loading } = useWeatherData(routeID);

  // --- AUDIT: Debug log to identify structure mismatch ---
  if (!loading && data) {
    console.log(`[Weather Debug] Route: ${routeID}`, data);
  }

  if (loading) return <div className="rr-widget-weather-root">Syncing...</div>;
  if (typeof window !== 'undefined') { (window as any).currentWeatherData = data; }
  if (!data || !data.weather) return <div className="rr-widget-weather-root">Offline</div>;

  const { weather } = data;
  
  // Logic from your QGIS expression
  const condition = weather.primary_condition || "Clear";

  const getIconPath = (cond: string) => {
    const lowCond = cond.toLowerCase();
    const path = "/images/icons/";
    if (lowCond.includes('cloud')) return `${path}cloud_3d.png`;
    if (lowCond.includes('rain') || lowCond.includes('shower')) return `${path}cloud_with_rain_3d.png`;
    if (lowCond.includes('clear') || lowCond.includes('sunny')) return `${path}sun_with_face_3d.png`;
    if (lowCond.includes('snow') || lowCond.includes('ice')) return `${path}snowflake_3d.png`;
    return `${path}sun_with_face_3d.png`; // Default
  };

  return (
    <div className="rr-widget-weather-root">
      <div className="rr-weather-icon-box">
        <img 
          src={getIconPath(condition)} 
          className="rr-weather-icon-svg" 
          alt={condition} 
          onError={(e: any) => { e.target.src = "/images/icons/sun_behind_small_cloud_3d.png"; }}
        />
      </div>
      
      <div className="rr-weather-temp-node">
        {/* AUDIT: Safety guard to prevent NaN° if current_temp is missing or null */}
        {typeof weather.current_temp === 'number' ? Math.round(weather.current_temp) : '--'}°
      </div>

      <div className="rr-weather-condition-label">
        {condition.toUpperCase()}
      </div>
      
      <div className="rr-weather-precip-node">
        {/* AUDIT: Using null-coalescing for precision variables */}
        Precip: {weather.precip_prob ?? 0}% chance | 24HR: {weather.precip_24h ?? 0}in
      </div>
    </div>
  );
}