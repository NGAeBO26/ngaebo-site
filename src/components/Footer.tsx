/* src/components/Footer.tsx */
import { Link } from "react-router-dom";
import "../styles/Footer.css"; // Imports extracted class rules safely

export default function Footer() {
  return (
    <footer className="rg-site-footer">
      <div className="rg-footer-container">
        
        {/* 🎯 LEFT BLOCK: Clean Legal Anchor Navigation Arrays */}
        <div className="rg-footer-links-block">
          <Link to="/legals#terms" className="rg-footer-link">
            Terms & Conditions
          </Link>
          <Link to="/legals#privacy" className="rg-footer-link">
            Privacy Policy
          </Link>
          <Link to="/legals#affiliate" className="rg-footer-link">
            Affiliate Disclosure
          </Link>
        </div>

        {/* 🎯 RIGHT BLOCK: Mandated Ownership and License Delineation String */}
        <div className="rg-footer-copyright-text">
          © 2026 AdventureGeoLab LLC — Licensed to North Georgia eBike Outfitters LLC. All Rights Reserved.
        </div>

      </div>
    </footer>
  );
}