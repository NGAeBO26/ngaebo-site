/* src/features/Discovery/components/MobileGravelPopup.tsx */
import { useState } from "react";
import { useShopifyCart } from "../../../store/ShopifyCartContext";
import { useShopifyAuth } from "../../../store/ShopifyAuthContext";
import TokenUpsellModal from "../../../components/TokenUpsellModal";
import TransactionOverlay, {
  type TransactionState,
} from "../../../components/TransactionOverlay";
import MobileThreeDayForecast from "./3DayForecast";
import Sparkline from "../../../components/RideGuide/widgets/Sparkline";
import MetricsTiles from "../../../components/RideGuide/widgets/MetricsTiles";
import "../../../styles//mobile/MobileGravelPopup.css";

interface MobileGravelPopupProps {
  feature: any;
  onActionTriggered?: () => void;
}

export default function MobileGravelPopup({
  feature,
  onActionTriggered,
}: MobileGravelPopupProps) {
  const { isAuthenticated, customer, refreshProfile, login } = useShopifyAuth();
  const { addRouteToCart, cartItems, checkoutUrl } = useShopifyCart();

  const [isAdding, setIsAdding] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [isCtaFlashing, setIsCtaFlashing] = useState(false);

  const [isUpsellOpen, setIsUpsellOpen] = useState(false);
  const [upsellTargetRoute, setUpsellTargetRoute] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [transactionState, setTransactionState] =
    useState<TransactionState | null>(null);

  if (!feature) return null;

  const routeProps = feature.properties || feature || {};
  const rawRouteId = String(
    routeProps.profile_id || feature.id || routeProps.id || routeProps.ID || ""
  );
  const routeTitle =
    routeProps.NAME || routeProps.title || "Selected Route";
  const miles = routeProps.GIS_MILES
    ? parseFloat(routeProps.GIS_MILES).toFixed(1)
    : null;
  const distanceMetric = miles
    ? `${miles} MILES`
    : routeProps.distance
    ? `${routeProps.distance} mi`
    : "Premium Data";
  const fcsLabel = routeProps.v3_fcs_label
    ? String(routeProps.v3_fcs_label).toLowerCase()
    : "";

  const routeVibe = routeProps.v3_vibe || "Explore backcountry trails";
  const routeSurface = routeProps.v3_surface || "Gravel / Dirt";

  const isFullyAuthenticated = isAuthenticated && customer !== null;
  const rawUnlockedGuides = customer?.unlocked_guides || "{}";
  let unlockedMap: Record<string, any> = {};

  try {
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
    if (typeof entry === "object" && entry !== null)
      return Number(entry.expiresAt || 0);
    return Number(entry || 0);
  };

  const hasActivePass = customer?.passExpiresAt
    ? new Date() < new Date(customer.passExpiresAt)
    : false;
  const isThisRouteExplicitlyUnlocked =
    hasActivePass || getRouteExpiry(rawRouteId) > currentTimestamp;

  const tokenBalance = customer?.tokens || 0;
  const hasTokens = tokenBalance > 0;

  const hasBundleInCart = cartItems.some(
    (item: any) =>
      item.routeId === "TOKEN_BUNDLE" ||
      item.isTokenBundle ||
      item.title?.toLowerCase().includes("pack")
  );
  const isTokenUser = isFullyAuthenticated && hasTokens && !hasBundleInCart;
  const isAlreadyInCart = cartItems.some(
    (item: any) => String(item.routeId) === rawRouteId
  );

  const handleAddToCartAction = async () => {
    if (isAdding || isThisRouteExplicitlyUnlocked || isAlreadyInCart) return;

    setIsAdding(true);
    const targetVariantId = "gid://shopify/ProductVariant/51045122146524";
    await addRouteToCart(
      targetVariantId,
      rawRouteId,
      routeTitle,
      distanceMetric,
      fcsLabel
    );
    setIsAdding(false);
  };

  const handleLockedTeaserClick = () => {
    setIsCtaFlashing(true);
    setTimeout(() => setIsCtaFlashing(false), 1200);
  };

  const handleTokenRedemption = async (
    targetId: string,
    targetTitle: string
  ) => {
    if (isRedeeming || !customer) return;

    if (onActionTriggered) onActionTriggered();

    setIsRedeeming(true);
    const API_BASE_TARGET =
      window.location.hostname === "localhost"
        ? "http://localhost:5000"
        : "";

    const isReprint =
      hasActivePass || getRouteExpiry(targetId) > Date.now();

    setTransactionState({
      status: "processing",
      type: isReprint ? "print_verification" : "single_unlock",
      title: isReprint
        ? "Authenticating Access..."
        : "Deducting Token Credit",
      message: isReprint
        ? `Verifying secure credentials and loading active data layers for: "${targetTitle}"...`
        : `Communicating transaction coordinates with security vault to unlock: "${targetTitle}"...`,
    });

    try {
      const response = await fetch(
        `${API_BASE_TARGET}/api/tokens/redeem`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerId: customer.id,
            routeId: targetId,
            routeTitle: targetTitle,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Server rejected balance transaction.");

      if (refreshProfile) await refreshProfile();
      setIsUpsellOpen(false);

      if (data.downloadUrl) {
        window.open(data.downloadUrl, "_blank");
      }

      setTransactionState({
        status: "success",
        type: isReprint ? "print_verification" : "single_unlock",
        title: isReprint ? "Access Authenticated" : "RideGuide Unlocked",
        message: isReprint
          ? `Vault clearance approved! Clean copies of your premium analytics sheets for "${targetTitle}" have been successfully launched in a new browser window tab.`
          : `Successfully redeemed 1 token credit. "${targetTitle}" has been moved to your permanent Catalog vault library.`,
        meta: { downloadUrl: data.downloadUrl },
      });
    } catch (err: any) {
      setTransactionState({
        status: "failure",
        type: isReprint ? "print_verification" : "single_unlock",
        title: isReprint
          ? "Clearance Request Declined"
          : "Vault Request Declined",
        message:
          err.message ||
          (isReprint
            ? "Secured credential validation mapping loop failed to complete."
            : "Insufficient profile wallet credit balance. Please purchase a bundle pack to unlock."),
      });
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleBatchTokenRedemption = async () => {
    if (isRedeeming || !customer || cartItems.length === 0) return;

    if (onActionTriggered) onActionTriggered();

    setIsRedeeming(true);
    const API_BASE_TARGET =
      window.location.hostname === "localhost"
        ? "http://localhost:5000"
        : "";
    let processedCount = 0;

    setTransactionState({
      status: "processing",
      type: "batch_unlock",
      title: "Processing Batch Generation",
      message: `Executing concurrent data-deductions for ${cartItems.length} tracks from your token balance...`,
    });

    try {
      for (const item of cartItems) {
        const targetId = item.routeId || "";
        if (targetId) {
          const response = await fetch(
            `${API_BASE_TARGET}/api/tokens/redeem`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                customerId: customer.id,
                routeId: targetId,
                routeTitle: item.title,
              }),
            }
          );
          if (response.ok) processedCount++;
        }
      }

      if (refreshProfile) await refreshProfile();
      setIsUpsellOpen(false);

      setTransactionState({
        status: "success",
        type: "batch_unlock",
        title: "Batch Assets Provisioned",
        message: `Successfully provisioned ${processedCount} maps! All elements have been dropped cleanly inside your Catalog tab.`,
      });
    } catch (err: any) {
      setTransactionState({
        status: "failure",
        type: "batch_unlock",
        title: "Batch Compilation Interrupted",
        message:
          err.message ||
          "An exception block broke the map verification execution loop sequence thread.",
      });
    } finally {
      setIsRedeeming(false);
    }
  };

  const handlePrimaryCheckoutDispatch = (
    targetId?: string,
    targetTitle?: string
  ) => {
    if (!isFullyAuthenticated) {
      login();
      return;
    }

    if (onActionTriggered) onActionTriggered();

    const dispatchId = targetId || rawRouteId;
    const dispatchTitle = targetTitle || routeTitle;

    if (dispatchId && dispatchTitle) {
      localStorage.setItem(
        "rg_intended_routes",
        JSON.stringify([{ routeId: dispatchId, title: dispatchTitle }])
      );
      setUpsellTargetRoute({ id: dispatchId, title: dispatchTitle });
      setIsUpsellOpen(true);
    }
  };

  const handleBypassCheckout = () => {
    setIsUpsellOpen(false);
    if (!checkoutUrl) return;
    window.open(checkoutUrl, "_blank");
  };

  return (
    <div className="rg-mobile-consolidated-drawer-content">
      <div className="rg-active-map-selection-panel rg-mobile-gravel-popup-container">
        {/* 🎯 HEADER BANNER: ROUTE VIBE & SURFACE TYPE */}
        <div className="route-finder-card-vertical mobile-header-banner-takeover">
          <div className="card-left-details-block">
            <div className="card-subtitle-banner-row">
              <div className="subtitle-item">
                <span className="subtitle-label">Route Vibe</span>
                <strong className="mellow-highlight-value">{routeVibe}</strong>
              </div>
              <span className="banner-inline-divider">|</span>
              <div className="subtitle-item">
                <span className="subtitle-label">Surface Type</span>
                <strong className="mellow-highlight-value">{routeSurface}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* 🎯 BODY DATA GROUP: METRICS, WEATHER, ELEVATION */}
        <div className="rg-mobile-drawer-data-body-group">
          {/* ROUTE METRICS */}
          <div className="hud-console-section section-metrics-row">
            <div className="takeover-report-label-banner">
              <span>Route Metrics</span>
            </div>
            <div className="hud-section-body rg-mobile-metrics-grid-bay">
              <MetricsTiles data={routeProps} />
            </div>
          </div>

          {/* WEATHER CONDITIONS (LOCKED TEASER VS UNLOCKED ACTIVE) */}
          <div className="hud-console-section section-weather-row">
            <div className="takeover-report-label-banner">
              <span>Weather Conditions</span>
            </div>
            <div className="hud-section-body">
              {isThisRouteExplicitlyUnlocked ? (
                <MobileThreeDayForecast routeID={rawRouteId} />
              ) : (
                <div
                  className={`teaser-locked-card ${
                    isCtaFlashing ? "is-active-teaser" : ""
                  }`}
                  onClick={handleLockedTeaserClick}
                >
                  <div className="teaser-blurred-content">
                    <MobileThreeDayForecast routeID={rawRouteId} />
                  </div>
                  <div className="teaser-lock-badge">
                    <img
                      src="/data/assets/icon_unlock.svg"
                      alt="Unlock"
                      className="teaser-lock-icon"
                    />
                    <span className="teaser-badge-label">Live Weather</span>
                    <span className="teaser-badge-hover-label">
                      INCLUDED WITH $6.99 GUIDE
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ELEVATION PROFILE */}
          <div className="hud-console-section section-elevation-graph">
            <div className="takeover-report-label-banner">
              <span>Elevation Profile</span>
            </div>
            <div className="hud-section-body sparkline-viewport-containment">
              <Sparkline routeID={rawRouteId} />
            </div>
          </div>
        </div>
      </div>

      {/* 🎯 MAIN ACTION CTA BUTTON */}
      <div className="rg-mobile-action-cta-button-wrapper">
        {isThisRouteExplicitlyUnlocked ? (
          <button
            type="button"
            className="rg-inline-card-action-btn print-green"
            onClick={() => handleTokenRedemption(rawRouteId, routeTitle)}
          >
            PRINT RIDEGUIDE NOW ➔
          </button>
        ) : isTokenUser ? (
          <button
            type="button"
            className="rg-inline-card-action-btn unlock-verdant"
            disabled={isRedeeming}
            onClick={() =>
              handlePrimaryCheckoutDispatch(rawRouteId, routeTitle)
            }
          >
            INSTANT UNLOCK (1 CREDIT) ➔
          </button>
        ) : (
          <button
            type="button"
            className={`rg-inline-card-action-btn add-verdant ${
              isCtaFlashing ? "flash-attention" : ""
            }`}
            disabled={isAdding || isAlreadyInCart}
            onClick={handleAddToCartAction}
          >
            {isAlreadyInCart
              ? "✓ ALREADY IN CART"
              : isAdding
              ? "ADDING... ⏳"
              : "ADD ROUTE TO CART +"}
          </button>
        )}
      </div>

      <TokenUpsellModal
        isOpen={isUpsellOpen}
        onClose={() => {
          setIsUpsellOpen(false);
          setUpsellTargetRoute(null);
        }}
        onBypass={handleBypassCheckout}
        targetRoute={upsellTargetRoute}
        isTokenUser={isTokenUser}
        tokenBalance={tokenBalance}
        onRedeemSingle={handleTokenRedemption}
        onRedeemBatch={handleBatchTokenRedemption}
        isMutating={isRedeeming}
      />
      <TransactionOverlay
        state={transactionState}
        onClose={() => setTransactionState(null)}
      />
    </div>
  );
}