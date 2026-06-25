/* src/components/CartDropdown.tsx */
import { useState } from "react";
import { useShopifyAuth } from "../store/ShopifyAuthContext"; 
import { useShopifyCart } from "../store/ShopifyCartContext";
import "../styles/CartDropdown.css"; 

interface CartDropdownProps {
  isOpen: boolean; 
  allRoutes?: any[]; 
}

export default function CartDropdown({ isOpen, allRoutes = [] }: CartDropdownProps) {
  const { customer, isAuthenticated, refreshProfile } = useShopifyAuth();
  const { cartItems, cartSubtotal, checkoutUrl, removeCartItem } = useShopifyCart();

  const [activeTab, setActiveTab] = useState<"cart" | "catalog">("cart");
  const [activeCatalogHoverId, setActiveCatalogHoverId] = useState<string | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);

  const isFullyAuthenticated = isAuthenticated && customer !== null; //

  const rawUnlockedGuides = customer?.unlocked_guides || "{}";
  let unlockedMap: Record<string, any> = {}; //
  
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
    console.error("Silent parse catch fallback invoked inside dropdown:", e);
    unlockedMap = {};
  }

  const currentTimestamp = Date.now(); //
  
  // 🎯 DEFENSIVE DICTIONARY EXTRACTORS: Safely unwraps nested shapes
  const getRouteExpiry = (id: string): number => {
    const entry = unlockedMap[id];
    if (!entry) return 0;
    if (typeof entry === "object" && entry !== null) return Number(entry.expiresAt || 0);
    return Number(entry || 0);
  };

  const tokenBalance = customer?.tokens || 0; //
  const hasActivePass = customer?.passExpiresAt 
    ? new Date() < new Date(customer.passExpiresAt) 
    : false; //

  const hasTokens = tokenBalance > 0; //
  const isTokenUser = isFullyAuthenticated && hasTokens; //

  // 🎯 VISIBLE LINE ITEM MATRIX: Filters out assets that are already paid or unlocked
  const visibleCartItems = cartItems.filter((item: any) => {
    const targetId = item.routeId || "";
    const isLineRouteUnlocked = hasActivePass || (getRouteExpiry(targetId) > currentTimestamp);
    return !isLineRouteUnlocked;
  });

  const totalCartCount = visibleCartItems.length; //

  // 🎯 SCHEMATIC OBJECT DICTIONARY PARSING
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

    try {
      const response = await fetch(`${API_BASE_TARGET}/api/tokens/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: customer.id, routeId: targetId, routeTitle: targetTitle })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Server rejected balance transaction.");
      
      if (refreshProfile) await refreshProfile();
      if (data.success && data.downloadUrl) window.open(data.downloadUrl, "_blank");

    } catch (err: any) {
      alert(`Transaction Failed: ${err.message}`);
    } finally {
      setIsRedeeming(false);
    }
  };

  // 🎯 BATCH REDEMPTION ENGINE: Iterates through current selections using token ledger rules
  const handleBatchTokenRedemption = async () => {
    if (isRedeeming || !customer || totalCartCount === 0) return;

    const confirmPrompt = `Use ${totalCartCount} credit tokens to instantly unlock all selected routes in your cart?`;
    if (!window.confirm(confirmPrompt)) return;

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

      if (refreshProfile) await refreshProfile();
      setActiveTab("catalog");
      alert(`🎉 Successfully activated ${processedCount} new RideGuides inside your vault! Use the individual row print triggers to generate your PDFs.`);
    } catch (err: any) {
      alert(`Batch Generation Encountered an Error: ${err.message}`);
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleCheckoutRedirect = () => {
    if (checkoutUrl) {
      window.open(checkoutUrl, "_blank"); 
    }
  };

  return (
    <div className={`rg-cart-dropdown-popover ${isOpen ? "rg-cart-reveal" : ""}`}>
      
      <div className="rg-cart-dropdown-header">
        <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
              <div className="rg-cart-dropdown-header-title" style={{ textAlign: "left", marginTop: "2px" }}>
              {activeTab === "cart" ? "Selection Inventory" : "Your Activated Guides"}
            </div>
          </div>
          {isFullyAuthenticated && !hasActivePass && (
            <span style={{ fontSize: "11px", backgroundColor: "rgba(255, 255, 255, 0.12)", padding: "4px 10px", borderRadius: "20px", fontWeight: "bold", color: "#f59e0b", border: "1px solid rgba(255, 255, 255, 0.08)", textTransform: "uppercase", letterSpacing: "0.4px" }}>
              🎫 {tokenBalance} Credits
            </span>
          )}
        </div>
      </div>

      <div className="rg-cart-dropdown-body">
        
        <div className="rg-storefront-tabs-nav-bar" style={{ margin: "0 0 12px 0", width: "100%" }}>
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

        {activeTab === "cart" && (
          <>
            <div className="rg-cart-scroll-container">
              {totalCartCount === 0 ? (
                <div className="rg-cart-empty-state">
                  Your cart is empty. Select a route to add!
                </div>
              ) : (
                visibleCartItems.map((item: any) => (
                  <div key={item.id} className="rg-cart-item-row-card">
                    <div className="rg-cart-item-left-group">
                      {item.fcsLabel && (
                        <img 
                          src={`/images/badges/fcs/fcs-badge-${item.fcsLabel.toLowerCase()}.png`} 
                          alt="fcs classification badge" 
                          className="rg-cart-item-badge-left"
                          onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                        />
                      )}
                      <div>
                        <div className="rg-cart-item-title">{item.title}</div>
                        <div className="rg-cart-item-subtitle">{item.distance}</div>
                      </div>
                    </div>

                    <div className="rg-cart-item-right-group">
                      <div className="rg-cart-item-price">
                        ${item.price.toFixed(2)}
                      </div>
                      <button
                        onClick={() => removeCartItem?.(item.id)}
                        className="rg-cart-item-remove-btn"
                        aria-label={`Remove ${item.title} from inventory selection`}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {!isFullyAuthenticated && totalCartCount > 0 && (
              <div style={{ padding: "10px 0 0 0", fontSize: "10px", color: "#b45309", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.3px", textAlign: "center", fontFamily: "sans-serif", borderTop: "1px dashed rgba(15, 23, 42, 0.1)", marginTop: "10px" }}>
                ⚠️ Guest Mode: Login Required at Checkout
              </div>
            )}

            {totalCartCount > 0 && (
              <div className="rg-cart-calculation-summary-block">
                <div className="rg-cart-subtotal-row">
                  <span className="rg-cart-subtotal-label">
                    {isTokenUser ? "Required Cost:" : "Total Subtotal:"}
                  </span>
                  <span className="rg-cart-subtotal-value">
                    {isTokenUser ? `${totalCartCount} Credits` : `$${cartSubtotal.toFixed(2)}`}
                  </span>
                </div>
                
                {/* 🎯 CONDITIONAL CTA WORKFLOW ELEMENT: Routes execution paths dynamically */}
                {isTokenUser ? (
                  <button 
                    onClick={handleBatchTokenRedemption}
                    disabled={isRedeeming}
                    className="rg-cart-checkout-cta-btn"
                    style={{ backgroundColor: "#16a34a" }} // Green accent vector matching the sidebar instant-unlock buttons
                  >
                    {isRedeeming ? "PROCESSING VAULT... ⏳" : `UNLOCK WITH ${totalCartCount} CREDITS ➔`}
                  </button>
                ) : (
                  <button onClick={handleCheckoutRedirect} className="rg-cart-checkout-cta-btn">
                    PROCEED TO CHECKOUT ➔
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {activeTab === "catalog" && isFullyAuthenticated && (
          <div className="rg-cart-scroll-container" style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            {activeCatalogPasses.length === 0 ? (
              <div className="rg-cart-empty-state" style={{ padding: "30px 12px" }}>
                No active passes owned. Spent tokens populate here for 7 days.
              </div>
            ) : (
              activeCatalogPasses.map((pass) => {
                const matchedMatch = allRoutes.find((r: any) => {
                  const id = String(r.properties?.profile_id || r.id || r.properties?.id || r.ID || "");
                  return id === pass.routeId;
                });

                const displayTitle = pass.name || 
                                     matchedMatch?.properties?.NAME || 
                                     matchedMatch?.title || 
                                     `Route Access #${pass.routeId}`;
                
                const isCurrentlyHovered = pass.routeId === activeCatalogHoverId;

                return (
                  <div 
                    key={pass.routeId} 
                    className="rg-catalog-row-item"
                    onMouseEnter={() => setActiveCatalogHoverId(pass.routeId)}
                    onMouseLeave={() => setActiveCatalogHoverId(null)}
                    style={{ padding: "8px 10px" }}
                  >
                    <div className="rg-catalog-item-meta-left">
                      <h3 
                        className="card-route-title"
                        style={{ 
                          color: isCurrentlyHovered ? "#f59e0b" : "#334155",
                          margin: 0,
                          fontSize: "10px",
                          fontWeight: 800,
                          textTransform: "uppercase",
                          fontFamily: "Montserrat, sans-serif"
                        }}
                      >
                        {displayTitle}
                      </h3>
                      <span className="rg-catalog-item-countdown-tag">⏰ {pass.daysLeft} days left</span>
                    </div>
                    <div className="rg-catalog-item-actions-right">
                      <button 
                        className="rg-catalog-inline-print-btn" 
                        disabled={isRedeeming} 
                        onClick={() => handleTokenRedemption(pass.routeId, displayTitle)}
                        style={{ padding: "3px 8px", fontSize: "8.5px" }}
                      >
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
    </div>
  );
}