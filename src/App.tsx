/* src/App.tsx */
import { Routes, Route, useParams, useSearchParams, useLocation } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";

// APPLICATION INTENT-DRIVEN MULTI-PAGE WORKSPACES
import Home from "./pages/Home";
import RideGuide from "./pages/RideGuide"; 
import BikeFinder from "./pages/BikeFinder";
import Shop from "./pages/Shop";
import Community from "./pages/Community";
import RedirectGateway from "./pages/RedirectGateway"; // NEW TRANSITION COMPONENT IMPORT

// Modal system
import UnlockModal from "./components/modal/UnlockModal";
import RouteReport_v3 from "./components/RideGuide/RouteReport_v3";
import RideGuidePrinter from "./components/RideGuide/RideGuidePrinter";

// Tracking canvas layer
import TelemetryOverlayTracker from "./components/RideGuide/TelemetryOverlayTracker";

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

function IframeReportWrapper() {
  const { routeID } = useParams<{ routeID: string }>();
  return <RouteReport_v3 routeID={routeID || "28-2_S1"} />;
}

function PrinterWrapper() {
  const { routeID } = useParams<{ routeID: string }>();
  return <RideGuidePrinter routeID={routeID || "28-2_S1"} />;
}

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
  const location = useLocation();
  const isIframePreviewActive = typeof window !== "undefined" && 
    new URLSearchParams(window.location.search).get("preview") === "true";

  // Check page identity contexts
  const isShopPage = location.pathname.toLowerCase() === "/shop";
  const isGatewayPage = location.pathname.toLowerCase() === "/redirect-gateway"; // CAPTURE GATEWAY IDENTITY

  return (
    <>
      <Routes>
        {/* DETACHED OPERATIONAL SYSTEM PATHS */}
        <Route path="/print/:routeID" element={<PrinterWrapper />} />
        <Route path="/download-guide" element={<DownloadGuideWrapper />} />
        
        {/* ISOLATED COMPLIANCE PIPELINE REDIRECT GATEWAY ROUTE:
           Bypasses standard site layouts entirely so it acts as an autonomous sandbox canvas tab */}
        <Route path="/redirect-gateway" element={<RedirectGateway />} />

        {/* STANDARD CONSUMER WEB INTERFACE LAYOUT ROUTING CONTAINER */}
        <Route
          path="/*"
          element={
            isIframePreviewActive ? (
              <main className="page iframe-preview-clean-canvas" style={{ padding: 0, margin: 0, backgroundColor: "#ffffff" }}>
                <Routes>
                  <Route path="/report/:routeID" element={<IframeReportWrapper />} />
                  <Route path="/route-report" element={<RouteReport_v3 routeID="28-2_S1" />} />
                </Routes>
              </main>
            ) : isShopPage ? (
              <Routes>
                <Route path="/shop" element={<Shop />} />
              </Routes>
            ) : isGatewayPage ? (
              /* Fallback safety capture node context path logic protection */
              <Routes>
                <Route path="/redirect-gateway" element={<RedirectGateway />} />
              </Routes>
            ) : (
              /* STANDARD GLOBAL TEMPLATE FRAME FOR REMAINING COMPONENT MAPPINGS */
              <>
                <Header />
                <main className="page" style={{ flex: 1 }}>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/rides" element={<RideGuide />} />
                    <Route path="/bikes" element={<BikeFinder />} />
                    <Route path="/community" element={<Community />} />
                    <Route path="/report/:routeID" element={<ReportWrapper />} />
                    <Route path="/route-report" element={<RouteReport_v3 routeID="28-2_S1" />} />
                  </Routes>
                </main>
                <Footer />
              </>
            )
          }
        />
      </Routes>
      <UnlockModal />
    </>
  );
}