/* src/store/StorePanel.tsx */
import { useState, useEffect } from "react";
import { useShopifyCart } from "./ShopifyCartContext"; 
import { useShopifyAuth } from "./ShopifyAuthContext"; 

const BADGES_BASE = "/images/badges/fcs";

interface StorePanelProps {
  activeRouteProperties: any | null;
}

export default function StorePanel({ activeRouteProperties }: StorePanelProps) {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  
  // LOAD IDENTITY METRICS: Pull customer profile data hooks along with data refresher utilities
  const { isAuthenticated, customer, refreshProfile } = useShopifyAuth();
  const { addRouteToCart, cartItems, checkoutUrl } = useShopifyCart(); 

  const [isAdding, setIsAdding] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false); 
  const [justAdded, setJustAdded] = useState(false);
  const [cartNotification, setCartNotification] = useState<string | null>(null);
  const [cachedRoute, setCachedRoute] = useState<any | null>(null);

  // 🚀 AUTO-REFRESH WALLET ON TAB FOCUS
  // Automatically updates the credit balance when a rider switches back to this tab from Shopify Checkout!
  useEffect(() => {
    if (isAuthenticated && refreshProfile) {
      const handleTabFocusSync = () => {
        console.log("🔄 Map tab focused. Syncing credit vault parameters with Shopify...");
        refreshProfile();
      };

      // Listen for when the user clicks back into this window
      window.addEventListener("focus", handleTabFocusSync);
      
      return () => {
        window.removeEventListener("focus", handleTabFocusSync);
      };
    }
  }, [isAuthenticated, refreshProfile]);

  /* Sync with incoming global map selections */
  useEffect(() => {
    if (activeRouteProperties !== null) {
      setCachedRoute(activeRouteProperties);
      setJustAdded(false); 
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

  // EVALUATE ACCOUNT BALANCE GATES
  const hasActivePass = customer?.passExpiresAt 
    ? new Date() < new Date(customer.passExpiresAt) 
    : false;

  const tokenBalance = customer?.tokens || 0;
  const hasTokens = tokenBalance > 0;
  
  const hasPremiumAccess = isAuthenticated && (hasActivePass || hasTokens);

  const isAlreadyInCart = cartItems.some((item) => String(item.routeId) === rawRouteId);

  // PARSE UNEXPIRED LIVE ACTIVE 7-DAY PASSES FROM METADATA LEDGER MAP
  const rawUnlockedGuides = (customer as any)?.unlocked_guides || (customer as any)?.unlocked || "{}";
  let unlockedMap: Record<string, number> = {};
  try {
    unlockedMap = typeof rawUnlockedGuides === "string" ? JSON.parse(rawUnlockedGuides) : rawUnlockedGuides;
  } catch (e) {
    unlockedMap = {};
  }

  const currentTimestamp = Date.now();
  const active7DayPassesList = Object.entries(unlockedMap)
    .filter(([_, expiresAt]) => expiresAt > currentTimestamp)
    .map(([routeId, expiresAt]) => ({
      routeId,
      expiresAt,
      daysLeft: Math.ceil((expiresAt - currentTimestamp) / (1000 * 60 * 60 * 24))
    }));

  // Standard checkout mutation pipeline
  const handleLaunchCheckoutChannel = async () => {
    if (!hasActiveSelection || isAdding || justAdded) return;
    if (isAlreadyInCart) {
      setCartNotification("already_in_cart");
      setTimeout(() => {
        setJustAdded(true);
        setCartNotification(null);
      }, 3000);
      return;
    }

    setIsAdding(true);
    setCartNotification(null);

    const targetVariantId = "gid://shopify/ProductVariant/51045122146524"; 
    const success = await addRouteToCart(targetVariantId, rawRouteId, routeTitle, distanceMetric, fcsLabel);

    if (success) {
      setCartNotification(`✓ Added ${routeTitle} to cart!`);
      setJustAdded(true); 
      setTimeout(() => {
        setCartNotification(null);
      }, 4500);
    } else {
      alert("Could not append item to cart selection. Please check network connectivity.");
    }
    setIsAdding(false);
  };

  // 🎰 EXECUTE ATOMIC STATELESS TOKEN REDEMPTION HANDSHAKE
  const handleTokenRedemption = async (overrideRouteId?: string, overrideRouteTitle?: string) => {
    const targetId = overrideRouteId || rawRouteId;
    const targetTitle = overrideRouteTitle || routeTitle;

    if (isRedeeming || !customer) return;

    const isPreVerifiedPass = overrideRouteId ? true : false;

    if (!isPreVerifiedPass) {
      const messagePrompt = hasActivePass
        ? `Download the printable RideGuide for "${targetTitle}" using your Unlimited Pass membership?`
        : `Use 1 credit token to unlock the printable RideGuide for "${targetTitle}"?\n\n(Current Balance: ${tokenBalance} Credits remaining)`;

      if (!window.confirm(messagePrompt)) {
        console.log("🎰 Transaction aborted by rider choice.");
        return; 
      }
    }

    setIsRedeeming(true);
    console.log(`🎰 DESTRUCTIVE CALL INITIATED: Redeeming access balance for guide ID: ${targetId}...`);

    const API_BASE_TARGET = window.location.hostname === "localhost" ? "http://localhost:5000" : "";

    try {
      const response = await fetch(`${API_BASE_TARGET}/api/tokens/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customer.id,
          routeId: targetId,
          routeTitle: targetTitle
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Server rejected balance transaction rules.");
      }

      await refreshProfile();

      if (data.success && data.downloadUrl) {
        console.log("🔒 Access approved! Launching secured link loop matrix...");
        window.open(data.downloadUrl, "_blank");
      } else {
        console.warn("⚠️ Fallback active: Backend didn't return a verified token link path.");
        window.open(`/download-guide?routeID=${targetId}`, "_blank");
      }

    } catch (err: any) {
      console.error("🚨 BALANCE REDEMPTION CRITICAL FAILURE:", err);
      alert(`Transaction Rejected: ${err.message || "Insufficient account balance."}`);
    } finally {
      setIsRedeeming(false);
    }
  };

  // MAIN ROUTER ENTRYPOINT FOR THE CTA CLICKS
  const handlePrimaryActionDispatch = () => {
    if (isAdding || isRedeeming) return;

    if (hasActiveSelection && !justAdded) {
      if (hasPremiumAccess) {
        handleTokenRedemption();
      } else {
        handleLaunchCheckoutChannel();
      }
    } else if (cartItems.length > 0) {
      if (checkoutUrl) {
        window.open(checkoutUrl, "_blank");
      }
    }
  };

  // RE-STYLED CONDITIONAL LOOKUPS FOR PRIMARY BUTTON
  let btnModifierClass = "mod-ready";
  if (isAdding || isRedeeming) {
    btnModifierClass = "mod-adding";
  } else if (hasActiveSelection && !justAdded) {
    btnModifierClass = hasPremiumAccess ? "mod-premium-unlock" : "mod-ready";
  } else if (cartItems.length > 0) {
    btnModifierClass = "mod-checkout"; 
  } else {
    btnModifierClass = "mod-disabled";
  }

  const isButtonDisabled = isAdding || isRedeeming || (!hasActiveSelection && cartItems.length === 0);
  const showInventoryDeck = justAdded || (!hasActiveSelection && cartItems.length > 0);
  const showPortalFrame = hasActiveSelection || cartItems.length > 0;

  return (
    <div className="rg-checkout-hub-card">
      
      <div className="drawer-header-title">
        <h2>Selected RideGuide</h2>
      </div>

      {isAuthenticated && (
        <div className="rg-compact-wallet-banner">
          <span className="rg-wallet-banner-label">Rider Account:</span>
          <span className="rg-wallet-banner-value">
            {hasActivePass ? "⚡ UNLIMITED MEMBERSHIP" : `🎫 ${tokenBalance} CREDIT BUNDLES`}
          </span>
        </div>
      )}

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
      ) : !showInventoryDeck ? (
        <div className="rg-selection-placeholder-node">
          No Map Route Activated
        </div>
      ) : null}

      {!showPortalFrame ? (
        <div className="rg-vault-refill-hub-container">
          <div className="rg-vault-header-section">
            <h3>CREDIT VAULT & REFILL STATION</h3>
            <p>Refill credit wallet bundles to unlock print portals without web checkout lineups.</p>
          </div>

          {/* ACTIVE 7-DAY RE-PRINT LEDGER LIST */}
          {isAuthenticated && active7DayPassesList.length > 0 && (
            <div className="rg-vault-active-passes-block">
              <h4>Active 7-Day Download Windows</h4>
              <div className="rg-vault-passes-scroll-pane">
                {active7DayPassesList.map((pass) => (
                  <div key={pass.routeId} className="rg-vault-pass-row-item">
                    <div className="rg-vault-pass-meta-left">
                      <span className="rg-vault-pass-route-id">Route: #{pass.routeId}</span>
                      <span className="rg-vault-pass-countdown">⏰ {pass.daysLeft} days left</span>
                    </div>
                    <button 
                      className="rg-vault-pass-reopen-action-btn"
                      disabled={isRedeeming}
                      onClick={() => handleTokenRedemption(pass.routeId, `Route #${pass.routeId}`)}
                    >
                      PRINT PDF
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BUNDLE PACK CART PERMALINKS MARKETPLACE */}
          <div className="rg-vault-bundle-marketplace">
            <h4>Purchase Token Refill Packs</h4>
            
            <div className="rg-vault-marketplace-card">
              <div className="rg-vault-card-details-left">
                <span className="rg-vault-pack-title">🚀 3-CREDIT REFILL</span>
                <span className="rg-vault-pack-desc">Unlock 3 maps anytime</span>
              </div>
              <a href="https://ngaebo-shop-3.myshopify.com/cart/51619975069916:1" target="_blank" rel="noreferrer" className="rg-vault-pack-checkout-link">
                $14.99
              </a>
            </div>

            <div className="rg-vault-marketplace-card featured-gold-border">
              <div className="rg-vault-card-details-left">
                <span className="rg-vault-pack-title">🔥 5-CREDIT REFILL</span>
                <span className="rg-vault-pack-desc">Unlock 5 maps (Save 10%)</span>
              </div>
              <a href="https://ngaebo-shop-3.myshopify.com/cart/51620055089372:1" target="_blank" rel="noreferrer" className="rg-vault-pack-checkout-link highlight">
                $22.49
              </a>
            </div>

            <div className="rg-vault-marketplace-card">
              <div className="rg-vault-card-details-left">
                <span className="rg-vault-pack-title">👑 15-CREDIT REFILL</span>
                <span className="rg-vault-pack-desc">Ultimate Gravel Pack</span>
              </div>
              <a href="https://ngaebo-shop-3.myshopify.com/cart/51620150837468:1" target="_blank" rel="noreferrer" className="rg-vault-pack-checkout-link">
                $59.99
              </a>
            </div>
          </div>

          <div className="rg-storefront-empty-viewport-placeholder inline-adjustment-hint">
            <span className="rg-placeholder-text">
              Select any map track line above to preview live telemetry data sets
            </span>
          </div>
        </div>
      ) : (
        <div className="rg-storefront-report-portal-wrapper">
          
          {(isAdding || isRedeeming || cartNotification) ? (
            <div className="rg-portal-success-overlay" style={cartNotification === "already_in_cart" ? { backgroundColor: "#451a03" } : undefined}>
              {cartNotification === "already_in_cart" ? (
                <>
                  <span className="rg-portal-success-icon">⚠️</span>
                  <h4 className="rg-portal-success-title">Route already in cart</h4>
                  <p className="rg-portal-success-desc">
                    {routeTitle} is already saved inside your active rider selection list.
                  </p>
                </>
              ) : isRedeeming ? (
                <>
                  <span className="rg-portal-success-icon">🎰</span>
                  <h4 className="rg-portal-success-title">Verifying Balance...</h4>
                  <p className="rg-portal-success-desc">
                    Communicating transaction credentials with your Shopify account ledger profile...
                  </p>
                </>
              ) : (
                <>
                  <span className="rg-portal-success-icon">✓</span>
                  <h4 className="rg-portal-success-title">Added to Cart!</h4>
                  <p className="rg-portal-success-desc">
                    {routeTitle} has been appended into your active session roster.
                  </p>
                </>
              )}
            </div>
          ) : showInventoryDeck ? (
            
            <div className="rg-portal-inventory-deck">
              <div className="rg-inventory-header-row">
                <span className="rg-inventory-meta-label">
                  CURRENT RIDER INVENTORY
                </span>
                <span className="rg-inventory-counter-tag">
                  {cartItems.length} Items
                </span>
              </div>

              <div className="rg-inventory-scroll-pane">
                {cartItems.map((item) => (
                  <div key={item.id} className="rg-inventory-item-card">
                    <div className="rg-inventory-item-left-details">
                      <div className="rg-inventory-item-title">
                        {item.title} {item.quantity > 1 && `(x${item.quantity})`}
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
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {isAuthenticated ? (
                <div style={{ padding: "4px 0", fontSize: "9.5px", color: "#16a34a", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.3px", textAlign: "center", fontFamily: "sans-serif" }}>
                  {hasActivePass 
                    ? "⚡ Unlimited Access Active Pass" 
                    : `🎫 Token Balance Remaining: ${tokenBalance} Credits`}
                </div>
              ) : (
                <div style={{ padding: "4px 0", fontSize: "9.5px", color: "#b45309", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.3px", textAlign: "center", fontFamily: "sans-serif" }}>
                  ⚠️ Guest Mode: Login Required at Checkout
                </div>
              )}

              <div className="rg-inventory-continue-shopping-row">
                <button 
                  onClick={() => {
                    setJustAdded(false);
                    if (!activeRouteProperties) setCachedRoute(null);
                  }} 
                  className="rg-inventory-continue-btn"
                >
                  Continue Shopping →
                </button>
              </div>
            </div>

          ) : (
            
            <>
              <div className="rg-storefront-report-portal-shield" onClick={hasPremiumAccess ? () => handleTokenRedemption() : handleLaunchCheckoutChannel} />
              
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
                
                {hasPremiumAccess ? (
                  <div className="rg-hub-pricing-row">
                    <span className="rg-hub-price-tag" style={{ color: "#16a34a" }}>✓ Unlocked</span>
                    <span className="rg-hub-price-annotation">/ Available in Account</span>
                  </div>
                ) : (
                  <div className="rg-hub-pricing-row">
                    <span className="rg-hub-price-tag">$6.99</span>
                    <span className="rg-hub-price-annotation">/ One-Time Purchase</span>
                  </div>
                )}
                
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

      <button 
        onClick={handlePrimaryActionDispatch} 
        disabled={isButtonDisabled}
        className={`rg-premium-buy-btn ${btnModifierClass}`}
      >
        {isAdding
          ? "ADDING TO CART... ⏳"
          : isRedeeming
            ? "GENERATING DOWNLOAD... ⏳"
            : (hasActiveSelection && !justAdded)
              ? hasActivePass
                ? "DOWNLOAD WITH ACTIVE PASS ➔"
                : hasTokens
                  ? `UNLOCK WITH 1 CREDIT (Balance: ${tokenBalance}) ➔`
                  : "ADD ROUTE TO CART"
              : (cartItems.length > 0)
                ? "PROCEED TO CHECKOUT ➔"
                : "SELECT ROUTE ON MAP TO BUY"
        }
      </button>

      <span className="rg-disclaimer-note">
        By purchasing, you agree to our terms and conditions.<br />
        RideGuide is a digital product delivered instantly after purchase. No physical item will be shipped. RideGuide is provided for informational purposes only and may not reflect real‑time road or terrain conditions. Outdoor activities involve inherent risks. Use at your own discretion.
      </span>

    </div>
  );
}