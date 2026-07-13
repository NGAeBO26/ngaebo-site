/* src/components/Header.tsx */
import { useState } from "react";
import { useShopifyAuth } from "../store/ShopifyAuthContext";
import { useShopifyCart } from "../store/ShopifyCartContext";
import CartDropdown from "./CartDropdown"; 
import "../styles/Header.css"; 

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileCartExpanded, setMobileCartExpanded] = useState(false); /* 🎯 Inline mobile cart state toggle anchor */
  const { login, logout, isAuthenticated, customer, isLoading: authLoading } = useShopifyAuth();
  const { cartCount, isCartOpen, setIsCartOpen } = useShopifyCart();

  const isCartActive = isCartOpen;
  const currentPath = typeof window !== "undefined" ? window.location.pathname : "";

  return (
    <header className="site-header">
      {/* Logo */}
      <img
        src="/images/site-logo.png"
        alt="North Georgia Outdoor eBikes"
        className="site-logo"
      />

      {/* MOBILE-ONLY BRAND HEADER TITLE */}
      <div className="mobile-header-brand-title">
        <span className="brand-title-line1">North Georgia</span>
        <span className="brand-title-line2">eBike Outfitters</span>
      </div>

      {/* Desktop Navigation */}
      <nav className="nav-desktop">
        
        <div className="nav-desktop-links-wrapper">
          <div className="nav-desktop-links-track">
            <a href="/" className="nav-link">Home</a>
            <a href="/rides" className="nav-link">RideGuides</a>
            <a href="/shop" className="nav-link">Shop</a>
            <a href="/about" className="nav-link">About Us</a>
          </div>
        </div>

        {/* SHIELDED SHOPIFY IDENTITY GATEWAY LAYER (DESKTOP) */}
        {!authLoading && (
          <div className={`rg-header-user-capsule ${isCartActive ? "rg-capsule-active" : ""}`}>
            
            {/* 🎯 POSITION 1: Far Left Greeting Name Text Block */}
            <span className="rg-header-greeting-text">
              {isAuthenticated && customer?.firstName ? `Hi, ${customer.firstName}` : "Hi, Guest"}
            </span>

            {/* 🎯 POSITION 2: Center-Left Inline Sign In / Sign Out Action Trigger */}
            {isAuthenticated ? (
              <button 
                onClick={logout} 
                className="rg-header-signout-btn nav-link"
              >
                Sign Out
              </button>
            ) : (
              <button 
                onClick={login} 
                className="rg-header-signout-btn nav-link"
              >
                Sign In
              </button>
            )}

            {/* 🎯 POSITION 3: Center-Right Headless Cart Trigger Box (With Floating Badge) */}
            <button 
              onClick={() => setIsCartOpen(!isCartOpen)}
              className="rg-header-cart-trigger"
              aria-label="Toggle Cart View"
            >
              {/* 🎯 UPDATED: Changed stroke to point to your brand cream variable */}
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="var(--brand-cream)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

            {/* 🎯 POSITION 4: Far Right Directional Indicator Status Arrow Menu Button */}
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

            {/* Desktop Popover Sheet Surface */}
            <CartDropdown isOpen={isCartActive} />
          </div>
        )}
      </nav>

      {/* Mobile Menu Toggle */}
      <button
        className="mobile-menu-toggle"
        onClick={() => {
          setMobileOpen(!mobileOpen);
          setMobileCartExpanded(false); /* Clear active sub-toggles when menu unmounts */
        }}
        aria-label="Toggle mobile menu"
      >
        <span className="mobile-menu-bar" />
        <span className="mobile-menu-bar" />
        <span className="mobile-menu-bar" />
      </button>

      {/* Mobile Menu Panel */}
      {mobileOpen && (
        <nav className="nav-mobile">
          {/* 🎯 CONVERTED: Dynamically checks the current url coordinates to inject active-destination classes */}
          <a 
            href="/" 
            className={`nav-mobile-link ${currentPath === "/" ? "active-destination" : ""}`} 
            onClick={() => setMobileOpen(false)}
          >
            Home
          </a>
          <a 
            href="/rides" 
            className={`nav-mobile-link ${currentPath === "/rides" ? "active-destination" : ""}`} 
            onClick={() => setMobileOpen(false)}
          >
            RideGuides
          </a>
          <a 
            href="/shop" 
            className={`nav-mobile-link ${currentPath === "/shop" ? "active-destination" : ""}`} 
            onClick={() => setMobileOpen(false)}
          >
            Shop
          </a>
          <a 
            href="/about" 
            className={`nav-mobile-link ${currentPath === "/about" ? "active-destination" : ""}`} 
            onClick={() => setMobileOpen(false)}
          >
            About Us
          </a>

          {/* SHIELDED SHOPIFY IDENTITY GATEWAY LAYER (MOBILE) */}
          {!authLoading && (
            <div className="rg-mobile-nav-user-block-wrapper">
              <div 
                className={`rg-mobile-nav-user-row ${mobileCartExpanded ? "mod-expanded" : ""}`}
                onClick={() => setMobileCartExpanded(!mobileCartExpanded)}
                role="button"
                aria-label="Toggle Mobile Shopping Cart"
              >
                <span className="rg-mobile-nav-username">
                  {isAuthenticated && customer?.firstName ? `Hi, ${customer.firstName}` : "Hi, Guest"}
                </span>

                {isAuthenticated ? (
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      logout(); 
                      setMobileOpen(false); 
                      setMobileCartExpanded(false); 
                    }} 
                    className="rg-mobile-inline-auth-btn"
                  >
                    Sign Out
                  </button>
                ) : (
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      login(); 
                    }} 
                    className="rg-mobile-inline-auth-btn"
                  >
                    Sign In
                  </button>
                )}

                <div className="rg-mobile-nav-cart-icon-box">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                  </svg>
                  {cartCount > 0 && (
                    <span className="rg-header-cart-badge mobile-inline-badge">
                      {cartCount}
                    </span>
                  )}
                </div>

                <div className="rg-header-toggle-arrow-btn">
                  <svg 
                    className={`rg-header-toggle-arrow-svg ${mobileCartExpanded ? "active" : ""}`} 
                    width="10" 
                    height="10" 
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 21l-12-18h24z" />
                  </svg>
                </div>
              </div>

              {mobileCartExpanded && (
                <div className="rg-mobile-nav-cart-accordion-content">
                  <CartDropdown isOpen={true} isMobile={true} />
                </div>
              )}
            </div>
          )}
        </nav>
      )}
    </header>
  );
}