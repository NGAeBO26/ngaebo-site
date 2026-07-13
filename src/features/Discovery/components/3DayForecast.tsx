/* src/features/Discovery/components/3DayForecast.tsx */
import { useState, useEffect } from 'react';
import { useWeatherData } from '../../../hooks/useWeatherData';
import '../../../styles/3DayForecast.css';

interface WeatherProps {
  routeID: string;
}

const ANIMATION_CYCLE_ICONS = [
  "/images/icons/sun_with_face_3d.png",
  "/images/icons/sun_behind_cloud_3d.png",
  "/images/icons/cloud_3d.png",
  "/images/icons/cloud_with_rain_3d.png"
];

export default function MobileThreeDayForecast({ routeID }: WeatherProps) {
  const { data, loading } = useWeatherData(routeID);
  const [iconIndex, setIconIndex] = useState(0);
  const [localLoading, setLocalLoading] = useState(false);

  // 🎯 FORCE LOADING LIFECYCLE: Triggers a tactile visual notice on every single route click
  useEffect(() => {
    if (routeID) {
      setLocalLoading(true);
      const timer = setTimeout(() => {
        setLocalLoading(false);
      }, 350); // Minimum animation visibility window (in milliseconds)
      return () => clearTimeout(timer);
    }
  }, [routeID]);

  // 🔄 3D Icon Asset Cycling Engine Animation Loop
  useEffect(() => {
    if (!loading && !localLoading) return;
    const interval = setInterval(() => {
      setIconIndex((prev) => (prev + 1) % ANIMATION_CYCLE_ICONS.length);
    }, 200); 
    return () => clearInterval(interval);
  }, [loading, localLoading]);

  const getIconPath = (cond: string) => {
    const lowCond = cond.toLowerCase();
    const path = "/images/icons/";
    if (lowCond.includes('cloud')) return `${path}cloud_3d.png`;
    if (lowCond.includes('rain') || lowCond.includes('shower')) return `${path}cloud_with_rain_3d.png`;
    if (lowCond.includes('clear') || lowCond.includes('sunny')) return `${path}sun_with_face_3d.png`;
    if (lowCond.includes('snow') || lowCond.includes('ice')) return `${path}snowflake_3d.png`;
    return `${path}sun_with_face_3d.png`;
  };

  const getDayLabel = (dateStr: string) => {
    try {
      const date = new Date(dateStr + 'T00:00:00');
      return date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    } catch {
      return dateStr;
    }
  };

  // Combine network sync and UI click states into a single unified gatekeeper
  const isSyncing = loading || localLoading;

  if (isSyncing || !data || !data.weather) {
    return (
      <div className="rr-forecast-loading-frame">
        <img src={ANIMATION_CYCLE_ICONS[iconIndex]} className="rr-forecast-loading-spinner" alt="" />
        <span>Updating Weather Conditions..</span>
      </div>
    );
  }

  const { weather } = data;
  const condition = weather.primary_condition || "Clear";
  const three_day_forecast = weather.three_day_forecast || [];

  return (
    <div className="rr-mobile-weather-panel-wrapper">
      
      {/* 🌤 * SECTION A: CURRENT WEATHER BAR SUMMARY */}
      {/* 🌤️ RE-NESTED 3-COLUMN STRUCTURE USING YOUR DYNAMIC ENGINE NODES */}
      <div className="rr-widget-weather-root">
        
        {/* COLUMN 1: LEFT CARD REGION - BUNDLED ICON AND TEMPERATURE INLINE */}
        <div className="rr-weather-column-left">
          <div className="rr-weather-icon-box">
            <img 
              src={getIconPath(condition)} 
              className="rr-weather-icon-svg" 
              alt={condition} 
              onError={(e: any) => { e.target.src = "/images/icons/sun_behind_small_cloud_3d.png"; }}
            />
          </div>
          <div className="rr-weather-meta-left-group horizontal-row-layout">
            <div className="rr-weather-temp-node">
              {typeof weather.current_temp === 'number' ? Math.round(weather.current_temp) : '--'}°
            </div>
          </div>
        </div>

        {/* COLUMN 2: CENTER CARD REGION - MAX WRAPPING ROOM FOR LONG CONDITIONS */}
        <div className="rr-weather-condition-label inline-position">
          {condition.toUpperCase()}
        </div>
        
        {/* COLUMN 3: RIGHT CARD REGION - STACKED DATA FLUSH AGAINST THE RIGHT WALL */}
        <div className="rr-weather-precip-node-stacked">
          <span className="rr-precip-line-primary">PRECIP: {weather.precip_prob ?? 0}%</span>
          <span className="rr-precip-line-secondary">24HR: {weather.precip_24h ?? 0}in</span>
        </div>

      </div>

      {/* 🌤 * SECTION B: FUTURE 3-DAY HORIZONTAL CARDS GRID */}
      {three_day_forecast.length > 0 && (
        <div className="rr-weather-forecast-container">
          {three_day_forecast.map((day: any, idx: number) => (
            <div key={day.date || idx} className="rr-weather-forecast-card">
              <span className="rr-forecast-day-label">{getDayLabel(day.date)}</span>
              
              <div className="rr-forecast-body-row">
                <div className="rr-forecast-icon-box">
                  <img 
                    src={getIconPath(day.condition || "Clear")} 
                    className="rr-forecast-icon-img" 
                    alt={day.condition} 
                  />
                </div>
                <div className="rr-forecast-temps-column">
                  <span className="rr-forecast-temp-max">{Math.round(day.temp_max)}°</span>
                  <span className="rr-forecast-temp-min">{Math.round(day.temp_min)}°</span>
                </div>
              </div>
              
              <span className="rr-forecast-precip-text">💧{day.precip_prob}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}