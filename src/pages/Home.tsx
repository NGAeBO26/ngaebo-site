/* src/pages/Home.tsx */
import { useState } from "react"; 
import FeaturedProducts from "../store/FeaturedProducts";
import "./Home.css";

export default function Home() {
  // --- MASTER STATE SYSTEM FOR ACCORDION SWITCHES ---
  const [activePillar, setActivePillar] = useState<string>("analytics");

  // Telemetry Conic Arc Math Loops
  const elevFill = (754 / 1500) * 100;
  const elevEmptyStart = 100 - Math.min(100, Math.max(0, elevFill));
  const gradeFill = (18.6 / 45) * 100;
  const gradeEmptyStart = 100 - Math.min(100, Math.max(0, gradeFill));

  // Precision 3:4 Blueprint Hotspot Map Locations
  const overlayCoordinates: Record<string, { top: string; left: string; width: string; height: string }> = {
    analytics: { top: "26.5%", left: "3.2%", width: "24.5%", height: "53.2%" },
    weather: { top: "12.8%", left: "3%", width: "94%", height: "14%" },
    terrain: { top: "79.6%", left: "3.2%", width: "94%", height: "15%" }
  };

  return (
    <main className="page funnel-landing-page">

      {/* SECTION 1: HERO SPLIT & FOCUS (Above the Fold) */}
      <section className="hero-funnel-section">
        <div className="funnel-container">
          <div className="hero-split-layout">
            
            <div className="hero-content-stack">
              <h1 className="hero-home-title">
                Master the North Georgia Backcountry with Confidence.
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
      <section className="problem-hook-section">
        <div className="funnel-container">
          <div className="problem-split-grid">
            <div className="problem-challenge-block">
              <h2>The Backcountry is Unforgiving. Don't Rely on Guesswork.</h2>
            </div>
            <div className="problem-solution-block">
              <span className="problem-tagline-amber">Know Before You Go.</span>
              <p>
                Riding <span className="txt-bold-heavy">off-road eBikes</span> through North Georgia's <span className="txt-bold-heavy">rugged backcountry </span>demands <span className="txt-bold-heavy">precision planning</span>. Unpredictable high-altitude weather means situations change quickly, which can <span className="txt-bold-heavy">drain your battery</span>, alter the <span className="txt-bold-heavy">rolling resistance</span> of native red clay dynamically, and blind valleys offer zero cellular safety nets. Our <span className="txt-bold-heavy">data-driven methodology</span> eliminates variables by modeling <span className="txt-bold-heavy">real-world physics </span> calculation nodes directly into your field telemetry maps—ensuring <span className="txt-bold-heavy">situational awareness</span> before you head out.
              </p>
            </div>
          </div>
        </div>
      </section>

      <hr className="funnel-divider" />

      {/* SECTION 3: THE DIGITAL PRODUCT SHOWCASE & ACCORDION CONSOLE */}
      <section className="digital-product-showcase-section">
        <div className="funnel-container">
          
          <div className="section-header">
            <h2>Every Adventure Starts with a Plan</h2>
            <p className="sub-tagline-lowercase">
              HIGH ACCURACY TERRAIN - CUSTOM ANALYTICS - WEATHER AWARE <br /> GUIDE FOR YOUR RIDE
            </p>
          </div>

          {/* Proposition Strip with Class Targets Embedded */}
          <div className="prop-strip-matrix-bay">
            <div className="prop-value-column-card">
              <div className="prop-value-icon-box ng-prop-icon-offline">
                <img src="data\assets\icon_no_cell_signal.svg" className="ng-prop-graphic-asset" alt="Offline Independent" />
              </div>
              <h5>Offline Independent</h5>
              <p>Pre-rendered field guides that load instantly without requiring <strong className="text-prop-heavy">cell network data or map syncs</strong>.</p>
            </div>

            <div className="prop-value-column-card">
              <div className="prop-value-icon-box window-icon ng-prop-icon-motor">
                <img src="data\assets\icon_credit_card.svg" className="ng-prop-graphic-asset" alt="No Subscription Required" />
              </div>
              <h5>No Subscription Required</h5>
              <p>Your ride, one price. Don't get caught in other subscription based route services. <strong className="text-prop-heavy">Buy only what you want, when you want.</strong></p>
            </div>

            <div className="prop-value-column-card">
              <div className="prop-value-icon-box ng-prop-icon-insurance">
                <img src="data\assets\icon_safety.svg" className="ng-prop-graphic-asset" alt="Peace of Mind" />
              </div>
              <h5>Peace of Mind</h5>
              <p>The backcountry can be dangerous if you are not prepared. <strong className="text-prop-heavy">Understand your risk and ride safely.</strong></p>
            </div>
          </div>

          {/* Interactive Console Deck */}
          <div className="blueprint-interactive-bay">
            <div className="product-pillars-tab-stack">
              
              {/* Accordion Tab Card 1 */}
              <button 
                className={`feature-pillar-tab-card ${activePillar === "analytics" ? "active-pillar" : "collapsed-pillar"}`} 
                onClick={() => setActivePillar("analytics")} 
                onMouseEnter={() => setActivePillar("analytics")}
              >
                <div className="accordion-tab-header-strip">
                  <span className="accordion-tab-vector-placeholder ng-icon-analytics">
                    <img src="data\assets\icon_route.svg" className="ng-accordion-graphic-asset" alt="Route Analytics" />
                  </span>
                  <div className="accordion-title-block">
                    <span className="pillar-eyebrow-accent">Dashboard Widget: Route Analytics & Signal Tracking</span>
                    <h4>Know the Route Before You Head Out</h4>
                  </div>
                </div>
                
                <div className="accordion-content-overflow-wrapper">
                  <p>Instantly evaluate hard metrics across the Gap. Verify exact route mileage, localized difficulty rankings, and real-world cellular signal drop zones so you never get stranded blind <strong className="txt-bold-heavy">without a backup plan</strong>.</p>
                  <ul className="pillar-benefit-bullet-list">
                    <li>Isolates cell drops before you enter a valley</li>
                    <li>Tracks exact difficulty scores and baseline route miles</li>
                  </ul>
                </div>
              </button>

              {/* Accordion Tab Card 2 */}
              <button 
                className={`feature-pillar-tab-card ${activePillar === "weather" ? "active-pillar" : "collapsed-pillar"}`} 
                onClick={() => setActivePillar("weather")} 
                onMouseEnter={() => setActivePillar("weather")}
              >
                <div className="accordion-tab-header-strip">
                  <span className="accordion-tab-vector-placeholder ng-icon-weather">
                    <img src="data\assets\icon_precip.svg" className="ng-accordion-graphic-asset" alt="Weather Engine" />
                  </span>
                  <div className="accordion-title-block">
                    <span className="pillar-eyebrow-accent">Dashboard Widget: Prime Ride Arc & Saturation Dials</span>
                    <h4>Target Your Optimal Ride Window</h4>
                  </div>
                </div>
                
                <div className="accordion-content-overflow-wrapper">
                  <p>Stop guessing how much rain a trail took. Cross-reference real-time precipitation tracking with our clay saturation matrix to calculate a dynamic departure window, ensuring you hit <strong className="txt-bold-heavy">tacky dirt instead of slick mud</strong>.</p>
                  <ul className="pillar-benefit-bullet-list">
                    <li>Locks in the precise hour to stage your ride</li>
                    <li>Flags soft/muddy tracking variables that sap eBike voltage</li>
                  </ul>
                </div>
              </button>

              {/* Accordion Tab Card 3 */}
              <button 
                className={`feature-pillar-tab-card ${activePillar === "terrain" ? "active-pillar" : "collapsed-pillar"}`} 
                onClick={() => setActivePillar("terrain")} 
                onMouseEnter={() => setActivePillar("terrain")}
              >
                <div className="accordion-tab-header-strip">
                  <span className="accordion-tab-vector-placeholder ng-icon-terrain">
                    <img src="data\assets\icon_motor.svg" className="ng-accordion-graphic-asset" alt="Terrain Analysis" />
                  </span>
                  <div className="accordion-title-block">
                    <span className="pillar-eyebrow-accent">Dashboard Widget: Elevation Sparkline & Grade Gauges</span>
                    <h4>Will Your Motor and Battery Hold Out?</h4>
                  </div>
                </div>
                
                <div className="accordion-content-overflow-wrapper">
                  <p>Scan continuous elevation gain trends alongside maximum incline severity metrics. Know exactly when your motor will face sharp grade spikes over 15% so you can <strong className="txt-bold-heavy">preserve battery cells</strong> and manage system heat.</p>
                  <ul className="pillar-benefit-bullet-list">
                    <li>Plots high-resolution vertical profile trends across the trip</li>
                    <li>Displays average grade percentages for accurate power mapping</li>
                  </ul>
                </div>
              </button>
            </div>

            <div className="blueprint-viewport-display-contain">
              <div 
                className="blueprint-hotspot-highlight-overlay" 
                style={{ 
                  top: overlayCoordinates[activePillar].top, 
                  left: overlayCoordinates[activePillar].left, 
                  width: overlayCoordinates[activePillar].width, 
                  height: overlayCoordinates[activePillar].height 
                }} 
              />
              <img src="/data/assets/RideGuide_Sample.png" alt="RideGuide Field Map Dashboard Mockup Blueprint" className="blueprint-main-map-image" />
            </div>
          </div>

          {/* Action Footer Call area */}
          <div className="isolated-cta-clear-way">
            <div className="cta-inner-alignment-shield">
              <a href="/rides" className="btn btn-primary btn-cta-oversized">
                Get Today's RideGuide for Your Route
              </a>
            </div>
          </div>

        </div>
      </section>

      <hr className="funnel-divider" />
      <section className="problem-hook-section">
        <div className="funnel-container">
          {/* 🎯 THE ASYMMETRICAL SPLIT HOOK HEADER PANEL (No inline layout attributes) */}
          <div className="problem-split-grid">
            <div className="problem-challenge-block">
              <h2>Vetted Backcountry Equipment</h2>
            </div>
            <div className="problem-solution-block">
              <span className="problem-tagline-amber">Tested components optimized specifically for North Georgia gap profiles.</span>
              <p>Our curratted selection of <span className="txt-bold-heavy">trail proven gear </span>is hand selected for the backcountry trails across the Blue Ridge. These <span className="txt-bold-heavy">featured items </span>aren't just compatible—they are explicitly vetted to survive deep <span className="txt-bold-heavy">off-grid expeditions</span>, ensuring your mechanical and electrical configurations hold out when situations change rapidly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 🚀 SECTION 4: CURATED SHARED ECOSYSTEM GRID CARD MATRIX */}
      <FeaturedProducts 
        sectionTitle="Vetted Backcountry Equipment"
        sectionSubtitle="Tested components optimized specifically for North Georgia gap profiles."
      />

      <hr className="funnel-divider" />

      {/* 🏛️ SECTION 5: TRUST & AUTHORITY MATRIX */}
      <section className="trust-authority-matrix">
        <div className="funnel-container">
          
          {/* Horizontal Row Wrapper hosting 3 side-by-side components */}
          <div className="authority-pillars-row matrix-columns-layout">
            
            {/* CARD 1: COMMUNITY BUILDING */}
            <a href="/community" className="authority-cell-link-card">
              <div className="authority-cell layout-vertical-stack">
                <div className="authority-icon-container">
                  <img 
                    src="/images/icons/community.png" 
                    alt="Community Building Icon" 
                    className="authority-pillar-icon"
                  />
                </div>
                <h5>Community Building</h5>
                <p>We connect North Georgia riders with group rides, route intel, and a crew that actually knows the mountains.</p>
              </div>
            </a>

            {/* CARD 2: RIDER EDUCATION */}
            <a href="/community" className="authority-cell-link-card">
              <div className="authority-cell layout-vertical-stack">
                <div className="authority-icon-container">
                  <img 
                    src="/images/icons/education.png" 
                    alt="Rider Education Icon" 
                    className="authority-pillar-icon"
                  />
                </div>
                <h5>Rider Education</h5>
                <p>We help riders understand terrain, slope, weather windows, and equipment choices so every outing feels intentional and safe.</p>
              </div>
            </a>

            {/* CARD 3: LOCAL PARTNERSHIPS */}
            <a href="/community" className="authority-cell-link-card">
              <div className="authority-cell layout-vertical-stack">
                <div className="authority-icon-container">
                  <img 
                    src="/images/icons/partnerships.png" 
                    alt="Local Partnerships Icon" 
                    className="authority-pillar-icon"
                  />
                </div>
                <h5>Local Partnerships</h5>
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
              — Jeff,North Georgia eBike Outfitters, owner.
            </cite>
          </div>

        </div>
      </section>

      <hr className="funnel-divider" />

      {/* SECTION 6: THE FOOTER SAFETY NET */}
      <section className="lead-capture-footer">
        <div className="funnel-container">
          <div className="capture-split-layout">
            <div>
              <h3>Get Offline Field Metrics</h3>
              <p>Receive free tactical checklists for tracking battery ranges offline.</p>
            </div>
            <div>
              <form onSubmit={(e) => e.preventDefault()} className="capture-form-flex-row">
                <input 
                  type="email" 
                  placeholder="Enter email address" 
                  className="capture-input-styled"
                />
                <button type="submit" className="btn btn-primary capture-button-whitespace">Join Pipeline</button>
              </form>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}