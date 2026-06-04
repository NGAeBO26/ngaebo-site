/* src/components/RideGuide/RideGuidePrinter.tsx */
import { useRef, useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import { domToPng } from "modern-screenshot"; 
import RouteReport_v3 from "./RouteReport_v3"; 

export default function RideGuidePrinter({ routeID }: { routeID: string }) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [hasAutoFired, setHasAutoFired] = useState(false); // Tracks auto-execution gate state
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
      
      .rr-isolation-shell {
        padding: 0 !important;
        margin: 0 !important;
        background-color: transparent !important;
      }

      .rr-metrics-column-sidebar div,
      .rr-metrics-column-sidebar span,
      .rr-metrics-column-sidebar p {
        white-space: nowrap !important;
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

  // 🎯 NEW AUTOMATION LIFECYCLE CONTROLLER:
  // Monitors DOM attachment states and automatically kicks off the PDF compilation pipeline
  useEffect(() => {
    if (printCanvasRef.current && !hasAutoFired && !isPrinting) {
      setHasAutoFired(true); // Ensure it only targets the immediate initial compilation thread pass
      executePdfDownload();
    }
  }, [printCanvasRef, hasAutoFired]);

  const executePdfDownload = async () => {
    if (!printCanvasRef.current) return;
    setIsPrinting(true);
    window.scrollTo(0, 0);

    const mapInstance = (window as any).map;
    const originalDevicePixelRatio = window.devicePixelRatio;

    if (mapInstance) {
      console.log("🧭 Accessing WebGL pipeline to re-scale graphics canvas buffers for crisp high-DPI output...");
      Object.defineProperty(window, 'devicePixelRatio', {
        get: () => 3, 
        configurable: true
      });
      mapInstance.resize();
    }

    console.log("⏳ Syncing typography engine buffers...");
    await document.fonts.ready;

    // Give WebGL assets exactly 800ms to resolve all tiling parameters gracefully during automated loading states
    await new Promise((resolve) => setTimeout(resolve, 800));

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
      
      // 🎯 THE WEB BROWSER INTERACTION UPGRADE:
      // Compile raw data into a unique binary blob container object
      const blobString = pdf.output("bloburl");
      
      // Request the browser engine to natively spawn a new focus view panel containing the raw file object
      window.open(blobString, "_blank");

    } catch (error) {
      console.error("Critical error compiling layout export pass:", error);
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
        paddingBottom: "80px"
      }}
    >
      {/* HUD OVERLAY TRACKER: Left intact as a manual fallback control option */}
      <div style={{ position: "fixed", top: "20px", right: "20px", zIndex: 99999 }}>
        <button
          onClick={executePdfDownload}
          disabled={isPrinting}
          style={{
            padding: "12px 28px",
            backgroundColor: isPrinting ? "#64748b" : "#10b981", 
            color: "#ffffff",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            borderRadius: "6px",
            fontWeight: "bold",
            fontSize: "15px",
            cursor: "pointer",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)"
          }}
        >
          {isPrinting ? "GENERATING RIDEGUIDE PDF..." : "RE-GENERATE PDF"}
        </button>
      </div>

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
    </div>
  );
}