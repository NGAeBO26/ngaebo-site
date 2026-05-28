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
// Import the detached print wrapper container
import RideGuidePrinter from "./components/RideGuide/RideGuidePrinter";

/**
 * ReportWrapper handles extracting the routeID from the URL 
 * and passing it to the Production Report Unit.
 */
function ReportWrapper() {
  const { routeID } = useParams<{ routeID: string }>();
  return <RouteReport_v3 routeID={routeID || "28-2_S1"} />;
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
        {/* 🖨️ DETACHED ROOT ROUTE: Placed entirely outside the .app-shell wrapper!
            This ensures that no site-wide global flex, margin, or overflow rules 
            can touch, squish, or distort your print document metrics. */}
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