/* src/components/DigitalProductShowcase.tsx */
import { useState, useEffect } from "react";
import TacticalLeadForm from "./TacticalLeadForm";
import "./DigitalProductShowcase.css";

interface DigitalProductShowcaseProps {
  mode: "landing" | "capture";
  intentTag?: string;
  onSuccess?: () => void;
}

export default function DigitalProductShowcase({
  mode,
  intentTag = "general_newsletter",
  onSuccess
}: DigitalProductShowcaseProps) {
  const [activePillar, setActivePillar] = useState<string>("analytics");
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);

  // Precision 3:4 Blueprint Hotspot Map Locations
  const overlayCoordinates: Record<string, { top: string; left: string; width: string; height: string }> = {
    analytics: { top: "26.5%", left: "3.2%", width: "24.5%", height: "53.2%" },
    weather: { top: "12.8%", left: "3%", width: "94%", height: "14%" },
    terrain: { top: "79.6%", left: "3.2%", width: "94%", height: "15%" }
  };

  // ─── INFINITE PASSIVE AUTO-CYCLE DESCENT PIPELINE ───
  useEffect(() => {
    if (hasInteracted || mode !== "landing") return;

    const pillarsOrder = ["analytics", "weather", "terrain"];

    const autoCycleTimer = setInterval(() => {
      setActivePillar((currentPillar) => {
        const currentIndex = pillarsOrder.indexOf(currentPillar);
        const nextIndex = (currentIndex + 1) % pillarsOrder.length;
        return pillarsOrder[nextIndex];
      });
    }, 1800);

    return () => clearInterval(autoCycleTimer);
  }, [hasInteracted, mode]);

  const handleTabInteraction = (pillarKey: string) => {
    setHasInteracted(true);
    setActivePillar(pillarKey);
  };

  return (
    <section className="digital-product-showcase-section">
      <div className="funnel-container">
        
        <div className="section-header">
          <h2>Every Adventure Starts with a Plan</h2>
          <img
            src="/images/RideGuide_embroid-v1.svg"
            alt="RideGuide Logo"
            className="showcase-brand-logo"
          />
          <p className="sub-tagline-lowercase">
            HIGH ACCURACY TERRAIN - CUSTOM ANALYTICS - WEATHER AWARE <br /> GUIDE FOR YOUR RIDE
          </p>
        </div>

        {/* Proposition Strip */}
        <div className="prop-strip-matrix-bay">
          
          <div className="prop-value-column-card">
            <div className="prop-card-header-strip">
              <div className="prop-value-icon-box">
                <img src="/data/assets/icon_no_cell_signal.svg" className="ng-prop-graphic-asset" alt="Offline Independent Icon" />
              </div>
              {/* ─── 🎯 FIX 1: CONVERTED H5 TO STYLED COMPLIANT PARAGRAPH ─── */}
              <span className="prop-card-header-title">Offline Independent</span>
            </div>
            <p>Pre-rendered field guides that load instantly without requiring <strong className="text-prop-heavy">cell network data or map syncs</strong>.</p>
          </div>

          <div className="prop-value-column-card">
            <div className="prop-card-header-strip">
              <div className="prop-value-icon-box">
                <img src="/data/assets/icon_credit_card.svg" className="ng-prop-graphic-asset" alt="No Subscription Required Icon" />
              </div>
              {/* ─── 🎯 FIX 2: CONVERTED H5 TO STYLED COMPLIANT PARAGRAPH ─── */}
              <span className="prop-card-header-title">No Required Subscription</span>
            </div>
            <p>Don't get caught in subscription based route services. <strong className="text-prop-heavy">Buy only what you want, when you want.</strong></p>
          </div>

          <div className="prop-value-column-card">
            <div className="prop-card-header-strip">
              <div className="prop-value-icon-box">
                <img src="/data/assets/icon_safety.svg" className="ng-prop-graphic-asset" alt="Peace of Mind Icon" />
              </div>
              {/* ─── 🎯 FIX 3: CONVERTED H5 TO STYLED COMPLIANT PARAGRAPH ─── */}
              <span className="prop-card-header-title">Peace of Mind</span>
            </div>
            <p>The backcountry can be dangerous if you are not prepared. <strong className="text-prop-heavy">Understand your risk and ride safely.</strong></p>
          </div>
        </div>

        {/* Interactive Console Deck */}
        <div className="blueprint-interactive-bay">
          {mode === "landing" ? (
            <div className="product-pillars-tab-stack">
              
              {/* Accordion Tab Card 1 */}
              <button 
                className={`feature-pillar-tab-card ${activePillar === "analytics" ? "active-pillar" : "collapsed-pillar"}`} 
                onClick={() => handleTabInteraction("analytics")} 
                onMouseEnter={() => handleTabInteraction("analytics")}
                aria-expanded={activePillar === "analytics"}
              >
                <div className="accordion-left-indicator-bar">
                  <span className="accordion-tab-chevron-indicator">❯</span>
                </div>

                <div className="accordion-tab-header-strip">
                  <span className="accordion-tab-vector-placeholder">
                    <img src="/data/assets/icon_route.svg" className="ng-accordion-graphic-asset" alt="Route Analytics Symbol" />
                  </span>
                  <div className="accordion-title-block">
                    {/* ─── 🎯 FIX 4: CONVERTED H4 TO ACCORDION LABEL PARAGRAPH ─── */}
                    <p className="accordion-title-text">Know the Route Before You Head Out</p>
                  </div>
                </div>
                
                <div className="accordion-content-overflow-wrapper">
                  <p>Instantly evaluate hard metrics across the Gap. Verify exact route mileage, localized difficulty rankings, and real-world cellular signal drop zones so you never get stranded blind <strong>without a backup plan</strong>.</p>
                  <ul className="pillar-benefit-bullet-list">
                    <li>Isolates cell drops before you enter a valley</li>
                    <li>Tracks exact difficulty scores and baseline route miles</li>
                  </ul>
                </div>
              </button>

              {/* Accordion Tab Card 2 */}
              <button 
                className={`feature-pillar-tab-card ${activePillar === "weather" ? "active-pillar" : "collapsed-pillar"}`} 
                onClick={() => handleTabInteraction("weather")} 
                onMouseEnter={() => handleTabInteraction("weather")}
                aria-expanded={activePillar === "weather"}
              >
                <div className="accordion-left-indicator-bar">
                  <span className="accordion-tab-chevron-indicator">❯</span>
                </div>

                <div className="accordion-tab-header-strip">
                  <span className="accordion-tab-vector-placeholder">
                    <img src="/data/assets/icon_precip.svg" className="ng-accordion-graphic-asset" alt="Weather Engine Symbol" />
                  </span>
                  <div className="accordion-title-block">
                    {/* ─── 🎯 FIX 5: CONVERTED H4 TO ACCORDION LABEL PARAGRAPH ─── */}
                    <p className="accordion-title-text">Target Your Optimal Ride Window</p>
                  </div>
                </div>
                
                <div className="accordion-content-overflow-wrapper">
                  <p>Stop guessing how much rain a trail took. Real-time precipitation tracking with our surface saturation matrix calculates the prime departure window, ensuring you hit <strong>tacky dirt instead of slick mud</strong>.</p>
                  <ul className="pillar-benefit-bullet-list">
                    <li>Locks in the precise hour to stage your ride</li>
                    <li>Flags soft/muddy tracking variables that sap eBike voltage</li>
                  </ul>
                </div>
              </button>

              {/* Accordion Tab Card 3 */}
              <button 
                className={`feature-pillar-tab-card ${activePillar === "terrain" ? "active-pillar" : "collapsed-pillar"}`} 
                onClick={() => handleTabInteraction("terrain")} 
                onMouseEnter={() => handleTabInteraction("terrain")}
                aria-expanded={activePillar === "terrain"}
              >
                <div className="accordion-left-indicator-bar">
                  <span className="accordion-tab-chevron-indicator">❯</span>
                </div>

                <div className="accordion-tab-header-strip">
                  <span className="accordion-tab-vector-placeholder">
                    <img src="/data/assets/icon_motor.svg" className="ng-accordion-graphic-asset" alt="Terrain Analysis Symbol" />
                  </span>
                  <div className="accordion-title-block">
                    {/* ─── 🎯 FIX 6: CONVERTED H4 TO ACCORDION LABEL PARAGRAPH ─── */}
                    <p className="accordion-title-text">Will Your Motor and Battery Hold Out?</p>
                  </div>
                </div>
                
                <div className="accordion-content-overflow-wrapper">
                  <p>Scan continuous elevation gain trends alongside maximum incline severity metrics. Know exactly when your motor will face sharp grade spikes over 15% so you can <strong>preserve battery cells</strong> and manage system heat.</p>
                  <ul className="pillar-benefit-bullet-list">
                    <li>Plots high-resolution vertical profile trends across the trip</li>
                    <li>Displays average grade percentages for accurate power mapping</li>
                  </ul>
                </div>
              </button>
            </div>
          ) : (
            <div className="capture-instructions-deck">
              <div className="capture-instructions-deck-header">
                {/* ─── 🎯 FIX 7: CONVERTED H3 TO CAPTURE HEADER PARAGRAPH ─── 
                    Prevents heading order skipping errors when embedded inside various page components. */}
                <p className="capture-instructions-title">
                  {showEmailForm ? "Get Your Free Sample Pack" : "Get Your RideGuide in 3 Steps"}
                </p> 
              </div>
              
              {!showEmailForm ? (
                <>
                  <p><span className="capture-instructions-deck-numeral">1.)</span> <strong>Filter routes</strong> by name, route class, distance, or grade.</p>
                  <p><span className="capture-instructions-deck-numeral">2.)</span> <strong>Select your route</strong> clicking 'Available Routes' or clicking the map.</p>
                  <p><span className="capture-instructions-deck-numeral">3.)</span> <strong>Unlock your RideGuide</strong> to see live weather and tracking analytics.</p>
                  
                  <div className="capture-form-inline-container">
                    <button 
                      className="btn btn-primary btn-cta-oversized" 
                      onClick={() => setShowEmailForm(true)}
                    >
                      Next: Get Free Sample Pack ➔
                    </button>
                    <span className="capture-legal-disclaimer">Planning your bike's maiden voyage? We've mapped out the ultimate 3-pack sample series of Fire Service routes perfectly suited for this bike. Instant download package delivered to your email.</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="capture-form-inline-container" style={{ marginTop: '24px' }}>
                    <TacticalLeadForm
                      layout="stacked"
                      sourceGroupTag={intentTag}
                      buttonLabel="Unlock RideGuide Access ➔"
                      onSuccess={onSuccess}
                    />
                  </div>
                  <span className="capture-legal-disclaimer">
                    By entering your email address, you agree to receiving email marketing
                  </span>
                </>
              )}
              <div className="capture-instructions-deck-footer"></div>
            </div>
          )}

          {/* Map Image Contain Shell */}
          <div className="blueprint-viewport-display-contain">
            {mode === "landing" && (
              <div 
                className="blueprint-hotspot-highlight-overlay" 
                style={{ 
                  top: overlayCoordinates[activePillar].top, 
                  left: overlayCoordinates[activePillar].left, 
                  width: overlayCoordinates[activePillar].width, 
                  height: overlayCoordinates[activePillar].height 
                }} 
              >
                <span className="map-overlay-tooltip">Hover to Learn More</span>
              </div>
            )}

            {/* Reverse Map Hover Triggers */}
            {mode === "landing" && Object.entries(overlayCoordinates).map(([key, coords]) => (
              <div
                key={`reverse-hover-hotspot-${key}`}
                className="blueprint-hotspot-interactive-zone"
                style={{
                  top: coords.top,
                  left: coords.left,
                  width: coords.width,
                  height: coords.height
                }}
                onMouseEnter={() => handleTabInteraction(key)}
              />
            ))}

            <img src="/data/assets/RideGuide_Sample.png" alt="RideGuide Field Map Dashboard Mockup Blueprint Blueprint Panel" className="blueprint-main-map-image" />
          </div>
        </div>  

        {/* Action Footer Call area */}
        {mode === "landing" && (
          <div className="isolated-cta-clear-way">
            <div className="cta-inner-alignment-shield">
              <a href="/rides" className="btn btn-primary btn-cta-oversized">
                Get Today's RideGuide for Your Route
              </a>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}