/* src/store/StorePanel.tsx */
import { useState, useEffect } from "react";
import { useShopifyCart } from "./ShopifyCartContext"; 
import { useShopifyAuth } from "./ShopifyAuthContext";
import TokenUpsellModal from "../components/TokenUpsellModal";

const BADGES_BASE = "/images/badges/fcs"; 

interface CartItem {
  id: string;
  routeId?: string;
  title: string;
  distance?: string;
  price: number;
}

interface StorePanelProps {
  activeRouteProperties: any | null;
  allRoutes?: any[]; 
}

export default function StorePanel({ activeRouteProperties, allRoutes = [] }: StorePanelProps) {
  // ACTIVE RENDERING LOG: Tracks prop data updates on every cycle
  console.log("=== ⚡ STOREPANEL RE-RENDER AUDIT ===");
  console.log("1. Raw allRoutes Prop Reference:", allRoutes);
  console.log("2. Array.isArray Check:", Array.isArray(allRoutes));
  console.log("3. Current Length:", allRoutes ? allRoutes.length : "undefined/null");
  console.log("======================================");

  const { isAuthenticated, customer, refreshProfile, login, logout } = useShopifyAuth(); 
  const { addRouteToCart, removeCartItem, cartItems, checkoutUrl } = useShopifyCart(); 

  const [isAdding, setIsAdding] = useState(false); 
  const [isRedeeming, setIsRedeeming] = useState(false);  
  const [cachedRoute, setCachedRoute] = useState<any | null>(null); 
  const [activeTab, setActiveTab] = useState<"cart" | "catalog">("cart"); 
  const [activeCatalogHoverId, setActiveCatalogHoverId] = useState<string | null>(null); 
  
  const [isUpsellOpen, setIsUpsellOpen] = useState(false);
  const [upsellTargetRoute, setUpsellTargetRoute] = useState<{ id: string; title: string } | null>(null);

  const isFullyAuthenticated = isAuthenticated && customer !== null; 

  const rawUnlockedGuides = customer?.unlocked_guides || "{}"; 
  let unlockedMap: Record<string, any> = {}; 
  
  try {
    if (typeof rawUnlockedGuides === "string") {
      let parsed = JSON.parse(rawUnlockedGuides);
      if (typeof parsed === "string") {
        parsed = JSON.parse(parsed);
      }
      unlockedMap = parsed || {};
    } else {
      unlockedMap = rawUnlockedGuides || {};
    }
  } catch (e) {
    console.error("Silent parse catch fallback invoked:", e);
    unlockedMap = {};
  }

  const currentTimestamp = Date.now(); 

  // DEFENSIVE DICTIONARY EXTRACTORS
  const getRouteExpiry = (id: string): number => {
    const entry = unlockedMap[id];
    if (!entry) return 0;
    if (typeof entry === "object" && entry !== null) return Number(entry.expiresAt || 0);
    return Number(entry || 0);
  };

  const hasActivePass = customer?.passExpiresAt 
    ? new Date() < new Date(customer.passExpiresAt) 
    : false; 

  const hasActiveSelection = cachedRoute !== null; 
  const routeProps = cachedRoute?.properties || cachedRoute || {}; 

  const routeTitle = hasActiveSelection
    ? (routeProps.NAME || routeProps.title || "Selected Route")
    : "No Route Selected"; 

  const rawRouteId = hasActiveSelection 
    ? String(routeProps.profile_id || cachedRoute.id || routeProps.id || routeProps.ID || "")
    : ""; 

  const miles = routeProps.GIS_MILES ? parseFloat(routeProps.GIS_MILES).toFixed(1) : null; 
  const distanceMetric = miles ? `${miles} MILES` : (routeProps.distance ? `${routeProps.distance} mi` : "Premium Data"); 
  const avgGrade = routeProps.v3_avg_grade || "0"; 
  const fcsLabel = routeProps.v3_fcs_label ? String(routeProps.v3_fcs_label).toLowerCase() : ""; 
  const fcsBadgePath = fcsLabel ? `${BADGES_BASE}/fcs-badge-${fcsLabel}.png` : ""; 

  const tokenBalance = customer?.tokens || 0; 
  const hasTokens = tokenBalance > 0; 
  const isTokenUser = isFullyAuthenticated && hasTokens;  

  const isThisRouteExplicitlyUnlocked = hasActivePass || (getRouteExpiry(rawRouteId) > currentTimestamp); 

  // SCHEMATIC OBJECT ENTRY PARSING
  const activeCatalogPasses = Object.entries(unlockedMap)
    .map(([routeId, entry]) => {
      const expiresAt = typeof entry === "object" && entry !== null ? Number(entry.expiresAt || 0) : Number(entry || 0);
      const name = typeof entry === "object" && entry !== null ? String(entry.name || "") : "";
      return { routeId, expiresAt, name };
    })
    .filter((pass) => pass.expiresAt > currentTimestamp)
    .map((pass) => ({
      ...pass,
      daysLeft: Math.ceil((pass.expiresAt - currentTimestamp) / (1000 * 60 * 60 * 24))
    }));

  const visibleCartItems = cartItems.filter((item: CartItem) => {
    const targetId = item.routeId || "";
    const isLineRouteUnlocked = hasActivePass || (getRouteExpiry(targetId) > currentTimestamp);
    return !isLineRouteUnlocked;
  }); 

  const totalCartCount = visibleCartItems.length; 
  const computedPriceTotal = (totalCartCount * 6.99).toFixed(2); 
  const computedTokenTotal = totalCartCount;  

  const isAlreadyInCart = visibleCartItems.some((item: CartItem) => String(item.routeId) === rawRouteId); 

  useEffect(() => {
    if (isFullyAuthenticated && refreshProfile) {
      const handleTabFocusSync = () => refreshProfile();
      window.addEventListener("focus", handleTabFocusSync);
      return () => window.removeEventListener("focus", handleTabFocusSync);
    }
  }, [isFullyAuthenticated, refreshProfile]); 

  useEffect(() => {
    if (activeRouteProperties !== null) {
      setCachedRoute(activeRouteProperties);
      
      const routeProps = activeRouteProperties.properties || activeRouteProperties || {};
      const clickedRouteId = String(routeProps.profile_id || activeRouteProperties.id || routeProps.id || routeProps.ID || "");
      
      const isRoutePaidFor = hasActivePass || (getRouteExpiry(clickedRouteId) > Date.now());
      if (isRoutePaidFor) {
        setActiveTab("catalog");
      }
    }
  }, [activeRouteProperties, unlockedMap, hasActivePass]); 

  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).debugCatalog = activeCatalogPasses;
      (window as any).debugRoutes = allRoutes;
    }
  }, [activeCatalogPasses, allRoutes]); 

  // 🎯 AUTOMATED POST-PURCHASE WORKFLOW ENGINE
  useEffect(() => {
    const processAutomatedFulfillment = async () => {
      const savedIntendedRoutes = localStorage.getItem("rg_intended_routes");
      if (!savedIntendedRoutes || !isFullyAuthenticated || isRedeeming) return;

      // Scan for the leftover bundle package in the current cart session
      const bundleItem = cartItems.find((item: any) => item.routeId === "TOKEN_BUNDLE");

      // Execute fulfillment once the webhook completes and updates the credit ledger balance
      if (tokenBalance > 0) {
        try {
          const intendedRoutes = JSON.parse(savedIntendedRoutes);
          console.log("🚀 [AUTOMATION ENGINE]: Capturing return from checkout. Running auto-unlock tracks:", intendedRoutes);
          
          setIsRedeeming(true);
          let processedCount = 0;
          const API_BASE_TARGET = window.location.hostname === "localhost" ? "http://localhost:5000" : "";

          // Sequentially fulfill each track automatically using backend token workflows
          for (const route of intendedRoutes) {
            if (route.routeId) {
              console.log(`   -> Executing background redemption for: ${route.title} (${route.routeId})`);
              const response = await fetch(`${API_BASE_TARGET}/api/tokens/redeem`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                  customerId: customer.id, 
                  routeId: route.routeId, 
                  routeTitle: route.title 
                })
              });
              if (response.ok) processedCount++;
            }
          }

          // Force update the local authentication context profile parameters
          if (refreshProfile) {
            await refreshProfile();
          }

          // Remove the processed bundle item from the user's active cart lines
          if (bundleItem && removeCartItem) {
            console.log("   -> Automatically removing bundle package from cart lines:", bundleItem.id);
            await removeCartItem(bundleItem.id);
          }

          // Clear the local storage cache keys
          localStorage.removeItem("rg_intended_routes");
          
          // Force view to catalog panel and alert success
          setActiveTab("catalog");
          alert(`🎉 Success! Bought credits applied: ${processedCount} routes unlocked and added to your catalog. Check your email (${customer.email}) for links!`);
          
        } catch (err) {
          console.error("❌ Post-purchase automation processing exception:", err);
        } finally {
          setIsRedeeming(false);
        }
      }
    };

    processAutomatedFulfillment();
  }, [cartItems, tokenBalance, isFullyAuthenticated, customer, removeCartItem, refreshProfile]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).forceOpenUpsell = (targetId?: string, targetTitle?: string) => {
        if (targetId && targetTitle) {
          setUpsellTargetRoute({ id: targetId, title: targetTitle });
        } else {
          setUpsellTargetRoute(null);
        }
        setIsUpsellOpen(true);
      };
    }
    return () => {
      if (typeof window !== "undefined") {
        delete (window as any).forceOpenUpsell;
      }
    };
  }, []);

  const handleAddToCartAction = async () => {
    if (!hasActiveSelection || isAdding) return;
    if (isThisRouteExplicitlyUnlocked) {
      setActiveTab("catalog");
      return;
    }
    if (isAlreadyInCart) return;

    setIsAdding(true);
    const targetVariantId = "gid://shopify/ProductVariant/51045122146524"; 
    await addRouteToCart(targetVariantId, rawRouteId, routeTitle, distanceMetric, fcsLabel);
    setIsAdding(false);
  }; 

  const handleTokenRedemption = async (targetId: string, targetTitle: string) => {
    if (isRedeeming || !customer) return;
    setIsRedeeming(true);
    const API_BASE_TARGET = window.location.hostname === "localhost" ? "http://localhost:5000" : "";

    try {
      const response = await fetch(`${API_BASE_TARGET}/api/tokens/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: customer.id, routeId: targetId, routeTitle: targetTitle })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Server rejected balance transaction.");
      
      await refreshProfile();
      setActiveTab("catalog");
      setIsUpsellOpen(false);
      
      if (data.success && data.downloadUrl) window.open(data.downloadUrl, "_blank");

    } catch (err: any) {
      alert(`Transaction Failed: ${err.message || "Insufficient balance."}`);
    } finally {
      setIsRedeeming(false);
    }
  }; 

  const handleBatchTokenRedemption = async () => {
    if (isRedeeming || !customer || totalCartCount === 0) return;
    setIsRedeeming(true);
    const API_BASE_TARGET = window.location.hostname === "localhost" ? "http://localhost:5000" : "";
    let processedCount = 0;

    try {
      for (const item of visibleCartItems) {
        const targetId = item.routeId || "";
        if (targetId) {
          const response = await fetch(`${API_BASE_TARGET}/api/tokens/redeem`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ customerId: customer.id, routeId: targetId, routeTitle: item.title })
          });
          if (response.ok) processedCount++;
        }
      }

      await refreshProfile();
      setActiveTab("catalog");
      setIsUpsellOpen(false);
      alert(`🎉 Successfully activated ${processedCount} new RideGuides inside your vault! Use the individual row print triggers to generate your PDFs.`);
    } catch (err: any) {
      alert(`Batch Generation Encountered an Error: ${err.message}`);
    } finally {
      setIsRedeeming(false);
    }
  }; 

  // 🎯 MASTER INTERCEPT GATEWAY: Stashes target paths into local storage state
  const handlePrimaryCheckoutDispatch = (targetId?: string, targetTitle?: string) => {
    if (!isFullyAuthenticated) {
      login();
      return;
    }

    if (targetId && targetTitle) {
      // User tapped an individual track's unlock link
      localStorage.setItem("rg_intended_routes", JSON.stringify([{ routeId: targetId, title: targetTitle }]));
      setUpsellTargetRoute({ id: targetId, title: targetTitle });
      setIsUpsellOpen(true);
      return;
    }

    if (totalCartCount === 0) return;

    // User clicked the global master checkout link button with multiple tracks inside their cart
    localStorage.setItem(
      "rg_intended_routes", 
      JSON.stringify(visibleCartItems.map(item => ({ routeId: item.routeId, title: item.title })))
    );

    const hasBundleInCart = cartItems.some((item: any) => item.routeId === "TOKEN_BUNDLE");
    if (hasBundleInCart) {
      if (!checkoutUrl) return;
      window.open(checkoutUrl, "_blank");
      return;
    }

    setUpsellTargetRoute(null);
    setIsUpsellOpen(true);
  };

  const handleBypassCheckout = () => {
    setIsUpsellOpen(false);
    if (!checkoutUrl) return;
    window.open(checkoutUrl, "_blank");
  };

  return (
    <div className="rg-checkout-hub-card">
      <div className="drawer-header-title">
        <h2>RideGuide Shop</h2>
      </div>

      <div className="rg-unified-top-profile-deck">
        <div className="rg-profile-identity-row">
          <span className="rg-profile-username-tag">
            👤︎ {isFullyAuthenticated ? (customer?.firstName || "Rider") : "Guest Rider"}
          </span>
          <div className="rg-profile-right-side-dock">
            {isFullyAuthenticated && !hasActivePass && (
              <span className="rg-profile-wallet-balance-tag">🎫 {tokenBalance} Credits</span>
            )}
            <button onClick={isFullyAuthenticated ? logout : login} className="rg-profile-inline-auth-btn-link">
              {isFullyAuthenticated ? "Sign Out" : "Sign In"}
            </button>
          </div>
        </div>
        
        <div className="rg-profile-purchase-pricing-stack">
          <span className="rg-purchase-for-label-text">Selection Cart Summary</span>
          <span className="rg-purchase-price-value-callout">
            {isThisRouteExplicitlyUnlocked 
              ? "✓ UNLOCKED" 
              : totalCartCount === 0 
                ? "Cart Empty" 
                : !isFullyAuthenticated 
                  ? `$${computedPriceTotal}` 
                  : isTokenUser ? `${computedTokenTotal} Token Credit` : `$${computedPriceTotal}`}
          </span>
          {totalCartCount > 0 && isTokenUser && !isThisRouteExplicitlyUnlocked && (
            <span className="rg-ledger-balance-subtext">
              ({tokenBalance - computedTokenTotal} Credits remaining post-generation)
            </span>
          )}
        </div>
      </div>

      <div className="rg-storefront-workspace-container">
        
        {hasActiveSelection && (
          <div className="rg-active-map-selection-panel">
            <span className="rg-panel-section-title" style={{ display: 'block' }}>Selected Route Details</span>
            <div className="route-finder-card-vertical">
              <div className="card-left-details-block">
                <span className="card-route-title" style={{ display: 'block' }}>{routeTitle}</span>
                <div className="card-metrics-grid">
                  <div className="metric-column"><span className="metric-label">Distance</span><span className="metric-value">{distanceMetric}</span></div>
                  <div className="metric-column"><span className="metric-label">Avg Grade</span><span className="metric-value">{avgGrade}%</span></div>
                </div>
              </div>
              <div className="card-right-badge-bay">
                {fcsBadgePath && <img src={fcsBadgePath} alt="FCS Difficulty Badge Graphic" className="card-route-badge-image-scaled" />}
              </div>
            </div>

            {isThisRouteExplicitlyUnlocked ? (
              <button className="rg-inline-card-action-btn print-green" onClick={() => handleTokenRedemption(rawRouteId, routeTitle)}>
                PRINT RIDEGUIDE NOW ➔
              </button>
            ) : isTokenUser ? (
              <button className="rg-inline-card-action-btn unlock-verdant" disabled={isRedeeming} onClick={() => handlePrimaryCheckoutDispatch(rawRouteId, routeTitle)}>
                INSTANT UNLOCK (1 CREDIT) ➔
              </button>
            ) : (
              <button className="rg-inline-card-action-btn add-verdant" disabled={isAdding || isAlreadyInCart} onClick={handleAddToCartAction}>
                {isAlreadyInCart ? "✓ ALREADY IN CART" : isAdding ? "ADDING... ⏳" : "ADD ROUTE TO CART +"}
              </button>
            )}
          </div>
        )}

        <div className="rg-tabs-window-container">
          
          <div className="rg-storefront-tabs-nav-bar">
            <button 
              className={`rg-tab-nav-trigger-btn ${activeTab === "cart" ? "active" : ""}`}
              onClick={() => setActiveTab("cart")}
            >
              Cart ({totalCartCount})
            </button>
            {isFullyAuthenticated && (
              <button 
                className={`rg-tab-nav-trigger-btn ${activeTab === "catalog" ? "active" : ""}`}
                onClick={() => setActiveTab("catalog")}
              >
                Catalog ({activeCatalogPasses.length})
              </button>
            )}
          </div>

          <div className="rg-storefront-tab-active-content-pane">
            {activeTab === "cart" && (
              <div className="rg-persistent-cart-panel">
                {totalCartCount === 0 ? (
                  <div className="rg-cart-empty-placeholder text-deck-injection">
                    <div className="rg-horizontal-instructions-tier panel-optimized-deck">
                      <span className="rg-instructions-micro-header font-weight-heavy" style={{ display: 'block', marginBottom: '12px' }}>
                        Get Your RideGuide in 3 Easy Steps:
                      </span>
                      <span className="rg-instructions-micro-header-callout panel-empty-state-sub-caption">
                        Select any route line on the map to begin. →
                      </span>
                      <div className="rg-horizontal-steps-row vertical-stack-fallback-panel">
                        <div className="rg-step-column-item">
                          <span className="rg-step-badge-number">1</span>
                          <p className="rg-step-item-text">
                            <strong>Filter tracks</strong> by class, mileage, or average trail grading.
                          </p>
                        </div>
                        <div className="rg-step-column-item" style={{ marginTop: '4px' }}>
                          <span className="rg-step-badge-number">2</span>
                          <p className="rg-step-item-text">
                            <strong>Select a route</strong> by clicking list cards or lines on the map canvas.
                          </p>
                        </div>
                        <div className="rg-step-column-item" style={{ marginTop: '4px' }}>
                          <span className="rg-step-badge-number">3</span>
                          <p className="rg-step-item-text">
                            <strong>Unlock maps</strong> to instantly download continuous telemetry profiles.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rg-cart-items-list-container">
                    {visibleCartItems.map((item: CartItem) => {
                      const targetId = item.routeId || "";
                      return (
                        <div key={item.id} className="rg-cart-row-item">
                          <div className="rg-cart-item-meta-left">
                            <span className="rg-cart-item-title-text">{item.title}</span>
                            <span className="rg-cart-item-sub-metrics">{item.distance || "Premium Data"}</span>
                          </div>
                          <div className="rg-cart-item-actions-right">
                            {isTokenUser ? (
                              <button 
                                className="rg-cart-inline-unlock-btn"
                                disabled={isRedeeming}
                                onClick={() => handlePrimaryCheckoutDispatch(targetId, item.title)}
                              >
                                Unlock
                              </button>
                            ) : (
                              <span className="rg-cart-item-price-tag">
                                ${item.price.toFixed(2)}
                              </span>
                            )}
                            <button className="rg-cart-remove-line-item-btn" onClick={() => removeCartItem && removeCartItem(item.id)} title="Remove route from cart">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === "catalog" && isFullyAuthenticated && (
              <div className="rg-catalog-vault-panel">
                {activeCatalogPasses.length === 0 ? (
                  <div className="rg-catalog-empty-placeholder">
                    <span>No active passes owned. Completed checkouts or spent credits populate here for 7 days.</span>
                  </div>
                ) : (
                  <div className="rg-catalog-items-list-container">
                    {activeCatalogPasses.map((pass) => {
                      const matchedMatch = allRoutes.find((r: any) => {
                        const id = String(r.properties?.profile_id || r.id || r.properties?.id || r.ID || "");
                        return id === pass.routeId;
                      });

                      const displayTitle = pass.name || 
                                           matchedMatch?.properties?.NAME || 
                                           matchedMatch?.title || 
                                           (rawRouteId === pass.routeId ? routeTitle : `Route Access #${pass.routeId}`);
                      
                      const isCurrentlyHovered = pass.routeId === activeCatalogHoverId;

                      return (
                        <div 
                          key={pass.routeId} 
                          className="rg-catalog-row-item"
                          onMouseEnter={() => setActiveCatalogHoverId(pass.routeId)}
                          onMouseLeave={() => setActiveCatalogHoverId(null)}
                        >
                          <div className="rg-catalog-item-meta-left">
                            <span 
                              className="card-route-title catalog-vault-item-title-text"
                              style={{ 
                                color: isCurrentlyHovered ? "#f59e0b" : "#334155",
                                margin: 0,
                                fontSize: "10.5px",
                                fontWeight: 800,
                                display: "block",
                                textTransform: "uppercase",
                                fontFamily: "Montserrat, sans-serif"
                              }}
                            >
                              {displayTitle}
                            </span>
                            <span className="rg-catalog-item-countdown-tag">⏰ {pass.daysLeft} days remaining</span>
                          </div>
                          <div className="rg-catalog-item-actions-right">
                            <button 
                              className="rg-catalog-inline-print-btn" 
                              disabled={isRedeeming} 
                              onClick={() => handleTokenRedemption(pass.routeId, displayTitle)}
                            >
                              Print ➔
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {activeTab === "catalog" ? (
        <button disabled={true} className="rg-premium-buy-btn mod-disabled">
          Click the Print Link Above to Get Your Guide
        </button>
      ) : (
        <button 
          onClick={() => handlePrimaryCheckoutDispatch()} 
          disabled={totalCartCount === 0} 
          className={`rg-premium-buy-btn ${totalCartCount > 0 ? "mod-ready" : "mod-disabled"}`}
        >
          {totalCartCount === 0 
            ? "SELECT ROUTE TO CHECKOUT" 
            : !isFullyAuthenticated 
              ? "SIGN IN TO CHECKOUT ➔" 
              : isTokenUser 
                ? "MANAGE & UNLOCK WITH CREDITS ➔" 
                : "PROCEED TO CHECKOUT ➔"}
        </button>
      )}

      <span className="rg-disclaimer-note">
        By purchasing, you agree to our terms and conditions.<br />
      </span>

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
    </div>
  );
}