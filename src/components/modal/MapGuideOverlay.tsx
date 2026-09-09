/* src/components/modal/MapGuideOverlay.tsx */
import { useState, useEffect, useLayoutEffect, useRef } from "react";
import "../../styles/MapGuideOverlay.css";

interface OnboardingStep {
  stepNumber: number;
  title: string;
  subHeader: string;
  videoDesktopUrl: string;
  videoMobileUrl: string;
}

interface MapGuideOverlayProps {
  isMapReady: boolean;
  isDesktopTakeoverActive: boolean;
  isMobile: boolean;
}

export default function MapGuideOverlay({ 
  isMapReady, 
  isDesktopTakeoverActive, 
  isMobile 
}: MapGuideOverlayProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'filters' | 'map'>('filters');
  const [activeWelcomePillar, setActiveWelcomePillar] = useState<string>("analytics");

  const modalRef = useRef<HTMLDivElement>(null);

  const overlayCoordinates: Record<string, { top: string; left: string; width: string; height: string }> = {
    analytics: { top: "26.5%", left: "3.2%", width: "24.5%", height: "53.2%" },
    weather: { top: "12.8%", left: "3%", width: "94%", height: "14%" },
    terrain: { top: "79.6%", left: "3.2%", width: "94%", height: "15%" }
  };

  const STEPS: OnboardingStep[] = [
    {
      stepNumber: 1,
      title: "Locate Your Route",
      subHeader: "01 / 03 • EXPLORE THE REGISTRY",
      videoDesktopUrl: "/data/assets/videos/guides/guide-step-1-filters-desktop.mp4",
      videoMobileUrl: "/data/assets/videos/guides/guide-step-1-filters-mobile.mp4"
    },
    {
      stepNumber: 2,
      title: "Inspect Deep Metrics",
      subHeader: "02 / 03 • THE GRAVEL POPUP MATRIX",
      videoDesktopUrl: "/data/assets/videos/guides/guide-step-2-desktop.mp4",
      videoMobileUrl: "/data/assets/videos/guides/guide-step-2-mobile.mp4"
    },
    {
      stepNumber: 3,
      title: "Review & Checkout",
      subHeader: "03 / 03 • YOUR BACKCOUNTRY CATALOG",
      videoDesktopUrl: "/data/assets/videos/guides/guide-step-3-desktop.mp4",
      videoMobileUrl: "/data/assets/videos/guides/guide-step-3-mobile.mp4"
    }
  ];

  // Add this simple lifecycle hook effect inside your component block definitions:
  useEffect(() => {
    const handleForceOpenTourChannel = () => {
      setIsOpen(true);
      setCurrentStep(0); // Rewinds workflow back to welcome screen state
    };

    window.addEventListener("rg-open-onboarding-tour", handleForceOpenTourChannel);
    return () => window.removeEventListener("rg-open-onboarding-tour", handleForceOpenTourChannel);
  }, []);

  useLayoutEffect(() => {
    const isAlreadyOnboarded = localStorage.getItem("nga_map_onboarded") === "true";
    if (isAlreadyOnboarded || !isMapReady) return;

    if (isMobile) {
      setIsOpen(true);
    } else {
      if (isDesktopTakeoverActive) {
        setIsOpen(true);
      }
    }
  }, [isMapReady, isDesktopTakeoverActive, isMobile]);

  useEffect(() => {
    if (!isOpen) {
      document.body.classList.remove("guide-overlay-active", "guide-highlight-filters", "guide-highlight-map", "guide-highlight-popup", "guide-highlight-checkout");
      return;
    }

    document.body.classList.add("guide-overlay-active");
    document.body.classList.remove("guide-highlight-filters", "guide-highlight-map", "guide-highlight-popup", "guide-highlight-checkout");

    if (currentStep === 1) {
      if (activeTab === 'filters') {
        document.body.classList.add("guide-highlight-filters");
      } else {
        document.body.classList.add("guide-highlight-map");
      }
    }
    if (currentStep === 2) document.body.classList.add("guide-highlight-popup");
    if (currentStep === 3) document.body.classList.add("guide-highlight-checkout");

  }, [currentStep, isOpen, activeTab]);

  if (!isOpen) return null;

  const activeStepData = STEPS[currentStep - 1];

  // 🎯 MEDIA ROUTER ENGINE (UPDATED WITH PRECISION MAPCLICK STRING TARGETS)
  const getCurrentVideoUrl = (): string => {
    if (currentStep === 1) {
      if (isMobile) {
        return activeTab === 'filters' 
          ? "/data/assets/videos/guides/guide-step-1-filters-mobile.mp4" 
          : "/data/assets/videos/guides/guide-step-1-mapclick-mobile.mp4";
      } else {
        return activeTab === 'filters' 
          ? "/data/assets/videos/guides/guide-step-1-filters-desktop.mp4" 
          : "/data/assets/videos/guides/guide-step-1-mapclick-desktop.mp4"; // 🎯 Refactored target
      }
    }
    
    if (!activeStepData) return "";
    return isMobile ? activeStepData.videoMobileUrl : activeStepData.videoDesktopUrl;
  };

  const handleNextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    } else {
      handleDismissTour();
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleDismissTour = () => {
    if (dontShowAgain) {
      localStorage.setItem("nga_map_onboarded", "true");
    }
    setIsOpen(false);
  };

  return (
    <div className="rg-guide-backdrop" role="presentation">
      <div 
        className="rg-guide-container" 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="rg-guide-title" 
        tabIndex={-1} 
        ref={modalRef} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rg-guide-brand-banner">
          <img src="/images/site-logo.png" alt="NGAEBO Site Logo" className="rg-guide-banner-logo-left" />
          <img src="/images/RideGuide_embroid-v1.svg" alt="RideGuide Centered Logo" className="rg-guide-banner-branding-svg-center" />
        </div>

        <button className="rg-guide-close-x" onClick={handleDismissTour} aria-label="Skip onboarding map guide menu">
          &times;
        </button>

        {/* ─── STATE 0: OVERHAULED WELCOME SCREEN INTRO ─── */}
        {currentStep === 0 ? (
          <div className="rg-guide-workspace-body mod-welcome-layout">
            <div className="rg-guide-welcome-left-copy">
              <span className="rg-guide-deal-tag mod-premium-amber">Tactical Telemetry Overview</span>
              <span className="rg-welcome-eyebrow-sub">PLAN FASTER • RIDE SMARTER</span>
              <h2 id="rg-guide-title" className="rg-guide-main-title mod-light-text">Every Adventure Starts with a Plan</h2>
              
              <div className="rg-welcome-horizontal-pill-carousel" role="tablist">
                <button 
                  className={`rg-welcome-carousel-pill ${activeWelcomePillar === "analytics" ? "active" : ""}`}
                  onClick={() => setActiveWelcomePillar("analytics")}
                >
                  📊 Analytics
                </button>
                <button 
                  className={`rg-welcome-carousel-pill ${activeWelcomePillar === "weather" ? "active" : ""}`}
                  onClick={() => setActiveWelcomePillar("weather")}
                >
                  🌧️ Saturation
                </button>
                <button 
                  className={`rg-welcome-carousel-pill ${activeWelcomePillar === "terrain" ? "active" : ""}`}
                  onClick={() => setActiveWelcomePillar("terrain")}
                >
                  ⛰️ Topography
                </button>
              </div>

              <div className="rg-welcome-dynamic-benefit-injector">
                {activeWelcomePillar === "analytics" && (
                  <div className="rg-benefit-anim-node">
                    <p className="rg-benefit-injector-heading">⚡ Route Analytics Coverage</p>
                    <p className="rg-benefit-injector-text">Instantly evaluate track parameters. Verify exact mileage, gradient profiles, and technical ratings so you never head out blind into a valley.</p>
                  </div>
                )}
                {activeWelcomePillar === "weather" && (
                  <div className="rg-benefit-anim-node">
                    <p className="rg-benefit-injector-heading">🌦️ Surface Saturation Tracking</p>
                    <p className="rg-benefit-injector-text">Stop guessing how much rain a trail absorbed. Check real-time precipitation history to ensure you encounter premium tacky dirt instead of axle-deep muck.</p>
                  </div>
                )}
                {activeWelcomePillar === "terrain" && (
                  <div className="rg-benefit-anim-node">
                    <p className="rg-benefit-injector-heading">🔋 Power Mapping Analytics</p>
                    <p className="rg-benefit-injector-text">Analyze high-resolution elevation gains to protect battery health. Map steep gradients to extend eBike voltage and prevent system overheating.</p>
                  </div>
                )}
              </div>

              <div className="rg-guide-welcome-quick-bullets-row">
                <span className="rg-guide-bullet-mini-badge mod-dark-variant">✓ 100% Offline Capable</span>
                <span className="rg-guide-bullet-mini-badge mod-dark-variant">✓ Zero Subscriptions</span>
              </div>
            </div>

            <div className="rg-guide-welcome-right-showcase">
              <div className="rg-guide-interactive-blueprint-container">
                <div 
                  className="blueprint-hotspot-highlight-overlay mod-welcome-override" 
                  style={{ 
                    top: overlayCoordinates[activeWelcomePillar].top, 
                    left: overlayCoordinates[activeWelcomePillar].left, 
                    width: overlayCoordinates[activeWelcomePillar].width, 
                    height: overlayCoordinates[activeWelcomePillar].height 
                  }} 
                />

                {Object.keys(overlayCoordinates).map((key) => (
                  <div
                    key={`welcome-hotspot-${key}`}
                    className={`blueprint-hotspot-interactive-zone mod-welcome-reticle ${activeWelcomePillar === key ? 'active' : ''}`}
                    style={{
                      top: `calc(${overlayCoordinates[key].top} + (${overlayCoordinates[key].height} / 2) - 10px)`,
                      left: `calc(${overlayCoordinates[key].left} + (${overlayCoordinates[key].width} / 2) - 10px)`,
                    }}
                    onMouseEnter={() => setActiveWelcomePillar(key)}
                    onClick={() => setActiveWelcomePillar(key)}
                  />
                ))}

                <img 
                  src="/data/assets/RideGuide_Sample.png" 
                  alt="Premium RideGuide Telemetry Sheet Map Showcase" 
                  className="rg-guide-blueprint-base-img" 
                />
              </div>
            </div>
          </div>
        ) : (
          /* ─── STATES 1-3: INTERACTIVE TOUR PLATFORM STEPS ─── */
          <div className="rg-guide-workspace-body">
            <div className="rg-guide-identity-header">
              <div className="rg-guide-meta-badge-row">
                <span className="rg-guide-deal-tag">Interface Tour</span>
                <span className="rg-guide-step-indicator-lbl">{STEPS[currentStep - 1].subHeader}</span>
              </div>
              <h2 id="rg-guide-title" className="rg-guide-main-title">{STEPS[currentStep - 1].title}</h2>
            </div>

            <div className={`rg-guide-segmented-tabs-bar ${currentStep !== 1 ? "mod-hidden-placeholder" : ""}`} role="tablist" aria-label="Discovery view controls">
              <button 
                type="button" 
                className={`rg-guide-tab-pill ${activeTab === 'filters' ? 'active-pill' : ''}`}
                onClick={() => currentStep === 1 && setActiveTab('filters')}
                role="tab"
                aria-selected={activeTab === 'filters'}
                tabIndex={currentStep === 1 ? 0 : -1}
              >
                Find Route Using Filters
              </button>
              <button 
                type="button" 
                className={`rg-guide-tab-pill ${activeTab === 'map' ? 'active-pill' : ''}`}
                onClick={() => currentStep === 1 && setActiveTab('map')}
                role="tab"
                aria-selected={activeTab === 'map'}
                tabIndex={currentStep === 1 ? 0 : -1}
              >
                Find Route Using Map
              </button>
            </div>

            <div className="rg-guide-description-chassis">
              <p className="rg-guide-subcaption">
                {currentStep === 1 && (activeTab === 'filters' 
                  ? "Use the top filter criteria bar to slide your preferred distance, surface types, or grade bounds. The dashboard directory grid matches parameters automatically."
                  : "Pan, tilt, and zoom across the interactive topographic canvas layout layer. Click directly on any active track pin cluster or trace to populate specific metrics.")
                }
                {currentStep === 2 && "Tapping a pin brings up the centralized popup dashboard. Here you can inspect high-accuracy elevation charts, fire service road profiles, and technical ratings. Tap the 'Add Route to Checklist' CTA right inside the card to stage it."}
                {currentStep === 3 && "Open the StorePanel drawer to view your accumulated checklist rows. Your selections sit staged and ready. When you are fully prepared to secure the detailed offline terrain packages, hit the checkout initiation button to wrap up."}
              </p>
              
              <div className="rg-guide-step-dots-row">
                <span className={`rg-guide-step-dot ${currentStep === 0 ? 'active' : ''}`} onClick={() => setCurrentStep(0)} />
                {STEPS.map((step) => (
                  <span 
                    key={step.stepNumber} 
                    className={`rg-guide-step-dot ${currentStep === step.stepNumber ? 'active' : ''}`}
                    onClick={() => setCurrentStep(step.stepNumber)}
                  />
                ))}
              </div>

              <div className="rg-guide-left-bypass-holder">
                <button onClick={handleDismissTour} className="rg-guide-dismiss-bypass-btn">
                  Skip Interface Tour Completely
                </button>
              </div>
            </div>

            <div className="rg-guide-media-screen-box">
              <div className="rg-guide-video-window-chassis">
                <video 
                  key={`${currentStep}-${activeTab}-${isMobile}`}
                  className="rg-guide-video-canvas"
                  autoPlay 
                  muted 
                  loop 
                  playsInline
                >
                  <source src={getCurrentVideoUrl()} type="video/mp4" />
                </video>
              </div>
            </div>
          </div>
        )}

        <footer className="rg-guide-footer-dock-wrapper">
          <div className="rg-guide-footer-checkbox-side">
            <label className="rg-guide-checkbox-container-label">
              <input 
                type="checkbox" 
                id="nga-dont-show-again-checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
              />
              <span className="rg-guide-checkbox-custom-box"></span>
              <span className="rg-guide-checkbox-text-label">Don't show this introductory tour again</span>
            </label>
          </div>

          <div className="rg-guide-footer-navigation-buttons-side">
            {currentStep > 0 && (
              <button type="button" onClick={handlePrevStep} className="rg-guide-nav-btn mod-secondary-back">
                Back
              </button>
            )}
            <button type="button" onClick={handleNextStep} className="rg-guide-nav-btn mod-primary-action">
              {currentStep === 0 ? "Start Interface Tour ➔" : currentStep === STEPS.length ? "Get Riding ➔" : "Next Step ➔"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}