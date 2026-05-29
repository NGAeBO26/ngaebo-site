/* src/components/RideGuide/TelemetryTooltip.tsx */
import tooltipData from "../../data/rideGuideTooltips.json";
import "./TelemetryTooltip.css";

interface TelemetryTooltipProps {
  widgetKey: string;
  isVisible: boolean;
  cardPosition: "left" | "right";
  cardOffsetTop: string;
}

export default function TelemetryTooltip({ 
  widgetKey, 
  isVisible, 
  cardPosition, 
  cardOffsetTop 
}: TelemetryTooltipProps) {
  
  if (!isVisible) return null;
  
  const sanitizedKey = widgetKey.toLowerCase();
  const data = (tooltipData as any)[sanitizedKey];

  if (!data) {
    console.warn(`⚠️ Key lookup signature "${sanitizedKey}" missed inside rideGuideTooltips.json.`);
    return null;
  }

  // Uses slimmer, precise horizontal viewport offset calculations
  const placementStyles = cardPosition === "right"
    ? { left: "calc(215.9mm + 12px)" }
    : { right: "calc(215.9mm + 12px)" };

  const animationClass = cardPosition === "right" 
    ? "rg-slide-from-right" 
    : "rg-slide-from-left";

  return (
    <div
      className={`rg-hud-tooltip-card ${animationClass}`}
      style={{
        position: "absolute",
        top: cardOffsetTop,
        ...placementStyles
      }}
    >
      <span className="rg-tooltip-tagline">{data.tagline}</span>
      <h4 className="rg-tooltip-title">{data.title}</h4>

      <div className="rg-tooltip-formula">{data.formula}</div>
      <p className="rg-tooltip-description">{data.description}</p>

      {/* 🚀 CHECKMARK BULLET LOOP INTERFACE */}
      {data.bullets && (
        <div className="rg-tooltip-bullet-box">
          <strong className="rg-tooltip-bullet-header">RIDER BENEFIT</strong>
          <div className="rg-tooltip-bullet-list">
            {data.bullets.map((bullet: string, index: number) => (
              <span key={index} className="rg-tooltip-bullet-item">
                {bullet}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}