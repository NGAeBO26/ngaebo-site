/* src/pages/Legals.tsx */
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import "../styles/Legals.css"; 
import TacticalLeadForm from "../components/TacticalLeadForm";

export default function Legals() {
  const { hash } = useLocation();

  // 🎯 SPA HASH SCROLL ANCHOR UTILITY: Forces browser layouts to drop precisely down to target IDs
  useEffect(() => {
    if (hash) {
      const element = document.getElementById(hash.replace("#", ""));
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [hash]);

  const lastUpdatedDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  return (
    /* ─── 🎯 FIX 1: SWAPPED DIV TO MAIN LANDMARK REGION ─── 
       This completely resolves the landmark 'region' violation on the legals track */
    <main className="rg-legals-page-fluid-shell" style={{ paddingTop: "40px" }}>
      
      {/* DOCUMENT CARD CONTAINER: Keeps policies perfectly centered at 800px max width */}
      <div className="rg-legals-central-canvas" style={{ marginBottom: "60px" }}>
        <header className="rg-legals-header">
          <h1 className="rg-legals-title">Legal Disclosures & Policies</h1>
          <p className="rg-legals-date">Last Updated: {lastUpdatedDate}</p>
          <p className="rg-legals-meta">
            IP Owner: AdventureGeoLab LLC | Operator: North Georgia eBike Outfitters LLC
          </p>
        </header>

        {/* ──────────────────────────────────────────────────────────────────
            SECTION 1: TERMS & CONDITIONS
            ────────────────────────────────────────────────────────────────── */}
        {/* ─── 🎯 FIX 2: BIND LARGE SECTIONS TO UNAMBIGUOUS HEADING LABELS ─── */}
        <section id="terms" className="rg-legals-section-large" aria-labelledby="terms-main-title">
          <h2 id="terms-main-title" className="rg-legals-heading-2">1. Terms & Conditions</h2>
          
          <h3 className="rg-legals-heading-3">1.1 Ownership & Licensing Structure</h3>
          <p className="rg-legals-body-text">
            This website (the “Site”), including all RideGuide digital products, FS‑road mapping data, spatial analytics, elevation profiles, and all related intellectual property, is owned exclusively by <strong>AdventureGeoLab LLC</strong>. AdventureGeoLab LLC licenses the Site and RideGuide digital products to <strong>North Georgia eBike Outfitters LLC</strong>, which operates the Site and sells or distributes licensed digital products to end users. By using the Site or purchasing digital products, you acknowledge this ownership and licensing structure.
          </p>

          <h3 className="rg-legals-heading-3">1.2 Acceptance of Terms</h3>
          <p className="rg-legals-body-text">
            By accessing or using the Site, purchasing digital products, or interacting with affiliate links, you agree to these Terms & Conditions (“Terms”). If you do not agree, discontinue use of the Site.
          </p>

          <h3 className="rg-legals-heading-3">1.3 Use of the Website</h3>
          <p className="rg-legals-body-text">
            You agree not to copy, scrape, or reproduce content; attempt to bypass security or access restricted areas; misuse affiliate links or manipulate tracking; or use the Site for unlawful purposes. AdventureGeoLab LLC and North Georgia eBike Outfitters LLC may suspend or terminate access for violations.
          </p>

          <h3 className="rg-legals-heading-3">1.4 Intellectual Property Rights</h3>
          <p className="rg-legals-body-text">
            All content on this Site—including RideGuide digital products, spatial analytics, FS‑road maps, elevation profiles, graphics, branding, and written materials—is the exclusive property of AdventureGeoLab LLC. North Georgia eBike Outfitters LLC operates under a license and does not transfer ownership of any intellectual property to end users. You may not reproduce, distribute, modify, or republish any content without written permission from AdventureGeoLab LLC.
          </p>

          <h3 className="rg-legals-heading-3">1.5 Digital Product License (End Users)</h3>
          <p className="rg-legals-body-text">
            When you purchase a digital product, you receive a non-exclusive, non-transferable, revocable license for personal use only, granted by AdventureGeoLab LLC and distributed by North Georgia eBike Outfitters LLC. You may not resell, redistribute files, share them publicly or privately, repackage them into commercial products, or claim ownership or authorship. Violations may result in license termination and legal action.
          </p>

          <h3 className="rg-legals-heading-3">1.6 Digital Product Delivery & Access</h3>
          <p className="rg-legals-body-text">
            Digital products are delivered instantly via download link or email. For support, contact <a href="mailto:support@northgeorgiaebikes.com" className="rg-legals-link">
                   support@northgeorgiaebikes.com
                 </a>.
          </p>

          <h3 className="rg-legals-heading-3">1.7 Digital Product Refund Policy</h3>
          <p className="rg-legals-body-text">
            Because digital products are delivered instantly and cannot be returned, <strong>all sales are final</strong>. Refunds are only issued if a file is corrupted or a download link fails and cannot be restored. We do not offer refunds for change of mind, incorrect purchase, or device incompatibility.
          </p>

          <h3 className="rg-legals-heading-3">1.8 Payment Terms</h3>
          <p className="rg-legals-body-text">
            All payments are processed securely through third‑party providers. We do not store payment information. You agree to provide accurate billing information, authorize charges to your payment method, and resolve disputes directly with your payment provider if needed.
          </p>

          <h3 className="rg-legals-heading-3">1.10 Mapping, Terrain, and Safety Disclaimer</h3>
          <div className="rg-legals-safety-box">
            RideGuide digital products, FS‑road maps, and spatial analytics are provided for informational purposes only. We do not guarantee the accuracy of terrain data, road conditions, safety of any route, or suitability for your equipment or skill level. Outdoor activities involve inherent risks. You assume all responsibility for your safety and decisions. Nothing on this Site constitutes professional, legal, safety, or engineering advice. All content is informational and provided “as‑is.”
          </div>

          <h3 className="rg-legals-heading-3">1.11 Limitation of Liability</h3>
          <p className="rg-legals-body-text">
            To the fullest extent permitted by law, AdventureGeoLab LLC and North Georgia eBike Outfitters LLC are not liable for direct, indirect, incidental, or consequential damages; loss of data, profits, or business; injuries or accidents related to outdoor activities; errors or omissions in digital products or mapping data; or issues arising from affiliate purchases. Your use of the Site and products is at your own risk.
          </p>

          <h3 className="rg-legals-heading-3">1.12 DMCA / Copyright Policy</h3>
          <p className="rg-legals-body-text">
            If you believe your copyrighted material has been used improperly, send a DMCA notice to <a href="mailto:support@northgeorgiaebikes.com" className="rg-legals-link">
                   support@northgeorgiaebikes.com
                 </a> with the subject line <em>"DMCA Takedown Request"</em>, including contact information, work description, and standard good-faith legal statements.
          </p>

          <h3 className="rg-legals-heading-3">1.13 Governing Law & Changes</h3>
          <p className="rg-legals-body-text">
            These Terms are governed by the laws of the State of Georgia, without regard to conflict-of-law principles. We may update these Terms at any time. Continued use of the Site constitutes acceptance of the updated Terms.
          </p>
        </section>

        {/* ──────────────────────────────────────────────────────────────────
            SECTION 2: PRIVACY POLICY
            ────────────────────────────────────────────────────────────────── */}
        {/* ─── 🎯 FIX 3: BIND LARGE SECTIONS TO UNAMBIGUOUS HEADING LABELS ─── */}
        <section id="privacy" className="rg-legals-section-large" aria-labelledby="privacy-main-title">
          <h2 id="privacy-main-title" className="rg-legals-heading-2">2. Privacy Policy</h2>
          <p className="rg-legals-body-text">
              AdventureGeoLab LLC owns and operates the Site. North Georgia eBike Outfitters LLC operates the customer‑facing brand under license. We are committed to safeguarding your information.
          </p>
          <p className="rg-legals-body-text">
              We collect limited personal information such as email addresses when you subscribe or authenticate, analytics telemetry performance benchmarks, cookies, and tracking pixels to process order lifecycles smoothly. We do not sell personal data to third parties.
          </p>

          {/* 🎯 COMPLIANCE ADDITION: Data Erasure Rights Vector */}
          <h3 className="rg-legals-heading-3-dark">2.1 Your Privacy Choices & Data Erasure Rights</h3>
          <p className="rg-legals-body-text">
              Depending on your state or country of residence, you may possess explicit legal rights to inspect, limit, or permanently delete the personal information we have collected about you. 
          </p>
          <p className="rg-legals-body-text">
              To execute an official Right-to-Know request or to instruct us to permanently purge your user metadata from our internal ordering logs and upstream marketing notification lists, please send a structured request to our security inbox at: <a href="mailto:privacy@northgeorgiaebikes.com" className="rg-legals-link">
                   privacy@northgeorgiaebikes.com
                 </a>. We will process and confirm your request free of charge within 30 days of receipt.
          </p>
        </section>

        {/* ──────────────────────────────────────────────────────────────────
            SECTION 3: AFFILIATE DISCLOSURE
            ────────────────────────────────────────────────────────────────── */}
        {/* ─── 🎯 FIX 4: BIND LARGE SECTIONS TO UNAMBIGUOUS HEADING LABELS ─── */}
        <section id="affiliate" className="rg-legals-section-small" aria-labelledby="affiliate-main-title">
          <h2 id="affiliate-main-title" className="rg-legals-heading-2">3. Affiliate Disclosure (FTC Compliance)</h2>
          <p className="rg-legals-body-text">
            This Site contains affiliate links. When you click these links and make a purchase, we may earn a commercial commission at no additional cost to you. We only recommend products we believe provide value, but we do not control or guarantee any third‑party products, services, or policies.
          </p>
          <p className="rg-legals-body-text">
            When you click an affiliate link, you are leaving our Site and entering a third‑party website. You acknowledge that we do not own or operate affiliate products; are not responsible for shipping, returns, warranties, or customer service; and that partner specifications can modify without notice. AdventureGeoLab LLC and North Georgia eBike Outfitters LLC are not liable for any damages or issues arising from third‑party purchases.
          </p>
        </section>
      </div>
      
      {/* 🚀 SECTION 6: THE FOOTER SAFETY NET (Now spans edge-to-edge effortlessly) */}
      <section className="lead-capture-footer" aria-label="Footer Registration Lead Capture">
        <div className="funnel-container">
          <div className="capture-split-layout">
            <div className="capture-text-stack">
              <h3 style={{ margin: "0 0 8px 0", fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: "1.65rem" }}>
                Get Your Free Sample Pack.
              </h3>
              <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.95rem", lineHeight: 1.5 }}>
                Planning your bike's maiden voyage? We've mapped out the ultimate 3-pack sample of our favorite Fire Service Road routes, perfect for eBike adventures. Instant download package delivered to your email.
              </p>
            </div>
            <div>
              {/* Live Embedded Reusable Lead Form System */}
              <TacticalLeadForm 
                buttonLabel="Get Free Maps"
                sourceGroupTag="home_footer_checklist"
                layout="row"
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}