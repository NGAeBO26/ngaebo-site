/* src/store/StorePanel.tsx */
import { useState, useEffect } from "react";
import { useShopifyCart } from "./ShopifyCartContext"; // 🎯 Integrated shared context link

const BADGES_BASE = "/images/badges/fcs";

interface StorePanelProps {
  activeRouteProperties: any | null;
}

export default function StorePanel({ activeRouteProperties }: StorePanelProps) {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  
  // 🎯 CONNECT STATE CONTEXT: Read live item arrays alongside mutation engines
  const { addRouteToCart, cartItems } = useShopifyCart(); 

  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [cartNotification, setCartNotification] = useState<string | null>(null);
  const [cachedRoute, setCachedRoute] = useState<any | null>(null);

  /* Sync with incoming global map selections */
  useEffect(() => {
    if (activeRouteProperties !== null) {
      setCachedRoute(activeRouteProperties);
      setJustAdded(false); // 🎯 RESET FLOW: Tapping a new map line automatically loops back to State 2
      setCartNotification(null);
    }
  }, [activeRouteProperties]);

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

  useEffect(() => {
    if (rawRouteId) {
      setIframeLoaded(false);
    }
  }, [rawRouteId]);

  const handleLaunchCheckoutChannel = async () => {
    if (!hasActiveSelection || isAdding || justAdded) return;
    
    setIsAdding(true);
    setCartNotification(null);
    console.log(`🚀 INITIATING CART MUTATION: Passing context lines to Shopify Storefront schema layer for asset: ${rawRouteId}...`);

    const targetVariantId = "gid://shopify/ProductVariant/51045122146524"; 

    // Trigger background Storefront line inject parameters
    const success = await addRouteToCart(targetVariantId, rawRouteId, routeTitle, distanceMetric, fcsLabel);

    if (success) {
      console.log("✓ ITEM PERSISTED SUCCESSFULLY: Internal cart count matrices refreshed.");
      setCartNotification(`✓ Added ${routeTitle} to cart!`);
      setJustAdded(true); // 🎯 SWITCH TO STATE 4: Locks view down to show user's active cart contents
      
      // Auto-expire popup alert block after a readable duration loop
      setTimeout(() => {
        setCartNotification(null);
      }, 4500);
    } else {
      alert("Could not append item to cart selection. Please check network connectivity.");
    }
    
    setIsAdding(false);
  };

  // 🎯 DETERMINE MODIFIER PROFILE STATE FOR PRIMARY BUTTON ELEMENT
  let btnModifierClass = "mod-ready";
  if (!hasActiveSelection || justAdded) {
    btnModifierClass = "mod-disabled";
  } else if (isAdding) {
    btnModifierClass = "mod-adding";
  }

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

      {/* ──────────────────────────────────────────────────────────────────────────
         📦 DYNAMIC STATE VIEW DECK FOR THE REPORT VIEWPORT PORTAL AREA
         ────────────────────────────────────────────────────────────────────────── */}
      
      {/* 🎯 STATE 1: INTRO UNSELECTED CHANNELS */}
      {!hasActiveSelection ? (
        <div className="rg-storefront-empty-viewport-placeholder">
          <span className="rg-placeholder-icon"><img alt="fcs classification badge" className="rg-placeholder-icon" src="data/assets/icon_ride.svg"></img></span>
          <span className="rg-placeholder-text">
            Select a route line <br /> in the map to <br /> view the route PDF preview
          </span>
        </div>
      ) : (
        <div className="rg-storefront-report-portal-wrapper">
          
          {/* 🎯 STATE 3: INTERCEPT WITH LIVE SUCCESS NOTICE (CLEAN EXTRACT) */}
          {(isAdding || cartNotification) ? (
            <div className="rg-portal-success-overlay">
              <span className="rg-portal-success-icon">✓</span>
              <h4 className="rg-portal-success-title">
                Added to Cart!
              </h4>
              <p className="rg-portal-success-desc">
                {routeTitle} has been appended into your active session roster.
              </p>
            </div>
          ) : justAdded ? (
            
            /* 🎯 STATE 4: THE LIVE INVENTORY DECK DISPLAY MODULE (CLEAN EXTRACT) */
            <div className="rg-portal-inventory-deck">
              <div className="rg-inventory-header-row">
                <span className="rg-inventory-meta-label">
                  CURRENT RIDER INVENTORY
                </span>
                <span className="rg-inventory-counter-tag">
                  {cartItems.length} Items
                </span>
              </div>

              {/* Internal overflow micro scroll-pane matrix layout */}
              <div className="rg-inventory-scroll-pane">
                {cartItems.map((item) => (
                  <div key={item.id} className="rg-inventory-item-card">
                    <div className="rg-inventory-item-left-details">
                      <div className="rg-inventory-item-title">
                        {item.title}
                      </div>
                      <div className="rg-inventory-item-subtitle">
                        {item.distance}
                      </div>
                    </div>

                    <div className="rg-inventory-item-right-bay">
                      {item.fcsLabel && (
                        <img 
                          src={`/images/badges/fcs/fcs-badge-${item.fcsLabel.toLowerCase()}.png`} 
                          alt="fcs badge" 
                          className="rg-inventory-item-badge-asset"
                          onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                        />
                      )}
                      <span className="rg-inventory-item-price-label">
                        ${item.price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          ) : (
            
            /* 🎯 STATE 2: ACTIVE SELECTION LIVE IFRAME REPORT VIEWPORT PREVIEW */
            <>
              <div className="rg-storefront-report-portal-shield" onClick={handleLaunchCheckoutChannel} />
              
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
            </>
          )}

        </div>
      )}

      {/* 🎯 REMOVED: Redundant toast section deleted from this location to eliminate dual layout rendering blocks */}

      {/* PRIMARY ACTION TRIGGER ATTACHED PERMANENTLY TO COLUMN BASE (CLEAN EXTRACT) */}
      <button 
        onClick={handleLaunchCheckoutChannel} 
        disabled={!hasActiveSelection || isAdding || justAdded}
        className={`rg-premium-buy-btn ${btnModifierClass}`}
      >
        {/* STATE-SWITCHING BUTTON MATRIX DECK */}
        {!hasActiveSelection || justAdded
          ? "SELECT ROUTE ON MAP TO BUY" 
          : (isAdding ? "ADDING TO CART... ⏳" : "ADD ROUTE TO CART")
        }
      </button>

      <span className="rg-disclaimer-note">
        By purchasing, you agree to our terms and conditions.<br />
        RideGuide is a digital product delivered instantly after purchase. No physical item will be shipped. RideGuide is provided for informational purposes only and may not reflect real‑time road or terrain conditions. Outdoor activities involve inherent risks. Use at your own discretion.
      </span>

    </div>
  );
}