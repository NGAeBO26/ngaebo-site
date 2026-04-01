import { computeFinalSuitability } from "../lib/scoring/computeFinalSuitability";

type GravelPopupProps = {
  roadId: string;
  roadName: string;
  maintenanceLevel: string;
  surfaceType: string;
  status: string;
  meanSlope: number;
  maxSlope: number;
  ascentPerKm: number;
  suitability: string;
  precip24h: number;
  tractionImpact: string;
  classRecommendation: string;
  elevationProfile: number[];
  baseScore: number;
};

export default function GravelPopup(props: GravelPopupProps) {
  const finalSuitability = computeFinalSuitability({
    baseScore: props.baseScore,
    precip_24h: props.precip24h,
    meanSlope: props.meanSlope,
    maxSlope: props.maxSlope,
    surfaceType: props.surfaceType as any,
  });

  const sparkline = buildSparkline(props.elevationProfile);

  return (
    <div
      style={{
        fontFamily:
          "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
        fontSize: "13px",
        lineHeight: 1.25,
        width: "100%",
        maxWidth: "320px",
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: "6px" }}>
        {props.roadName}
      </div>

      <div style={{ marginBottom: "4px", color: "#555" }}>
        <strong>Maintenance:</strong> {props.maintenanceLevel}
      </div>

      <div style={{ marginBottom: "4px", color: "#555" }}>
        <strong>Surface:</strong> {props.surfaceType}
      </div>

      <div style={{ marginBottom: "4px", color: "#555" }}>
        <strong>Status:</strong> {props.status}
      </div>

      <div style={{ marginTop: "8px", marginBottom: "4px" }}>
        <strong>Suitability:</strong>{" "}
        <span style={{ color: suitabilityColor(finalSuitability) }}>
          {finalSuitability}
        </span>
      </div>

      <div style={{ marginBottom: "8px", color: "#444" }}>
        {props.classRecommendation}
      </div>

      <div style={{ marginTop: "10px" }}>{sparkline}</div>
    </div>
  );
}

/* ---------------- SPARKLINE ---------------- */

function buildSparkline(values: number[]) {
  if (!values || values.length === 0) return null;

  const width = 260;
  const height = 50;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);

  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height}>
      <defs>
        <linearGradient id="elevGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#4CAF50" />
          <stop offset="50%" stopColor="#FFC107" />
          <stop offset="100%" stopColor="#F44336" />
        </linearGradient>
      </defs>

      <polyline
        fill="none"
        stroke="url(#elevGrad)"
        strokeWidth="2"
        points={points}
      />
    </svg>
  );
}

/* ---------------- COLOR ---------------- */

function suitabilityColor(label: string) {
  switch (label) {
    case "Highly Suitable":
      return "#4CAF50";
    case "Somewhat Suitable":
      return "#FFC107";
    default:
      return "#F44336";
  }
}