import { computeFinalSuitability } from "../lib/scoring/computeFinalSuitability";

export type GravelPopupData = {
  roadId: string;
  roadName: string;
  maintenanceLevel: string;
  surfaceType: string;
  status: string;
  meanSlope: number;
  maxSlope: number;
  ascentPerKm: number;
  suitability?: string;
  precip24h: number;
  tractionImpact: string;
  classRecommendation: string;
  classExplanation?: string;
  elevationProfile: number[];
  baseScore: number;
};

type GravelPopupProps = {
  route: GravelPopupData | null;
  onClose?: () => void;
};

export default function GravelPopup({ route, onClose }: GravelPopupProps) {
  if (!route) return null;

  const finalSuitability = computeFinalSuitability({
    baseScore: route.baseScore,
    precip_24h: route.precip24h,
    meanSlope: route.meanSlope,
    maxSlope: route.maxSlope,
    surfaceType: normalizeSurfaceType(route.surfaceType),
  });

  return (
    <div
      style={{
        width: "100%",
        background: "#f8fafc",
        borderTop: "2px solid #cbd5e1",
        boxShadow: "0 -10px 30px rgba(0,0,0,0.18)",
        color: "#0f172a",
        fontFamily:
          "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      }}
    >
      {/* ---------------- TOP GRID ---------------- */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1.2fr 1.2fr 1fr",
          gap: "20px",
          padding: "18px 20px",
          alignItems: "start",
        }}
      >
        {/* ROAD INFO */}
        <div style={{ borderRight: "1px solid #cbd5e1", paddingRight: "16px" }}>
          <div style={{ fontSize: "18px", fontWeight: 800, color: "#17365d" }}>
            {route.roadId} | {route.roadName}
          </div>

          <div style={{ marginTop: "12px", fontSize: "16px" }}>
            Level {route.maintenanceLevel} - {route.surfaceType}
          </div>

          <div style={{ marginTop: "8px", fontSize: "16px" }}>
            Status: {route.status}
          </div>
        </div>

        {/* TRACTION */}
        <div style={{ borderRight: "1px solid #cbd5e1", paddingRight: "16px" }}>
          <div
            style={{
              fontSize: "12px",
              letterSpacing: "0.08em",
              fontWeight: 800,
              color: "#334155",
              marginBottom: "10px",
            }}
          >
            TRACTION
          </div>

          <div style={{ fontSize: "14px", lineHeight: 1.5 }}>
            <div>
              <strong>Mean Slope</strong> {route.meanSlope.toFixed(1)}%
            </div>
            <div>
              <strong>Max Slope</strong> {route.maxSlope.toFixed(1)}%
            </div>
            <div>
              <strong>Climb</strong> {route.ascentPerKm.toFixed(0)} m/km
            </div>
          </div>

          <div style={{ marginTop: "10px", fontSize: "13px", color: "#475569" }}>
            {route.tractionImpact}
          </div>
        </div>

        {/* WEATHER */}
        <div style={{ borderRight: "1px solid #cbd5e1", paddingRight: "16px" }}>
          <div
            style={{
              fontSize: "12px",
              letterSpacing: "0.08em",
              fontWeight: 800,
              color: "#334155",
              marginBottom: "10px",
            }}
          >
            24-HOUR WEATHER DATA
          </div>

          <div style={{ fontSize: "14px" }}>
            <strong>Precip:</strong> {route.precip24h.toFixed(1)} mm
          </div>
        </div>

        {/* SUITABILITY */}
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              display: "inline-block",
              background: suitabilityBadgeColor(finalSuitability),
              color: "#fff",
              fontWeight: 800,
              fontSize: "18px",
              lineHeight: 1,
              padding: "14px 18px",
              borderRadius: "8px",
              minWidth: "110px",
              textAlign: "center",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2)",
            }}
          >
            {shortSuitabilityLabel(finalSuitability)}
          </div>

          <div style={{ marginTop: "12px", fontSize: "14px", color: "#1e293b" }}>
            {route.classRecommendation}
          </div>
        </div>
      </div>

      {/* ---------------- CLASS EXPLANATION ---------------- */}
      <div
        style={{
          borderTop: "1px solid #cbd5e1",
          padding: "10px 20px 8px",
          fontSize: "14px",
          color: "#334155",
          position: "relative",
        }}
      >
        {route.classExplanation || "Class explanation text"}

        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close route details"
            style={{
              position: "absolute",
              right: "16px",
              top: "8px",
              border: "none",
              background: "transparent",
              fontSize: "22px",
              cursor: "pointer",
              color: "#475569",
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* ---------------- ELEVATION PROFILE ---------------- */}
      <div
        style={{
          borderTop: "1px solid #cbd5e1",
          padding: "10px 20px 6px",
          background: "#fff",
        }}
      >
        <DistanceAxis values={route.elevationProfile} />

        <div style={{ marginTop: "8px" }}>
          <ElevationProfile values={route.elevationProfile} />
        </div>

        <div
          style={{
            textAlign: "center",
            fontSize: "16px",
            fontWeight: 700,
            color: "#334155",
            marginTop: "4px",
          }}
        >
          Elevation Profile
        </div>
      </div>
    </div>
  );
}

/* ---------------- ELEVATION PROFILE COMPONENT ---------------- */

function ElevationProfile({ values }: { values: number[] }) {
  if (!values || values.length < 2) {
    return (
      <div
        style={{
          height: 90,
          display: "flex",
          alignItems: "center",
          color: "#64748b",
        }}
      >
        No elevation profile data
      </div>
    );
  }

  const width = 1200;
  const height = 90;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);

  const linePoints = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  const areaPoints = `0,${height} ${linePoints} ${width},${height}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height="90"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="elevLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#16a34a" />
          <stop offset="50%" stopColor="#fde047" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
      </defs>

      <polygon points={areaPoints} fill="rgba(148,163,184,0.16)" />

      <polyline
        fill="none"
        stroke="url(#elevLineGrad)"
        strokeWidth="4"
        points={linePoints}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ---------------- DISTANCE AXIS ---------------- */

function DistanceAxis({ values }: { values: number[] }) {
  const miles = Math.max(1, Math.round(values.length / 10));
  const labels = [0, Math.max(1, Math.round(miles / 2)), miles];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        alignItems: "center",
        textAlign: "center",
        color: "#1d4b7a",
        fontWeight: 700,
        fontSize: "14px",
        borderBottom: "2px solid #1d4b7a",
        paddingBottom: "4px",
      }}
    >
      <div>{labels[0]} mi</div>
      <div>{labels[1]} mi</div>
      <div>{labels[2]} mi</div>
    </div>
  );
}

/* ---------------- HELPERS ---------------- */

function normalizeSurfaceType(
  value: string
): "paved" | "gravel" | "dirt" | "clay" | "unknown" {
  const v = value.toLowerCase();
  if (v.includes("pav")) return "paved";
  if (v.includes("grav")) return "gravel";
  if (v.includes("dirt")) return "dirt";
  if (v.includes("clay")) return "clay";
  return "unknown";
}

function suitabilityBadgeColor(label: string) {
  switch (label) {
    case "Highly Suitable":
      return "#2e8b57";
    case "Somewhat Suitable":
      return "#d88b0d";
    default:
      return "#c2410c";
  }
}

function shortSuitabilityLabel(label: string) {
  switch (label) {
    case "Highly Suitable":
      return "Good";
    case "Somewhat Suitable":
      return "Fair";
    default:
      return "Poor";
  }
}