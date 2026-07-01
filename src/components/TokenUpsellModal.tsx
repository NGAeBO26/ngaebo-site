/* src/components/TokenUpsellModal.tsx */
import { useEffect, useRef, useState } from "react";
import { useShopifyCart } from "../store/ShopifyCartContext";
import { useShopifyAuth } from "../store/ShopifyAuthContext"; // 🎯 Added Auth Context import
import "../styles/TokenUpsellModal.css";

interface TokenUpsellModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBypass: () => void;
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

export default function TokenUpsellModal({ isOpen, onClose, onBypass }: TokenUpsellModalProps) {
  const { customer } = useShopifyAuth(); // 🎯 Extract customer for access pass validation
  const { cartItems, removeCartItem, addRouteToCart, checkoutUrl } = useShopifyCart(); // 🎯 Removed local auth helpers from here
  const [isMutating, setIsMutating] = useState(false);
  
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);

  const UPSELL_TIERS: UpsellTier[] = [
    {
      id: "3-pack",
      variantId: "51619975069916",
      title: "Starter 3-Pack",
      price: 14.99,
      perTrackPrice: "$5.00",
      savingsLabel: "Saves 28%",
      badgeText: "Popular"
    },
    {
      id: "5-pack",
      variantId: "51620055089372",
      title: "Explorer 5-Pack",
      price: 19.99,
      perTrackPrice: "$4.00",
      savingsLabel: "Saves 42%",
      badgeText: "Best Value"
    },
    {
      id: "15-pack",
      variantId: "51620150837468",
      title: "Backcountry Master 15-Pack",
      price: 34.99,
      perTrackPrice: "$2.33",
      savingsLabel: "Saves 66%",
      badgeText: "Ultimate Access"
    }
  ];

  // 🎯 Defensive parsing framework matching app specifications
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
    console.error("Silent parse catch fallback invoked inside upsell modal:", e);
    unlockedMap = {};
  }

  const getRouteExpiry = (id: string): number => {
    const entry = unlockedMap[id];
    if (!entry) return 0;
    if (typeof entry === "object" && entry !== null) return Number(entry.expiresAt || 0);
    return Number(entry || 0);
  };

  const hasActivePass = customer?.passExpiresAt 
    ? new Date() < new Date(customer.passExpiresAt) 
    : false;

  // Derive cash-only items to calculate current subtotal and identify tracks to clear
  const currentTimestamp = Date.now();
  const cashCartItems = cartItems.filter((item: any) => {
    const targetId = item.routeId || "";
    const isLineRouteUnlocked = hasActivePass || (getRouteExpiry(targetId) > currentTimestamp);
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
    if (isMutating) return;
    setIsMutating(true);

    try {
      // 1. Flush all baseline cash tracks from cart layout context sequentially
      for (const item of cashCartItems) {
        if (removeCartItem) {
          await removeCartItem(item.id);
        }
      }

      // 2. Insert designated Shopify Credit Pack Token Variant Entry
      if (addRouteToCart) {
        await addRouteToCart(
          tier.variantId,
          "TOKEN_BUNDLE",
          tier.title,
          `${tier.badgeText || "Credit Bundle Package"}`,
          "premium"
        );
      }

      // 3. Dispatch to final checkout pipeline
      if (checkoutUrl) {
        window.open(checkoutUrl, "_blank");
      }
    } catch (error) {
      console.error("Failed to execute cart mutation pipeline upgrade:", error);
      alert("There was an issue processing your upgrade selection. Please try again.");
    } finally {
      setIsMutating(false);
      onClose();
    }
  };

  return (
    <div 
      className="rg-upsell-backdrop" 
      onClick={onClose}
      role="presentation"
    >
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
          disabled={isMutating}
        >
          &times;
        </button>

        <div className="rg-upsell-header-block">
          <span className="rg-upsell-badge-pill">Smart Rider Deal</span>
          <h2 id="rg-upsell-title" className="rg-upsell-main-title">
            Unlock More For Less Money
          </h2>
          <p id="rg-upsell-description" className="rg-upsell-subcaption">
            Your current selection costs <strong className="rg-highlight-text">${computedCashSubtotal}</strong> for {totalCashCount} individual track{totalCashCount > 1 ? "s" : ""}. Upgrade to a bundle to instantly unlock your tracks and keep leftover credits for future maps.
          </p>
        </div>

        <div className="rg-upsell-matrix-grid">
          {/* Baseline Current State Tracker */}
          <div className="rg-upsell-tier-card mod-current-baseline">
            <div className="rg-upsell-card-inner">
              <span className="rg-upsell-tier-label">As-Staged Selection</span>
              <div className="rg-upsell-price-callout">${computedCashSubtotal}</div>
              <span className="rg-upsell-math-subtext">$6.99 per single track</span>
              <span className="rg-upsell-savings-tag mod-neutral">Standard Price</span>
            </div>
          </div>

          {/* Premium Bundle Generation Cards */}
          {UPSELL_TIERS.map((tier) => (
            <div key={tier.id} className="rg-upsell-tier-card mod-bundle-premium">
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
                  disabled={isMutating}
                >
                  {isMutating ? "Updating..." : "Choose Upgrade ➔"}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="rg-upsell-footer-actions-tray">
          <button 
            onClick={onBypass} 
            className="rg-upsell-dismiss-bypass-btn"
            disabled={isMutating}
          >
            No thanks, proceed with individual tracks (${computedCashSubtotal})
          </button>
        </div>
      </div>
    </div>
  );
}