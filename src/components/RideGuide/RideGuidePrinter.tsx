/* src/components/RideGuide/RideGuidePrinter.tsx */
import { useRef, useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import { domToPng } from "modern-screenshot"; 
import RouteReport_v3 from "./RouteReport_v3"; 

interface RideGuidePrinterProps {
  routeID: string;
  customerID: string; // 🎯 Securely passed down from your logged-in Shopify context shell
}

export default function RideGuidePrinter({ routeID, customerID }: RideGuidePrinterProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [hasAutoFired, setHasAutoFired] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [accessDeniedMessage, setAccessDeniedMessage] = useState<string | null>(null);
  const printCanvasRef = useRef<HTMLDivElement>(null);

  // 🎯 LAYER 1: ABSOLUTELY ALIGN CORE PRINT RENDERING PROPERTIES
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

  // 🎯 LAYER 2: STATEFUL ACCOUNT VERIFICATION CHECK
  useEffect(() => {
    // Inside RideGuidePrinter.tsx -> Layer 2 useEffect hook
    const verifyOwnershipAccess = async () => {
      try {
        setIsVerifying(true);
        
        // 🎯 THE FIX: Extract the secure token parameter directly out of the active window URL
        const urlParams = new URLSearchParams(window.location.search);
        const activeSecureToken = urlParams.get("secureToken") || "";

        const response = await fetch("/api/tokens/verify-ownership", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            customerId: customerID, 
            routeId: routeID,
            secureToken: activeSecureToken // 🚀 Send the cryptographic signature token along
          })
        });
        const data = await response.json();

        if (!response.ok || !data.hasAccess) {
          setAccessDeniedMessage(data.error || "🚨 Access Denied: Invalid signature credentials.");
        } else {
          setAccessDeniedMessage(null);
        }
      } catch (err) {
        setAccessDeniedMessage("🚨 Identity Matrix Timeout: Failed connecting to authentication firewall.");
      } finally {
        setIsVerifying(false);
      }
    };

    if (customerID && routeID) {
      // Both tracking markers are fully present, run the validation checks safely
      verifyOwnershipAccess();
    } else if (!customerID) {
      // 🎯 SPA HYDRATION PROTECTION LAYER:
      // If customerID is missing on the first frame, hold the application in a loading state 
      // to give the Shopify context provider a window of time to parse active session cookies.
      setIsVerifying(true);
      
      // Setup a safety timeout: If after 2.5 seconds the context still hasn't 
      // populated a customer ID, we can safely assume they are truly logged out.
      const safetyAuthTimeout = setTimeout(() => {
        if (!customerID) {
          setAccessDeniedMessage("🚨 Identity Matrix Error: Missing tracking constraints. Please ensure you are logged into your account.");
          setIsVerifying(false);
        }
      }, 2500);

      // Clean up the timer instantly if the component unmounts or customerID populates early
      return () => clearTimeout(safetyAuthTimeout);
    }
  }, [customerID, routeID]);

  // 🎯 LAYER 3: VERIFICATION MAP HOOK CHECK & EVENT LISTENERS
  useEffect(() => {
    let pollingInterval: NodeJS.Timeout;
    let maximumSafetyTimeout: NodeJS.Timeout;

    // Strict Guard: Refuse to initialize the printer polling engines if user validation fails
    if (printCanvasRef.current && !hasAutoFired && !isPrinting && !isVerifying && !accessDeniedMessage) {
      setHasAutoFired(true);

      pollingInterval = setInterval(() => {
        const isMapRenderFinished = (window as any).mapLoaded === true;
        if (isMapRenderFinished) {
          console.log("✅ Map state tracking passed. Initiating snapshot compiler engine...");
          clearInterval(pollingInterval);
          clearTimeout(maximumSafetyTimeout);
          executePdfDownload();
        }
      }, 200); 

      maximumSafetyTimeout = setTimeout(() => {
        console.warn("⚠️ Pipeline Timeout: GIS took too long to fire idle state. Proceeding with print.");
        clearInterval(pollingInterval);
        executePdfDownload();
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
    }
  };

  // ──────────────────────────────────────────────────────────────────────
  // ⛔ CONDITIONAL SECURITY RENDER SCREENS
  // ──────────────────────────────────────────────────────────────────────
  if (isVerifying) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", color: "#ffffff", backgroundColor: "#0f172a", fontFamily: "sans-serif" }}>
        <h2>🔄 SECURE AUTHENTICATION GATE LOCK CHECKING...</h2>
      </div>
    );
  }

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
      <div ref={printCanvasRef} className="rg-print-capture-target" style={{ width: "816px", height: "1056px", position: "relative", backgroundColor: "#ffffff", boxSizing: "border-box", overflow: "hidden", margin: "40px auto 0 auto", padding: "0", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)" }}>
        <div style={{ transform: "scale(1)", transformOrigin: "top center", width: "816px", height: "1056px", position: "absolute", top: 0, left: 0 }}>
          <RouteReport_v3 routeID={routeID} />
        </div>
      </div>

      <div style={{ position: "fixed", bottom: "40px", left: "50%", transform: "translateX(-50%)", zIndex: 99999, display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", width: "auto" }}>
        <button
          onClick={executePdfDownload}
          disabled={isPrinting}
          style={{
            padding: "14px 40px", backgroundColor: isPrinting ? "#475569" : "var(--brand-amber)", color: "#ffffff", border: "1px solid rgba(255, 255, 255, 0.15)", borderRadius: "50px", fontWeight: "bold", fontSize: "14px", letterSpacing: "0.02em", cursor: isPrinting ? "not-allowed" : "pointer", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)", transition: "all 0.2s ease-in-out"
          }}
        >
          {isPrinting ? "GENERATING RIDEGUIDE PDF..." : "GENERATE PDF"}
        </button>
      </div>
    </div>
  );
}