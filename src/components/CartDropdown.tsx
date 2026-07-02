/* src/components/CartDropdown.tsx */
import { useState } from "react";
import { useShopifyAuth } from "../store/ShopifyAuthContext"; 
import { useShopifyCart } from "../store/ShopifyCartContext";
import TokenUpsellModal from "./TokenUpsellModal"; 
import TransactionOverlay, { type TransactionState } from "./TransactionOverlay";
import "../styles/CartDropdown.css"; 

interface CartDropdownProps {
  isOpen: boolean; 
  allRoutes?: any[]; 
}

export default function CartDropdown({ isOpen, allRoutes = [] }: CartDropdownProps) {
  const { customer, isAuthenticated, refreshProfile, login } = useShopifyAuth();
  const { cartItems, cartSubtotal, checkoutUrl, removeCartItem } = useShopifyCart();

  const [activeTab, setActiveTab] = useState<"cart" | "catalog">("cart");
  const [activeCatalogHoverId, setActiveCatalogHoverId] = useState<string | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);
  
  const [isUpsellOpen, setIsUpsellOpen] = useState(false);

  // 🎯 CENTRALIZED INTERCEPT WORKFLOW ENGINE STATE
  const [transactionState, setTransactionState] = useState<TransactionState | null>(null);

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
    if (typeof entry === "object" && entry !== null) return Number(entry.expiresAt || 0);
    return Number(entry || 0);
  };

  const tokenBalance = customer?.tokens || 0; 
  const hasActivePass = customer?.passExpiresAt ? new Date() < new Date(customer.passExpiresAt) : false; 
  const hasTokens = tokenBalance > 0; 
  const isTokenUser = isFullyAuthenticated && hasTokens; 

  const visibleCartItems = cartItems.filter((item: any) => {
    const targetId = item.routeId || "";
    const isLineRouteUnlocked = hasActivePass || (getRouteExpiry(targetId) > currentTimestamp);
    return !isLineRouteUnlocked;
  });

  const totalCartCount = visibleCartItems.length; 

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

  const handleTokenRedemption = async (targetId: string, targetTitle: string) => {
    if (isRedeeming || !customer) return;
    const API_BASE_TARGET = window.location.hostname === "localhost" ? "http://localhost:5000" : "";
    setIsRedeeming(true);

    // 🎯 ROUTE LOADING STATE TO OVERLAY
    setTransactionState({
      status: 'processing',
      type: 'single_unlock',
      title: 'Deducting Wallet Balance',
      message: `Communicating coordinates with secure token vault to activate: "${targetTitle}"...`
    });

    try {
      const response = await fetch(`${API_BASE_TARGET}/api/tokens/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: customer.id, routeId: targetId, routeTitle: targetTitle })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Server rejected balance transaction.");
      
      if (refreshProfile) await refreshProfile();
      setIsUpsellOpen(false);

      // 🎯 ROUTE SUCCESS TO OVERLAY
      setTransactionState({
        status: 'success',
        type: 'single_unlock',
        title: 'RideGuide Unlocked',
        message: `Redeemed 1 credit code asset. "${targetTitle}" has been provisioned inside your permanent vault file array layout.`,
        meta: { downloadUrl: data.downloadUrl }
      });

      if (data.success && data.downloadUrl) window.open(data.downloadUrl, "_blank");

    } catch (err: any) {
      setTransactionState({
        status: 'failure',
        type: 'single_unlock',
        title: 'Transaction Interrupted',
        message: err.message || 'Verification payload transaction rejected.'
      });
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleBatchTokenRedemption = async () => {
    if (isRedeeming || !customer || totalCartCount === 0) return;
    setIsRedeeming(true);
    const API_BASE_TARGET = window.location.hostname === "localhost" ? "http://localhost:5000" : "";
    let processedCount = 0;

    // 🎯 ROUTE PROCESSING BATCH STATE TO OVERLAY
    setTransactionState({
      status: 'processing',
      type: 'batch_unlock',
      title: 'Fulfilling Inventory Selection',
      message: `Running sequence array conversions to activate ${totalCartCount} tracks from your credit balance...`
    });

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

      if (refreshProfile) await refreshProfile();
      setActiveTab("catalog");
      setIsUpsellOpen(false);

      // 🎯 ROUTE BATCH SUCCESS TO OVERLAY
      setTransactionState({
        status: 'success',
        type: 'batch_unlock',
        title: 'Batch Generation Finalized',
        message: `Successfully provisioned ${processedCount} maps! All elements have been dropped cleanly inside your Catalog tab view container slots.`
      });

    } catch (err: any) {
      setTransactionState({
        status: 'failure',
        type: 'batch_unlock',
        title: 'Batch Processing Terminated',
        message: err.message || 'Array processing structural thread failure.'
      });
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleCheckoutRedirect = () => {
    if (totalCartCount === 0) return;
    if (!isFullyAuthenticated) {
      login();
      return;
    }
    const hasBundleInCart = cartItems.some((item: any) => item.routeId === "TOKEN_BUNDLE");
    if (hasBundleInCart) {
      if (checkoutUrl) window.open(checkoutUrl, "_blank"); 
      return;
    }
    setIsUpsellOpen(true);
  };

  const handleBypassCheckout = () => {
    setIsUpsellOpen(false);
    if (checkoutUrl) window.open(checkoutUrl, "_blank"); 
  };

  return (
    <div className={`rg-cart-dropdown-popover ${isOpen ? "rg-cart-reveal" : ""}`}>
      <div className="rg-cart-dropdown-header">
        <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="rg-cart-dropdown-header-title" style={{ textAlign: "left", marginTop: "2px" }}>
            {activeTab === "cart" ? "Selection Inventory" : "Your Activated Guides"}
          </div>
          {isFullyAuthenticated && !hasActivePass && (
            <span style={{ fontSize: "11px", backgroundColor: "rgba(255, 255, 255, 0.12)", padding: "4px 10px", borderRadius: "20px", fontWeight: "bold", color: "#f59e0b", border: "1px solid rgba(255, 255, 255, 0.08)", textTransform: "uppercase" }}>
              🎫 {tokenBalance} Credits
            </span>
          )}
        </div>
      </div>

      <div className="rg-cart-dropdown-body">
        <div className="rg-storefront-tabs-nav-bar" style={{ margin: "0 0 12px 0", width: "100%" }}>
          <button className={`rg-tab-nav-trigger-btn ${activeTab === "cart" ? "active" : ""}`} onClick={() => setActiveTab("cart")}>
            Cart ({totalCartCount})
          </button>
          {isFullyAuthenticated && (
            <button className={`rg-tab-nav-trigger-btn ${activeTab === "catalog" ? "active" : ""}`} onClick={() => setActiveTab("catalog")}>
              Catalog ({activeCatalogPasses.length})
            </button>
          )}
        </div>

        {activeTab === "cart" && (
          <>
            <div className="rg-cart-scroll-container">
              {totalCartCount === 0 ? (
                <div className="rg-cart-empty-state">Your cart is empty. Select a route to add!</div>
              ) : (
                visibleCartItems.map((item: any) => (
                  <div key={item.id} className="rg-cart-item-row-card">
                    <div className="rg-cart-item-left-group">
                      {item.fcsLabel && (
                        <img src={`/images/badges/fcs/fcs-badge-${item.fcsLabel.toLowerCase()}.png`} alt="fcs classification" className="rg-cart-item-badge-left" onError={(e) => { (e.target as HTMLElement).style.display = "none"; }} />
                      )}
                      <div>
                        <div className="rg-cart-item-title">{item.title}</div>
                        <div className="rg-cart-item-subtitle">{item.distance}</div>
                      </div>
                    </div>
                    <div className="rg-cart-item-right-group">
                      <div className="rg-cart-item-price">${item.price.toFixed(2)}</div>
                      <button onClick={() => removeCartItem?.(item.id)} className="rg-cart-item-remove-btn">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {!isFullyAuthenticated && totalCartCount > 0 && (
              <div style={{ padding: "10px 0 0 0", fontSize: "10px", color: "#b45309", fontWeight: "700", textTransform: "uppercase", textAlign: "center", marginTop: "10px" }}>
                ⚠️ Guest Mode: Login Required at Checkout
              </div>
            )}

            {totalCartCount > 0 && (
              <div className="rg-cart-calculation-summary-block">
                <div className="rg-cart-subtotal-row">
                  <span className="rg-cart-subtotal-label">{isTokenUser ? "Required Cost:" : "Total Subtotal:"}</span>
                  <span className="rg-cart-subtotal-value">{isTokenUser ? `${totalCartCount} Credits` : `$${cartSubtotal.toFixed(2)}`}</span>
                </div>
                <button onClick={handleCheckoutRedirect} className="rg-cart-checkout-cta-btn">
                  {!isFullyAuthenticated ? "SIGN IN TO CHECKOUT ➔" : isTokenUser ? "MANAGE & UNLOCK WITH CREDITS ➔" : "PROCEED TO CHECKOUT ➔"}
                </button>
              </div>
            )}
          </>
        )}

        {activeTab === "catalog" && isFullyAuthenticated && (
          <div className="rg-cart-scroll-container" style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            {activeCatalogPasses.length === 0 ? (
              <div className="rg-cart-empty-state" style={{ padding: "30px 12px" }}>No active passes owned. Spent tokens populate here for 7 days.</div>
            ) : (
              activeCatalogPasses.map((pass) => {
                const matchedMatch = allRoutes.find((r: any) => {
                  const id = String(r.properties?.profile_id || r.id || r.properties?.id || r.ID || "");
                  return id === pass.routeId;
                });
                const displayTitle = pass.name || matchedMatch?.properties?.NAME || matchedMatch?.title || `Route Access #${pass.routeId}`;
                const isCurrentlyHovered = pass.routeId === activeCatalogHoverId;

                return (
                  <div key={pass.routeId} className="rg-catalog-row-item" onMouseEnter={() => setActiveCatalogHoverId(pass.routeId)} onMouseLeave={() => setActiveCatalogHoverId(null)} style={{ padding: "8px 10px" }}>
                    <div className="rg-catalog-item-meta-left">
                      <h3 className="card-route-title" style={{ color: isCurrentlyHovered ? "#f59e0b" : "#334155", margin: 0, fontSize: "10px", fontWeight: 800, textTransform: "uppercase", fontFamily: "Montserrat, sans-serif" }}>
                        {displayTitle}
                      </h3>
                      <span className="rg-catalog-item-countdown-tag">⏰ {pass.daysLeft} days left</span>
                    </div>
                    <div className="rg-catalog-item-actions-right">
                      <button className="rg-catalog-inline-print-btn" disabled={isRedeeming} onClick={() => handleTokenRedemption(pass.routeId, displayTitle)} style={{ padding: "3px 8px", fontSize: "8.5px" }}>
                        Print ➔
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      <TokenUpsellModal 
        isOpen={isUpsellOpen}
        onClose={() => setIsUpsellOpen(false)}
        onBypass={handleBypassCheckout}
        targetRoute={null}
        isTokenUser={isTokenUser}
        tokenBalance={tokenBalance}
        onRedeemSingle={handleTokenRedemption}
        onRedeemBatch={handleBatchTokenRedemption}
        isMutating={isRedeeming}
      />

      {/* 🎯 DROPDOWN CONNECTOR BIND FOR OVERLAY LIFE-CYCLES */}
      <TransactionOverlay state={transactionState} onClose={() => setTransactionState(null)} />
    </div>
  );
}