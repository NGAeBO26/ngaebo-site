import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import TrailGuides from "./pages/TrailGuides";

export default function App() {
  return (
    <div className="app-shell">
      <Header />

      <main className="page">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/trail-guides" element={<TrailGuides />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}