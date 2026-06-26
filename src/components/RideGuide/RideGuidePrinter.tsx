/* src/components/RideGuide/RideGuidePrinter.tsx */
import { useRef, useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import { domToPng } from "modern-screenshot"; 
import RouteReport_v3 from "./RouteReport_v3"; 

// 🎯 UNIFIED IMPORTERS: Hook into layout loader and auth context engines
import { LoadingOverlay } from "../LoadingOverlay";
import { useShopifyAuth } from "../../store/ShopifyAuthContext"; 
import "../../styles/RideGuidePrinter.css"; // Clean CSS migration target

interface RideGuidePrinterProps {
  routeID: string;
  customerID: string; 
}

export default function RideGuidePrinter({ routeID, customerID }: RideGuidePrinterProps) {
  const { login, isLoading: authIsLoading } = useShopifyAuth(); 
  
  const [isPrinting, setIsPrinting] = useState(false);
  const [hasAutoFired, setHasAutoFired] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [accessDeniedMessage, setAccessDeniedMessage] = useState<string | null>(null);
  const printCanvasRef = useRef<HTMLDivElement>(null);

  // 🎯 LIFECYCLE MANAGEMENT STATES
  const [overlayProgress, setOverlayProgress] = useState(0);
  const [overlayMessage, setOverlayMessage] = useState("Initializing PDF Generation Pipeline...");
  const [showOverlay, setShowOverlay] = useState(true);
  
  // 🎯 TERMS & DISCLOSURE GATEWAY STATES
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);

  // LAYER 1: ABSOLUTELY ALIGN CORE PRINT RENDERING PROPERTIES
  useEffect(() => {
    const origHtmlMargin = document.documentElement.style.margin;
    const origHtmlPadding = document.documentElement.style.padding;
    const origBodyMargin = document.body.style.margin;
    const origBodyPadding = document.body.style.padding;
    const origBg = document.body.style.backgroundColor;

    const styleElement = document.createElement("style");
    styleElement.id = "rg-printer-absolute-alignment-hotfix";
    styleElement.innerHTML = `
      html, body, #root, .app-shell, main.page, .rg-printer-root-canvas {
        margin: 0 !important;
        padding: 0 !important;
        height: auto !important;
        min-height: 0 !important;
        max-height: none !important;
        overflow: visible !important;
        display: block !important;
      }
      .rr-isolation-shell { padding: 0 !important; margin: 0 !important; background-color: transparent !important; }
      .rr-metrics-column-sidebar div, .rr-metrics-column-sidebar span, .rr-metrics-column-sidebar p { white-space: nowrap !important; }
      .rr-weather-condition-node, .rr-weather-condition-label, .rr-weather-temp-node, .rr-weather-precip-node {
        white-space: nowrap !important; display: block !important; width: 100% !important; text-align: center !important; margin-left: auto !important; margin-right: auto !important; overflow: visible !important;
      }
      .rr-widget-weather-root, .rr-overview-module { overflow: visible !important; display: flex !important; flex-direction: column !important; align-items: center !important; }
      body { background-color: var(--brand-sand) !important; }
    `;
    document.head.appendChild(styleElement);

    return () => {
      document.documentElement.style.margin = origHtmlMargin;
      document.documentElement.style.padding = origHtmlPadding;
      document.body.style.margin = origBodyMargin;
      document.body.style.padding = origBodyPadding;
      document.body.style.backgroundColor = origBg;
      const existing = document.getElementById("rg-printer-absolute-alignment-hotfix");
      if (existing) existing.remove();
    };
  }, []);

  // LAYER 2: STATEFUL ACCOUNT VERIFICATION CHECK
  useEffect(() => {
    if (authIsLoading) {
      setIsVerifying(true);
      setOverlayProgress(10);
      setOverlayMessage("Synchronizing Shopify Secure Session...");
      return;
    }

    const verifyOwnershipAccess = async () => {
      try {
        setIsVerifying(true);
        setOverlayProgress(25);
        setOverlayMessage("Verifying Security Credentials...");
        
        const urlParams = new URLSearchParams(window.location.search);
        const activeSecureToken = urlParams.get("secureToken") || "";

        const response = await fetch("/api/tokens/verify-ownership", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            customerId: customerID, 
            routeId: routeID,
            secureToken: activeSecureToken 
          })
        });
        const data = await response.json();

        if (!response.ok || !data.hasAccess) {
          setAccessDeniedMessage(data.error || "🚨 Access Denied: Invalid signature credentials.");
          setShowOverlay(false);
        } else {
          setAccessDeniedMessage(null);
          setOverlayProgress(50);
          setOverlayMessage("Initializing Geospatial Engine & Weather Sync...");
        }
      } catch (err) {
        setAccessDeniedMessage("🚨 Identity Matrix Timeout: Failed connecting to authentication firewall.");
        setShowOverlay(false);
      } finally {
        setIsVerifying(false);
      }
    };

    if (customerID && routeID) {
      verifyOwnershipAccess();
    } else if (!customerID) {
      setIsVerifying(true);
      setOverlayProgress(5);
      setOverlayMessage("Redirecting to secure login gateway...");
      
      sessionStorage.setItem("auth_redirect_back_target", window.location.href);
      login();
    }
  }, [customerID, routeID, authIsLoading, login]);

  // PHASE 3 STABILIZER EFFECT
  useEffect(() => {
    if (!showOverlay || isVerifying || accessDeniedMessage || overlayProgress < 50) return;

    const progressTimer = setInterval(() => {
      setOverlayProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          
          setTimeout(() => {
            setShowOverlay(false);
            setShowTermsModal(true);
          }, 500);

          return 100;
        }
        
        if (prev >= 80) {
          setOverlayMessage("Compiling Premium Document PDF...");
        } else {
          setOverlayMessage("Compiling GIS Render Maps...");
        }

        return prev + 5;
      });
    }, 150);

    return () => clearInterval(progressTimer);
  }, [showOverlay, isVerifying, accessDeniedMessage, overlayProgress]);

  // LAYER 3: VERIFICATION MAP HOOK CHECK & EVENT LISTENERS
  useEffect(() => {
    let pollingInterval: NodeJS.Timeout;
    let maximumSafetyTimeout: NodeJS.Timeout;

    if (printCanvasRef.current && !hasAutoFired && !isPrinting && !isVerifying && !accessDeniedMessage) {
      setHasAutoFired(true);

      pollingInterval = setInterval(() => {
        const isMapRenderFinished = (window as any).mapLoaded === true;
        if (isMapRenderFinished) {
          clearInterval(pollingInterval);
          clearTimeout(maximumSafetyTimeout);

          setOverlayMessage("Compiling Premium Document PDF...");
          setOverlayProgress(100);

          setTimeout(() => {
            setShowOverlay(false);
            setShowTermsModal(true);
          }, 800);
        } else {
          setOverlayMessage("Compiling GIS Render Maps...");
        }
      }, 200); 

      maximumSafetyTimeout = setTimeout(() => {
        clearInterval(pollingInterval);
        setOverlayMessage("Compiling Premium Document PDF...");
        setOverlayProgress(100);
        setTimeout(() => {
          setShowOverlay(false);
          setShowTermsModal(true);
        }, 600);
      }, 6000);
    }

    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
      if (maximumSafetyTimeout) clearTimeout(maximumSafetyTimeout);
    };
  }, [printCanvasRef, hasAutoFired, isVerifying, accessDeniedMessage]);

  const executePdfDownload = async () => {
    if (!printCanvasRef.current || isVerifying || accessDeniedMessage) return;
    
    setShowTermsModal(false);
    setOverlayProgress(100);
    setOverlayMessage("Compiling Vector Coordinates & Exporting Map...");
    setShowOverlay(true);
    
    setIsPrinting(true);
    window.scrollTo(0, 0);

    const mapInstance = (window as any).map;
    const originalDevicePixelRatio = window.devicePixelRatio;

    if (mapInstance) {
      Object.defineProperty(window, 'devicePixelRatio', {
        get: () => 3, 
        configurable: true
      });
      mapInstance.resize();
    }

    await document.fonts.ready;
    await new Promise((resolve) => setTimeout(resolve, 600));

    try {
      const dataUrl = await domToPng(printCanvasRef.current, {
        scale: 3, 
        backgroundColor: "#ffffff",
        width: 816,
        height: 1056
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [816, 1056] 
      });

      pdf.addImage(dataUrl, "PNG", 0, 0, 816, 1056);
      const blobString = pdf.output("bloburl");
      window.open(blobString, "_blank");

    } catch (error) {
      console.error("Critical error executing dynamic template capture:", error);
    } finally {
      if (mapInstance) {
        Object.defineProperty(window, 'devicePixelRatio', {
          get: () => originalDevicePixelRatio,
          configurable: true
        });
        mapInstance.resize();
      }
      setIsPrinting(false);
      setShowOverlay(false);
    }
  };

  if (accessDeniedMessage) {
    return (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100vh", color: "#f87171", backgroundColor: "#0f172a", padding: "20px", textAlign: "center", fontFamily: "sans-serif" }}>
        <h1 style={{ fontSize: "64px", margin: "0" }}>🔒</h1>
        <h2>{accessDeniedMessage}</h2>
        <p style={{ color: "#94a3b8" }}>Please navigate back to the mapping panel to initialize an updated 7-day access key token.</p>
      </div>
    );
  }

  return (
    <div className="rg-printer-root-canvas">
      
      <LoadingOverlay 
        isLoading={showOverlay} 
        progress={overlayProgress} 
        message={overlayMessage} 
      />

      {/* 🎯 EXTRACTED STYLES: Terms overlay backdrop frame handles layout via mapped classes */}
      {showTermsModal && (
        <div className="rg-printer-backdrop-overlay">
          <div className="rg-printer-modal-card">
            
            <div className="rg-printer-logo-wrapper">
              <img 
                src="/images/RideGuide_embroid-v1.svg" 
                alt="NGAeBO System Verification" 
                className={`rg-printer-logo-asset ${isPrinting ? "is-spinning" : ""}`}
              />
            </div>

            <h3 className="rg-printer-modal-title">
              Rider Policy & Safety Agreement
            </h3>

            <div className="rg-modal-scroller-box">
              <p className="rg-printer-scroller-text-p1">
                <strong>RideGuide </strong>is a digital product delivered instantly after purchase. No physical item will be shipped. <strong>RideGuide </strong> is provided for informational purposes only and may not reflect real‑time road or terrain conditions. Outdoor activities involve inherent risks. <strong> Use at your own discretion</strong>"
              </p>
              <p className="rg-printer-scroller-text-p2">
                When you purchase a <strong>digital product</strong>, you receive a non-exclusive, non-transferable, revocable license for <strong>personal use only</strong>, granted by <strong>AdventureGeoLab LLC </strong>and distributed by <strong>North Georgia eBike Outfitters LLC</strong>. You may not resell, redistribute files, share them publicly or privately, repackage them into commercial products, or claim ownership or authorship. <strong>Violations may result in license termination and legal action</strong>.
              </p>
              <p className="rg-printer-scroller-text-p3">
                <strong>Digital products </strong> are delivered instantly via <strong>download link or email</strong>. For support, contact{" "}
                  <a href="mailto:support@northgeorgiaebikes.com" className="rg-legals-link">
                    support@northgeorgiaebikes.com
                  </a>.
              </p>
            </div>

            <label className="rg-printer-checkbox-label">
              <input 
                type="checkbox" 
                checked={hasAcceptedTerms}
                onChange={(e) => setHasAcceptedTerms(e.target.checked)}
                className="rg-printer-checkbox-input"
              />
              <span className="rg-printer-checkbox-text">
                I agree to the Terms & Conditions and acknowledge the legal ownership, safety, and digital download parameters.
              </span>
            </label>

            <button
              onClick={executePdfDownload}
              disabled={!hasAcceptedTerms || isPrinting}
              className={`rg-printer-modal-submit-btn ${hasAcceptedTerms ? "mod-accepted" : "mod-disabled"}`}
            >
              {isPrinting ? "Compiling Document Vector Maps... ⏳" : "Generate Premium PDF ➔"}
            </button>

          </div>
        </div>
      )}

      <div ref={printCanvasRef} className="rg-print-capture-target">
        <div className="rg-print-inner-scale-box">
          <RouteReport_v3 routeID={routeID} />
        </div>
      </div>

      {/* Floating Action Backup Trigger Elements */}
      {!showOverlay && !showTermsModal && (
        <div className="rg-printer-floating-action-wrapper">
          <button
            onClick={() => {
              setHasAcceptedTerms(false);
              setShowTermsModal(true);
            }}
            disabled={isPrinting || isVerifying}
            className={`rg-printer-floating-action-btn ${(isPrinting || isVerifying) ? "mod-disabled" : "mod-ready"}`}
          >
            GENERATE PDF
          </button>
        </div>
      )}
    </div>
  );
}