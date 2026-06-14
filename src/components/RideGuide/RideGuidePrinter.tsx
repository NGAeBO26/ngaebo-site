/* src/components/RideGuide/RideGuidePrinter.tsx */
import { useRef, useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import { domToPng } from "modern-screenshot"; 
import RouteReport_v3 from "./RouteReport_v3"; 

export default function RideGuidePrinter({ routeID }: { routeID: string }) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [hasAutoFired, setHasAutoFired] = useState(false);
  const printCanvasRef = useRef<HTMLDivElement>(null);

  // 🎯 CORE RENDERING COMPATIBILITY SPECIFICATION SHEET LAYER
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
      
      .rr-isolation-shell {
        padding: 0 !important;
        margin: 0 !important;
        background-color: transparent !important;
      }

      /* 🟢 PREVENT SIDEBAR CRADLE LAYOUT ROUNDING WRAP CHECKS */
      .rr-metrics-column-sidebar div,
      .rr-metrics-column-sidebar span,
      .rr-metrics-column-sidebar p {
        white-space: nowrap !important;
      }

      /* 🟢 COUPLING SELECTORS: PREVENT ALL WEATHER TEXT NODES FROM WRAPPING/SHIFTING IN PDF */
      /* Targets condition labels, temp fields, and precipitation rows to guarantee inline horizontal centering */
      .rr-weather-condition-node,
      .rr-weather-condition-label,
      .rr-weather-temp-node,
      .rr-weather-precip-node {
        white-space: nowrap !important;
        display: block !important;
        width: 100% !important;          /* Extends bounding box full width to support alignment calculations */
        max-width: none !important;
        text-align: center !important;    /* Forces absolute horizontal centering vectors */
        margin-left: auto !important;
        margin-right: auto !important;
        overflow: visible !important;
      }

      /* Ensure parent box parameters inherit sub-pixel layout overflow bounds */
      .rr-widget-weather-root,
      .rr-overview-module {
        overflow: visible !important;
        display: flex !important;         /* Preserves active widget flexbox model templates */
        flex-direction: column !important;
        align-items: center !important;
      }

      body {
        background-color: #0f172a !important; 
      }
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

  // 🎯 VERIFICATION POLL CONSOLE ENGINE
  useEffect(() => {
    let pollingInterval: NodeJS.Timeout;
    let maximumSafetyTimeout: NodeJS.Timeout;

    if (printCanvasRef.current && !hasAutoFired && !isPrinting) {
      setHasAutoFired(true);

      pollingInterval = setInterval(() => {
        // Query the MapLibre engine to see if the vector layer compilation task has gone idle
        const isMapRenderFinished = (window as any).mapLoaded === true;
        
        if (isMapRenderFinished) {
          console.log("✅ Map state tracking passed. Initiating snapshot compiler engine...");
          clearInterval(pollingInterval);
          clearTimeout(maximumSafetyTimeout);
          executePdfDownload();
        }
      }, 200); 

      // 6-second safety timeout limits prevent absolute loops if map assets time out
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
  }, [printCanvasRef, hasAutoFired]);

  const executePdfDownload = async () => {
    if (!printCanvasRef.current) return;
    setIsPrinting(true);
    window.scrollTo(0, 0);

    const mapInstance = (window as any).map;
    const originalDevicePixelRatio = window.devicePixelRatio;

    if (mapInstance) {
      Object.defineProperty(window, 'devicePixelRatio', {
        get: () => 3, // Upsamples device metrics to eliminate card and text rasterization blur
        configurable: true
      });
      mapInstance.resize();
    }

    await document.fonts.ready;
    // Buffer delay allows the WebGL map frame loop to redraw perfectly inside the new 3x boundary limits
    await new Promise((resolve) => setTimeout(resolve, 600));

    // ==========================================================================
    // 🔍 INTERACTIVE LAYOUT BREAKPOINT DEBUGGER
    // ==========================================================================
    // Open your browser DevTools (F12) BEFORE hitting "Generate PDF".
    // Execution will freeze right here! Go inspect the weather widget elements.
    debugger;

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

  return (
    <div 
      className="rg-printer-root-canvas"
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        boxSizing: "border-box",
        paddingBottom: "160px" // Adds clear layout spacing for your floating HUD panel
      }}
    >
      {/* 🗺️ FIXED RIGID PRINT PAGE SHEET CANVAS BOUNDS */}
      <div
        ref={printCanvasRef}
        className="rg-print-capture-target"
        style={{
          width: "816px",    
          height: "1056px",  
          position: "relative",
          backgroundColor: "#ffffff",
          boxSizing: "border-box",
          overflow: "hidden",
          margin: "40px auto 0 auto", 
          padding: "0",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)"
        }}
      >
        <div style={{
          transform: "scale(1)", 
          transformOrigin: "top center",
          width: "816px",
          height: "1056px",
          position: "absolute",
          top: 0,
          left: 0
        }}>
          <RouteReport_v3 routeID={routeID} />
        </div>
      </div>

      {/* 🎯 FLOATING CONTROLLER HUD: Perfectly centered at the bottom of the viewport */}
      <div 
        style={{ 
          position: "fixed", 
          bottom: "40px", 
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 99999, // Guarantees this overlay layer is excluded from the target snapshot node elements
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "10px",
          width: "auto"
        }}
      >
        <button
          onClick={executePdfDownload}
          disabled={isPrinting}
          style={{
            padding: "14px 40px",
            backgroundColor: isPrinting ? "#475569" : "#10b981", 
            color: "#ffffff",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            borderRadius: "50px", 
            fontWeight: "bold",
            fontSize: "14px",
            letterSpacing: "0.02em",
            cursor: isPrinting ? "not-allowed" : "pointer",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)",
            transition: "all 0.2s ease-in-out"
          }}
        >
          {isPrinting ? "GENERATING RIDEGUIDE PDF..." : "GENERATE PDF"}
        </button>
      </div>
    </div>
  );
}