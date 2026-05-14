/* src/components/RideGuide/widgets/EffortTax.tsx */
import { useWeatherData } from '../../../hooks/useWeatherData';
import { useRouteMetrics } from '../../../hooks/useRouteMetrics';
import * as theme from '../../../config/theme_config';

export default function EffortTax({ routeID }: { routeID: string }) {
  const { data, loading } = useWeatherData(routeID);
  const { metrics } = useRouteMetrics(routeID);

  // DYNAMIC PATH: Pull from the .env Master Switch
  const EFFORT_BASE = import.meta.env.VITE_EFF_DIR || '/data/effortgauges';

  if (loading || !data?.weather?.metadata) return <div>Syncing...</div>;

  const taxPct = data?.ssdi?.physics?.energy_penalty_pct ?? 0;
  const displayTax = Math.round(taxPct);
  const actualMiles = metrics?.GIS_MILES ?? 0;
  const feelsLike = (actualMiles * (1 + (taxPct / 100))).toFixed(1);
  const dynamicColor = theme.get_tax_color(taxPct);
  
  const version = data.weather.metadata.generated_at;
  // UPDATED: Path now uses the environment variable
  const svgPath = `${EFFORT_BASE}/${routeID}_effort_tax.svg?v=${version}`;

  return (
    <div className="rr-effort-tax-container">
      <div className="rr-effort-tax-main">
        <div className="rr-tax-metadata-row">
           <span className="rr-tax-pct-value" style={{ color: dynamicColor }}>
             EFFORT TAX +{displayTax}%
           </span>
        </div>
        <div className="rr-effort-tax-gauge-box">
          <img src={svgPath} alt="Effort Tax Gauge" className="rr-effort-tax-svg" />
        </div>
        <div className="rr-tax-metadata-row">
           <span className="rr-tax-miles-value">
             Feels Like: {actualMiles}mi → {feelsLike}mi
           </span>
        </div>
      </div>
    </div>
  );
}