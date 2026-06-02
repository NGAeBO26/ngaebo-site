/* src/components/modal/UnlockModal.tsx */
import { useState, useEffect } from "react";
import "../../styles/modal.css";
import ModalBackdrop from "./ModalBackdrop";
import ModalCard from "./ModalCard";
import { useUnlockModal } from "./useUnlockModal";

// REUSE YOUR STYLED PRODUCTION TOOLTIP COMPONENT INSTANCE
import TelemetryTooltip from "../RideGuide/TelemetryTooltip";

export default function UnlockModal() {
  const { isOpen, close, unlock } = useUnlockModal();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  // 🎯 STARTUP KEY CONTROLLER: Initialized to point cleanly to our onboarding introduction sheet card
  const [activeKey, setActiveKey] = useState("intro");

  // 🎯 AUTOMATED LIFECYCLE REBOOT OVERLAY TRIGGER
  useEffect(() => {
    if (isOpen) {
      console.log("🧼 Restoring onboarding explorer view panel context to default intro dashboard state...");
      setActiveKey("intro");
    }
  }, [isOpen]);

  // Percentage-based coordinate map matching your report template blueprint zones
  const responsiveZones = [
    { key: "currentweather",   top: "15.2%", left: "4.6%",   width: "23.2%", height: "10.8%" },
    { key: "primeridetime",    top: "15.2%", left: "28.7%",  width: "42.6%", height: "10.8%" },
    { key: "routeconditions",  top: "15.2%", left: "72.2%",  width: "23.2%", height: "10.8%" },
    { key: "routemetrics",     top: "29.5%", left: "4.6%",   width: "23.2%", height: "23.3%" },
    { key: "efforttax",        top: "53.3%", left: "4.6%",   width: "23.2%", height: "9.0%"  },
    { key: "riskradar",        top: "61.8%", left: "4.6%",   width: "23.2%", height: "17.9%" },
    { key: "placestosee",      top: "29.5%", left: "72.2%",  width: "23.2%", height: "23.3%" },
    { key: "emergencyservices",top: "53.3%", left: "72.2%",  width: "23.2%", height: "9.0%"  },
    { key: "elevationprofile", top: "80.2%", left: "4.6%",   width: "90.8%", height: "12.5%" } 
  ];

  // ✉️ ACTION A: MailerLite Capture Synchronizer Engine Pipeline
  async function handleFreeRegistration(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Subscription failed. Please verify email format attributes.");
        return;
      }

      unlock(); // Commits authorization flags seamlessly down to Zustand and localStorage contexts
      const targetRouteID = (window as any).currentReportRouteID || "346_S1";
      window.open(`/report/${targetRouteID}`, '_blank', 'noopener,noreferrer');
    } catch {
      setError("Ecosystem gateway response timeout. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // 🛒 ACTION B: Headless Shopify Checkout Permalink Generation Protocol
  const handlePremiumPurchase = () => {
    const targetRouteID = (window as any).currentReportRouteID || "346_S1";
    
    // Shopify Store Domain configurations
    const SHOPIFY_STORE_DOMAIN = "your-dev-store.myshopify.com"; 
    const BLUEPRINT_VARIANT_ID = "48652317950234"; // Single Product Variant Inventory Token
    
    const checkoutPermalink = `https://${SHOPIFY_STORE_DOMAIN}/cart/${BLUEPRINT_VARIANT_ID}:1?attributes[Route_ID]=${targetRouteID}&attributes[Fulfillment_Mode]=Automated_PDF_Pipeline`;
    
    console.log("🛒 [HEADLESS SALES ROUTING] Launching secure checkout pass...");
    window.open(checkoutPermalink, '_blank', 'noopener,noreferrer');
  };

  if (!isOpen) return null; //

  return (
    <>
      <ModalBackdrop onClose={close} /> {/* */}
      <ModalCard width="lg"> {/* */}
        <button onClick={close} className="modal-close">✕</button> {/* */}

        <div className="rg-immersive-tour-wrapper">
          
          <span className="rg-tour-header-tagline">
            RideGuide Interactive Preview
          </span>
          
          {/* 🎯 CALIBRATED MARKETING TEXT UPDATE CHANNELS */}
          <p className="rg-tour-header-sub-tagline">
            Know before you go. Your custom RideGuide helps you plan smarter, safer, and more enjoyable rides with personalized insights into route conditions to help you make better decisions about bike setup and gear loadouts. <br /><br />
            Unlock today's RideGuide for your route to explore detailed route conditions, real-time weather updates, essential safety information, and so much more.
          </p>

          {/* 🗺️ BALANCED TRIPLE COLUMN CONVERSION GRID LOOP DECK ASSEMBLY */}
          <div className="rg-blueprint-interaction-deck">
            
            {/* COLUMN 1: LEFT HAND SYSTEM LEGEND DISPLAY PANEL (HANDLES INTRO & WIDGET TOOLTIPS TOGETHER) */}
            <div className="rg-gutter-tooltip-slot rg-left-legend">
              {activeKey === "intro" ? (
                /* RIDEGUIDE SPECIMEN INTRODUCTION BRIEFING CARD CONTAINER */
                <div className="rg-modal-intro-card">
                  <h4 className="rg-tooltip-title rg-intro-main-title">
                    The Digital RideGuide
                  </h4>
                  
                  <p className="rg-intro-main-desc">
                    Powered by AdventureGEOLAB's outdoor analytics platform. Our data pipeline compiles thousands of real-time topographical and weather data-points to provide off-road riders with unmatched situational awareness.
                  </p>

                  <div className="rg-intro-highlights-list">
                    <div className="rg-intro-highlight-item">
                      🗺️ <strong>Intended Uses:</strong> Track weather windows, visualize route steepness vectors, inspect substrate traction, and understand dynamic risk factors.
                    </div>
                    <div className="rg-intro-highlight-item">
                      ⚡ <strong>Core Highlights:</strong> Live multi-axis meteorological analysis, high-density terrain modeling, and custom physics engine calculations for traction and energy expenditure.
                    </div>
                  </div>

                  <div className="rg-tooltip-bullet-box rg-intro-explorer-cta-block">
                    <strong className="rg-tooltip-bullet-header" style={{ color: "#236ea0", marginBottom: "4px" }}>
                      Interactive Explorer:
                    </strong>
                    <span style={{ fontSize: "10.5px", color: "#1e293b", lineHeight: "1.4", display: "block", fontWeight: "500" }}>
                      Hover over any widget on the sample RideGuide to preview how our system works!
                    </span>
                  </div>
                </div>
              ) : (
                /* STYLED LIVE DATA DICTIONARY TOOLTIP TARGET POPULATOR OVERLAY */
                <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                  <TelemetryTooltip 
                    widgetKey={activeKey} 
                    isVisible={true} 
                    cardPosition="left" 
                    cardOffsetTop="0px" 
                    isModalRender={true} 
                  />
                  {/* RETURN ACTION ANCHOR LINK BUTTON TRACK ELEMENT */}
                  <button onClick={() => setActiveKey("intro")} className="rg-intro-return-action-trigger">
                    ← Return to Introduction Overview
                  </button>
                </div>
              )}
            </div>

            {/* COLUMN 2: CENTER PIECE VIEWPORT MAPPED STABLE IMAGE */}
            <div className="rg-mini-blueprint-viewport">
              <img 
                src="/data/assets/RideGuide_Sample.svg" 
                className="rg-mini-blueprint-img-bg"
                alt="RideGuide Field Specimen Blueprint Page"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/data/assets/RideGuide_Sample.png";
                }}
              />

              {/* RELATIVE PERCENTAGE TRIGGER ZONES SHEET */}
              {responsiveZones.map((zone) => (
                <div
                  key={zone.key}
                  onMouseEnter={() => setActiveKey(zone.key)}
                  onClick={() => setActiveKey(zone.key)}
                  className={`rg-mini-hotspot ${activeKey === zone.key ? 'active' : ''}`}
                  style={{
                    top: zone.top,
                    left: zone.left,
                    width: zone.width,
                    height: zone.height,
                  }}
                />
              ))}
            </div>

            {/* COLUMN 3: RIGHT HAND SYSTEM TRANSACTION TERMINAL CARD */}
            <div className="rg-gutter-tooltip-slot">
              <div className="rg-checkout-hub-card">
                
                {/* INTERACTIVE COMPONENT CAPTURE ENTRY FORM TIER */}
                <div className="rg-hub-badge-tier">Register Now</div>
                <h4 className="rg-hub-main-title">Free RideGuide Sample Pack</h4>
                <div className="rg-hub-pricing-row">
                  <span className="rg-hub-price-tag">$0</span>
                  <span className="rg-hub-price-annotation">/ Email Registration</span>
                </div>
                
                <form onSubmit={handleFreeRegistration} className="unlock-form">
                  <input
                    type="email"
                    placeholder="Enter your email address..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="unlock-input"
                  />
                  {error && <p className="unlock-error">{error}</p>}
                  <button type="submit" disabled={loading} className="rg-free-submit-btn">
                    {loading ? "LINKING CORRIDOR..." : "Download Your Sample Pack ➔"}
                  </button>
                </form>

                <div className="rg-hub-divider-line" />

                {/* PREMIUM COMMERCE TRANSACTION CHECKOUT ASSET FUNNEL TIER */}
                <div className="rg-hub-badge-tier" style={{ backgroundColor: "#d88a3a" }}>Buy Now</div>
                <h4 className="rg-hub-main-title">Printable RideGuide PDF</h4>
                <div className="rg-hub-pricing-row">
                  <span className="rg-hub-price-tag">$4.99</span>
                  <span className="rg-hub-price-annotation">/ One-Time Purchase</span>
                </div>
                
                <p style={{ fontSize: "10px", color: "#475569", lineHeight: "1.4", margin: "0 0 12px 0" }}>
                  Get today's RideGuide for your route featuring current weather and live route conditions, delivered straight to your inbox.
                </p>

                <button 
                  onClick={handlePremiumPurchase} 
                  className="rg-premium-buy-btn"
                  style={{ marginTop: "auto" }}
                >
                  GET Today's RideGuide ➔
                </button>

              </div>
            </div>

          </div>

        </div>
      </ModalCard>
    </>
  );
}