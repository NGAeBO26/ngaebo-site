import { useState, useEffect } from "react";
import "../styles/CookieBanner.css";

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    // Check local storage setting to preserve user preference history
    const consent = localStorage.getItem("ngaebo_cookie_consent");
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("ngaebo_cookie_consent", "accepted");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div 
      className="rg-cookie-banner-container" 
      role="region" 
      aria-label="Cookie Tracking Notice"
    >
      <div className="rg-cookie-banner-content">
        <div className="rg-cookie-banner-heading">
          <img 
            className="rg-cookie-img" 
            alt="Cookie Icon" 
            src="/data/assets/icon_cookie.svg" 
          />
          Cookie Tracking Notice
        </div>

        <p className="rg-cookie-banner-description">
          This website uses cookies to improve the user experience. By using our website 
          you consent to all cookies in accordance with our privacy policy.
        </p>

        <div className="rg-cookie-banner-actions">
          <a href="/legals#privacy" className="rg-cookie-banner-privacy-link">
            Review Privacy Policy ➔
          </a>
          <button 
            onClick={handleAccept} 
            className="rg-cookie-banner-accept-btn"
          >
            Accept &amp; Continue
          </button>
        </div>
      </div>
    </div>
  );
}