/* src/store/StorePanel.tsx */
import { useState, useEffect } from "react";
import { shopifyFetch, CREATE_CHECKOUT_MUTATION } from "./shopifyClient";

const BADGES_BASE = "/images/badges/fcs";

interface StorePanelProps {
  activeRouteProperties: any | null;
}

export default function StorePanel({ activeRouteProperties }: StorePanelProps) {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  /* THE CACHE ENGINE: Local state to keep the panel loaded when global state drops to null */
  const [cachedRoute, setCachedRoute] = useState<any | null>(null);

  /* Sync with incoming global map selections */
  useEffect(() => {
    if (activeRouteProperties !== null) {
      setCachedRoute(activeRouteProperties);
    }
  }, [activeRouteProperties]);

  /* Evaluate logic against our persistent cache instead of the raw prop */
  const hasActiveSelection = cachedRoute !== null;
  const routeProps = cachedRoute?.properties || cachedRoute || {};

  const routeTitle = hasActiveSelection
    ? (routeProps.NAME || routeProps.title || "Selected Route")
    : "No Route Selected";

  const rawRouteId = hasActiveSelection 
    ? String(routeProps.profile_id || cachedRoute.id || routeProps.id || routeProps.ID || "")
    : "";

  const miles = routeProps.GIS_MILES 
    ? parseFloat(routeProps.GIS_MILES).toFixed(1) 
    : null;
    
  const distanceMetric = miles 
    ? `${miles} MILES` 
    : (routeProps.distance ? `${routeProps.distance} mi` : "Premium Data");

  const avgGrade = routeProps.v3_avg_grade || "0";
  const fcsLabel = routeProps.v3_fcs_label ? String(routeProps.v3_fcs_label).toLowerCase() : "";
  const fcsBadgePath = fcsLabel ? `${BADGES_BASE}/fcs-badge-${fcsLabel}.png` : "";

  /* Reset loading spinners only when our cached tracking ID physically rotates */
  useEffect(() => {
    if (rawRouteId) {
      setIframeLoaded(false);
    }
  }, [rawRouteId]);

  /* THE LIVE ACTION TRANSACTION HANDLER */
  const handleLaunchCheckoutChannel = async () => {
    if (!hasActiveSelection) return;
    
    setIsRedirecting(true);
    console.log(`🚀 INITIATING TRANSITION: Compiling custom order invoice parameters inside Shopify for track asset: ${rawRouteId}...`);

    const targetVariantId = "gid://shopify/ProductVariant/51045122146524"; 

    const cartInput = {
      lines: [
        {
          merchandiseId: targetVariantId,
          quantity: 1,
          attributes: [
            { key: "SelectedRouteID", value: rawRouteId },
            { key: "RouteTitle", value: routeTitle },
            { key: "TelemetryDistance", value: distanceMetric }
          ]
        }
      ]
    };

    const responseData = await shopifyFetch({
      query: CREATE_CHECKOUT_MUTATION,
      variables: { input: cartInput }
    });

    if (responseData?.cartCreate?.cart?.checkoutUrl) {
      const secureCheckoutUrl = responseData.cartCreate.cart.checkoutUrl;
      console.log("✓ SHOPIFY MODERN INVOICE READY! Forwarding user to secure external billing screen layer.");
      window.top ? (window.top.location.href = secureCheckoutUrl) : (window.location.href = secureCheckoutUrl);
    } else {
      setIsRedirecting(false);
      const errorMsg = responseData?.cartCreate?.userErrors?.[0]?.message || "Check variant settings.";
      console.error("❌ Shopify Cart rejection notes:", responseData?.cartCreate?.userErrors);
      alert(`Could not initialize transaction connection: ${errorMsg}`);
    }
  };

  return (
    <div className="rg-checkout-hub-card">
      
      {/* MATCHING HEADER COMPONENT BLOCK WITH NEGATIVE MARGIN BREAKOUT */}
      <div className="drawer-header-title">
        <h2>Selected RideGuide</h2>
      </div>

      {/* DYNAMIC METRIC RESULT CARD CONTAINER */}
      {hasActiveSelection ? (
        <div className="rg-selection-card-space">
          <div className="route-finder-card-vertical">
            <div className="card-left-details-block">
              <div className="card-title-block">
                <div className="card-id-row">
                  <h3 className="card-route-title">
                    {routeTitle}
                  </h3>
                </div>
              </div>

              <div className="card-metrics-grid">
                <div className="metric-column">
                  <span className="metric-label">Distance</span>
                  <span className="metric-value">{distanceMetric}</span>
                </div>
                <div className="metric-column">
                  <span className="metric-label">Avg Grade</span>
                  <span className="metric-value">{avgGrade}%</span>
                </div>
              </div>
            </div>

            <div className="card-right-badge-bay">
              {fcsBadgePath && (
                <img
                  src={fcsBadgePath}
                  alt="fcs classification badge"
                  className="card-route-badge-image-scaled"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="rg-selection-placeholder-node">
          No Map Route Activated
        </div>
      )}

      {/* RIDEGUIDE RENDER IFRAME VIEWPORT PREVIEW ENGINE */}
      {hasActiveSelection && rawRouteId ? (
        <div className="rg-storefront-report-portal-wrapper" onClick={handleLaunchCheckoutChannel}>
          <div className="rg-storefront-report-portal-shield" />
          
          {!iframeLoaded && (
            <div className="rg-storefront-report-portal-loader">
              <span className="animate-pulse">Compiling Report Matrix...</span>
            </div>
          )}
          
          <iframe
            src={`/report/${rawRouteId}?preview=true`}
            title={`Preview for track ${rawRouteId}`}
            scrolling="no"
            onLoad={() => setIframeLoaded(true)}
          />

          {/* 🎯 RESTRUCTURED ENGAGING INTERACTIVE UPSELL OVERLAY ELEMENT */}
          <div className="rg-portal-embedded-upsell-overlay">
            <div className="rg-retail-badge-row-link">
              <h4 className="rg-hub-main-title">Printable RideGuide PDF</h4>
            </div>
            
            <div className="rg-hub-pricing-row">
              <span className="rg-hub-price-tag">$6.99</span>
              <span className="rg-hub-price-annotation">/ One-Time Purchase</span>
            </div>
            
            <p className="rg-retail-description-text">
              Get today's RideGuide for this route featuring:
            </p>

            {/* VERTICALLY STACKED HIGHLIGHT PILLS */}
            <div className="rg-overlay-feature-pills-stack">
              <div className="rg-feature-pill-item">
                <span className="rg-pill-checkmark">✓</span>
                <span className="rg-pill-label-text">Current Weather</span>
              </div>
              <div className="rg-feature-pill-item">
                <span className="rg-pill-checkmark">✓</span>
                <span className="rg-pill-label-text">Live Route Conditions</span>
              </div>
            </div>

            <p className="rg-retail-delivery-footer-text">
              Delivered straight to your inbox!
            </p>
          </div>
        </div>
      ) : (
        <div className="rg-storefront-empty-viewport-placeholder">
          <span className="rg-placeholder-icon">🗺️</span>
          <span className="rg-placeholder-text">
            Select a route line <br /> on the map tool to <br /> view its custom PDF pack
          </span>
        </div>
      )}

      {/* 🎯 PRIMARY ACTION TRIGGER ATTACHED PERMANENTLY TO COLUMN BASE */}
      <button 
        onClick={handleLaunchCheckoutChannel} 
        disabled={!hasActiveSelection || isRedirecting}
        className="rg-premium-buy-btn"
        style={{ 
          backgroundColor: !hasActiveSelection ? "#94a3b8" : (isRedirecting ? "#10b981" : "#d88a3a"),
          cursor: !hasActiveSelection || isRedirecting ? "not-allowed" : "pointer"
        }}
      >
        {!hasActiveSelection 
          ? "SELECT ROUTE ON MAP TO BUY" 
          : (isRedirecting ? "COMPILING CHECKOUT... ⏳" : "BUY TODAY'S RIDEGUIDE ➔")
        }
      </button>
      <span className="rg-disclaimer-note">
        By purchasing, you agree to our terms and conditions.<br />
        RideGuide is a digital product delivered instantly after purchase. No physical item will be shipped. RideGuide is provided for informational purposes only and may not reflect real‑time road or terrain conditions. Outdoor activities involve inherent risks. Use at your own discretion.
      </span>

    </div>
  );
}