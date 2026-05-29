/* src/App.tsx */
import { Routes, Route, useParams } from "react-router-dom";
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

        {/* 🛠️ ALIGNMENT FIX STYLE TAG */}
        <style>{`
          .rg-interactive-explorer-shell .rr-isolation-shell {
            padding: 0 !important;
            margin: 0 !important;
            background-color: transparent !important;
            width: auto !important;
            line-height: normal !important; /* Locks structural text node tracking from expanding boxes */
          }
          .rg-interactive-explorer-shell .rr-document-page {
            margin: 0 !important;
          }
          /* Removes pink test boundaries so production presentation interface looks perfectly clean */
          .rg-blueprint-overlay-canvas {
            border: none !important;
          }
        `}</style>
      </div>
    </div>
  );
}

/**
 * PrinterWrapper handles extracting the routeID from the URL
 * and passing it to the isolated PDF printer layer.
 */
function PrinterWrapper() {
  const { routeID } = useParams<{ routeID: string }>();
  return <RideGuidePrinter routeID={routeID || "28-2_S1"} />;
}

export default function App() {
  return (
    <>
      <Routes>
        {/* 🖨️ DETACHED ROOT ROUTE */}
        <Route path="/print/:routeID" element={<PrinterWrapper />} />

        {/* STANDARD CONSUMER WEB INTERFACE LAYOUT LOOP */}
        <Route
          path="/*"
          element={
            <div className="app-shell">
              <Header />
              <main className="page">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/trail-guides" element={<TrailGuides />} />
                  <Route path="/community" element={<Community />} />
                  
                  {/* COOPERATIVE DATA APP ROUTES */}
                  <Route path="/report/:routeID" element={<ReportWrapper />} />
                  <Route path="/route-report" element={<RouteReport_v3 routeID="28-2_S1" />} />
                </Routes>
              </main>
              <Footer />
            </div>
          }
        />
      </Routes>
      <UnlockModal />
    </>
  );
}