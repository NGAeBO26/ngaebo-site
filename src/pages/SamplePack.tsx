/* src/pages/SamplePack.tsx */
import SamplePackHero from "../components/RideGuide/SamplePackHero";
import DigitalProductShowcase from "../components/DigitalProductShowcase";
import FeaturedProducts from "../store/FeaturedProducts";
import TacticalLeadForm from "../components/TacticalLeadForm";

export default function SampleGiveaway() {
  return (
    <div className="sample-giveaway-funnel-container-shell" style={{ width: "100%", display: "block" }}>
      
      {/* ─── 🎯 FIX 1: PRIMARY LEVEL-ONE HEADING INFRASTRUCTURE ─── 
          Resolves page-has-heading-one. Keeps the root title perfectly legible 
          to screen readers while keeping it invisible on-screen. */}
      <h1 style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: '0',
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: '0'
      }}>
        Free Offline Backcountry Map Sample Pack and Tactical Field Guides
      </h1>

      {/* ─── SYSTEM CORE INJECTOR ─── */}
      <div className="sample-giveaway-funnel" style={{ width: "100%", display: "flex", flexDirection: "column" }}>
        
        {/* ─── 🎯 FIX 2: NAMED ACCESSIBILITY LANDMARK REGION ─── */}
        <section 
          className="featured-section-split-grid" 
          style={{ marginTop: "60px" }}
          aria-label="Backcountry Risk and Physics Overview"
        >
          <div className="featured-problem-block">
            <h2>The Backcountry is Unforgiving. Don't Rely on Guesswork.</h2>
          </div>
          <div className="featured-solution-block">
            <span className="featured-orange-tagline">Know Before You Go.</span>
            <p className="featured-narrative-p">
              Riding <strong>off-road eBikes</strong> through North Georgia's <strong>rugged backcountry</strong> demands <strong>precision planning</strong>. Unpredictable high-altitude weather means situations change quickly, which can <strong>drain your battery</strong>, alter the <strong>rolling resistance</strong> of native red clay dynamically, and blind valleys offer zero <strong>cellular safety nets</strong>. Our <strong>data-driven methodology</strong> evaluates difficulty and risk by modeling <strong>real-world physics</strong> calculations directly into <strong>weather-aware</strong> field guides—ensuring <strong>situational awareness</strong> before you head out.
            </p>
          </div>
        </section>

        {/* ─── ANCHOR JUMP-LINK PILL BANNER ─── */}
        <div className="rg-jump-banner-container">
          <button
            onClick={() => document.getElementById("free-samples-download")?.scrollIntoView({ behavior: "smooth" })}
            className="btn-jump-banner-pill"
          >
            {/* ─── 🎯 FIX 3: ESCAPE ICON NOISE FOR SCREEN READERS ─── */}
            Get Your Samples Now <span aria-hidden="true">↓</span>
          </button>
        </div>

        {/* ─── STEP 2: THE INTERACTIVE SYSTEM PROOF (Digital Showcase) ─── */}
        <DigitalProductShowcase mode="landing" intentTag="sample_pack_nurture" />

        {/* ─── 🎯 FIX 4: NAMED ACCESSIBILITY LANDMARK REGION ─── */}
        <section 
          className="featured-section-split-grid"
          aria-label="E-Bike Hardware Grade Optimization"
        >
          <div className="featured-problem-block">
            <h2>Serious Adventures Demand Premium Hardware.</h2>
          </div>
          <div className="featured-solution-block">
            <span className="featured-orange-tagline">Match Your Machine to the Grade.</span>
            <p className="featured-narrative-p">
              Tackling tough 12% grades in the gaps requires more than line choice—it demands the right equipment for the job. Review our curated selection of off-road electric bikes, and trail-tested accessories built to withstand rugged outdoor riding.
            </p>
          </div>
        </section>

        {/* ─── STEP 5: HARDWARE RET RETRIEVAL DECK ─── */}
        <FeaturedProducts />

        {/* ─── STEP 3: THE COMPILATION DOWNLOAD FULFILLMENT REWARD (Sample Pack Hero) ─── */}
        <div id="free-samples-download">
          <SamplePackHero />
        </div>

        {/* ─── SECTION 6: FULL-WIDTH NESTLED FOOTER SAFETY NET ─── */}
        {/* ─── 🎯 FIX 5: HYDRATE THE FOOTER LANDMARK REGION ─── */}
        <section 
          className="lead-capture-footer"
          aria-label="Newsletter Subscription Form"
          style={{
            width: "calc(100% + 40px)",
            marginLeft: "-20px",
            marginRight: "-20px",
            marginBottom: "-100px", 
            backgroundColor: "color-mix(in srgb, var(--brand-deep-green) 92%, #000000)", 
            padding: "48px 40px",
            boxSizing: "border-box",
            display: "block"
          }}
        >
          <div className="funnel-container" style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <div className="capture-split-layout" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "40px", flexWrap: "wrap" }}>
              
              <div className="capture-text-stack" style={{ flex: "1", minWidth: "280px", textAlign: "left" }}>
                <h3 style={{ margin: "0 0 8px 0", fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: "2rem", color: "#ffffff" }}>
                  Stay Up to Date.
                </h3>
                <p style={{ margin: 0, color: "#cbd5e1", fontSize: "0.95rem", lineHeight: 1.6 }}>
                  Stay ready for your next ride. Get the latest on deals, events, and new products. Delivered straight to your inbox.
                </p>
              </div>

              <div style={{ minWidth: "320px" }}>
                {/* Live Embedded Reusable Lead Form System */}
                <TacticalLeadForm 
                  buttonLabel="Sign Up ➔"
                  sourceGroupTag="home_footer_checklist"
                  layout="row"
                />
              </div>

            </div>
          </div>
        </section>

      </div>
    </div>
  );
}