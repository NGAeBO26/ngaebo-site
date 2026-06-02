/* src/components/RideGuide/TelemetryTooltip.tsx */
import tooltipData from "../../data/rideGuideTooltips.json";
import "./TelemetryTooltip.css";

interface TelemetryTooltipProps {
  widgetKey: string;
  isVisible: boolean;
  cardPosition: "left" | "right";
  cardOffsetTop: string;
  isModalRender?: boolean; // 🎯 NEW ADAPTIVE LAYOUT ATTRIBUTE PARAMETER
}

export default function TelemetryTooltip({ 
  widgetKey, 
  isVisible, 
  cardPosition, 
  cardOffsetTop,
  isModalRender = false // Defaults intact to avoid breaking the active report overlay views
}: TelemetryTooltipProps) {
  
  if (!isVisible) return null;
  
  const sanitizedKey = widgetKey.toLowerCase();
  const data = (tooltipData as any)[sanitizedKey];

  if (!data) {
    console.warn(`⚠️ Key lookup signature "${sanitizedKey}" missed inside rideGuideTooltips.json.`);
    return null;
  }

  // 🔒 CONTEXT LAYER SHIFT CONTROL
  // If rendering inside the registration modal view deck layout, skip hardcoded coordinates
  const placementStyles = isModalRender 
    ? {} 
    : (cardPosition === "right" ? { left: "calc(215.9mm + 12px)" } : { right: "calc(215.9mm + 12px)" });

  const animationClass = isModalRender 
    ? "rg-modal-inline-fade" 
    : (cardPosition === "right" ? "rg-slide-from-right" : "rg-slide-from-left");

  return (
    <div
      className={`rg-hud-tooltip-card ${animationClass}`}
      style={{
        position: isModalRender ? "relative" : "absolute",
        top: isModalRender ? "auto" : cardOffsetTop,
        ...placementStyles
      }}
    >
      <span className="rg-tooltip-tagline">{data.tagline}</span>
      <h4 className="rg-tooltip-title">{data.title}</h4>

      <div className="rg-tooltip-formula">{data.formula}</div>
      <p className="rg-tooltip-description">{data.description}</p>

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