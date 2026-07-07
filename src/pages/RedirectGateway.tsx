/* src/pages/RedirectGateway.tsx */
import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import "./RedirectGateway.css";
import TacticalLeadForm from "../components/TacticalLeadForm"; 

export default function RedirectGateway() {
  const [searchParams] = useSearchParams();
  
  const brand = searchParams.get("brand") || "Partner Vendor";
  const productName = searchParams.get("title") || "Premium Selected Gear";
  const subCategory = searchParams.get("sub") || "Verified Equipment";
  const destinationUrl = searchParams.get("dest") || "https://ngaebo.com";
  
  const parsedIntentTag = searchParams.get("intent") || "general_newsletter";
  const isAccessoryItem = parsedIntentTag.startsWith("acc_");

  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [ftcAgreed, setFtcAgreed] = useState<boolean>(false);
  const [liabilityAgreed, setLiabilityAgreed] = useState<boolean>(false);

  const loadingPhases = [
    "...Reviewing Listings...",
    "...Finding Discounts...",
    "...Loading Page..."
  ];
  const [currentPhaseIdx, setCurrentPhaseIdx] = useState<number>(0);
  const [textOpacityClass, setTextOpacityClass] = useState<string>("fade-in");

  useEffect(() => {
    console.log("================================================== ");
    console.log("📡 [GATEWAY DIAGNOSTIC]: New Tab Mount Trace Initialized");
    console.log(`🔹 Product Name: "${productName}"`);
    console.log(`🔹 Brand Group: "${brand}"`);
    console.log(`🔹 URL Intent Tag Extracted: "${parsedIntentTag}"`);
    console.log(`🔹 Ultimate Target Destination URL: "${destinationUrl}"`);
    console.log("================================================== ");
  }, [brand, productName, parsedIntentTag, destinationUrl]);

  useEffect(() => {
    if (!isSearching) return;

    const timer1Out = setTimeout(() => setTextOpacityClass("fade-out"), 850);
    const timer1In = setTimeout(() => {
      setCurrentPhaseIdx(1);
      setTextOpacityClass("fade-in");
    }, 1000);

    const timer2Out = setTimeout(() => setTextOpacityClass("fade-out"), 1850);
    const timer2In = setTimeout(() => {
      setCurrentPhaseIdx(2);
      setTextOpacityClass("fade-in");
    }, 2000);

    return () => {
      clearTimeout(timer1Out);
      clearTimeout(timer1In);
      clearTimeout(timer2Out);
      clearTimeout(timer2In);
    };
  }, [isSearching]);

  useEffect(() => {
    if (!isSearching) return;

    const redirectTimer = setTimeout(() => {
      window.location.href = destinationUrl;
    }, 3000);

    return () => clearTimeout(redirectTimer);
  }, [isSearching, destinationUrl]);

  const getGatewayBrandLogoUrl = (brandName: string): string => {
    if (!brandName) return "";
    const lookupKey = brandName.toLowerCase().trim();
    if (lookupKey.includes('kingbull')) return "/data/assets/kingbull_logo.png";
    if (lookupKey.includes('ride1up')) return "/data/assets/Ride1Up_logo.png";
    if (lookupKey.includes('rockbros')) return "/data/assets/rockbros_text_logo.png";
    return "";
  };

  const logoAssetUrl = getGatewayBrandLogoUrl(brand);

  const handleProceedToAffiliate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ftcAgreed || !liabilityAgreed) return;
    setIsSearching(true);
  };

  return (
    <div className="gateway-master-viewport-wrapper">
      <div className="gateway-center-card-shell">
        
        {/* Accent Bar at the top header */}
        <div className="gateway-card-accent-bar">
          <span>{isSearching ? "Establishing Secure Connection" : "Vendor Redirection Gateway"}</span>
        </div>

        {/* ─── 🎯 FIX 1: FLOATING BRAND LOGO OUTSIDE EMBED BANNER ───
            Placed at top level to allow absolute positioning over the header bar boundary seamlessly */}
        
          <img className="gateway-absolute-main-logo" src="/images/site-logo.png" alt="NGAEBO Logo" />
        

        {!isSearching ? (
          <div className="gateway-form-payload">
            
            {/* ─── 🎯 FIX 2: VENDOR LOGO BAY (CENTERED, EMOJI DELETED) ─── */}
            <div className="gateway-centered-vendor-logo-bay">
              {logoAssetUrl ? (
                <img className="gateway-computed-logo" src={logoAssetUrl} alt={`${brand} Logo`} />
              ) : (
                <span className="gateway-brand-text-fallback">{brand}</span>
              )}
            </div>

            {/* ─── 🎯 FIX 3: BLUE PROTOCOL BLOCK POSITIONED DIRECTLY BELOW VENDOR LOGO ─── */}
            <div className="gateway-title-block-lbl">
              <p className="gateway-item-context-lbl">
                Verifying routing protocols for:
              </p>
              <div className="gateway-product-row-flex">
                {/* Shifted away from h2 tags to remove structural dependencies on page imports */}
                <span className="gateway-inline-product-title-text">{productName}</span>
                {subCategory && (
                  <span className="gateway-inline-subcat-badge">{subCategory}</span>
                )}
              </div>
            </div>

            {/* Incentive lead element card summary */}
            <div className="gateway-rideguide-lead-incentive-card">
              <p className="gateway-lead-description-copy" style={{ margin: 0 }}>
                {isAccessoryItem ? (
                  "Ready to try out your new gear? We've bundled our top 3 North Georgia gravel routes to test out your new accessories. Enter your email to get free guides delivered straight to your inbox!"
                ) : (
                  "Planning your bike's maiden voyage? We've mapped out the ultimate 3-pack sample series of Fire Service routes perfectly suited for this bike. Instant download package delivered to your email."
                )}
              </p>
              <TacticalLeadForm 
                layout="row"
                sourceGroupTag={parsedIntentTag}
                placeholderText="Enter your email address..."
                buttonLabel="Claim Free Maps ➔"
              />
            </div>

            {/* Disclosures Scroll View Box */}
            <div className="gateway-scrollable-disclosure-pane">
              <div className="gateway-legal-section">
                <h4>Affiliate Disclosure (FTC Compliance)</h4>
                <p>This Site contains affiliate links. When you click these links and make a purchase, we may earn a commission at no additional cost to you. We only recommend products we believe provide value, but we do not control or guarantee any third‑party products, services, or policies.</p>
              </div>
              <div className="gateway-legal-section">
                <h4>Affiliate Product Terms &amp; Liability Disclaimer</h4>
                <p>When you click an affiliate link, you are leaving our Site and entering a third‑party website. You acknowledge that:</p>
                <ul className="gateway-bullet-list">
                  <li>We do not own or operate affiliate products</li>
                  <li>We are not responsible for shipping, returns, warranties, or customer service</li>
                  <li>Product pricing, availability, and specifications may change without notice</li>
                  <li>You must follow the affiliate partner’s terms and policies</li>
                </ul>
                <p className="gateway-notice-bold-alert">North Georgia eBike Outfitters LLC are not liable for any damages or issues arising from third‑party purchases.</p>
              </div>
            </div>

            {/* Verification Consent Form Trigger */}
            <form onSubmit={handleProceedToAffiliate}>
              <div className="gateway-checkbox-inputs-stack">
                <label className="gateway-input-label-row">
                  <input type="checkbox" checked={ftcAgreed} onChange={(e) => setFtcAgreed(e.target.checked)} required />
                  <span className="gateway-checkbox-text-token">I acknowledge the Affiliate Disclosure (FTC Compliance statement).</span>
                </label>
                <label className="gateway-input-label-row">
                  <input type="checkbox" checked={liabilityAgreed} onChange={(e) => setLiabilityAgreed(e.target.checked)} required />
                  <span className="gateway-checkbox-text-token">I understand and agree to the Product Terms and Liability Disclaimers.</span>
                </label>
              </div>

              <div className="gateway-form-actions-footer">
                <button type="button" className="gateway-cancel-close-btn" onClick={() => window.close()}>✕ Cancel &amp; Close Tab</button>
                <button type="submit" className="gateway-submit-action-btn" disabled={!ftcAgreed || !liabilityAgreed}>Proceed to Verified Vendor ↗</button>
              </div>
            </form>
          </div>
        ) : (
          <div className="gateway-theater-loading-wrapper">
            <div className="gateway-radial-vector-spinner"></div>
            <h3 className="gateway-static-theater-headline">Searching for Best Price...</h3>
            <p className="gateway-server-handshake-lbl">Establishing secure connection to <span className="gateway-brand-badge-token">{brand}</span> servers...</p>
            <span className={`gateway-dynamic-phase-caption ${textOpacityClass}`}>{loadingPhases[currentPhaseIdx]}</span>
          </div>
        )}
      </div>
    </div>
  );
}