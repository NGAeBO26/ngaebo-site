import { useState } from "react";

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="site-header">
      {/* Logo */}
      <img
        src="/images/site-logo.png"
        alt="North Georgia Outdoor eBikes"
        className="site-logo"
      />

      {/* Desktop Navigation */}
  <nav className="nav-desktop">
  <a href="/" className="nav-link">Home</a>
  <a href="/trail-guides" className="nav-link">Trail Guides</a>
  <a href="#pillars" className="nav-link">Our Mission</a>
</nav>

      {/* Mobile Menu Toggle */}
      <button
        className="mobile-menu-toggle"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle mobile menu"
      >
        <span className="mobile-menu-bar" />
        <span className="mobile-menu-bar" />
        <span className="mobile-menu-bar" />
      </button>

      {/* Mobile Menu Panel */}
      {mobileOpen && (
        <nav className="nav-mobile">
          <a href="/" className="nav-mobile-link" onClick={() => setMobileOpen(false)}>
            Home
          </a>
          <a href="/trail-guides" className="nav-mobile-link" onClick={() => setMobileOpen(false)}>
            Trail Guides
          </a>
          <a href="#pillars" className="nav-mobile-link" onClick={() => setMobileOpen(false)}>
            Our Mission
          </a>
        </nav>
      )}
    </header>
  );
}