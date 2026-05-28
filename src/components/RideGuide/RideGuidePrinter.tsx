/* src/components/RideGuide/RideGuidePrinter.tsx */
import { useRef, useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import { domToPng } from "modern-screenshot"; 
import RouteReport_v3 from "./RouteReport_v3"; // Pristine Stock Imported Completely Intact

export default function RideGuidePrinter({ routeID }: { routeID: string }) {
  const [isPrinting, setIsPrinting] = useState(false);
  const printCanvasRef = useRef<HTMLDivElement>(null);

  // 🎯 LIFECYCLE CSS INJECTION RUNTIME HOTFIX LAYER
  useEffect(() => {
    const origHtmlMargin = document.documentElement.style.margin;
    const origHtmlPadding = document.documentElement.style.padding;
    const origBodyMargin = document.body.style.margin;
    const origBodyPadding = document.body.style.padding;
    const origBg = document.body.style.backgroundColor;

    const styleElement = document.createElement("style");
    styleElement.id = "rg-printer-absolute-alignment-hotfix";
    styleElement.innerHTML = `
      /* Nuke default browser margins, paddings, and parent flexbox layout constraints */
      html, body, #root, .app-shell, main.page, .rg-printer-root-canvas {
        margin: 0 !important;
        margin-top: 0 !important;
        padding: 0 !important;
        padding-top: 0 !important;
        height: auto !important;
        min-height: 0 !important;
        max-height: none !important;
        overflow: visible !important;
        display: block !important;
      }
      
      /* Override the stock isolation container 40px padding creep */
      .rr-isolation-shell {
        padding: 0 !important;
        margin: 0 !important;
        background-color: transparent !important;
      }

      /* 🎯 FIX: EFFORT TAX WRAPPING HOTFIX
         Prevents font tracking metrics from forcing side-by-side text/percentages down onto two lines */
      .rr-metrics-column-sidebar div,
      .rr-metrics-column-sidebar span,
      .rr-metrics-column-sidebar p {
        white-space: nowrap !important;
      }

      body {
        background-color: #0f172a !important; /* Premium dark slate backdrop for clear page tracing boundaries */
      }
    `;
    document.head.appendChild(styleElement);

    return () => {
      // Safely dismantle layout overrides when user navigates away from the print view path
      document.documentElement.style.margin = origHtmlMargin;
      document.documentElement.style.padding = origHtmlPadding;
      document.body.style.margin = origBodyMargin;
      document.body.style.padding = origBodyPadding;
      document.body.style.backgroundColor = origBg;

      const existing = document.getElementById("rg-printer-absolute-alignment-hotfix");
      if (existing) existing.remove();
    };
  }, []);

  const executePdfDownload = async () => {
    if (!printCanvasRef.current) return;
    setIsPrinting(true);
    window.scrollTo(0, 0);

    // 🎯 FIX: MAP CANVAS BLUR HIGH-DPI UP-SAMPLING PASS
    // Capture the current global window MapLibre application context instance initialized in RouteMap.tsx
    const mapInstance = (window as any).map;
    const originalDevicePixelRatio = window.devicePixelRatio;

    if (mapInstance) {
      console.log("🧭 Accessing WebGL pipeline to re-scale graphics canvas buffers for crisp high-DPI output...");
      
      // Override browser context to force maximum vector and resolution compilation density arrays
      Object.defineProperty(window, 'devicePixelRatio', {
        get: () => 3, // Upsamples calculations to crisp 300+ DPI equivalent quality parameters
        configurable: true
      });
      
      // Fire an internal map container resize command to force the immediate rendering redraw pass
      mapInstance.resize();
    }

    // 🎯 FONT LAYER SYNCHRONIZATION: Force compiler to wait until typography sets are completely cached in memory
    console.log("⏳ Syncing typography engine buffers...");
    await document.fonts.ready;

    // Give the map runtime pipeline exactly 400ms to redraw its topographic tile frames seamlessly
    await new Promise((resolve) => setTimeout(resolve, 400));

    try {
      // Rasterize the target container nodes
      const dataUrl = await domToPng(printCanvasRef.current, {
        scale: 3, // Super-samples text elements and structural vectors to match crisp map layers
        backgroundColor: "#ffffff",
        width: 816,
        height: 1056
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [816, 1056] // Locks 1:1 mapping coordinates down perfectly
      });

      pdf.addImage(dataUrl, "PNG", 0, 0, 816, 1056);
      pdf.save(`RideGuide_FS_${routeID}.pdf`);
    } catch (error) {
      console.error("Critical error compiling layout export pass:", error);
    } finally {
      // 🛠️ CLEANUP: Restore browser window variables instantly to protect system memory and prevent viewport lags
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
        paddingBottom: "80px"
      }}
    >
      {/* FLOATING HUD ACTION CONTROL PANEL OVERLAY TRIGGER */}
      <div style={{ position: "fixed", top: "20px", right: "20px", zIndex: 99999 }}>
        <button
          onClick={executePdfDownload}
          disabled={isPrinting}
          style={{
            padding: "12px 28px",
            backgroundColor: "#10b981", 
            color: "#ffffff",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            borderRadius: "6px",
            fontWeight: "bold",
            fontSize: "15px",
            cursor: "pointer",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)"
          }}
        >
          {isPrinting ? "COMPILING HIGH-RES MAP GRAPHICS..." : "DOWNLOAD PRINTABLE PDF"}
        </button>
      </div>

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
          margin: "40px auto 0 auto", // Visual placement margin for clean monitor display previewing
          padding: "0",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)"
        }}
      >
        {/* Your calculation layout runs at standard scale configuration matrix parameters */}
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
    </div>
  );
}