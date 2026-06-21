/* src/components/Header.tsx */
import { useState } from "react";
import { useShopifyAuth } from "../store/ShopifyAuthContext";
import { useShopifyCart } from "../store/ShopifyCartContext";
import CartDropdown from "./CartDropdown"; 
import "../styles/Header.css"; // Link our style definitions explicitly

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { login, logout, isAuthenticated, customer, isLoading: authLoading } = useShopifyAuth();
  const { cartCount, isCartOpen, setIsCartOpen } = useShopifyCart();

  const isCartActive = isCartOpen && isAuthenticated;

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
        
        {/* Transition slide hooks mapped to a semantic layout modifier class */}
        <div className="nav-desktop-links-wrapper">
          <div className="nav-desktop-links-track">
            <a href="/" className="nav-link">Home</a>
            <a href="/rides" className="nav-link">RideGuides</a>
            <a href="/shop" className="nav-link">Shop</a>
            <a href="#pillars" className="nav-link">Our Mission</a>
          </div>
        </div>

        {/* 🔒 SHIELDED SHOPIFY IDENTITY GATEWAY LAYER (DESKTOP) */}
        {!authLoading && (
          isAuthenticated ? (
            /* Enclosure blocks completely offloaded onto Header.css */
            <div className={`rg-header-user-capsule ${isCartActive ? "rg-capsule-active" : ""}`}>
              
              <span className="rg-header-greeting-text">
                Hi, {customer?.firstName || "Rider"}
              </span>

              {/* 🛒 Headless Cart Icon Toggle Link Trigger */}
              <button 
                onClick={() => setIsCartOpen(!isCartOpen)}
                className="rg-header-cart-trigger"
                aria-label="Toggle Cart View"
              >
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                {cartCount > 0 && (
                  <span className="rg-header-cart-badge">
                    {cartCount}
                  </span>
                )}
              </button>

              <button 
                onClick={logout} 
                className="rg-header-signout-btn nav-link"
              >
                Sign Out
              </button>

              {/* 🎯 NEW: Moved arrow action trigger up to the header line to the right of Sign Out */}
              <button
                onClick={() => setIsCartOpen(!isCartOpen)}
                className="rg-header-toggle-arrow-btn"
                aria-label="Toggle Cart View Menu"
              >
                <svg 
                  className={`rg-header-toggle-arrow-svg ${isCartActive ? "active" : ""}`} 
                  width="10" 
                  height="10" 
                  viewBox="0 0 24 24"
                >
                  <path d="M12 21l-12-18h24z" />
                </svg>
              </button>

              {/* STATE ENGINE ROUTER DROPDOWN HOOK */}
              <CartDropdown isOpen={isCartActive} />
            </div>
          ) : (
            <button 
              onClick={login} 
              className="nav-link" 
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0, font: "inherit", marginLeft: "14px" }}
            >
              Sign In
            </button>
          )
        )}
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
          <a href="/rides" className="nav-mobile-link" onClick={() => setMobileOpen(false)}>
            RideGuides
          </a>
          <a href="/shop" className="nav-mobile-link" onClick={() => setMobileOpen(false)}>
            Shop
          </a>
          <a href="#pillars" className="nav-mobile-link" onClick={() => setMobileOpen(false)}>
            Our Mission
          </a>

          {/* 🔒 SHIELDED SHOPIFY IDENTITY GATEWAY LAYER (MOBILE) */}
          {!authLoading && (
            isAuthenticated ? (
              <>
                <div style={{ padding: "12px 16px 12px 16px", borderTop: "1px solid #334155", marginTop: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "14px", fontWeight: "600", color: "#cbd5e1" }}>Hi, {customer?.firstName}</span>
                  
                  <button 
                    onClick={() => { setIsCartOpen(!isCartOpen); setMobileOpen(false); }}
                    style={{ background: "none", border: "none", color: "#cbd5e1", display: "flex", alignItems: "center", cursor: "pointer", padding: 0 }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="9" cy="21" r="1"></circle>
                      <circle cx="20" cy="21" r="1"></circle>
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                  </button>
                </div>
                <button 
                  onClick={() => { logout(); setMobileOpen(false); }} 
                  className="nav-mobile-link" 
                  style={{ background: "none", border: "none", textAlign: "left", width: "100%", cursor: "pointer", font: "inherit", paddingTop: "0" }}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button 
                onClick={login} 
                className="nav-mobile-link" 
                style={{ background: "none", border: "none", textAlign: "left", width: "100%", cursor: "pointer", font: "inherit", borderTop: "1px solid #334155", marginTop: "8px", paddingTop: "12px" }}
              >
                Sign In
              </button>
            )
          )}
        </nav>
      )}
    </header>
  );
}