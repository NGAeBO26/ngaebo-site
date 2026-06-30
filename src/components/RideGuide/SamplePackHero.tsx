/* src/components/RideGuide/SamplePackHero.tsx */
import React from "react";
import "../../styles/SamplePackHero.css";

export default function SamplePackHero() {
  const sampleRoutes = [
    {
      id: "nimblewill",
      title: "FS 28-2 Nimblewill",
      shortName: "Nimblewill",
      thumbnail: "/data/assets/sample_pack/thumbnails/FS_NIMBLEWILL_SAMPLE.png",
      pdfUrl: "/data/assets/sample_pack/FS_28_2_NIMBLEWILL.pdf",
      frameClass: "card-nimblewill",
      highlightText: "Weather Aware"
    },
    {
      id: "dicks-creek",
      title: "FS 34 Dicks Creek",
      shortName: "Dicks Creek",
      thumbnail: "/data/assets/sample_pack/thumbnails/FS_DICKSCREEK_SAMPLE.png",
      pdfUrl: "/data/assets/sample_pack/FS_34_DICKS_CREEK.pdf",
      frameClass: "card-dicks-creek",
      highlightText: "Physics Engine"
    },
    {
      id: "williams-gap",
      title: "FS 346 Williams Gap",
      shortName: "Williams Gap",
      thumbnail: "/data/assets/sample_pack/thumbnails/FS_WILLIAMSGAP_SAMPLE.png",
      pdfUrl: "/data/assets/sample_pack/FS_346_WILLIAMS_GAP.pdf",
      frameClass: "card-williams-gap",
      highlightText: "Route Conditions"
    }
  ];

  const handleOpenPdf = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  /* ─── 🎯 FIX 1: KEYBOARD NAVIGATION FOR CLICKABLE CARDS ─── 
     Allows non-mouse users to activate the maps using Enter or Spacebar */
  const handleKeyDown = (e: React.KeyboardEvent, url: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleOpenPdf(url);
    }
  };

  return (
    <section className="rg-sample-hero-section">
      
      {/* ─── 🎯 FIX 2: UNIFIED HEADING TREE ─── 
          Consolidates the title into a single semantic <h2> layout block 
          (since SamplePack.tsx now holds the primary hidden <h1>). 
          The embedded logo image uses inline text-equivalent formatting. */}
      <div className="rg-sample-hero-title-block">
        <h2 className="rg-sample-hero-heading-text">
          Your Free{" "}
          <img
            src="/images/RideGuide_embroid-v1.svg"
            alt="RideGuide"
            className="showcase-brand-logo"
          />{" "}
          Sample Pack
        </h2>        
      </div>

      {/* ASYMMETRICAL PORTRAIT SPREAD GRID CONTAINER */}
      <div className="rg-sample-tabletop-grid">
        {sampleRoutes.map((route) => (
          <div 
            key={route.id}
            className={`rg-sample-card-frame ${route.frameClass}`}
            onClick={() => handleOpenPdf(route.pdfUrl)}
            
            /* ─── 🎯 FIX 3: INJECT CORE INTERACTIVE ATTRIBUTES ─── */
            role="button"
            tabIndex={0}
            onKeyDown={(e) => handleKeyDown(e, route.pdfUrl)}
            aria-label={`Open and print ${route.title} field guide layout sheet`}
          >
            <div className="rg-sample-thumbnail-box">
              <img 
                src={route.thumbnail} 
                alt={`${route.title} Field Guide Preview`} 
                className="rg-sample-thumbnail-img"
                onError={(e) => { e.currentTarget.src = "/data/assets/RideGuide_Sample.png"; }}
              />
            </div>

            {/* Verdant Feature Highlights Panel */}
            <div className="rg-sample-bottom-verdant-pill">
              {/* ─── 🎯 FIX 4: MASK THE RAW GLYPH CHARACTER ─── */}
              <span><span aria-hidden="true">✓</span> {route.highlightText}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ─── RESOLVED HITBOX ACCESS ROW ─── */}
      <div className="rg-sample-actions-distribution-row">
        {sampleRoutes.map((route) => (
          <div key={`action-link-${route.id}`} className="rg-individual-action-column">
            <button
              onClick={() => handleOpenPdf(route.pdfUrl)}
              className="btn-premium-sample-cta"
              title={`Download transparent vector maps template file for ${route.title}`}
            >
              {/* ─── 🎯 FIX 5: ESCAPE ARROW AUDIO OVERHEAD ─── */}
              Get {route.shortName} Map <span aria-hidden="true">➔</span>
            </button>
          </div>
        ))}
      </div>

      {/* Paragraph moved underneath triggers with dedicated footer utility styling */}
      <p className="rg-sample-hero-footer-text">
        Your sample field maps are ready for download! Click any sample image or button above to explore your first RideGuide!
      </p>
      
    </section>
  );
}