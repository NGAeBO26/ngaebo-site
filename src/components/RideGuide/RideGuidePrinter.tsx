/* src/components/RideGuide/RideGuidePrinter.tsx */
import { useRef, useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import { domToPng } from "modern-screenshot"; 
import { useNavigate } from "react-router-dom"; /* 🎯 NEW: Hook into the React Router navigation stack */
import RouteReport_v3 from "./RouteReport_v3"; 

// 🎯 UNIFIED IMPORTERS: Hook into layout loader and auth context engines
import { LoadingOverlay } from "../LoadingOverlay";
import { useShopifyAuth } from "../../store/ShopifyAuthContext"; 
import "../../styles/RideGuidePrinter.css"; 

interface RideGuidePrinterProps {
  routeID: string;
  customerID: string; 
}

export default function RideGuidePrinter({ routeID, customerID }: RideGuidePrinterProps) {
  const { login, isLoading: authIsLoading } = useShopifyAuth(); 
  const navigate = useNavigate(); /* 🎯 Initialize backplane router link tracking */
  
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

  /* 📱 RESPONSIVE VIEWPORT ENGINE: Identifies mobile viewports to cleanly suppress background screens */
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaCondition = window.matchMedia("(max-width: 767px)");
    setIsMobile(mediaCondition.matches);
    
    const viewportListener = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mediaCondition.addEventListener("change", viewportListener);
    return () => mediaCondition.removeEventListener("change", viewportListener);
  }, []);

  /* 🎯 SCROLL FREEZE LOCK: Tags the body layout to prevent mobile background drift */
  useEffect(() => {
    if (showTermsModal) {
      document.body.classList.add("rg-printer-body-freeze");
    } else {
      document.body.classList.remove("rg-printer-body-freeze");
    }
    return () => document.body.classList.remove("rg-printer-body-freeze");
  }, [showTermsModal]);

  /* 🎯 ROUTE BACKTRACKING HANDLER: Gracefully steps the user back to the workspace they arrived from */
  const handleExitWorkflow = () => {
    navigate("/rides"); 
  };

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
      
      .rg-print-inner-scale-box {
        transform: none !important;
      }
      
      .rg-print-capture-target {
        box-shadow: none !important;
        border: none !important;
      }
      
      header, [class*="header"], .rr-isolation-shell > div:first-child {
        position: static !important;
        position: relative !important;
        transform: none !important;
        will-change: auto !important;
        filter: none !important;
        backdrop-filter: none !important;
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
          setOverlayProgress(30);
          setOverlayMessage("Initializing Geospatial Engine & Weather Sync...");
          
          setShowTermsModal(true);
          setShowOverlay(false);
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

  // PHASE 3 PROGRESS SIMULATION LINEAR STEPPER
  useEffect(() => {
    if (isVerifying || accessDeniedMessage || overlayProgress < 30 || overlayProgress >= 100) return;

    const progressTimer = setInterval(() => {
      setOverlayProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          return 100;
        }
        
        const nextProgress = prev + 5;
        if (nextProgress >= 100) setOverlayMessage("RideGuide Ready to Print!");
        else if (nextProgress >= 75) setOverlayMessage("Generating Route Statistics");
        else if (nextProgress >= 50) setOverlayMessage("Physics Engine Engaged");
        else if (nextProgress >= 35) setOverlayMessage("Digital Elevation Model Rendering...");
        else if (nextProgress >= 20) setOverlayMessage("Weather API Sync...");

        return nextProgress;
      });
    }, 150);

    return () => clearInterval(progressTimer);
  }, [isVerifying, accessDeniedMessage, overlayProgress]);

  // LAYER 3: BACKGROUND MAP SYNCHRONIZATION HOOK
  useEffect(() => {
    let pollingInterval: NodeJS.Timeout;

    if (printCanvasRef.current && !hasAutoFired && !isPrinting && !isVerifying && !accessDeniedMessage) {
      setHasAutoFired(true);

      pollingInterval = setInterval(() => {
        const isMapRenderFinished = (window as any).mapLoaded === true;
        if (isMapRenderFinished) {
          clearInterval(pollingInterval);
          setOverlayProgress(100);
          setOverlayMessage("RideGuide Ready to Print!");
        }
      }, 200); 
    }

    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [printCanvasRef, hasAutoFired, isVerifying, accessDeniedMessage]);

  const executePdfDownload = async () => {
    if (!printCanvasRef.current || isVerifying || accessDeniedMessage) return;
    
    setIsPrinting(true);
    setOverlayMessage("Compiling Document Vector Maps...");
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
      
      /* 🎯 TYPE-SAFE SAFARI BYPASS: Checks payload type before evaluation. 
         This converts native URL objects to strings to completely bypass type-assignment errors. */
      const blobTarget = pdf.output("bloburl");
      window.location.href = typeof blobTarget === "string" ? blobTarget : blobTarget.toString();

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
      setOverlayMessage("RideGuide Ready to Print!");
    }
  };

  if (accessDeniedMessage) {
    return (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100vh", color: "#f87171", backgroundColor: "#0f172a", padding: "20px", textAlign: "center", fontFamily: "sans-serif" }}>
        <h1 style={{ fontSize: "64px", margin: "0" }}>🔒</h1>
        <h2>{accessDeniedMessage}</h2>
        <p style={{ color: "#94a3b8" }}>Please navigate back to the mapping panel to initialize an updated 7-day access key token.</p>
        <button type="button" onClick={handleExitWorkflow} style={{ marginTop: "16px", padding: "10px 20px", cursor: "pointer", fontWeight: "bold" }}>
          Return to Workspace
        </button>
      </div>
    );
  }

  return (
    <div className="rg-printer-root-canvas">
      
      <LoadingOverlay 
        isLoading={showOverlay && !isMobile} 
        progress={overlayProgress} 
        message={overlayMessage} 
      />

      {showTermsModal && (
        <div className="rg-printer-backdrop-overlay">
          <div className="rg-printer-modal-card">
            
            <div className="rg-printer-logo-wrapper">
              <img 
                src="/images/RideGuide_embroid-v1.svg" 
                alt="NGAeBO System Verification" 
                className="rg-printer-logo-asset"
              />
            </div>

            <div className="rg-printer-pipeline-stack">
              <h4 className="rg-printer-pipeline-header">...Pipeline Initialized...</h4>
              
              <div className={`pipeline-row ${overlayProgress >= 35 ? "mod-completed" : overlayProgress >= 20 ? "mod-active" : "mod-pending"}`}>
                <span className="check-node">{overlayProgress >= 35 ? "✓" : "⏳"}</span> Weather API Sync...
              </div>
              
              <div className={`pipeline-row ${overlayProgress >= 50 ? "mod-completed" : overlayProgress >= 35 ? "mod-active" : "mod-pending"}`}>
                <span className="check-node">{overlayProgress >= 50 ? "✓" : "⏳"}</span> Digital Elevation Model Rendering...
              </div>
              
              <div className={`pipeline-row ${overlayProgress >= 75 ? "mod-completed" : overlayProgress >= 50 ? "mod-active" : "mod-pending"}`}>
                <span className="check-node">{overlayProgress >= 75 ? "✓" : "⏳"}</span> Physics Engine Engaged
              </div>
              
              <div className={`pipeline-row ${overlayProgress >= 100 ? "mod-completed" : overlayProgress >= 75 ? "mod-active" : "mod-pending"}`}>
                <span className="check-node">{overlayProgress >= 100 ? "✓" : "⏳"}</span> Generating Route Statistics
              </div>
              
              <div className={`pipeline-row ${overlayProgress === 100 ? "mod-completed mod-ready" : "mod-pending"}`}>
                <span className="check-node">{overlayProgress === 100 ? "🎯" : "⏳"}</span> RideGuide Ready to Print!
              </div>
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

            {/* 🎯 THE CONTROL WRAPPER LAYOUT DOCK */}
            <div className="rg-printer-bottom-docked-controls-wrapper">
              <label className="rg-printer-checkbox-label">
                <input 
                  type="checkbox" 
                  checked={hasAcceptedTerms}
                  onChange={(e) => setHasAcceptedTerms(e.target.checked)}
                  className="rg-printer-checkbox-input"
                  disabled={isPrinting}
                />
                <span className="rg-printer-checkbox-text">
                  I agree to the Terms & Conditions and acknowledge the legal ownership, safety, and digital download parameters.
                </span>
              </label>

              <button
                onClick={executePdfDownload}
                disabled={!hasAcceptedTerms || isPrinting || overlayProgress < 100}
                className={`rg-printer-modal-submit-btn ${hasAcceptedTerms && overlayProgress === 100 ? "mod-accepted" : "mod-disabled"}`}
              >
                {isPrinting 
                  ? "Compiling Document Vector Maps... ⏳" 
                  : overlayProgress < 100 
                    ? "Loading Mapping Telemetry... ⏳" 
                    : "Generate Premium PDF ➔"
                }
              </button>

              <button
                type="button"
                onClick={handleExitWorkflow}
                disabled={isPrinting}
                className="rg-printer-modal-exit-btn"
              >
                Cancel & Return to App ➔
              </button>
            </div>

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