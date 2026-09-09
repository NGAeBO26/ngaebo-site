/* src/pages/Home.tsx */

import { useState, useRef, useEffect } from "react";
import FeaturedProducts from "../store/FeaturedProducts";
import TacticalLeadForm from "../components/TacticalLeadForm";
import "./Home.css";

export default function Home() {
  const [isMuted, setIsMuted] = useState(true);
  const [openHotspots, setOpenHotspots] = useState<Record<string, boolean>>({
    weather: false,
    effort: false,
    risk: false,
    conditions: false,
  });
  const videoRef = useRef<HTMLVideoElement>(null);
  const showcaseRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);

  // Dynamic Geometry Measurement Refs
  const stageRef = useRef<HTMLDivElement>(null);
  const heroSheetRef = useRef<HTMLDivElement>(null);

  const markerRefs = {
    weather: useRef<HTMLButtonElement>(null),
    effort: useRef<HTMLButtonElement>(null),
    risk: useRef<HTMLButtonElement>(null),
    conditions: useRef<HTMLButtonElement>(null),
  };

  const cardRefs = {
    weather: useRef<HTMLDivElement>(null),
    effort: useRef<HTMLDivElement>(null),
    risk: useRef<HTMLDivElement>(null),
    conditions: useRef<HTMLDivElement>(null),
  };

  // Calculated SVG Paths and Node Dots
  const [calculatedPaths, setCalculatedPaths] = useState({
    effort: { path: "M 390 208 L 338 208 L 338 94 L 286 94", cx: 390, cy: 208 },
    risk: { path: "M 390 256 L 338 256 L 338 306 L 286 306", cx: 390, cy: 256 },
    weather: { path: "M 501 59 L 608 59 L 608 94 L 714 94", cx: 501, cy: 59 },
    conditions: { path: "M 609 59 L 609 220 L 662 220 L 662 306 L 714 306", cx: 609, cy: 59 },
  });

  const toggleHotspot = (id: 'weather' | 'effort' | 'risk' | 'conditions') => {
    setOpenHotspots((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Re-calculate paths dynamically from live DOM geometry
  const recalculateConnectorPaths = () => {
    const stageNode = stageRef.current;
    const heroSheetNode = heroSheetRef.current;
    if (!stageNode || !heroSheetNode) return;

    const stageRect = stageNode.getBoundingClientRect();
    if (stageRect.width === 0 || stageRect.height === 0) return;

    const heroSheetRect = heroSheetNode.getBoundingClientRect();
    const scaleX = 1000 / stageRect.width;
    const scaleY = 400 / stageRect.height;

    const heroLeftSvg = (heroSheetRect.left - stageRect.left) * scaleX;
    const heroRightSvg = (heroSheetRect.right - stageRect.left) * scaleX;
    const heroTopSvg = (heroSheetRect.top - stageRect.top) * scaleY;

    // Helper for Left Cards (Effort & Risk)
    const computeLeftPath = (
      markerEl: HTMLButtonElement | null,
      cardEl: HTMLDivElement | null
    ) => {
      if (!markerEl || !cardEl) return null;
      const mRect = markerEl.getBoundingClientRect();
      const cRect = cardEl.getBoundingClientRect();

      const mCx = (mRect.left + mRect.width / 2 - stageRect.left) * scaleX;
      const mCy = (mRect.top + mRect.height / 2 - stageRect.top) * scaleY;
      const cEdgeX = (cRect.right - stageRect.left) * scaleX;
      const cCy = (cRect.top + cRect.height / 2 - stageRect.top) * scaleY;

      const gapWidth = heroLeftSvg - cEdgeX;
      const midGapX = cEdgeX + gapWidth * 0.5;

      const pathStr = `M ${mCx.toFixed(1)} ${mCy.toFixed(1)} L ${midGapX.toFixed(1)} ${mCy.toFixed(1)} L ${midGapX.toFixed(1)} ${cCy.toFixed(1)} L ${cEdgeX.toFixed(1)} ${cCy.toFixed(1)}`;
      return { path: pathStr, cx: Math.round(mCx), cy: Math.round(mCy) };
    };

    // Helper for Prime Ride Time (Weather) -> UP, RIGHT, DOWN, RIGHT
    const computeWeatherPath = (
      markerEl: HTMLButtonElement | null,
      cardEl: HTMLDivElement | null
    ) => {
      if (!markerEl || !cardEl) return null;
      const mRect = markerEl.getBoundingClientRect();
      const cRect = cardEl.getBoundingClientRect();

      const mCx = (mRect.left + mRect.width / 2 - stageRect.left) * scaleX;
      const mCy = (mRect.top + mRect.height / 2 - stageRect.top) * scaleY;
      const cEdgeX = (cRect.left - stageRect.left) * scaleX;
      const cCy = (cRect.top + cRect.height / 2 - stageRect.top) * scaleY;

      const gapWidth = cEdgeX - heroRightSvg;
      const midGapX = heroRightSvg + gapWidth * 0.38;

      // Clearance Y above the top of the sample sheet
      const topY = Math.max(12, heroTopSvg - 14);

      const pathStr = `M ${mCx.toFixed(1)} ${mCy.toFixed(1)} L ${mCx.toFixed(1)} ${topY.toFixed(1)} L ${midGapX.toFixed(1)} ${topY.toFixed(1)} L ${midGapX.toFixed(1)} ${cCy.toFixed(1)} L ${cEdgeX.toFixed(1)} ${cCy.toFixed(1)}`;
      return { path: pathStr, cx: Math.round(mCx), cy: Math.round(mCy) };
    };

    // Helper for Route Conditions -> DOWN inside sheet, RIGHT to gap, DOWN to card, RIGHT to card
    const computeConditionsPath = (
      markerEl: HTMLButtonElement | null,
      cardEl: HTMLDivElement | null
    ) => {
      if (!markerEl || !cardEl) return null;
      const mRect = markerEl.getBoundingClientRect();
      const cRect = cardEl.getBoundingClientRect();

      const mCx = (mRect.left + mRect.width / 2 - stageRect.left) * scaleX;
      const mCy = (mRect.top + mRect.height / 2 - stageRect.top) * scaleY;
      const cEdgeX = (cRect.left - stageRect.left) * scaleX;
      const cCy = (cRect.top + cRect.height / 2 - stageRect.top) * scaleY;

      const gapWidth = cEdgeX - heroRightSvg;
      const midGapX = heroRightSvg + gapWidth * 0.5;

      const heroHeightSvg = heroSheetRect.height * scaleY;
      const heroMidY = heroTopSvg + heroHeightSvg * 0.55;

      // M start -> L down inside sheet -> L right to gap -> L down gap -> L right to card
      const pathStr = `M ${mCx.toFixed(1)} ${mCy.toFixed(1)} L ${mCx.toFixed(1)} ${heroMidY.toFixed(1)} L ${midGapX.toFixed(1)} ${heroMidY.toFixed(1)} L ${midGapX.toFixed(1)} ${cCy.toFixed(1)} L ${cEdgeX.toFixed(1)} ${cCy.toFixed(1)}`;
      return { path: pathStr, cx: Math.round(mCx), cy: Math.round(mCy) };
    };

    const eff = computeLeftPath(markerRefs.effort.current, cardRefs.effort.current);
    const rsk = computeLeftPath(markerRefs.risk.current, cardRefs.risk.current);
    const wtr = computeWeatherPath(markerRefs.weather.current, cardRefs.weather.current);
    const cnd = computeConditionsPath(markerRefs.conditions.current, cardRefs.conditions.current);

    setCalculatedPaths((prev) => ({
      effort: eff || prev.effort,
      risk: rsk || prev.risk,
      weather: wtr || prev.weather,
      conditions: cnd || prev.conditions,
    }));
  };

  useEffect(() => {
    const targetNode = ctaRef.current || showcaseRef.current;
    if (!targetNode) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          recalculateConnectorPaths();
          // Traces Prime Ride Time line & blooms card ONLY after Section 2 CTA scrolls into view
          setTimeout(() => {
            setOpenHotspots({
              weather: true,
              effort: false,
              risk: false,
              conditions: false,
            });
          }, 100);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(targetNode);
    window.addEventListener("resize", recalculateConnectorPaths);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", recalculateConnectorPaths);
    };
  }, []);

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
                  Build Your Next Ride
                </a>
                <a href="#free-sample-pack" className="btn btn-funnel-sub">
                  See Free Sample pack →
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

      {/* SECTION 2: THE CORE PROBLEM & VALUE PROOF SHOWCASE */}
      <section className="problem-hook-section" aria-label="Backcountry Challenges Overview">
        <div className="funnel-container">
          
          {/* 1. Problem-to-Solution Block */}
          <div className="problem-split-grid">
            <div className="problem-challenge-block">
              <span className="section2-eyebrow-amber">Know Before You Go.</span>
              <h2 className="section2-headline">
                Find a Ride That Fits Today—Before You Commit to the Wrong Route
              </h2>
            </div>
            <div className="problem-solution-block">
              <p className="section2-body-text">
                North Georgia routes can look great on a map and still feel wrong once weather, surface conditions, and climbing start working against you. <strong>RideBuilder</strong> helps you find routes that fit your bike, your time, and how hard you want the day to feel. Then the unlocked <strong>RideGuide</strong> helps you know when to ride, what the route may ask of you, and what to watch before you head out—so the plan feels clearer before you commit.
              </p>
              <div className="section2-action-row">
                <a href="/rides" className="btn btn-funnel-main">
                  Build Your Next Ride
                </a>
                <a href="#free-sample-pack" className="section2-secondary-link">
                  See Free Sample Pack →
                </a>
              </div>
            </div>
          </div>

          {/* 2. Interactive Proof Showcase (Central RideGuide Hero & Blooming Telemetry Hotspots) */}
          <div className="section2-proof-showcase" ref={showcaseRef}>
            <div className="showcase-header-block">
              <h3 className="showcase-main-title">A Route Line is NOT a Ride Plan</h3>
              <p className="showcase-sub-title">
                Ride smarter with terrain, weather, and risk insights—before you roll out.
              </p>
            </div>

            {/* Central Interactive Hero Stage */}
            <div className="showcase-interactive-stage" ref={stageRef}>
              
              {/* Dynamic Orthogonal Stepped Vector Line Tracing Overlay Layer */}
              <svg className="hotspot-connector-svg" viewBox="0 0 1000 400" preserveAspectRatio="none">
                {/* Path 1: Effort Gauge (Middle-Left Hotspot -> Top-Left Slot) */}
                <path
                  d={calculatedPaths.effort.path}
                  className={`connector-line-path ${openHotspots.effort ? 'active-line' : ''}`}
                />
                <circle cx={calculatedPaths.effort.cx} cy={calculatedPaths.effort.cy} r="4" className={`connector-node-dot ${openHotspots.effort ? 'active-line' : ''}`} />

                {/* Path 2: Risk Radar (Bottom-Left Hotspot -> Bottom-Left Slot) */}
                <path
                  d={calculatedPaths.risk.path}
                  className={`connector-line-path ${openHotspots.risk ? 'active-line' : ''}`}
                />
                <circle cx={calculatedPaths.risk.cx} cy={calculatedPaths.risk.cy} r="4" className={`connector-node-dot ${openHotspots.risk ? 'active-line' : ''}`} />

                {/* Path 3: Prime Ride Time (Top-Center Hotspot -> Top-Right Slot) */}
                <path
                  d={calculatedPaths.weather.path}
                  className={`connector-line-path ${openHotspots.weather ? 'active-line' : ''}`}
                />
                <circle cx={calculatedPaths.weather.cx} cy={calculatedPaths.weather.cy} r="4" className={`connector-node-dot ${openHotspots.weather ? 'active-line' : ''}`} />

                {/* Path 4: Route Conditions (Top-Right Hotspot -> Bottom-Right Slot) */}
                <path
                  d={calculatedPaths.conditions.path}
                  className={`connector-line-path ${openHotspots.conditions ? 'active-line' : ''}`}
                />
                <circle cx={calculatedPaths.conditions.cx} cy={calculatedPaths.conditions.cy} r="4" className={`connector-node-dot ${openHotspots.conditions ? 'active-line' : ''}`} />
              </svg>

              <div className="hero-guide-frame-wrapper" ref={heroSheetRef}>
                <img src="/data/assets/RideGuide_Sample.png" alt="Central Sample RideGuide Field Sheet" className="hero-guide-sheet-img" />

                {/* Centered Map Overlay Banner */}
                <div className="hero-guide-map-overlay">
                  <img src="/images/RideGuide_embroid-v1.svg" alt="RideGuide Logo" className="overlay-brand-logo" />
                  <span className="overlay-title">Sample RideGuide</span>
                  <span className="overlay-subtitle">Click any Icon to Explore the Guide</span>
                </div>

                {/* Hotspot 1: Prime Ride Time (Top-Center "PRIME RIDE TIME" Box) */}
                <button
                  ref={markerRefs.weather}
                  type="button"
                  className={`hotspot-marker marker-weather ${openHotspots.weather ? 'active-hotspot' : ''}`}
                  onClick={() => toggleHotspot('weather')}
                  aria-label="Toggle Prime Ride Time Telemetry"
                >
                  <img src="/data/assets/icon_joyscore.svg" alt="" className="hotspot-icon" />
                  <span className="hotspot-pulse-ring" />
                </button>

                {/* Hotspot 2: Effort Gauge (Middle-Left "EFFORT TAX" Box) */}
                <button
                  ref={markerRefs.effort}
                  type="button"
                  className={`hotspot-marker marker-effort ${openHotspots.effort ? 'active-hotspot' : ''}`}
                  onClick={() => toggleHotspot('effort')}
                  aria-label="Toggle Effort Gauge Telemetry"
                >
                  <img src="/data/assets/icon_motor.svg" alt="" className="hotspot-icon" />
                  <span className="hotspot-pulse-ring" />
                </button>

                {/* Hotspot 3: Risk Radar (Bottom-Left "RISK RADAR") */}
                <button
                  ref={markerRefs.risk}
                  type="button"
                  className={`hotspot-marker marker-risk ${openHotspots.risk ? 'active-hotspot' : ''}`}
                  onClick={() => toggleHotspot('risk')}
                  aria-label="Toggle Risk Radar Telemetry"
                >
                  <img src="/data/assets/icon_safety.svg" alt="" className="hotspot-icon" />
                  <span className="hotspot-pulse-ring" />
                </button>

                {/* Hotspot 4: Route Conditions (Top-Right "TRAIL STATUS") */}
                <button
                  ref={markerRefs.conditions}
                  type="button"
                  className={`hotspot-marker marker-conditions ${openHotspots.conditions ? 'active-hotspot' : ''}`}
                  onClick={() => toggleHotspot('conditions')}
                  aria-label="Toggle Route Conditions Telemetry"
                >
                  <img src="/data/assets/icon_route.svg" alt="" className="hotspot-icon" />
                  <span className="hotspot-pulse-ring" />
                </button>
              </div>

              {/* Slot Top-Left Bloomed: Effort Gauge */}
              <div 
                ref={cardRefs.effort} 
                className={`hotspot-widget-card slot-top-left ${openHotspots.effort ? 'bloomed' : 'hidden'}`}
                onClick={() => toggleHotspot('effort')}
              >
                <div className="widget-card-header">
                  <div className="widget-header-icon">
                    <img src="/data/assets/icon_motor.svg" alt="" className="widget-header-icon-img" />
                  </div>
                  <div className="widget-title">EFFORT GAUGE</div>
                  <button
                    type="button"
                    className="widget-close-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleHotspot('effort');
                    }}
                    aria-label="Close Effort Gauge"
                  >
                    ✕
                  </button>
                </div>
                <div className="widget-body-row">
                  <div className="widget-subtitle">How hard will it feel?</div>
                  <img src="/data/effortgauges/346_S1_effort_tax.svg" alt="Effort Gauge Telemetry" className="widget-telemetry-svg" />
                </div>
                <p className="widget-description">
                  See how terrain, traction, and surface saturation may change the ride today.
                </p>
                <div className="widget-benefit">
                  <strong>Benefit:</strong> Match the route to your bike, energy, and plans.
                </div>
              </div>

              {/* Slot Bottom-Left Bloomed: Risk Radar */}
              <div 
                ref={cardRefs.risk} 
                className={`hotspot-widget-card slot-bottom-left ${openHotspots.risk ? 'bloomed' : 'hidden'}`}
                onClick={() => toggleHotspot('risk')}
              >
                <div className="widget-card-header">
                  <div className="widget-header-icon">
                    <img src="/data/assets/icon_safety.svg" alt="" className="widget-header-icon-img" />
                  </div>
                  <div className="widget-title">RISK RADAR</div>
                  <button
                    type="button"
                    className="widget-close-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleHotspot('risk');
                    }}
                    aria-label="Close Risk Radar"
                  >
                    ✕
                  </button>
                </div>
                <div className="widget-body-row">
                  <div className="widget-subtitle">What should I watch?</div>
                  <img src="/data/visualization/346_S1_spider.svg" alt="Risk Radar Telemetry" className="widget-telemetry-svg" />
                </div>
                <p className="widget-description">
                  Review route-specific risk factors worth a closer look before you go.
                </p>
                <div className="widget-benefit">
                  <strong>Benefit:</strong> Know key factors before leaving the trailhead.
                </div>
              </div>

              {/* Slot Top-Right Bloomed: Prime Ride Time */}
              <div 
                ref={cardRefs.weather} 
                className={`hotspot-widget-card slot-top-right ${openHotspots.weather ? 'bloomed' : 'hidden'}`}
                onClick={() => toggleHotspot('weather')}
              >
                <div className="widget-card-header">
                  <div className="widget-header-icon">
                    <img src="/data/assets/icon_joyscore.svg" alt="" className="widget-header-icon-img" />
                  </div>
                  <div className="widget-title">PRIME RIDE TIME</div>
                  <button
                    type="button"
                    className="widget-close-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleHotspot('weather');
                    }}
                    aria-label="Close Prime Ride Time"
                  >
                    ✕
                  </button>
                </div>
                <div className="widget-body-row">
                  <div className="widget-subtitle">When should I ride?</div>
                  <img src="/data/joyscores/346_S1_joy_dial.svg" alt="Prime Ride Time Telemetry" className="widget-telemetry-svg" />
                </div>
                <p className="widget-description">
                  See the best 3-hour window, based on current weather and route conditions.
                </p>
                <div className="widget-benefit">
                  <strong>Benefit:</strong> Choose a better time before making the trip.
                </div>
              </div>

              {/* Slot Bottom-Right Bloomed: Route Conditions */}
              <div 
                ref={cardRefs.conditions} 
                className={`hotspot-widget-card slot-bottom-right ${openHotspots.conditions ? 'bloomed' : 'hidden'}`}
                onClick={() => toggleHotspot('conditions')}
              >
                <div className="widget-card-header">
                  <div className="widget-header-icon">
                    <img src="/data/assets/icon_route.svg" alt="" className="widget-header-icon-img" />
                  </div>
                  <div className="widget-title">ROUTE CONDITIONS</div>
                  <button
                    type="button"
                    className="widget-close-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleHotspot('conditions');
                    }}
                    aria-label="Close Route Conditions"
                  >
                    ✕
                  </button>
                </div>
                <div className="widget-body-row">
                  <div className="widget-subtitle">What are the route conditions?</div>
                  <img src="/data/visualization/346_S1_conditions_wheel.svg" alt="Route Conditions Wheel" className="widget-telemetry-svg" />
                </div>
                <p className="widget-description">
                  Tracks soil saturation, surface roughness, and route access status.
                </p>
                <div className="widget-benefit">
                  <strong>Benefit:</strong> Know surface grip and mud risks before rolling out.
                </div>
              </div>
            </div>  

            <div className="showcase-prompt-callout">
              <a ref={ctaRef} href="/rides" className="btn btn-funnel-main">
                Build Your Next Ride
              </a>
              <div className="showcase-sample-path-row">
                <a href="#free-sample-pack" className="section2-sample-link">
                  See Free Sample Pack →
                </a>
              </div>
            </div>

            <div className="showcase-footer-block">
              

              {/* Supporting Proof Cards Grid Embedded Directly Inside Footer Block */}
              <div className="section2-proof-cards-grid">
                <div className="proof-card-item">
                  <div className="proof-card-header-strip">
                    <img src="/data/assets/icon_joyscore.svg" alt="" className="proof-card-icon" />
                    <h4>Current for 7 days. Refresh anytime.</h4>
                  </div>
                  <p>Refresh during the active pass to update ride windows, route conditions, and effort.</p>
                </div>

                <div className="proof-card-item">
                  <div className="proof-card-header-strip">
                    <img src="/data/assets/icon_no_cell_signal.svg" alt="" className="proof-card-icon" />
                    <h4>Download once. Access anywhere.</h4>
                  </div>
                  <p>Save or print before leaving so the route details remain useful when cell service is limited.</p>
                </div>

                <div className="proof-card-item">
                  <div className="proof-card-header-strip">
                    <img src="/data/assets/icon_credit_card.svg" alt="" className="proof-card-icon" />
                    <h4>$6.99 per route. No Subscription.</h4>
                  </div>
                  <p>One RidedeGuide per route for $6.99; no recurring subscription required.</p>
                </div>

                <div className="proof-card-item">
                  <div className="proof-card-header-strip">
                    <img src="/data/assets/icon_token.svg" alt="" className="proof-card-icon" />
                    <h4>Grab tokens for future rides</h4>
                  </div>
                  <p>Each token unlocks one RideGuide, buy token packs and get discounts.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      <hr className="funnel-divider" />    
      
      {/* ─── 🎯 FIX 3: DEFINE LANDMARK REGION SCOPE ─── */}
      <section className="problem-hook-section" aria-label="Curated Adventure Hardware Breakdown">
        <div className="funnel-container">
          <div className="problem-split-grid">
            
            <div className="problem-challenge-block">
              <span className="section2-eyebrow-amber">Take the Right Gear.</span>
              <h2 className="section2-headline">Vetted Adventure-Ready Equipment for Cargo, Safety, Comfort and More.</h2>
            </div>
            <div className="problem-solution-block">
              <p className="section2-body-text">Our curated selection of <span className="txt-bold-heavy">outdoor-proven gear </span>is hand selected for the backcountry trails across North Georgia. These <span className="txt-bold-heavy">featured items </span>aren't just compatible—they are <span className="txt-bold-heavy">capable, durable </span> and built to survive deep <span className="txt-bold-heavy">off-road expeditions</span>, ensuring your mechanical and electrical configurations hold out when situations change rapidly.
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