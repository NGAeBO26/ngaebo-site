/* src/pages/RedirectGateway.tsx */
import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import "./RedirectGateway.css";

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

  const [emailInput, setEmailInput] = useState<string>("");
  const [isSubmittingForm, setIsSubmittingForm] = useState<boolean>(false);
  const [formFeedbackMessage, setFormFeedbackMessage] = useState<string>("");
  const [formSuccessStatus, setFormSuccessStatus] = useState<boolean>(false);

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

  const handleSubmitLeadCapture = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("\n==================================================");
    console.log("🚀 [FORM INITIATED]: Processing RideGuide Opt-In Request...");

    if (!emailInput || !emailInput.includes("@")) {
      console.warn("⚠️ [VALIDATION FAILURE]: Front-end rejected malformed email input:", emailInput);
      setFormFeedbackMessage("⚠️ Please provide a valid email address path.");
      return;
    }

    setIsSubmittingForm(true);
    setFormFeedbackMessage("");

    /* 🎯 ENVIRONMENTAL REACTION GATEWAY PORT RESOLVER:
   If running locally on Vite (port 5173), we route directly to your 
   Express backend on port 5000 using the standard IPv4 loopback address. 
   When built for production, it seamlessly drops back to a safe relative endpoint string. */
const targetEndpoint = window.location.port === "5173"
  ? "http://127.0.0.1:5000/api/subscribe"
  : "/api/subscribe";

const requestBodyPayload = {
  email: emailInput.trim(),
  intent_tag: parsedIntentTag 
};

console.log(`📡 [NETWORK FETCH]: Dispatched POST stream to: ${targetEndpoint}`);
    console.log("📦 [PAYLOAD RAW BODY]: Serialized structured data parameters:", requestBodyPayload);

    try {
      const response = await fetch(targetEndpoint, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(requestBodyPayload)
      });

      console.log(`📥 [RESPONSE RETURNED]: Network HTTP Status Code -> ${response.status}`);

      const data = await response.json();
      console.log("📄 [SERVER JSON RESULT]: Returned data packet maps to:", data);

      if (!response.ok) {
        throw new Error(data.error || `Server HTTP error status: ${response.status}`);
      }

      console.log("🎉 [SUCCESS]: Lead successfully accepted by backend pipeline matrix.");
      setFormSuccessStatus(true);
      setFormFeedbackMessage("🎉 Adventure Pack Unlocked! Your printable trail sheets are hitting your inbox.");
      
    } catch (err: any) {
      console.error("❌ [PIPELINE CRITICAL EXCEPTION ENCOUNTERED]:");
      console.error(`💥 Error Name: ${err.name}`);
      console.error(`💥 Error Message: ${err.message}`);
      
      setFormFeedbackMessage("⚠️ Subscription failed. Please try again.");
    } finally {
      setIsSubmittingForm(false);
      console.log("==================================================\n");
    }
  };

  const handleProceedToAffiliate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ftcAgreed || !liabilityAgreed) return;
    setIsSearching(true);
  };

  return (
    <div className="gateway-master-viewport-wrapper">
      <div className="gateway-center-card-shell">
        <div className="gateway-card-accent-bar">
          <span>{isSearching ? "Establishing Secure Connection" : subCategory}</span>
        </div>

        {!isSearching ? (
          <div className="gateway-form-payload">
            <div className="gateway-co-branded-handshake-banner">
              <img className="gateway-identity-main-logo" src="/images/site-logo.png" alt="NGAEBO Logo" />
              <span className="gateway-handshake-icon-divider">🤝</span>
              {logoAssetUrl ? (
                <img className="gateway-computed-logo" src={logoAssetUrl} alt={brand} />
              ) : (
                <span className="gateway-brand-text-fallback">{brand}</span>
              )}
            </div>

            <div className="gateway-title-block-lbl">
              <h2>Vendor Redirection Gateway</h2>
              <p className="gateway-item-context-lbl">Verifying routing protocols for: <strong>{productName}</strong></p>
            </div>

            <div className="gateway-rideguide-lead-incentive-card">
              <div className="gateway-lead-icon-badge">🗺️ BONUS INCLUDED</div>
              <h4>Claim Your Free RideGuide Sample Pack</h4>
              <p className="gateway-lead-description-copy">
                {isAccessoryItem ? (
                  "Prepping for new gear setup runs? We've bundled our top 3 high-intensity North Georgia gravel trail loops to test out your new accessories. Enter your email to receive high-res printable maps straight to your inbox!"
                ) : (
                  "Planning your bike's maiden voyage? We've mapped out the ultimate 3-pack sample series of Fire Service road loops perfectly balanced for this exact build class. Instant download package delivered to your email."
                )}
              </p>

              {!formSuccessStatus ? (
                <form className="gateway-inline-subscription-box" onSubmit={handleSubmitLeadCapture}>
                  <input type="email" placeholder="Enter your email address..." value={emailInput} onChange={(e) => setEmailInput(e.target.value)} disabled={isSubmittingForm} required />
                  <button type="submit" disabled={isSubmittingForm}>{isSubmittingForm ? "Linking..." : "Claim Free Maps ➔"}</button>
                </form>
              ) : null}

              {formFeedbackMessage && <p className={`gateway-form-feedback-lbl ${formSuccessStatus ? "success" : "error"}`}>{formFeedbackMessage}</p>}
              {!formSuccessStatus && <span className="gateway-form-optional-caption">* Optional onboarding step. Access map links will auto-fulfill natively via email sequences.</span>}
            </div>

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