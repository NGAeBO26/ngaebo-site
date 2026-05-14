/* src/components/RideGuide/widgets/RouteConditions.tsx */
import { useWeatherData } from '../../../hooks/useWeatherData';

export default function RouteConditions({ routeID }: { routeID: string }) {
  const { data, loading } = useWeatherData(routeID);

  // DYNAMIC PATH: Pull from VIS_DIR switch
  const VIS_BASE = import.meta.env.VITE_VIS_DIR || '/data/visualization';

  if (loading || !data?.ssdi) return <div className="rr-widget-conditions-root">...</div>;

  const { ssdi } = data;
  const badgeType = ssdi.badge_type || 'STANDARD';

  const getConditionColor = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('muddy')) return '#4d3a24';
    if (t.includes('wet') || t.includes('damp')) return '#236ea0';
    if (t.includes('ideal') || t.includes('hero')) return '#2e7d32';
    if (t.includes('dry')) return '#e66e00';
    return '#333333';
  };

  const haloStyle = {
    color: getConditionColor(badgeType),
    textShadow: '0 0 4px white, 0 0 4px white, 0 0 4px white, 0 0 4px white',
    zIndex: 60,
    position: 'relative' as const
  };

  return (
    <div className="rr-widget-conditions-root">
      <div className="rr-cond-wheel-container">
        
        <div className="rr-cond-tire-bed" />

        {/* UPDATED: Dynamic Path + Cache Busting */}
        <img 
          src={`${VIS_BASE}/${routeID}_conditions_wheel.svg?v=${ssdi.environment?.generated_at || Date.now()}`} 
          className="rr-cond-wheel-svg" 
          alt="Conditions Wheel"
        />

        <div className="rr-cond-hub-overlay">
          <div className="rr-cond-hub-text" style={haloStyle}>
            {badgeType.toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
}