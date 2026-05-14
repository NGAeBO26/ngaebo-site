/* src/components/RideGuide/widgets/MetricsTiles.tsx - CORRECTED DIRECTION LOGIC */
import '../../../styles/RouteMetrics.css';

const IconRenderer = ({ type, value, raw }: { type: string, value: string | number, raw?: any }) => {
  const assetBase = import.meta.env.VITE_ASSETS_DIR || '/data/assets';
  
  // --- THRESHOLD CALCULATION ---
  let fillPercent = 0;
  let trackColor = "#9badad"; // Default Grey

  if (type === 'score') {
    fillPercent = (raw || 0) * 10;
    trackColor = "#8da65a"; // Forest Green
  } else if (type === 'dist') {
    // Distance Gauge: 0-50 miles
    const val = parseFloat(value.toString());
    fillPercent = (val / 50) * 100;
    trackColor = "#236ea0"; // Sky Blue
  } else if (type === 'elev') {
    // Elevation Gauge: 0-1500 ft
    const val = parseInt(value.toString().replace(/,/g, ''));
    fillPercent = (val / 1500) * 100;
    trackColor = "#d88a3a"; // Earth Orange
  } else if (type === 'grade') {
    // Grade Gauge: 0-45% (Based on your divisor)
    const val = parseFloat(value.toString());
    fillPercent = (val / 45) * 100;
    trackColor = "#c0392b"; // Danger Red
  } else if (type === 'signal') {
    // Signal Mapping
    const signalMap: Record<string, number> = { 
        "Excellent": 100, "Intermittent": 80, "Weak/Stable": 60, "Spotty": 40, "Unreliable": 20, "Unavailable": 0 
    };
    fillPercent = signalMap[value.toString()] || 0;
    trackColor = "#27ae60"; // Safe Green
  }

  // Ensure fill doesn't exceed 100%
  const activeFill = Math.min(100, Math.max(0, fillPercent));

  // --- CORRECTED REVERSED DIRECTION MATH ---
  // We place the empty track color (#e0e0e0) at the start of the sweep.
  // The active color (trackColor) will sit at the end.
  const emptyStartPercent = 100 - activeFill;

  return (
    <div className="rr-metric-dial-wrapper">
      <div 
        className="rr-metric-dial-arc" 
        style={{ 
            /* 1. Start at 180deg (Bottom)
               2. Draw empty track (#e0e0e0) clockwise from bottom to the fill-start point
               3. Draw trackColor for the remainder
               4. Mirror horizontally to flip the clockwise sweep into a counter-clockwise one
            */
            background: `conic-gradient(from 180deg, #e0e0e0 0% ${emptyStartPercent}%, ${trackColor} ${emptyStartPercent}% 100%)`,
            transform: 'scaleX(-1)' 
        }}
      ></div>
      <div className="rr-metric-dial-mask">
        <img 
            src={`${assetBase}/icon_${type === 'score' ? 'fcs_score' : 
                   type === 'dist' ? 'odometer' : 
                   type === 'elev' ? 'gain_arrow' : 
                   type === 'grade' ? 'grade' : 'cell_signal'}.svg`} 
            className={`rr-metric-dial-icon ${type}`} 
            alt={type} 
        />
      </div>
    </div>
  );
};

export default function MetricsTiles({ data }: { data: any }) {
  const metrics = [
    { label: "Difficulty Score", value: data?.v3_fcs_score?.toFixed(1) || "0.0", type: 'score', raw: data?.v3_fcs_score },
    { label: "Route Distance", value: `${data?.GIS_MILES?.toFixed(1) || "0.0"} mi`, type: 'dist' },
    { label: "Elevation Gain", value: `${data?.v3_elev_gain?.toLocaleString() || "0"} ft`, type: 'elev' },
    { label: "Average Grade", value: `${data?.v3_avg_grade || "0"}%`, type: 'grade' },
    { label: "Cell Service", value: data?.v3_signal_class || "N/A", type: 'signal' }
  ];

  return (
    <div className="rr-metrics-tiles-wrapper">
      {metrics.map((m, i) => (
        <div key={i} className="rr-metric-tile-row">
          <div className="rr-metric-icon-column">
             <IconRenderer type={m.type} value={m.value.split(' ')[0]} raw={m.raw} />
          </div>
          <div className="rr-metric-content-column">
            <div className="rr-metric-value-display">{m.value}</div>
            <div className="rr-metric-label-display">{m.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}