/* src/components/TokenUpsellModal.tsx */
import { useEffect, useRef, useState } from "react";
import { useShopifyCart } from "../store/ShopifyCartContext";
import { useShopifyAuth } from "../store/ShopifyAuthContext";
import "../styles/TokenUpsellModal.css";

interface TokenUpsellModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBypass: () => void;
  targetRoute: { id: string; title: string } | null;
  isTokenUser: boolean;
  tokenBalance: number;
  onRedeemSingle: (targetId: string, targetTitle: string) => Promise<void>;
  onRedeemBatch: () => Promise<void>;
  isMutating: boolean; // Represents backend token redemption status
}

interface UpsellTier {
  id: string;
  variantId: string;
  title: string;
  price: number;
  perTrackPrice: string;
  savingsLabel: string;
  badgeText?: string;
}

export default function TokenUpsellModal({
  isOpen,
  onClose,
  onBypass,
  targetRoute,
  isTokenUser,
  tokenBalance,
  onRedeemSingle,
  onRedeemBatch,
  isMutating
}: TokenUpsellModalProps) {
  const { customer } = useShopifyAuth();
  const { cartItems, removeCartItem, addRouteToCart, checkoutUrl } = useShopifyCart();
  
  // Local processing state specifically for handling cart-to-bundle transitions
  const [isUpgrading, setIsUpgrading] = useState(false);
  
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);

  // 🎯 FIXED: Embedded raw variant numbers directly inside legitimate Shopify GraphQL GID schemas
  const UPSELL_TIERS: UpsellTier[] = [
    {
      id: "3-pack",
      variantId: "gid://shopify/ProductVariant/51619975069916",
      title: "Starter 3-Pack",
      price: 14.99,
      perTrackPrice: "$5.00",
      savingsLabel: "Saves 28%",
      badgeText: "Popular"
    },
    {
      id: "5-pack",
      variantId: "gid://shopify/ProductVariant/51620055089372",
      title: "Explorer 5-Pack",
      price: 19.99,
      perTrackPrice: "$4.00",
      savingsLabel: "Saves 42%",
      badgeText: "Best Value"
    },
    {
      id: "15-pack",
      variantId: "gid://shopify/ProductVariant/51620150837468",
      title: "Backcountry Master 15-Pack",
      price: 34.99,
      perTrackPrice: "$2.33",
      savingsLabel: "Saves 66%",
      badgeText: "Ultimate Access"
    }
  ];

  // Derive cash-only items to calculate current subtotal and identify tracks to clear
  const currentTimestamp = Date.now();
  const cashCartItems = cartItems.filter((item: any) => {
    const targetId = item.routeId || "";
    const rawUnlocked = customer?.unlocked_guides || "{}";
    let parsedMap: Record<string, any> = {};
    try {
      parsedMap = typeof rawUnlocked === "string" ? JSON.parse(rawUnlocked) : rawUnlocked;
      if (typeof parsedMap === "string") parsedMap = JSON.parse(parsedMap);
    } catch {
      parsedMap = {};
    }
    
    const entry = parsedMap[targetId];
    const expiresAt = typeof entry === "object" && entry !== null ? Number(entry.expiresAt || 0) : Number(entry || 0);
    const hasActivePass = customer?.passExpiresAt ? new Date() < new Date(customer.passExpiresAt) : false;
    
    const isLineRouteUnlocked = hasActivePass || (expiresAt > currentTimestamp);
    return !isLineRouteUnlocked && targetId !== "TOKEN_BUNDLE";
  });

  const totalCashCount = cashCartItems.length;
  const computedCashSubtotal = (totalCashCount * 6.99).toFixed(2);

  // Focus Trap and Escape Key Side-Effects
  useEffect(() => {
    if (isOpen) {
      triggerElementRef.current = document.activeElement as HTMLElement;
      if (modalRef.current) {
        modalRef.current.focus();
      }
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      if (triggerElementRef.current) {
        triggerElementRef.current.focus();
      }
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key === "Tab" && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            event.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            event.preventDefault();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleUpgradeAction = async (tier: UpsellTier) => {
    if (isUpgrading || isMutating) return;
    setIsUpgrading(true);

    console.group("🛒 [SHOPIFY BUNDLE UPGRADE PIPELINE]");
    console.log("1. Target Tier Selection:", tier);
    console.log("2. Staged Cash Items to Remove:", cashCartItems);

    try {
      // 1. Flush all baseline cash tracks from cart layout context sequentially
      for (const item of cashCartItems) {
        console.log(`   -> Attempting removal of cash item: "${item.title}" (Line ID: ${item.id})`);
        if (removeCartItem) {
          const removed = await removeCartItem(item.id);
          console.log(`   -> Shopify removal status for "${item.title}":`, removed ? "✅ Success" : "❌ Failed");
        }
      }

      // 2. Insert designated Shopify Credit Pack Token Variant Entry
      console.log(`3. Sending Bundle GID to Storefront API: ${tier.variantId}`);
      let mutationSuccess = false;
      if (addRouteToCart) {
        mutationSuccess = await addRouteToCart(
          tier.variantId,
          "TOKEN_BUNDLE",
          tier.title,
          `${tier.badgeText || "Credit Bundle Package"}`,
          "premium"
        );
      }

      console.log("4. Shopify Bundle Injection Result:", mutationSuccess ? "✅ Success" : "❌ Denied");
      console.log("5. Evaluated Checkout URL in Context:", checkoutUrl);

      // 3. Wrapped downstream redirect in a defensive check
      if (mutationSuccess && checkoutUrl) {
        console.log("🚀 PIPELINE COMPLETE: Opening secure checkout tab layout.");
        console.groupEnd();
        
        window.open(checkoutUrl, "_blank");
        onClose();
      } else {
        throw new Error(`Mutation succeeded layout but checkoutUrl is missing or invalid. Success flag: ${mutationSuccess}`);
      }
    } catch (error: any) {
      console.error("❌ CRITICAL ERROR IN UPGRADE PIPELINE:", error);
      console.groupEnd();
      
      alert("There was an issue processing your upgrade selection. Please try again or checkout with individual items.");
      window.location.reload();
    } finally {
      setIsUpgrading(false);
    }
  };

  const isProcessingAnyAction = isMutating || isUpgrading;

  return (
    <div className="rg-upsell-backdrop" onClick={onClose} role="presentation">
      <div 
        className="rg-upsell-container"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rg-upsell-title"
        aria-describedby="rg-upsell-description"
        tabIndex={-1}
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          className="rg-upsell-close-x" 
          onClick={onClose} 
          aria-label="Close promotion dialog"
          disabled={isProcessingAnyAction}
        >
          &times;
        </button>

        {isTokenUser ? (
          <div className="rg-upsell-header-block" style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "20px" }}>
            <span className="rg-upsell-badge-pill" style={{ backgroundColor: "#dcfce7", color: "#15803d" }}>
              🎫 Wallet Balance: {tokenBalance} Credits
            </span>
            
            {targetRoute ? (
              <>
                <h2 id="rg-upsell-title" className="rg-upsell-main-title">Confirm RideGuide Activation</h2>
                <p id="rg-upsell-description" className="rg-upsell-subcaption">
                  You are about to use <strong className="rg-highlight-text">1 token credit</strong> to unlock continuous telemetry mapping for: <br />
                  <strong style={{ color: "#0f172a", fontSize: "16px" }}>"{targetRoute.title}"</strong>
                </p>
                <button
                  onClick={() => onRedeemSingle(targetRoute.id, targetRoute.title)}
                  disabled={isProcessingAnyAction}
                  className="rg-upsell-tier-cta-action-btn"
                  style={{ maxWidth: "320px", margin: "20px auto 0 auto", backgroundColor: "#16a34a", fontSize: "14px", padding: "12px" }}
                >
                  {isProcessingAnyAction ? "Unlocking Vault... ⏳" : "Confirm Instant Unlock ➔"}
                </button>
              </>
            ) : (
              <>
                <h2 id="rg-upsell-title" className="rg-upsell-main-title">Batch Credit Activation</h2>
                <p id="rg-upsell-description" className="rg-upsell-subcaption">
                  You have <strong className="rg-highlight-text">{totalCashCount} tracks</strong> waiting in your cart inventory selection.
                </p>
                <button
                  onClick={onRedeemBatch}
                  disabled={isProcessingAnyAction || totalCashCount === 0}
                  className="rg-upsell-tier-cta-action-btn"
                  style={{ maxWidth: "320px", margin: "20px auto 0 auto", backgroundColor: "#16a34a", fontSize: "14px", padding: "12px" }}
                >
                  {isProcessingAnyAction ? "Processing Batch... ⏳" : `Unlock All (${totalCashCount} Credits) ➔`}
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="rg-upsell-header-block">
            <span className="rg-upsell-badge-pill">Smart Rider Deal</span>
            <h2 id="rg-upsell-title" className="rg-upsell-main-title">Unlock More For Less Money</h2>
            <p id="rg-upsell-description" className="rg-upsell-subcaption">
              Your current selection costs <strong className="rg-highlight-text">${computedCashSubtotal}</strong> for {totalCashCount} individual track{totalCashCount > 1 ? "s" : ""}. Upgrade to a bundle to instantly unlock your tracks and keep leftover credits for future maps.
            </p>
          </div>
        )}

        <div className="rg-upsell-matrix-heading" style={{ textAlign: "center", margin: isTokenUser ? "24px 0 12px 0" : "0 0 16px 0", fontSize: "12px", fontWeight: 800, textTransform: "uppercase", color: "#64748b", letterSpacing: "0.5px" }}>
          {isTokenUser ? "Need more tokens? Purchase bundle packs below:" : "Compare and Choose Your Option:"}
        </div>

        <div className="rg-upsell-matrix-grid">
          {!isTokenUser && (
            <div className="rg-upsell-tier-card mod-current-baseline">
              <div className="rg-upsell-card-inner">
                <span className="rg-upsell-tier-label">As-Staged Selection</span>
                <div className="rg-upsell-price-callout">${computedCashSubtotal}</div>
                <span className="rg-upsell-math-subtext">$6.99 per single track</span>
                <span className="rg-upsell-savings-tag mod-neutral">Standard Price</span>
              </div>
            </div>
          )}

          {UPSELL_TIERS.map((tier) => (
            <div key={tier.id} className="rg-upsell-tier-card mod-bundle-premium" style={{ gridColumn: isTokenUser ? "span 1" : undefined }}>
              {tier.badgeText && (
                <span className="rg-upsell-card-ribbon-tag">{tier.badgeText}</span>
              )}
              <div className="rg-upsell-card-inner">
                <span className="rg-upsell-tier-label">{tier.title}</span>
                <div className="rg-upsell-price-callout">${tier.price.toFixed(2)}</div>
                <span className="rg-upsell-math-subtext">~{tier.perTrackPrice} per track telemetry</span>
                <span className="rg-upsell-savings-tag mod-active-green">{tier.savingsLabel}</span>
                
                <button
                  onClick={() => handleUpgradeAction(tier)}
                  className="rg-upsell-tier-cta-action-btn"
                  disabled={isProcessingAnyAction}
                >
                  {isUpgrading ? "Adding..." : "Buy Pack ➔"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {!isTokenUser && (
          <div className="rg-upsell-footer-actions-tray">
            <button 
              onClick={onBypass} 
              className="rg-upsell-dismiss-bypass-btn"
              disabled={isProcessingAnyAction}
            >
              No thanks, proceed with individual tracks (${computedCashSubtotal})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}