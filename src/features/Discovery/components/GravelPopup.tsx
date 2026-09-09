/* src/features/Discovery/components/GravelPopup.tsx */
import { useState } from "react";
import Sparkline from "../../../components/RideGuide/widgets/Sparkline";
import MetricsTiles from "../../../components/RideGuide/widgets/MetricsTiles";
import EffortTax from "../../../components/RideGuide/widgets/EffortTax";
import RiskRadar from "../../../components/RideGuide/widgets/RiskRadar";
import PlacesToSee from "../../../components/RideGuide/widgets/PlacesToSee";
import CurrentWeather from "../../../components/RideGuide/widgets/CurrentWeather";
import RouteConditions from "../../../components/RideGuide/widgets/RouteConditions";
import GravelGuide from "../GravelGuide";
import { useShopifyCart } from "../../../store/ShopifyCartContext";
import { useShopifyAuth } from "../../../store/ShopifyAuthContext";
import "../../../styles/GravelPopup.css";

const BADGES_BASE = "/images/badges/fcs";

interface GravelPopupProps {
  feature: any;
  onClose: () => void;
  className?: string;
}

export default function GravelPopup({ feature, onClose, className = "popup-entering" }: GravelPopupProps) {
  const { isAuthenticated, customer, login } = useShopifyAuth();
  const { addRouteToCart, cartItems } = useShopifyCart();
  const [isAdding, setIsAdding] = useState(false);

  // 🎯 RESPONSIVE SIDE WING TOGGLE STATES (MID-SCREEN 769px - 1100px)
  const [isLeftExpanded, setIsLeftExpanded] = useState(false);
  const [isRightExpanded, setIsRightExpanded] = useState(false);

  if (!feature) return null;

  const geoData = feature.properties ?? {};
  const routeID = String(geoData.profile_id || geoData.id || feature.id || "");
  
  const routeName = geoData.NAME || "Unknown Route";
  const routeVibe = geoData.v3_vibe || "Explore backcountry trails";
  const routeSurface = geoData.v3_surface || "Gravel / Dirt";

  const fcsLabel = geoData.v3_fcs_label ? String(geoData.v3_fcs_label).toLowerCase() : "";
  const fcsBadgePath = fcsLabel ? `${BADGES_BASE}/fcs-badge-${fcsLabel}.png` : "";

  // Payload generation for Add To Cart logic
  const miles = geoData.GIS_MILES ? parseFloat(geoData.GIS_MILES).toFixed(1) : null;
  const distanceMetric = miles ? `${miles} MILES` : "Premium Data";

  // Auth & Wallet Check
  const isFullyAuthenticated = isAuthenticated && customer !== null;
  const tokenBalance = customer?.tokens || 0;
  const hasTokens = tokenBalance > 0;
  const hasBundleInCart = cartItems.some((item: any) => item.routeId === "TOKEN_BUNDLE" || item.isTokenBundle || item.title?.toLowerCase().includes("pack"));
  const isTokenUser = isFullyAuthenticated && hasTokens && !hasBundleInCart;
  const isAlreadyInCart = cartItems.some((item: any) => String(item.routeId) === routeID);

  let unlockedMap: Record<string, any> = {};
  try {
    const rawUnlockedGuides = customer?.unlocked_guides || "{}";
    if (typeof rawUnlockedGuides === "string") {
      let parsed = JSON.parse(rawUnlockedGuides);
      if (typeof parsed === "string") parsed = JSON.parse(parsed);
      unlockedMap = parsed || {};
    } else {
      unlockedMap = rawUnlockedGuides || {};
    }
  } catch (e) {
    unlockedMap = {};
  }

  const currentTimestamp = Date.now();
  const getRouteExpiry = (id: string): number => {
    const entry = unlockedMap[id];
    if (!entry) return 0;
    if (typeof entry === "object" && entry !== null) return Number(entry.expiresAt || 0);
    return Number(entry || 0);
  };
  
  const hasActivePass = customer?.passExpiresAt ? new Date() < new Date(customer.passExpiresAt) : false;
  const isThisRouteExplicitlyUnlocked = hasActivePass || (getRouteExpiry(routeID) > currentTimestamp);

  // ACTION HANDLERS
  const handleAddToCartAction = async () => {
    if (isAdding || isThisRouteExplicitlyUnlocked || isAlreadyInCart) return;
    setIsAdding(true);
    const targetVariantId = "gid://shopify/ProductVariant/51045122146524";
    await addRouteToCart(targetVariantId, routeID, routeName, distanceMetric, fcsLabel);
    setIsAdding(false);
  };

  const handlePrimaryCheckoutDispatch = () => {
    if (!isFullyAuthenticated) {
      login();
      return;
    }
    if ((window as any).forceOpenUpsell) {
      (window as any).forceOpenUpsell(routeID, routeName);
    }
  };

  const handlePrint = () => {
    if ((window as any).rgTriggerTokenRedemption) {
      (window as any).rgTriggerTokenRedemption(routeID, routeName);
    }
  };

  return (
    <div className={`takeover-hud-drop-down-tray-wrapper ${className}`}>
      {/* ─── 1. INTEGRATED BLUE ROUTE HEADER CAPSULE (48px HEIGHT MATCH) ─── */}
      <div className="hud-integrated-blue-header-capsule">
        <button onClick={onClose} className="takeover-hud-tray-up-chevron-btn" title="Close Drawer" aria-label="Close Drawer">
          ▲
        </button>

        <div className="hud-header-text-stack">
          <h1 className="hud-route-title-node">FS {routeName}</h1>
        </div>

        {fcsBadgePath && (
          <img
            src={fcsBadgePath}
            alt={`${fcsLabel} classification badge`}
            className="hud-header-fcs-badge"
            onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
          />
        )}
      </div>

      <div className="hud-header-vibe-surface-banner">
        <div className="vibe-item">
          <span className="vibe-label">ROUTE VIBE</span>
          <strong className="vibe-value">{routeVibe}</strong>
        </div>
        <span className="vibe-divider">|</span>
        <div className="vibe-item">
          <span className="vibe-label">SURFACE TYPE</span>
          <strong className="vibe-value">{routeSurface}</strong>
        </div>
      </div>

      <div className="takeover-hud-drop-down-tray-body">
        {/* ─── 2. BANNER HEADER TIER (INTERACTIVE RESPONSIVE TOGGLES) ─── */}
        <div className="hud-body-banner-header">
          <button 
            type="button" 
            className={`banner-col banner-toggle-btn col-left ${isLeftExpanded ? "is-active" : ""}`}
            onClick={() => setIsLeftExpanded(!isLeftExpanded)}
            title="Toggle Route Metrics Panel"
          >
            <span className="banner-chevron">{isLeftExpanded ? "◀" : "▶"}</span>
            <span>ROUTE METRICS</span>
          </button>
          
          <div className="banner-col col-center">ROUTE MAP</div>
          
          <button 
            type="button" 
            className={`banner-col banner-toggle-btn col-right ${isRightExpanded ? "is-active" : ""}`}
            onClick={() => setIsRightExpanded(!isRightExpanded)}
            title="Toggle Route Guide Panel"
          >
            <span>ROUTE GUIDE</span>
            <span className="banner-chevron">{isRightExpanded ? "▶" : "◀"}</span>
          </button>
        </div>

        {/* ─── 3. 3-COLUMN REPORT TEASER GRID ─── */}
        <div className="hud-three-column-grid-layout">
          
          {/* COLUMN 1: TELEMETRY & PROPRIETARY ANALYTICS TEASERS */}
          <div className={`hud-grid-column col-telemetry ${isLeftExpanded ? "wing-open" : "wing-collapsed"}`}>
            {/* 🎯 EDGE HANDLE RAIL (MID-SCREEN COLLAPSED TRIGGER) */}
            <button
              type="button"
              className="wing-handle-rail rail-left"
              onClick={() => setIsLeftExpanded(!isLeftExpanded)}
              aria-label="Expand Telemetry Metrics Panel"
            >
              <span className="rail-icon">{isLeftExpanded ? "◀" : "▶"}</span>
              <span className="rail-label">METRICS</span>
            </button>

            {/* Box 1: MetricsTiles (Height: 230px) */}
            <div className="hud-console-section section-metrics">
              <div className="hud-section-body horizontal-metrics-grid-bay">
                <MetricsTiles data={geoData} />
              </div>
            </div>

            {/* Box 2: Effort Tax Teaser */}
            <div className="hud-console-section section-teaser-effort">
              <div className="teaser-locked-card" onClick={handleAddToCartAction}>
                <div className="teaser-blurred-content">
                  <EffortTax routeID={routeID} />
                </div>
                <div className="teaser-lock-badge">
                  <img
                    src="/data/assets/icon_unlock.svg"
                    alt="Unlock"
                    className="teaser-lock-icon"
                  />
                  <span className="teaser-badge-label">Effort Tax (+8%)</span>
                  <span className="teaser-badge-hover-label">INCLUDED WITH $6.99 GUIDE</span>
                </div>
              </div>
            </div>

            {/* Box 3: Risk Radar Teaser (Height: 180px) */}
            <div className="hud-console-section section-teaser-risk">
              <div className="teaser-locked-card" onClick={handleAddToCartAction}>
                <div className="teaser-blurred-content">
                  <RiskRadar routeID={routeID} />
                </div>
                <div className="teaser-lock-badge">
                  <img
                    src="/data/assets/icon_unlock.svg"
                    alt="Unlock"
                    className="teaser-lock-icon"
                  />
                  <span className="teaser-badge-label">Full Risk Radar</span>
                  <span className="teaser-badge-hover-label">INCLUDED WITH $6.99 GUIDE</span>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMN 2: SPATIAL MAP, SPARKLINE & CENTERED CTA */}
          <div className="hud-grid-column col-spatial">
            {/* Box 1: Rotated Map */}
            <div className="hud-console-section section-rotated-map">
              <div className="hud-section-body rotated-map-viewport-containment">
                <GravelGuide
                  activeRouteId={routeID}
                  filteredRoutes={[feature]}
                  isTakeoverActive={true}
                  isPopupContext={true}
                />
              </div>
            </div>

            {/* Box 2: Elevation Sparkline Graph (Height: 110px) */}
            <div className="hud-console-section section-elevation-graph">
              <div className="hud-sparkline-banner-header">ELEVATION PROFILE</div>
              <div className="sparkline-viewport-containment">
                <Sparkline routeID={routeID} />
              </div>
            </div>

            {/* Box 3: Centered Action CTA Bay Under Middle Column (Height: 50px) */}
            <div className="hud-console-section section-middle-cta">
              {isThisRouteExplicitlyUnlocked ? (
                <button className="popup-cta-btn mod-print" onClick={handlePrint}>
                  PRINT RIDEGUIDE NOW ➔
                </button>
              ) : isTokenUser ? (
                <button className="popup-cta-btn mod-unlock" onClick={handlePrimaryCheckoutDispatch}>
                  INSTANT UNLOCK (1 CREDIT) ➔
                </button>
              ) : (
                <button className="popup-cta-btn mod-add" disabled={isAdding || isAlreadyInCart} onClick={handleAddToCartAction}>
                  {isAlreadyInCart ? "✓ ALREADY IN CART" : isAdding ? "ADDING... ⏳" : "ADD ROUTE TO CART +"}
                </button>
              )}
            </div>
          </div>

          {/* COLUMN 3: ROUTE GUIDE & ENVIRONMENTAL STATUS TEASERS */}
          <div className={`hud-grid-column col-guide ${isRightExpanded ? "wing-open" : "wing-collapsed"}`}>
            {/* 🎯 EDGE HANDLE RAIL (CHEVRON MOVED BEFORE LABEL TO MATCH LEFT RAIL) */}
            <button
              type="button"
              className="wing-handle-rail rail-right"
              onClick={() => setIsRightExpanded(!isRightExpanded)}
              aria-label="Expand Route Guide Panel"
            >
              <span className="rail-icon">{isRightExpanded ? "▶" : "◀"}</span>
              <span className="rail-label">GUIDE</span>
            </button>

            {/* Box 1: PlacesToSee (Height: 230px) */}
            <div className="hud-console-section section-places-to-see">
              <div className="hud-section-body guide-places-bay">
                <PlacesToSee routeID={routeID} />
              </div>
            </div>

            {/* Box 2: Weather Teaser */}
            <div className="hud-console-section section-teaser-weather">
              <div className="teaser-locked-card" onClick={handleAddToCartAction}>
                <div className="teaser-blurred-content">
                  <CurrentWeather routeID={routeID} />
                </div>
                <div className="teaser-lock-badge">
                  <img
                    src="/data/assets/icon_unlock.svg"
                    alt="Unlock"
                    className="teaser-lock-icon"
                  />
                  <span className="teaser-badge-label">Live Weather</span>
                  <span className="teaser-badge-hover-label">INCLUDED WITH $6.99 GUIDE</span>
                </div>
              </div>
            </div>

            {/* Box 3: Route Conditions Teaser (Height: 180px) */}
            <div className="hud-console-section section-teaser-conditions">
              <div className="teaser-locked-card" onClick={handleAddToCartAction}>
                <div className="teaser-blurred-content">
                  <RouteConditions routeID={routeID} />
                </div>
                <div className="teaser-lock-badge">
                  <img
                    src="/data/assets/icon_unlock.svg"
                    alt="Unlock"
                    className="teaser-lock-icon"
                  />
                  <span className="teaser-badge-label">Live Trail Status</span>
                  <span className="teaser-badge-hover-label">INCLUDED WITH $6.99 GUIDE</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}