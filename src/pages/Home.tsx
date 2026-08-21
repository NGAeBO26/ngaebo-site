/* src/pages/Home.tsx */

import { useState, useRef } from "react";
import FeaturedProducts from "../store/FeaturedProducts";
import TacticalLeadForm from "../components/TacticalLeadForm";
import DigitalProductShowcase from "../components/DigitalProductShowcase"; 
import "./Home.css";

export default function Home() {
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const toggleAudio = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (videoRef.current) {
      const nextMutedState = !isMuted;
      videoRef.current.muted = nextMutedState;
      setIsMuted(nextMutedState);
    }
  };

  return (
    <div className="page funnel-landing-page">

      {/* SECTION 1: HERO SPLIT & FOCUS (Above the Fold) */}
      {/* ─── 🎯 FIX 1: DEFINE LANDMARK REGION SCOPE ─── */}
      <section className="hero-funnel-section" aria-label="Introduction and Telemetry HUD Dashboard">
        <div className="funnel-container">
          <div className="hero-split-layout">
            
            <div className="hero-content-stack">
              <div className="hero-eyebrow-blue">
                Plan Faster. Ride Smarter.
              </div>
              <h1 className="hero-home-title">
                Build the Right Ride for Today’s Conditions — Before You Roll Out
              </h1>
              <p className="hero-text">
                Use our smart route matcher <strong>RideBuilder</strong> to match your bike, your time, your effort level and more to build a route that fits today. Then unlock a <strong>RideGuide</strong> with current-weather-powered ride intelligence so you can ride safer, avoid surprises, and know what to expect before you go.
              </p>
              
              <div className="hero-actions-stack">
                <a href="/rides" className="btn btn-funnel-main">
                  Find My Ride with RideBuilder
                </a>
                <a href="#free-sample-pack" className="btn btn-funnel-sub">
                  See 3 Free Sample RideGuides
                </a>
              </div>
            </div>

            <div className="hero-visual-block hero-bezel-showcase">
              <a href="/rides" className="hero-phone-bezel-link" aria-label="Launch RideBuilder workspace">
                <div className="hero-phone-video-viewport">
                  <video
                    ref={videoRef}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="hero-promo-video-element"
                  >
                    <source src="/data/assets/videos/RideBuilder-promo1.mp4" type="video/mp4" />
                  </video>
                  <button
                    type="button"
                    className="hero-video-audio-toggle"
                    onClick={toggleAudio}
                    aria-label={isMuted ? "Enable video audio" : "Mute video audio"}
                  >
                    {isMuted ? "🔇  Sound On" : "🔊 Sound Off"}
                  </button>
                  <div className="hero-video-interactive-badge">
                    <span>Tap to Launch RideBuilder →</span>
                  </div>
                </div>
              </a>
            </div>

          </div>

          <div className="hero-bridge-line">
            <span className="bridge-title">Know Before You Go — Why It’s Worth It</span>
            <p>
              A RideGuide helps you avoid picking the wrong route for your bike, energy, or the day’s conditions. For <strong>$6.99</strong>, see when to ride, how hard it’ll feel, and what to watch before you commit — ensuring a safer, more enjoyable, and more predictable ride with fewer bad surprises.
            </p>
          </div>
        </div>
      </section>

      <hr className="funnel-divider" />

      {/* SECTION 2: THE CORE PROBLEM / VALUE HOOK */}
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
                <span className="authority-matrix-title">Community Building</span>
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
                <span className="authority-matrix-title">Rider Education</span>
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
                <span className="authority-matrix-title">Local Partnerships</span>
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
      <section id="free-sample-pack" className="lead-capture-footer" aria-label="Free Map Sample Giveaway Registration">
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