/* src/components/RideGuide/widgets/Sparkline.tsx */
import '../../../styles/RouteReport.css';

interface SparklineProps {
  routeID: string;
}

export default function Sparkline({ routeID }: SparklineProps) {
  // VITE FIX: Use import.meta.env instead of process.env
  const ELEVATION_BASE = import.meta.env.VITE_ELEVATION_DIR || '/data/sparklines';
  
  // 2. CONSTRUCTED PATH: Combines the base with the route-specific filename
  const svgPath = `${ELEVATION_BASE}/${routeID}_sparkline.svg`;
  
  return (
    <div className="rr-sparkline-container">
      <div className="rr-sparkline-main">
        <img 
          src={svgPath} 
          alt={`Elevation profile for route ${routeID}`} 
          className="rr-sparkline-svg" 
          onError={(e) => {
            // Fallback if SVG is missing
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>
    </div>
  );
}