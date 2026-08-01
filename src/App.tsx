/* src/App.tsx */

import { Routes, Route, useParams } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";

// APPLICATION INTENT-DRIVEN MULTI-PAGE WORKSPACES
import Home from "./pages/Home";
import RideGuide from "./pages/RideGuide"; 
import BikeFinder from "./pages/BikeFinder";
import Shop from "./pages/Shop";
import Community from "./pages/Community";
import RedirectGateway from "./pages/RedirectGateway"; 
import DownloadGuide from "./pages/DownloadGuide";
import Legals from "./pages/Legals";
import SampleGiveaway from "./pages/SamplePack"; 
import AboutUs from "./pages/AboutUs";

// SHOPIFY CUSTOMER AUTHENTICATION INFRASTRUCTURE
import { ShopifyAuthProvider, useShopifyAuth } from "./store/ShopifyAuthContext";
import { ShopifyCartProvider } from "./store/ShopifyCartContext"; 
import AccountCallback from "./pages/AccountCallback";

// Modal system
import UnlockModal from "./components/modal/UnlockModal";
import RouteReport_v3 from "./components/RideGuide/RouteReport_v3";
import RideGuidePrinter from "./components/RideGuide/RideGuidePrinter";
import CookieBanner from "./pages/CookieBanner";

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
  const { customer } = useShopifyAuth(); 
  
  return <RideGuidePrinter routeID={routeID || "28-2_S1"} customerID={customer?.id || ""} />;
}

export default function App() {
  
  const isIframePreviewActive = typeof window !== "undefined" && 
    new URLSearchParams(window.location.search).get("preview") === "true";

  

  return (
    <ShopifyAuthProvider>
      <ShopifyCartProvider>
        <Routes>
          {/* DETACHED OPERATIONAL SYSTEM PATHS */}
          <Route path="/print/:routeID" element={<PrinterWrapper />} />
          <Route path="/download-guide" element={<DownloadGuide />} />
          <Route path="/account/callback" element={<AccountCallback />} />
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
              ) : (
                /* 🎯 UNIFIED LANDMARK MATRIX LAYER: Wraps all pages in the primary layout wrapper, 
                   ensuring the <Header /> renders everywhere while remaining fully accessible. */
                <>
                  <Header />
                  <main className="page" style={{ flex: 1 }} aria-label="North Georgia Outfitters Consumer Portal">
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/rides" element={<RideGuide />} />
                      <Route path="/shop" element={<Shop />} />
                      <Route path="/about" element={<AboutUs />} />
                      <Route path="/bikes" element={<BikeFinder />} />
                      <Route path="/community" element={<Community />} />
                      <Route path="/legals" element={<Legals />} />
                      <Route path="/samples" element={<SampleGiveaway />} />
                      
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
        <CookieBanner />
      </ShopifyCartProvider>
    </ShopifyAuthProvider>
  );
}