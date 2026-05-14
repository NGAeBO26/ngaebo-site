/* src/components/RideGuide/widgets/PrimeRideTime.tsx */
import { useWeatherData } from '../../../hooks/useWeatherData';

export default function PrimeRideTime({ routeID }: { routeID: string }) {
  const { data, loading } = useWeatherData(routeID);

  // Dynamic path from the "Master Switch"
  const JOY_BASE = import.meta.env.VITE_JOY_DIR || '/data/joyscores';

  if (loading || !data?.weather?.metadata) return <div className="rr-widget-prime-root">Syncing...</div>;

  const { metadata } = data.weather;
  
  const formatHour = (h: number) => {
    const suffix = h >= 12 ? 'pm' : 'am';
    const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${displayH}${suffix}`;
  };

  // Restored readable overlay styling
  const haloStyle = {
    textShadow: '0 0 3px white, 0 0 3px white, 0 0 3px white, 0 0 3px white',
    zIndex: 60,
    position: 'relative' as const
  };

  return (
    <div className="rr-widget-prime-root">
       <div className="rr-joy-dial-box">
          <img 
            /* FIXED: Use dynamic JOY_BASE and metadata timestamp for cache-busting */
            src={`${JOY_BASE}/${routeID}_joy_dial.svg?v=${metadata.generated_at}`} 
            className="rr-joy-dial-svg" 
            alt="Joy Dial"
          />
          
          <div className="rr-prime-time-dual-wrap">
             <div className="rr-prime-time-node-group">
                <div className="rr-prime-micro-label" style={haloStyle}>START</div>
                <div className="rr-prime-time-node" style={haloStyle}>
                    {formatHour(metadata.prime_window_start)}
                </div>
             </div>
             
             <div className="rr-prime-time-node-group">
                <div className="rr-prime-micro-label" style={haloStyle}>END</div>
                <div className="rr-prime-time-node" style={haloStyle}>
                    {formatHour(metadata.prime_window_end)}
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}