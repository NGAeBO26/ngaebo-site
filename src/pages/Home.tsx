/* src/pages/Home.tsx */

import FeaturedProducts from "../store/FeaturedProducts";
import TacticalLeadForm from "../components/TacticalLeadForm";
import DigitalProductShowcase from "../components/DigitalProductShowcase"; 
import "./Home.css";

export default function Home() {
  // Telemetry Conic Arc Math Loops
  const elevFill = (754 / 1500) * 100;
  const elevEmptyStart = 100 - Math.min(100, Math.max(0, elevFill));
  const gradeFill = (18.6 / 45) * 100;
  const gradeEmptyStart = 100 - Math.min(100, Math.max(0, gradeFill));

  return (
    <div className="page funnel-landing-page">

      {/* SECTION 1: HERO SPLIT & FOCUS (Above the Fold) */}
      {/* ─── 🎯 FIX 1: DEFINE LANDMARK REGION SCOPE ─── */}
      <section className="hero-funnel-section" aria-label="Introduction and Telemetry HUD Dashboard">
        <div className="funnel-container">
          <div className="hero-split-layout">
            
            <div className="hero-content-stack">
              <h1 className="hero-home-title">
                Master the Backcountry.<br /> Ride with Confidence.
              </h1>
              <h2 className="hero-tagline-blue">
                Plan Faster. Ride Smarter.
              </h2>
              <p className="hero-text">
                Unlock precision off-road eBike flight charts and field maps. Featuring custom meteorological modeling, high-accuracy terrain profile tracking, and real-world physics engine calculators, you'll always know trail requirements before you leave the staging area.
              </p>
              <div className="hero-actions-stack">
                <a href="/rides" className="btn btn-funnel-main">
                  Get the Ultimate RideGuide
                </a>
                <a href="/shop" className="btn btn-funnel-sub">
                  Shop Vetted Gear
                </a>
              </div>
            </div>

            <div className="hero-visual-block">
              <div className="hud-console-header-pill">
                <img src="/images/RideGuide_embroid-v1.svg" alt="RideGuide System Logo" className="hud-console-logo-asset" />
                <div className="hud-header-text-aligner">
                  <h3 className="hud-pipeline-title">...PIPELINE INITIALIZED...</h3>
                  <div className="hud-pipeline-checklist">
                    <span>...WEATHER API SYNC ✓</span>
                    <span>...DIGITER ELEVATION MODEL ACTIVE ✓</span>
                    <span>...PHYSICS ENGINE ENGAGED ✓</span>
                  </div>
                </div>
              </div>

              <div className="hero-hud-3x3-container">
                <div className="hud-center-radar-anchor">
                  <div className="hud-spider-wrapper">
                    <span className="hud-axis-label axis-top">Vertical Tax</span>
                    <span className="hud-axis-label axis-right-side">Slip Hazard</span>
                    <span className="hud-axis-label axis-right-bottom">Energy Drain</span>
                    <span className="hud-axis-label axis-left-bottom">Exposure</span>
                    <span className="hud-axis-label axis-left-side">Isolation</span>
                    <span className="hud-axis-label axis-center-title">Risk Radar</span>
                    <img src="/data/visualization/17A_S1_spider.svg" className="svg-size-risk-radar" alt="Risk Radar Chart" />
                  </div>
                </div>

                <div className="hud-quadrant-card cell-top-left">
                  <div>
                    <div className="hud-panel-label">Meteorological Model Active..</div>
                    <div className="hud-panel-title">Prime Ride Time</div>
                  </div>
                  <div className="hero-metric-inline-card-centered">
                    <img src="/data/joyscores/83_S1_joy_dial.svg" className="svg-size-joy-dial" alt="Joy Score Dial" />
                  </div>
                </div>

                <div className="hud-quadrant-card cell-top-right">
                  <div>
                    <div className="hud-panel-label">Analyzing Terrain.......</div>
                    <div className="hud-panel-title">Elevation Profile</div>
                  </div>
                  <div className="hero-metric-inline-card-centered">
                    <img src="/data/sparklines/54A_S1_sparkline.svg" className="svg-size-sparkline" alt="Terrain Elevation Profile" />
                  </div>
                </div>

                <div className="hud-quadrant-card cell-bottom-left">
                  <div>
                    <div className="hud-panel-label">Running Physics Engine ...</div>
                    <div className="hud-panel-title">Effort Intensity Gauge</div>
                  </div>
                  <div className="hero-metric-inline-card-centered hud-padded-intensity-box">
                    <img src="/data/effortgauges/83_S1_effort_tax.svg" className="svg-size-effort-gauge" alt="Effort Intensity Gauge Meter" />
                  </div>
                </div>

                <div className="hud-quadrant-card cell-bottom-right">
                  <div>
                    <div className="hud-panel-label">Generating Route Statistics.....</div>
                    <div className="hud-panel-title">Route Metrics</div>
                  </div>
                  <div className="hero-metric-flex-bay">
                    <div className="hero-metric-inline-card">
                      <div className="hero-dial-wrapper">
                        <div className="hero-dial-arc" style={{ background: `conic-gradient(from 180deg, #e0e0e0 0% ${elevEmptyStart}%, #d88a3a ${elevEmptyStart}% 100%)`, transform: 'scaleX(-1)' }}></div>
                        <div className="hero-dial-mask">
                          <img src="/data/assets/icon_gain_arrow.svg" className="hero-dial-icon" alt="Elevation Gain" />
                        </div>
                      </div>
                      <div>
                        <div className="hud-metric-readout-bold">754 ft</div>
                        <div className="hud-metric-label-micro">Elevation Gain</div>
                      </div>
                    </div>

                    <div className="hero-metric-inline-card">
                      <div className="hero-dial-wrapper">
                        <div className="hero-dial-arc" style={{ background: `conic-gradient(from 180deg, #e0e0e0 0% ${gradeEmptyStart}%, #c0392b ${gradeEmptyStart}% 100%)`, transform: 'scaleX(-1)' }}></div>
                        <div className="hero-dial-mask">
                          <img src="/data/assets/icon_grade.svg" className="hero-dial-icon" alt="Average Grade" />
                        </div>
                      </div>
                      <div>
                        <div className="hud-metric-readout-bold">18.6%</div>
                        <div className="hud-metric-label-micro">Average Grade</div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      <hr className="funnel-divider" />

      {/* SECTION 2: THE CORE PROBLEM / VALUE HOOK */}
      {/* ─── 🎯 FIX 2: DEFINE LANDMARK REGION SCOPE ─── */}
      <section className="problem-hook-section" aria-label="Backcountry Challenges Overview">
        <div className="funnel-container">
          <div className="problem-split-grid">
            <div className="problem-challenge-block">
              <h2>The Backcountry is Unforgiving. Don't Rely on Guesswork.</h2>
            </div>
            <div className="problem-solution-block">
              <span className="problem-tagline-amber">Know Before You Go.</span>
              <p>
                Riding <span className="txt-bold-heavy">off-road eBikes</span> through North Georgia's <span className="txt-bold-heavy">rugged backcountry </span>demands <span className="txt-bold-heavy">precision planning</span>. Unpredictable high-altitude weather means situations change quickly, which can <span className="txt-bold-heavy">drain your battery</span>, alter the <span className="txt-bold-heavy">rolling resistance</span> of native red clay dynamically, and blind valleys offer zero <span className="txt-bold-heavy">cellular safety nets.</span> Our <span className="txt-bold-heavy">data-driven methodology</span> evaluates difficulty and risk by modeling <span className="txt-bold-heavy">real-world physics </span> calculations directly into <span className="txt-bold-heavy">weather-aware</span> field guides—ensuring <span className="txt-bold-heavy">situational awareness</span> before you head out.
              </p>
            </div>
          </div>
        </div>
      </section>

      <hr className="funnel-divider" />
    
      <DigitalProductShowcase mode="landing" />
        
      <hr className="funnel-divider" />

      {/* ─── 🎯 FIX 3: DEFINE LANDMARK REGION SCOPE ─── */}
      <section className="problem-hook-section" aria-label="Curated Adventure Hardware Breakdown">
        <div className="funnel-container">
          <div className="problem-split-grid">
            <div className="problem-challenge-block">
              <h2>Vetted Adventure-Ready Equipment for Cargo, Safety, Comfort and More.</h2>
            </div>
            <div className="problem-solution-block">
              <span className="problem-tagline-amber">Accessories and Gear selected specifically for off-road adventures.</span>
              <p>Our curated selection of <span className="txt-bold-heavy">outdoor-proven gear </span>is hand selected for the backcountry trails across North Georgia. These <span className="txt-bold-heavy">featured items </span>aren't just compatible—they are <span className="txt-bold-heavy">capable, durable </span> and built to survive deep <span className="txt-bold-heavy">off-road expeditions</span>, ensuring your mechanical and electrical configurations hold out when situations change rapidly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: CURATED SHARED ECOSYSTEM GRID CARD MATRIX */}
      <FeaturedProducts 
        sectionTitle="Vetted Backcountry Equipment"
        sectionSubtitle="Tested components optimized specifically for North Georgia gap profiles."
      />

      <hr className="funnel-divider" />

      {/* 🏛️ SECTION 5: TRUST & AUTHORITY MATRIX */}
      {/* ─── 🎯 FIX 4: DEFINE LANDMARK REGION SCOPE ─── */}
      <section className="trust-authority-matrix" aria-label="Brand Mission and Stewardship Authority">
        <div className="funnel-container">
          
          <div className="authority-pillars-row matrix-columns-layout">
            
            {/* CARD 1: COMMUNITY BUILDING */}
            <a href="/community" className="authority-cell-link-card" aria-label="Explore our community building efforts">
              <div className="authority-cell layout-vertical-stack">
                <div className="authority-icon-container">
                  <img 
                    src="/images/icons/community.png" 
                    alt="" /* Decorative icon inside link text header layout remains empty to prevent double voicing */
                    className="authority-pillar-icon"
                  />
                </div>
                {/* ─── 🎯 FIX 5: RECONCILED HEADING WEIGHT STEPS (h5 -> h3) ─── */}
                <h3>Community Building</h3>
                <p>We connect North Georgia riders with group rides, route intel, and a crew that actually knows the mountains.</p>
              </div>
            </a>

            {/* CARD 2: RIDER EDUCATION */}
            <a href="/community" className="authority-cell-link-card" aria-label="Learn about rider education programs">
              <div className="authority-cell layout-vertical-stack">
                <div className="authority-icon-container">
                  <img 
                    src="/images/icons/education.png" 
                    alt="" 
                    className="authority-pillar-icon"
                  />
                </div>
                {/* ─── 🎯 FIX 6: RECONCILED HEADING WEIGHT STEPS (h5 -> h3) ─── */}
                <h3>Rider Education</h3>
                <p>We help riders understand terrain, slope, weather windows, and equipment choices so every outing feels intentional and safe.</p>
              </div>
            </a>

            {/* CARD 3: LOCAL PARTNERSHIPS */}
            <a href="/community" className="authority-cell-link-card" aria-label="View local partnership actions">
              <div className="authority-cell layout-vertical-stack">
                <div className="authority-icon-container">
                  <img 
                    src="/images/icons/partnerships.png" 
                    alt="" 
                    className="authority-pillar-icon"
                  />
                </div>
                {/* ─── 🎯 FIX 7: RECONCILED HEADING WEIGHT STEPS (h5 -> h3) ─── */}
                <h3>Local Partnerships</h3>
                <p>We collaborate with shops, land stewards, and regional outdoor groups to strengthen access and trail stewardship across North Georgia.</p>
              </div>
            </a>

          </div>
          
          {/* RESTORED SOCIAL PROOF HIGHLIGHT BLOCK */}
          <div className="social-proof-strip">
            <blockquote className="social-quote-reset">
              "Our goal is to provide the most reliable and up-to-date information, alongside vetted gear recommendations for riders exploring the backcountry."
            </blockquote>
            <cite className="social-author-citation">
              — Jeff, North Georgia eBike Outfitters, owner.
            </cite>
          </div>

        </div>
      </section>

      <hr className="funnel-divider" />

      {/* SECTION 6: THE FOOTER SAFETY NET */}
      {/* ─── 🎯 FIX 8: DEFINE LANDMARK REGION SCOPE ─── */}
      <section className="lead-capture-footer" aria-label="Free Map Sample Giveaway Registration">
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
                buttonLabel="Get Free Maps" /* Reusable form component will overlay safety spans safely */
                sourceGroupTag="home_footer_checklist"
                layout="row"
              />
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}