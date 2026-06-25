/* src/components/RideGuide/RideGuidePrinter.tsx */
import { useRef, useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import { domToPng } from "modern-screenshot"; 
import RouteReport_v3 from "./RouteReport_v3"; 

// 🎯 UNIFIED IMPORT: Pull in your custom spinning tire overlay framework
import { LoadingOverlay } from "../LoadingOverlay";

interface RideGuidePrinterProps {
  routeID: string;
  customerID: string; // Securely passed down from your logged-in Shopify context shell
}

export default function RideGuidePrinter({ routeID, customerID }: RideGuidePrinterProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [hasAutoFired, setHasAutoFired] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [accessDeniedMessage, setAccessDeniedMessage] = useState<string | null>(null);
  const printCanvasRef = useRef<HTMLDivElement>(null);

  // 🎯 MULTI-PHASE TRACKING ENGINE STATES
  const [overlayProgress, setOverlayProgress] = useState(0);
  const [overlayMessage, setOverlayMessage] = useState("Initializing PDF Generation Pipeline...");
  const [showOverlay, setShowOverlay] = useState(true);

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
    const verifyOwnershipAccess = async () => {
      try {
        setIsVerifying(true);
        // PHASE 1 START: Initialize progress metrics for security verification
        setOverlayProgress(15);
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
          // PHASE 2 START: Transition immediately to the layout compilation stage
          setOverlayProgress(40);
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
      setOverlayMessage("Checking System Session Context...");
      
      const safetyAuthTimeout = setTimeout(() => {
        if (!customerID) {
          setAccessDeniedMessage("🚨 Identity Matrix Error: Missing tracking constraints. Please ensure you are logged into your account.");
          setIsVerifying(false);
          setShowOverlay(false);
        }
      }, 2500);

      return () => clearTimeout(safetyAuthTimeout);
    }
  }, [customerID, routeID]);

  // 🎯 PHASE 3 STABILIZER EFFECT: Smoothly increments loader progress while weather data & maps resolve
  useEffect(() => {
    if (!showOverlay || isVerifying || accessDeniedMessage || overlayProgress >= 85) return;

    const progressTimer = setInterval(() => {
      setOverlayProgress((prev) => {
        if (prev >= 85) {
          clearInterval(progressTimer);
          return prev;
        }
        // Slowly step forward to provide continuous UI movement animation feedback
        return prev + 3;
      });
    }, 200);

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
          console.log("✅ Map state tracking passed. Initiating snapshot compiler engine...");
          clearInterval(pollingInterval);
          clearTimeout(maximumSafetyTimeout);

          // PHASE 4 START: Cap pipeline progress at full completion right before snapshot extraction
          setOverlayMessage("Compiling Premium Document PDF...");
          setOverlayProgress(100);

          // Give users brief visual satisfaction matching completion state before triggering tab prompt
          setTimeout(() => {
            executePdfDownload();
          }, 500);
        } else {
          // If the map is still compiling vectors, keep updating status alerts
          setOverlayMessage("Compiling GIS Render Maps...");
        }
      }, 200); 

      maximumSafetyTimeout = setTimeout(() => {
        console.warn("⚠️ Pipeline Timeout: GIS took too long to fire idle state. Proceeding with print.");
        clearInterval(pollingInterval);
        setOverlayMessage("Compiling Premium Document PDF...");
        setOverlayProgress(100);
        setTimeout(() => {
          executePdfDownload();
        }, 400);
      }, 6000);
    }

    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
      if (maximumSafetyTimeout) clearTimeout(maximumSafetyTimeout);
    };
  }, [printCanvasRef, hasAutoFired, isVerifying, accessDeniedMessage]);

  const executePdfDownload = async () => {
    if (!printCanvasRef.current || isVerifying || accessDeniedMessage) return;
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
      // Turn off full viewport overlay once the compilation flow settles completely
      setShowOverlay(false);
    }
  };

  // ──────────────────────────────────────────────────────────────────────
  // ⛔ CONDITIONAL SECURITY RENDER SCREENS
  // ──────────────────────────────────────────────────────────────────────
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
    <div className="rg-printer-root-canvas" style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", boxSizing: "border-box", paddingBottom: "160px" }}>
      
      {/* 🎯 THE MASTER LOADING SHIELD: Controls the entire generation timeline in a single component injection point */}
      <LoadingOverlay 
        isLoading={showOverlay} 
        progress={overlayProgress} 
        message={overlayMessage} 
      />

      {/* RETAINED LAYOUTS: UNTOUCHED 8.5x11 PDF PRINT CONFIGURATION BLOCKS */}
      <div ref={printCanvasRef} className="rg-print-capture-target" style={{ width: "816px", height: "1056px", position: "relative", backgroundColor: "#ffffff", boxSizing: "border-box", overflow: "hidden", margin: "40px auto 0 auto", padding: "0", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)" }}>
        <div style={{ transform: "scale(1)", transformOrigin: "top center", width: "816px", height: "1056px", position: "absolute", top: 0, left: 0 }}>
          <RouteReport_v3 routeID={routeID} />
        </div>
      </div>

      <div style={{ position: "fixed", bottom: "40px", left: "50%", transform: "translateX(-50%)", zIndex: 99999, display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", width: "auto" }}>
        <button
          onClick={executePdfDownload}
          disabled={isPrinting || isVerifying}
          style={{
            padding: "14px 40px", backgroundColor: (isPrinting || isVerifying) ? "#475569" : "var(--brand-amber)", color: "#ffffff", border: "1px solid rgba(255, 255, 255, 0.15)", borderRadius: "50px", fontWeight: "bold", fontSize: "14px", letterSpacing: "0.02em", cursor: (isPrinting || isVerifying) ? "not-allowed" : "pointer", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)", transition: "all 0.2s ease-in-out"
          }}
        >
          {isPrinting ? "GENERATING RIDEGUIDE PDF..." : "GENERATE PDF"}
        </button>
      </div>
    </div>
  );
}