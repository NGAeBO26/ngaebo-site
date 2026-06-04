/* src/App.tsx */
import { Routes, Route, useParams, useSearchParams } from "react-router-dom"; // 🎯 Added useSearchParams
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import TrailGuides from "./pages/TrailGuides";
import Community from "./pages/Community";

// Modal system
import UnlockModal from "./components/modal/UnlockModal";
import RouteReport_v3 from "./components/RideGuide/RouteReport_v3";
import RideGuidePrinter from "./components/RideGuide/RideGuidePrinter";

// Tracking canvas layer
import TelemetryOverlayTracker from "./components/RideGuide/TelemetryOverlayTracker";

/**
 * ReportWrapper handles extracting the routeID from the URL 
 * and layer-aligning both the master blueprint card and the 
 * transparent tracking grid to the exact same relative origin.
 */
function ReportWrapper() {
  const { routeID } = useParams<{ routeID: string }>();
  
  return (
    <div 
      className="rg-interactive-explorer-shell"
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        padding: "40px 0",
        backgroundColor: "#f4f1eb",
        boxSizing: "border-box"
      }}
    >
      <div 
        style={{ 
          position: "relative", 
          width: "215.9mm", 
          height: "279.4mm",
          overflow: "visible"
        }}
      >
        <RouteReport_v3 routeID={routeID || "28-2_S1"} />
        <TelemetryOverlayTracker />

        {/* ALIGNMENT FIX STYLE TAG */}
        <style>{`
          .rg-interactive-explorer-shell .rr-isolation-shell {
            padding: 0 !important;
            margin: 0 !important;
            background-color: transparent !important;
            width: auto !important;
            line-height: normal !important;
          }
          .rg-interactive-explorer-shell .rr-document-page {
            margin: 0 !important;
          }
          .rg-blueprint-overlay-canvas {
            border: none !important;
          }
        `}</style>
      </div>
    </div>
  );
}

/**
 * 🎯 NEW EXTRACTION WRAPPER:
 * Safely reads the live URL parameter context *after* React Router resolves 
 * the sub-navigation match tree, passing the real selected routeID directly to the component.
 */
function IframeReportWrapper() {
  const { routeID } = useParams<{ routeID: string }>();
  return <RouteReport_v3 routeID={routeID || "28-2_S1"} />;
}

function PrinterWrapper() {
  const { routeID } = useParams<{ routeID: string }>();
  return <RideGuidePrinter routeID={routeID || "28-2_S1"} />;
}

/**
 * 🖨️ NEW TRANSACTIONAL DOWNLOAD GATEWAY WRAPPER:
 * Extracts '?routeID=XXXX_XX' out of query string parameters 
 * and mounts the standalone high-DPI PDF generation print layout engine.
 */
function DownloadGuideWrapper() {
  const [searchParams] = useSearchParams();
  const routeID = searchParams.get("routeID");

  if (!routeID) {
    return (
      <div style={{ color: "white", textAlign: "center", padding: "80px", fontFamily: "sans-serif" }}>
        <h2>Invalid Asset Link</h2>
        <p style={{ color: "#9ca3af" }}>We couldn't detect a valid route ID parameter in your request link.</p>
      </div>
    );
  }

  return <RideGuidePrinter routeID={routeID} />;
}

export default function App() {
  // Inspect URL parameters at the top-level execution thread
  const isIframePreviewActive = typeof window !== "undefined" && 
    new URLSearchParams(window.location.search).get("preview") === "true";

  return (
    <>
      <Routes>
        {/* 🖨️ DETACHED ROOT ROUTES (Bypasses headers, footers, and marketing layouts entirely) */}
        <Route path="/print/:routeID" element={<PrinterWrapper />} />
        
        {/* 🎯 THE MISSING DOWNLOAD PATH ROUTE: Connects your MailerSend download buttons directly to the printing engine */}
        <Route path="/download-guide" element={<DownloadGuideWrapper />} />

        {/* STANDARD CONSUMER WEB INTERFACE LAYOUT LOOP */}
        <Route
          path="/*"
          element={
            isIframePreviewActive ? (
              /* IFRAME PREVIEW CANVAS MODE (Bypasses parent headers/footers/margins) */
              <main className="page iframe-preview-clean-canvas" style={{ padding: 0, margin: 0, backgroundColor: "#ffffff" }}>
                <Routes>
                  {/* 🎯 THE DYNAMIC ROUTE CORRECTION: Swapped out the direct inline useParams loop for our parameter extraction wrapper */}
                  <Route path="/report/:routeID" element={<IframeReportWrapper />} />
                  <Route path="/route-report" element={<RouteReport_v3 routeID="28-2_S1" />} />
                </Routes>
              </main>
            ) : (
              /* STANDARD FULL WEB EXPERIENCE SHELL CONTAINER */
              <div className="app-shell">
                <Header />
                <main className="page">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/trail-guides" element={<TrailGuides />} />
                    <Route path="/community" element={<Community />} />
                    
                    {/* STANDARD MASTER REPORT DETAILS LAYOUT VIEWPORTS */}
                    <Route path="/report/:routeID" element={<ReportWrapper />} />
                    <Route path="/route-report" element={<RouteReport_v3 routeID="28-2_S1" />} />
                  </Routes>
                </main>
                <Footer />
              </div>
            )
          }
        />
      </Routes>
      <UnlockModal />
    </>
  );
}