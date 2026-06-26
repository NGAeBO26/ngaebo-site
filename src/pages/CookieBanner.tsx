/* src/components/CookieBanner.tsx */
import { useState, useEffect } from "react";
import "../styles/CookieBanner.css"; // Imports centralized styles directly

export default function CookieBanner() {
  const [hasConsented, setHasConsented] = useState<boolean>(true);

  useEffect(() => {
    // Check if the client has already cleared the tracking confirmation barrier
    const existingConsent = localStorage.getItem("rg_cookie_consent");
    if (existingConsent !== "true") {
      setHasConsented(false);
    }
  }, []);

  const handleAcceptance = () => {
    localStorage.setItem("rg_cookie_consent", "true");
    setHasConsented(true);
  };

  if (hasConsented) return null;

  return (
    <div className="rg-cookie-banner-overlay">
      <div>
        {/* 🎯 THE FIX: Extracted the redundant span so Flexbox aligns the img and text node perfectly as siblings */}
        <h4 className="rg-cookie-banner-heading">
          <img src="/data/assets/icon_cookie.svg" className="rg-cookie-img" alt="Cookies" />
          Cookie Tracking Notice
        </h4>
        <p className="rg-cookie-banner-description">
          This website uses cookies to improve the user experience. By using our website you consent to all cookies in accordance with our privacy policy.
        </p>
      </div>
      <div className="rg-cookie-banner-actions-panel">
        <a href="/legals#privacy" className="rg-cookie-banner-privacy-link">
          Review Privacy Policy ➔
        </a>
        <button 
          onClick={handleAcceptance}
          className="rg-cookie-banner-accept-btn"
        >
          Accept & Continue
        </button>
      </div>
    </div>
  );
}