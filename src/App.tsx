/* src/App.tsx */
import { Routes, Route, useParams } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import TrailGuides from "./pages/TrailGuides";
import Community from "./pages/Community";

// Modal system
import UnlockModal from "./components/modal/UnlockModal";
// Updated import to ensure we point to the correct Analytics feature location
import RouteReport_v3 from "./components/RideGuide/RouteReport_v3";

/**
 * ReportWrapper handles extracting the routeID from the URL 
 * and passing it to the Production Report Unit.
 */
function ReportWrapper() {
  const { routeID } = useParams<{ routeID: string }>();
  return <RouteReport_v3 routeID={routeID || "28-2_S1"} />;
}

export default function App() {
  return (
    <div className="app-shell">
      <Header />
      <main className="page">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/trail-guides" element={<TrailGuides />} />
          <Route path="/community" element={<Community />} />
          
          {/* DYNAMIC JIT ROUTE */}
          <Route path="/report/:routeID" element={<ReportWrapper />} />
          
          {/* Legacy route for direct testing */}
          <Route path="/route-report" element={<RouteReport_v3 routeID="28-2_S1" />} />
        </Routes>
      </main>
      <Footer />
      <UnlockModal />
    </div>
  );
}