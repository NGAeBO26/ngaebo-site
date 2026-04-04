

import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import TrailGuides from "./pages/TrailGuides";
import Community from "./pages/Community";



// Modal system
import UnlockModal from "./components/modal/UnlockModal";

export default function App() {
  return (
    <div className="app-shell">
      <Header />

      <main className="page">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/trail-guides" element={<TrailGuides />} />
          <Route path="/community" element={<Community />} />
        </Routes>
      </main>

      <Footer />

      {/* Global modal mount point */}
      <UnlockModal />
    </div>
  );
}