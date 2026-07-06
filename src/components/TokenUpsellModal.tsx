/* src/components/TokenUpsellModal.tsx */
import { useEffect, useRef, useState } from "react";
import { useShopifyCart } from "../store/ShopifyCartContext";
import { useShopifyAuth } from "../store/ShopifyAuthContext";
import TacticalLeadForm from "./TacticalLeadForm"; 
import "../styles/TokenUpsellModal.css";

const DEV_PREVIEW_MODE = false;

interface TokenUpsellModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBypass: () => void;
  targetRoute: { id: string; title: string } | null;
  isTokenUser: boolean;
  tokenBalance: number;
  onRedeemSingle: (targetId: string, targetTitle: string) => Promise<void>;
  onRedeemBatch: () => Promise<void>;
  isMutating: boolean; 
}

interface UpsellTier {
  id: string;
  variantId: string;
  title: string;
  price: number;
  perTrackPrice: string;
  savingsLabel: string;
  badgeText?: string;
  imageUrl: string;
}

export default function TokenUpsellModal({
  isOpen,
  onClose,
  onBypass,
  targetRoute: propTargetRoute,
  isTokenUser: propIsTokenUser,
  tokenBalance: propTokenBalance,
  onRedeemSingle,
  onRedeemBatch,
  isMutating
}: TokenUpsellModalProps) {
  const { customer } = useShopifyAuth();
  const { cartItems, removeCartItem, addRouteToCart } = useShopifyCart();
  
  const [isUpgrading, setIsUpgrading] = useState(false);
  
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);

  const UPSELL_TIERS: UpsellTier[] = [
    {
      id: "3-pack",
      variantId: "gid://shopify/ProductVariant/51619975069916",
      title: "Starter 3-Pack",
      price: 14.99,
      perTrackPrice: "$5.00",
      savingsLabel: "Saves 28%",
      badgeText: "Popular",
      imageUrl: "/data/assets/rideguide-token-3.png"
    },
    {
      id: "5-pack",
      variantId: "gid://shopify/ProductVariant/51620055089372",
      title: "Explorer 5-Pack",
      price: 19.99,
      perTrackPrice: "$4.00",
      savingsLabel: "Saves 42%",
      badgeText: "Best Value",
      imageUrl: "/data/assets/rideguide-token-5.png"
    },
    {
      id: "15-pack",
      variantId: "gid://shopify/ProductVariant/51620150837468",
      title: "Backcountry Master 15-Pack",
      price: 34.99,
      perTrackPrice: "$2.33",
      savingsLabel: "Saves 66%",
      badgeText: "Ultimate Access",
      imageUrl: "/data/assets/rideguide-token-15.png"
    }
  ];

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

  const totalCashCount = DEV_PREVIEW_MODE ? 3 : cashCartItems.length;
  const computedCashSubtotal = DEV_PREVIEW_MODE ? "20.97" : (totalCashCount * 6.99).toFixed(2);
  const isTokenUser = DEV_PREVIEW_MODE ? false : propIsTokenUser; 
  const tokenBalance = DEV_PREVIEW_MODE ? 5 : propTokenBalance;
  const targetRoute = DEV_PREVIEW_MODE ? { id: "101", title: "Amicalola Falls Fire Road Overlook" } : propTargetRoute;

  useEffect(() => {
    if (isOpen) {
      triggerElementRef.current = document.activeElement as HTMLElement;
      if (modalRef.current) modalRef.current.focus();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      if (triggerElementRef.current) triggerElementRef.current.focus();
    }
    return () => { document.body.style.overflow = ""; };
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

  // 🎯 FIX D: Sequentially intercept, assign, and pass down mutation response target URL strings
  const handleUpgradeAction = async (tier: UpsellTier) => {
    if (DEV_PREVIEW_MODE) {
      alert(`Dev Mode: Simulating Shopify Checkout routing for ${tier.title}`);
      onClose();
      return;
    }
    
    if (isUpgrading || isMutating) return;
    setIsUpgrading(true);

    try {
      let liveTrackingCheckoutUrl: string | null = null;
      
      if (addRouteToCart) {
        // Step 1: Push bundle pack to inventory array and grab the initial checkout address
        liveTrackingCheckoutUrl = await addRouteToCart(
          tier.variantId,
          "TOKEN_BUNDLE",
          tier.title,
          `${tier.badgeText || "Credit Bundle Package"}`,
          "premium"
        );
      }

      if (!liveTrackingCheckoutUrl) {
        throw new Error("Shopify Storefront API rejected the variant append request.");
      }

      // Step 2: Loop through and strip single cash items, updating the URL string trace along the way
      for (const item of cashCartItems) {
        if (removeCartItem) {
          const freshUrlAfterDelete = await removeCartItem(item.id);
          if (freshUrlAfterDelete) {
            liveTrackingCheckoutUrl = freshUrlAfterDelete;
          }
        }
      }

      // Step 3: Dispatch tracking vector string to window session safely with zero race hazards
      if (liveTrackingCheckoutUrl) {
        window.open(liveTrackingCheckoutUrl, "_blank");
        onClose();
      } else {
        throw new Error("The checkout URL generated by the state engine is invalid.");
      }
    } catch (error: any) {
      console.error("❌ CRITICAL EXCEPTION IN UPGRADE WORKFLOW:", error);
      alert(`⚠️ Upgrade Interrupted:\n\n${error.message || error}\n\nYour original cart selections have been preserved.`);
    } finally {
      setIsUpgrading(false);
    }
  };

  const isProcessingAnyAction = isMutating || isUpgrading;

  return (
    <div className="rg-upsell-backdrop" onClick={onClose} role="presentation">
      <div className="rg-upsell-container" role="dialog" aria-modal="true" aria-labelledby="rg-upsell-title" aria-describedby="rg-upsell-description" tabIndex={-1} ref={modalRef} onClick={(e) => e.stopPropagation()}>
        <div className="rg-upsell-brand-banner">
          <img src="/images/logo.png" alt="RideGuide Badge" className="rg-upsell-banner-logo" onError={(e) => { (e.target as HTMLElement).style.display = "none"; }} />
          <img src="/images/RideGuide_embroid-v1.svg" alt="RideGuide Branding Script" className="rg-upsell-banner-branding-svg" onError={(e) => { (e.target as HTMLImageElement).src = "/images/RideGuide_embroid-v1.png"; }} />
        </div>

        <button className="rg-upsell-close-x" onClick={onClose} aria-label="Close promotion dialog" disabled={isProcessingAnyAction}>
          &times;
        </button>

        <div className="rg-upsell-split-layout">
          <div className="rg-upsell-left-panel-copy">
            {isTokenUser ? (
              <div className="rg-upsell-header-block id-token-header">
                <span className="rg-upsell-badge-pill">🎫 Wallet Balance: {tokenBalance} Credits</span>
                <div className="rg-upsell-left-preview-frame">
                  <img src="/images/RideGuide_Sample.png" alt="Staged Single Track Map Sheet Preview" className="rg-upsell-left-preview-media" onError={(e) => { (e.target as HTMLImageElement).src = "/data/assets/RideGuide_Sample.png"; }} />
                  <img src="/data/assets/rideguide-token.png" alt="RideGuide Credit Token Asset Overlay" className="rg-upsell-preview-token-overlay" />
                </div>
                {targetRoute ? (
                  <div className="rg-token-activation-content-block">
                    <p id="rg-upsell-description" className="rg-upsell-subcaption">
                      You are about to use <strong className="rg-highlight-text">1 token credit</strong> to unlock today's RideGuide featuring current weather and route conditions for: <br />
                      <strong className="rg-target-route-emphasis">"{targetRoute.title}"</strong>
                    </p>
                    <button onClick={() => onRedeemSingle(targetRoute.id, targetRoute.title)} disabled={isProcessingAnyAction} className="rg-upsell-instant-redeem-btn">
                      {isProcessingAnyAction ? "Unlocking Vault... ⏳" : "Confirm Instant Unlock ➔"}
                    </button>
                  </div>
                ) : (
                  <div className="rg-token-activation-content-block">
                    <h2 id="rg-upsell-title" className="rg-upsell-main-title">Batch Credit Activation</h2>
                    <p id="rg-upsell-description" className="rg-upsell-subcaption">
                      You have <strong className="rg-highlight-text">{totalCashCount} tracks</strong> waiting in your inventory selection.
                    </p>
                    <button onClick={onRedeemBatch} disabled={isProcessingAnyAction || totalCashCount === 0} className="rg-upsell-instant-redeem-btn">
                      {isProcessingAnyAction ? "Processing Batch... ⏳" : `Unlock All (${totalCashCount} Credits) ➔`}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="rg-upsell-header-block">
                <h2 id="rg-upsell-title" className="rg-upsell-main-title mod-home-punchy">Master the Backcountry.<br />Ride with Confidence.</h2>
                <div className="rg-upsell-banner-subheader">PLAN FASTER. RIDE SMARTER.</div>
                <p id="rg-upsell-description" className="rg-upsell-subcaption">
                  Stay <strong>prepared </strong> at <strong>great value</strong>, with custom <strong>route profiles</strong>, and high-accuracy <strong>terrain analytics</strong>. Your current single selection costs <strong className="rg-highlight-text">${computedCashSubtotal}</strong>. Upgrading to a <strong>bundle</strong> gives you <strong>instant access</strong> today and secures remaining credits to <strong>unlock more routes instantly</strong>.
                </p>
                {!isTokenUser && <div className="rg-upsell-matrix-heading">Compare and Choose Your Option ➔</div>}
                <div className="rg-upsell-left-bypass-holder">
                  <button onClick={onBypass} className="rg-upsell-dismiss-bypass-btn" disabled={isProcessingAnyAction}>
                    No thanks, proceed with individual tracks (${computedCashSubtotal})
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="rg-upsell-right-panel-cards">
            <div className="rg-upsell-matrix-grid">
              {isTokenUser && (
                <div className="rg-upsell-tier-card mod-matrix-heading-blank-card">
                  <div className="rg-upsell-card-inner content-vertical-centered">
                    <div className="rg-upsell-inline-matrix-heading-text">
                      Need more tokens?<br /><p>Purchase bundle packs to top off your account instantly:</p>
                    </div>
                  </div>
                </div>
              )}
              {!isTokenUser && (
                <div className="rg-upsell-tier-card mod-current-baseline">
                  <div className="rg-upsell-card-inner">
                    <span className="rg-upsell-tier-label">Price in Cart</span>
                    <div className="rg-upsell-horizontal-card-body">
                      <div className="rg-upsell-product-image-frame">
                        <img src="/images/RideGuide_Sample.png" alt="Staged Single Track Map Sheet Preview" className="rg-upsell-product-media mod-map-sheet" onError={(e) => { (e.target as HTMLImageElement).src = "/data/assets/RideGuide_Sample.png"; }} />
                      </div>
                      <div className="rg-upsell-card-meta-right">
                        <div className="rg-upsell-price-callout">${computedCashSubtotal}</div>
                        <span className="rg-upsell-math-subtext">$6.99 per single track</span>
                        <span className="rg-upsell-savings-tag mod-neutral">Standard Price</span>
                      </div>
                    </div>
                    <button disabled className="rg-upsell-tier-cta-action-btn mod-baseline-btn">Current Cart Selection</button>
                  </div>
                </div>
              )}
              {UPSELL_TIERS.map((tier) => (
                <div key={tier.id} className="rg-upsell-tier-card mod-bundle-premium">
                  {tier.badgeText && <span className="rg-upsell-card-ribbon-tag">{tier.badgeText}</span>}
                  <div className="rg-upsell-card-inner">
                    <span className="rg-upsell-tier-label">{tier.title}</span>
                    <div className="rg-upsell-horizontal-card-body">
                      <div className="rg-upsell-product-image-frame">
                        <img src={tier.imageUrl} alt={`${tier.title} Token Asset`} className="rg-upsell-product-media" onError={(e) => { (e.target as HTMLImageElement).src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%232b7cb6" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>`; }} />
                      </div>
                      <div className="rg-upsell-card-meta-right">
                        <div className="rg-upsell-price-callout">${tier.price.toFixed(2)}</div>
                        <span className="rg-upsell-math-subtext">~{tier.perTrackPrice} / track</span>
                        <span className="rg-upsell-savings-tag mod-active-green">{tier.savingsLabel}</span>
                      </div>
                    </div>
                    <button onClick={() => handleUpgradeAction(tier)} className="rg-upsell-tier-cta-action-btn" disabled={isProcessingAnyAction}>
                      {isUpgrading ? "Adding..." : "Buy Pack ➔"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <section className="lead-capture-footer mod-upsell-override" aria-label="Free Map Sample Giveaway Registration">
          <div className="funnel-container">
            <div className="capture-split-layout">
              <div className="capture-text-stack">
                <h3 className="lead-footer-headline">Get Your Free Sample Pack.</h3>
                <p className="lead-footer-subcaption">Planning your bike's maiden voyage? We've mapped out the ultimate 3-pack sample of our favorite Fire Service Road routes, perfect for eBike adventures. Instant download package delivered to your email.</p>
              </div>
              <div className="capture-form-dock">
                <TacticalLeadForm buttonLabel="Get Free Maps" sourceGroupTag="home_footer_checklist" layout="row" />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}