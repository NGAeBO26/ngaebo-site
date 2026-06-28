/* src/components/RideGuide/SamplePackHero.tsx */
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

  return (
    <section className="rg-sample-hero-section">
      
      {/* 🎯 RESOLVED: Flex layout holds h1 components and logo inline on a single line */}
      <div className="rg-sample-hero-title-block">
        <h1>Your Free</h1> 
        <img
          src="/images/RideGuide_embroid-v1.svg"
          alt="RideGuide Logo"
          className="showcase-brand-logo"
        /> 
        <h1>Sample Pack</h1>        
      </div>

      {/* ASYMMETRICAL PORTRAIT SPREAD GRID CONTAINER */}
      <div className="rg-sample-tabletop-grid">
        {sampleRoutes.map((route) => (
          <div 
            key={route.id}
            className={`rg-sample-card-frame ${route.frameClass}`}
            onClick={() => handleOpenPdf(route.pdfUrl)}
            title={`Open printable ${route.title} field guide in a new tab`}
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
              <span>✓ {route.highlightText}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ─── 🎯 RESOLVED HITBOX ACCESS ROW ─── */}
      <div className="rg-sample-actions-distribution-row">
        {sampleRoutes.map((route) => (
          <div key={`action-link-${route.id}`} className="rg-individual-action-column">
            <button
              onClick={() => handleOpenPdf(route.pdfUrl)}
              className="btn-premium-sample-cta"
              title={`Download transparent vector maps template file for ${route.title}`}
            >
              Get {route.shortName} Map ➔
            </button>
          </div>
        ))}
      </div>

      {/* 🎯 RESOLVED: Paragraph moved underneath triggers with dedicated footer utility styling */}
      <p className="rg-sample-hero-footer-text">
        Your sample field maps are ready for download! Click any sample image or button above to explore your first RideGuide!
      </p>
      
    </section>
    
    
  );
}