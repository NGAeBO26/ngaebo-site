/* src/features/Discovery/components/MobileRideBuilder.tsx */
import { useState, useMemo, useEffect, useRef } from "react";
import {
  DIFFICULTY_STEPS,
  useRideFinderEngine,
  translateQuizToEngine,
} from "./RideFinder";
import TacticalLeadForm from "../../../components/TacticalLeadForm";
import "../../../styles/RideBuilder.css";

export interface QuizSelections {
  bikeType: "all_road" | "gravel" | "rugged" | null;
  effortLevel: "casual" | "workout" | "grunt" | "sufferfest" | null;
  distanceRange: "quick" | "half_day" | "epic" | null;
  driveTimeMax?: number | null;
  selectedRideDay?: string | null;
}

interface MobileRideBuilderProps {
  isOpen: boolean;
  onToggleOpen?: () => void;
  onClose: () => void;
  engine: ReturnType<typeof useRideFinderEngine>;
  routesData: any[];
  totalCount: number;
  onApplyQuiz: (selections: QuizSelections) => void;
  onRouteSelect?: (route: any) => void;
}

interface DualRangeProps {
  label: string;
  minLimit: number;
  maxLimit: number;
  minValue: number;
  maxValue: number;
  unit: string;
  onMinChange: (val: number) => void;
  onMaxChange: (val: number) => void;
}

function DualRangeSlider({
  label,
  minLimit,
  maxLimit,
  minValue,
  maxValue,
  unit,
  onMinChange,
  onMaxChange,
}: DualRangeProps) {
  const minPercent = Math.max(
    0,
    Math.min(100, ((minValue - minLimit) / (maxLimit - minLimit)) * 100)
  );
  const maxPercent = Math.max(
    0,
    Math.min(100, ((maxValue - minLimit) / (maxLimit - minLimit)) * 100)
  );

  return (
    <div className="rg-tuning-control-card">
      <div className="rg-tuning-label-row">
        <label className="rg-tuning-label">{label}</label>
        <span className="rg-tuning-value">
          {minValue}
          {unit} – {maxValue}
          {unit}
        </span>
      </div>

      <div className="rg-dual-range-track-wrapper">
        <div
          className="rg-dual-range-track-bar"
          style={{
            left: `${minPercent}%`,
            right: `${100 - maxPercent}%`,
          }}
        />
        <input
          type="range"
          min={minLimit}
          max={maxLimit}
          value={minValue}
          onChange={(e) => {
            const val = Math.min(Number(e.target.value), maxValue - 1);
            onMinChange(val);
          }}
          className="rg-dual-range-thumb thumb-left"
        />
        <input
          type="range"
          min={minLimit}
          max={maxLimit}
          value={maxValue}
          onChange={(e) => {
            const val = Math.max(Number(e.target.value), minValue + 1);
            onMaxChange(val);
          }}
          className="rg-dual-range-thumb thumb-right"
        />
      </div>
    </div>
  );
}

export default function MobileRideBuilder({
  isOpen,
  onToggleOpen,
  onClose,
  engine,
  routesData,
  totalCount,
  onApplyQuiz,
  onRouteSelect,
}: MobileRideBuilderProps) {
  const [activeTab, setActiveTab] = useState<"quiz" | "manual">("quiz");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  // Step Scroll Refs
  const step1Ref = useRef<HTMLDivElement>(null);
  const step2Ref = useRef<HTMLDivElement>(null);
  const step3Ref = useRef<HTMLDivElement>(null);
  const step4Ref = useRef<HTMLDivElement>(null);
  const step5Ref = useRef<HTMLDivElement>(null);

  // Accordion open step tracking (1, 2, 3, 4, 5, or null)
  const [openStep, setOpenStep] = useState<number | null>(1);

  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    return localStorage.getItem("rideguide_lead_submitted") === "true";
  });

  const [originAddress, setOriginAddress] = useState<string>("Canton, GA");

  const [selections, setSelections] = useState<QuizSelections>(() => {
    return (
      engine.activeQuizSelections || {
        bikeType: null,
        effortLevel: null,
        distanceRange: null,
        driveTimeMax: null,
        selectedRideDay: null,
      }
    );
  });

  // Dynamic 10-day weather forecast window
  const tenDayWindow = useMemo(() => {
    const days = [];
    const today = new Date();
    const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const monthNames = [
      "JAN",
      "FEB",
      "MAR",
      "APR",
      "MAY",
      "JUN",
      "JUL",
      "AUG",
      "SEP",
      "OCT",
      "NOV",
      "DEC",
    ];

    for (let i = 0; i < 10; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const iso = d.toISOString().split("T")[0];
      const dayName = dayNames[d.getDay()];
      const monthName = monthNames[d.getMonth()];
      const dateNum = d.getDate();
      const label = `${dayName} ${monthName} ${dateNum}`;

      const weatherSeed = (i * 13 + 5) % 10;
      let icon = "☀️";
      let temp = 76 + (i % 5);
      let status = "Prime Dirt";

      if (weatherSeed > 7) {
        icon = "🌧️";
        status = "Wet Dirt";
      } else if (weatherSeed > 4) {
        icon = "⛅";
        status = "Ideal Pack";
      }

      days.push({ iso, label, icon, temp: `${temp}°F`, status });
    }
    return days;
  }, []);

  const isStep1Done = selections.effortLevel !== null;
  const isStep2Done = selections.distanceRange !== null;
  const isStep3Done = selections.bikeType !== null;
  const isStep4Done = Boolean(selections.driveTimeMax);
  const isStep5Done = Boolean(selections.selectedRideDay);
  const isAllBaseStepsComplete = isStep1Done && isStep2Done && isStep3Done;

  const fetchIsochrones = engine.fetchIsochrones;

  const handleDriveTimeClick = (minutes: number) => {
    const nextVal = selections.driveTimeMax === minutes ? null : minutes;
    handleSelectOption("driveTimeMax", nextVal);

    if (
      nextVal !== null &&
      originAddress.trim() &&
      engine.filteredRoutes &&
      engine.filteredRoutes.length > 0
    ) {
      fetchIsochrones(originAddress, engine.filteredRoutes);
    }
  };

  const handleSelectOption = (key: keyof QuizSelections, value: any) => {
    const nextSelections = { ...selections, [key]: value };
    setSelections(nextSelections);
    translateQuizToEngine(nextSelections, engine);

    if (key === "effortLevel") {
      setOpenStep(2);
      setTimeout(
        () => step1Ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
        120
      );
    } else if (key === "distanceRange") {
      setOpenStep(3);
      setTimeout(
        () => step1Ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
        120
      );
    } else if (key === "bikeType") {
      setOpenStep(isUnlocked ? 4 : null);
      if (isUnlocked) {
        setTimeout(
          () => step1Ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
          120
        );
      }
    } else if (key === "driveTimeMax") {
      setOpenStep(5);
      setTimeout(
        () => step1Ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
        120
      );
    } else if (key === "selectedRideDay") {
      // 🎯 AUTO-COLLAPSE ALL STEPS WHEN STEP 5 IS COMPLETED
      setOpenStep(null);
      setTimeout(
        () => step1Ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
        120
      );
    }
  };

  useEffect(() => {
    if (!engine.activeQuizSelections) {
      setSelections({
        bikeType: null,
        effortLevel: null,
        distanceRange: null,
        driveTimeMax: null,
        selectedRideDay: null,
      });
      setOpenStep(1);
    }
  }, [engine.activeQuizSelections]);

  const activeStep = !isStep1Done
    ? 1
    : !isStep2Done
    ? 2
    : !isStep3Done
    ? 3
    : !isStep4Done
    ? 4
    : !isStep5Done
    ? 5
    : null;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        autocompleteRef.current &&
        !autocompleteRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleUnlockSuccess = () => {
    localStorage.setItem("rideguide_lead_submitted", "true");
    setIsUnlocked(true);
    setOpenStep(4);
  };

  const dynamicSuggestions = useMemo(() => {
    const query = engine.searchName.trim().toLowerCase();
    if (!query) return engine.autocompleteNames;
    return engine.autocompleteNames.filter((name: string) =>
      name.toLowerCase().includes(query)
    );
  }, [engine.searchName, engine.autocompleteNames]);

  const quizMatchesCount = useMemo(() => {
    if (!routesData || !Array.isArray(routesData)) return 0;

    let targetSurfaces: string[] | null = null;
    switch (selections.bikeType) {
      case "all_road":
      case "gravel":
        targetSurfaces = ["Paved / Chipseal", "Improved Gravel"];
        break;
      case "rugged":
      default:
        targetSurfaces = null;
        break;
    }

    let targetMaxClass = 5;
    switch (selections.effortLevel) {
      case "casual":
        targetMaxClass = 1;
        break;
      case "workout":
        targetMaxClass = 2;
        break;
      case "grunt":
        targetMaxClass = 3;
        break;
      case "sufferfest":
      default:
        targetMaxClass = 5;
        break;
    }

    let targetMinDist = 0;
    let targetMaxDist = 30;
    switch (selections.distanceRange) {
      case "quick":
        targetMinDist = 0;
        targetMaxDist = 3.0;
        break;
      case "half_day":
        targetMinDist = 3.0;
        targetMaxDist = 8.0;
        break;
      case "epic":
      default:
        targetMinDist = 8.0;
        targetMaxDist = 30.0;
        break;
    }

    const CLASS_RANK_MAP: Record<string, number> = {
      Cruiser: 1,
      Rambler: 2,
      Grinder: 3,
      Frontier: 4,
      Apex: 5,
    };

    return routesData.filter((route) => {
      const p = route.properties || {};
      const miles = p.GIS_MILES ? parseFloat(p.GIS_MILES) : 0;
      const surfaceType = String(p.v3_surface || "").trim();
      const routeLabel = String(p.v3_fcs_label || "").trim();
      const routeRank = CLASS_RANK_MAP[routeLabel] || 1;

      const matchesSurface =
        !targetSurfaces || targetSurfaces.includes(surfaceType);
      const matchesClass = targetMaxClass === 5 || routeRank <= targetMaxClass;
      const matchesDistance = miles >= targetMinDist && miles <= targetMaxDist;

      return matchesSurface && matchesClass && matchesDistance;
    }).length;
  }, [routesData, selections]);

  // Helper Labels for 1-Line Collapsed Step Summaries
  const getEffortSummary = () => {
    if (selections.effortLevel === "casual") return "Casual Spin";
    if (selections.effortLevel === "workout") return "Solid Workout";
    if (selections.effortLevel === "grunt") return "Tough Grunt";
    if (selections.effortLevel === "sufferfest") return "Sufferfest";
    return "";
  };

  const getDistanceSummary = () => {
    if (selections.distanceRange === "quick") return "Quick Burner (<3 mi)";
    if (selections.distanceRange === "half_day") return "Half-Day (3–8 mi)";
    if (selections.distanceRange === "epic") return "All-Day Epic (8+ mi)";
    return "";
  };

  const getBikeSummary = () => {
    if (selections.bikeType === "all_road") return "Commuter / All-Road";
    if (selections.bikeType === "gravel") return "Fat-Tire";
    if (selections.bikeType === "rugged") return "Mountain Bike";
    return "";
  };

  const getDriveSummary = () => {
    if (selections.driveTimeMax === 60) return "Under 1 Hour";
    if (selections.driveTimeMax === 90) return "1 – 1.5 Hours";
    if (selections.driveTimeMax === 180) return "1.5 – 3 Hours";
    return "";
  };

  const getRideDaySummary = () => {
    if (!selections.selectedRideDay) return "";
    const found = tenDayWindow.find((d) => d.iso === selections.selectedRideDay);
    return found ? `${found.label} (${found.temp})` : selections.selectedRideDay;
  };

  const hasSelections = Boolean(
    selections.effortLevel ||
      selections.distanceRange ||
      selections.bikeType ||
      selections.driveTimeMax ||
      selections.selectedRideDay
  );

  const currentClassObj =
    DIFFICULTY_STEPS.find((s) => s.level === engine.maxClassLevel) ||
    DIFFICULTY_STEPS[4];

  return (
    <div className={`rg-mega-dropdown-tray rg-mobile-ridebuilder-container ${isOpen ? "tray-open" : "tray-collapsed"}`}>
      {/* 🎯 1. WISHLIST / CTA TRIGGER BUTTON */}
      <div className="finder-controls-wrapper">
        <button
          type="button"
          className={`rg-mega-summary-trigger-btn ${isOpen ? "active" : "beacon-cta"} ${
            isAllBaseStepsComplete ? "quiz-complete" : ""
          }`}
          onClick={() => {
            if (onToggleOpen) {
              onToggleOpen();
            } else if (isOpen) {
              onClose();
            }
          }}
        >
          {hasSelections ? (
            <>
              <span className="wishlist-label">MY NEXT RIDE IS:</span>
              <span className="wishlist-phrase">
                "I'm looking for a{" "}
                <strong className={selections.effortLevel ? "active-val" : "pending-val"}>
                  {getEffortSummary() || "____"}
                </strong>{" "}
                on a{" "}
                <strong className={selections.distanceRange ? "active-val" : "pending-val"}>
                  {getDistanceSummary() || "____"}
                </strong>{" "}
                riding a{" "}
                <strong className={selections.bikeType ? "active-val" : "pending-val"}>
                  {getBikeSummary() || "____"}
                </strong>
                {selections.driveTimeMax && (
                  <>
                    {" "}within{" "}
                    <strong className="active-val">{getDriveSummary()}</strong> of{" "}
                    <strong className="active-val">{originAddress}</strong>
                  </>
                )}
                {selections.selectedRideDay && (
                  <>
                    {" "}on <strong className="active-val">{getRideDaySummary()}</strong>
                  </>
                )}
                ."
              </span>
            </>
          ) : isOpen ? (
            <>
              <span className="wishlist-label">MY NEXT RIDE IS:</span>
              <span className="quiz-prompt-label">Choose from the options below to get started!</span>
            </>
          ) : (
            <span className="cta-button-text">Build Your Next Ride ▼</span>
          )}
        </button>
      </div>

      {isOpen && (
        <>
          {/* 🎯 2. STICKY MODE TOGGLE BAR (PINNED DIRECTLY AT TOP 112PX) */}
          <div className="rg-mega-dropdown-header">
            <div className="rg-mode-toggle-group">
              <button
                type="button"
                className={`rg-mode-tab-btn ${activeTab === "quiz" ? "active" : ""}`}
                onClick={() => setActiveTab("quiz")}
              >
                RideBuilder
              </button>

              <button
                type="button"
                className={`rg-mode-tab-btn ${activeTab === "manual" ? "active" : ""}`}
                onClick={() => setActiveTab("manual")}
              >
                Advanced Filtering
              </button>
            </div>
          </div>

          {/* 🎯 3. STICKY 5-STEP TIMELINE BAR (PINNED DIRECTLY AT TOP 150PX) */}
          {activeTab === "quiz" && (
            <div className="rg-mobile-sticky-quiz-stepper">
              <button
                type="button"
                className={`stepper-pill ${isStep1Done ? "completed" : activeStep === 1 ? "active" : ""}`}
                onClick={() => {
                  setOpenStep(1);
                  step1Ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                <span className="stepper-step-num">{isStep1Done ? "✓" : "1"}</span>
                <span className="stepper-step-label">Effort</span>
              </button>

              <button
                type="button"
                className={`stepper-pill ${!isStep1Done ? "locked" : isStep2Done ? "completed" : activeStep === 2 ? "active" : ""}`}
                onClick={() => {
                  if (!isStep1Done) return;
                  setOpenStep(2);
                  step2Ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                <span className="stepper-step-num">{isStep2Done ? "✓" : "2"}</span>
                <span className="stepper-step-label">Distance</span>
              </button>

              <button
                type="button"
                className={`stepper-pill ${!isStep2Done ? "locked" : isStep3Done ? "completed" : activeStep === 3 ? "active" : ""}`}
                onClick={() => {
                  if (!isStep2Done) return;
                  setOpenStep(3);
                  step3Ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                <span className="stepper-step-num">{isStep3Done ? "✓" : "3"}</span>
                <span className="stepper-step-label">Bike</span>
              </button>

              <button
                type="button"
                className={`stepper-pill ${!isStep3Done ? "locked" : !isUnlocked ? "pro-lock" : isStep4Done ? "completed" : activeStep === 4 ? "active" : ""}`}
                onClick={() => {
                  if (!isStep3Done) return;
                  setOpenStep(4);
                  step4Ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                <span className="stepper-step-num">{!isUnlocked ? "🔒" : isStep4Done ? "✓" : "4"}</span>
                <span className="stepper-step-label">Drive</span>
              </button>

              <button
                type="button"
                className={`stepper-pill ${!isUnlocked || !isStep4Done ? "locked" : isStep5Done ? "completed" : activeStep === 5 ? "active" : ""}`}
                onClick={() => {
                  if (!isUnlocked || !isStep4Done) return;
                  setOpenStep(5);
                  step5Ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                <span className="stepper-step-num">{!isUnlocked ? "🔒" : isStep5Done ? "✓" : "5"}</span>
                <span className="stepper-step-label">Window</span>
              </button>
            </div>
          )}

      {/* ─── TAB 1: GUIDED QUIZ ACCORDION FLOW ─── */}
      {activeTab === "quiz" ? (
        <div className="rg-quiz-grid-wrapper">
          <div className="rg-quiz-grid-body">
            {/* 🎯 STEP 1: PHYSICAL EFFORT */}
            <div
              ref={step1Ref}
              className={`rg-quiz-column step-1 ${
                activeStep === 1 ? "step-current" : "step-active"
              } ${openStep !== 1 && isStep1Done ? "is-collapsed" : ""}`}
            >
              <div
                className="rg-quiz-column-title clickable"
                onClick={() => setOpenStep((prev) => (prev === 1 ? null : 1))}
              >
                <span className={`step-num ${isStep1Done ? "completed" : activeStep === 1 ? "current" : ""}`}>
                  {isStep1Done ? "✓" : "1"}
                </span>
                <h3>How hard to push?</h3>
                {openStep !== 1 && isStep1Done && (
                  <span className="step-selected-summary">{getEffortSummary()}</span>
                )}
                <span className="accordion-chevron">{openStep === 1 ? "▲" : "▼"}</span>
              </div>

              {openStep === 1 && (
                <div className="rg-quiz-cards-stack">
                  <button
                    type="button"
                    className={`rg-quiz-card ${selections.effortLevel === "casual" ? "selected" : ""}`}
                    onClick={() => handleSelectOption("effortLevel", "casual")}
                  >
                    <div className="card-icon">
                      <img
                        src="/data/assets/icon_effort_easy.svg"
                        alt="Casual Spin"
                        className="quiz-card-svg-icon"
                      />
                    </div>
                    <div className="card-text">
                      <span className="card-headline">Casual Spin</span>
                      <span className="card-subtext">Cruiser • Low effort, gentle rolling</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`rg-quiz-card ${selections.effortLevel === "workout" ? "selected" : ""}`}
                    onClick={() => handleSelectOption("effortLevel", "workout")}
                  >
                    <div className="card-icon">
                      <img
                        src="/data/assets/icon_effort_medium.svg"
                        alt="Solid Workout"
                        className="quiz-card-svg-icon"
                      />
                    </div>
                    <div className="card-text">
                      <span className="card-headline">Solid Workout</span>
                      <span className="card-subtext">Rambler • Moderate climbing</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`rg-quiz-card ${selections.effortLevel === "grunt" ? "selected" : ""}`}
                    onClick={() => handleSelectOption("effortLevel", "grunt")}
                  >
                    <div className="card-icon">
                      <img
                        src="/data/assets/icon_effort_moderate.svg"
                        alt="Tough Grunt"
                        className="quiz-card-svg-icon"
                      />
                    </div>
                    <div className="card-text">
                      <span className="card-headline">Tough Grunt</span>
                      <span className="card-subtext">Grinder • Steep backcountry ascents</span>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* 🎯 STEP 2: TIME & DISTANCE */}
            <div
              ref={step2Ref}
              className={`rg-quiz-column step-2 ${
                !isStep1Done ? "step-locked" : activeStep === 2 ? "step-current" : "step-active"
              } ${openStep !== 2 && isStep2Done ? "is-collapsed" : ""}`}
            >
              <div
                className="rg-quiz-column-title clickable"
                onClick={() => isStep1Done && setOpenStep((prev) => (prev === 2 ? null : 2))}
              >
                <span className={`step-num ${isStep2Done ? "completed" : activeStep === 2 ? "current" : ""}`}>
                  {isStep2Done ? "✓" : "2"}
                </span>
                <h3>How long on trail?</h3>
                {openStep !== 2 && isStep2Done && (
                  <span className="step-selected-summary">{getDistanceSummary()}</span>
                )}
                <span className="accordion-chevron">{openStep === 2 ? "▲" : "▼"}</span>
              </div>

              {openStep === 2 && (
                <div className="rg-quiz-cards-stack">
                  <button
                    type="button"
                    className={`rg-quiz-card ${selections.distanceRange === "quick" ? "selected" : ""}`}
                    onClick={() => handleSelectOption("distanceRange", "quick")}
                  >
                    <div className="card-icon">
                      <img
                        src="/data/assets/icon_time_quick.svg"
                        alt="Quick Burner"
                        className="quiz-card-svg-icon"
                      />
                    </div>
                    <div className="card-text">
                      <span className="card-headline">Quick Burner</span>
                      <span className="card-subtext">Under 3 Miles • Quick segment outings</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`rg-quiz-card ${selections.distanceRange === "half_day" ? "selected" : ""}`}
                    onClick={() => handleSelectOption("distanceRange", "half_day")}
                  >
                    <div className="card-icon">
                      <img
                        src="/data/assets/icon_time_half.svg"
                        alt="Half-Day Ride"
                        className="quiz-card-svg-icon"
                      />
                    </div>
                    <div className="card-text">
                      <span className="card-headline">Half-Day Ride</span>
                      <span className="card-subtext">3 – 8 Miles • 2 to 3 hours</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`rg-quiz-card ${selections.distanceRange === "epic" ? "selected" : ""}`}
                    onClick={() => handleSelectOption("distanceRange", "epic")}
                  >
                    <div className="card-icon">
                      <img
                        src="/data/assets/icon_time_allday.svg"
                        alt="All-Day Epic"
                        className="quiz-card-svg-icon"
                      />
                    </div>
                    <div className="card-text">
                      <span className="card-headline">All-Day Epic</span>
                      <span className="card-subtext">8+ Miles • Full backcountry outing</span>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* 🎯 STEP 3: BIKE & TIRES */}
            <div
              ref={step3Ref}
              className={`rg-quiz-column step-3 ${
                !isStep2Done ? "step-locked" : activeStep === 3 ? "step-current" : "step-active"
              } ${openStep !== 3 && isStep3Done ? "is-collapsed" : ""}`}
            >
              <div
                className="rg-quiz-column-title clickable"
                onClick={() => isStep2Done && setOpenStep((prev) => (prev === 3 ? null : 3))}
              >
                <span className={`step-num ${isStep3Done ? "completed" : activeStep === 3 ? "current" : ""}`}>
                  {isStep3Done ? "✓" : "3"}
                </span>
                <h3>What are you Riding?</h3>
                {openStep !== 3 && isStep3Done && (
                  <span className="step-selected-summary">{getBikeSummary()}</span>
                )}
                <span className="accordion-chevron">{openStep === 3 ? "▲" : "▼"}</span>
              </div>

              {openStep === 3 && (
                <div className="rg-quiz-cards-stack">
                  <button
                    type="button"
                    className={`rg-quiz-card ${selections.bikeType === "all_road" ? "selected" : ""}`}
                    onClick={() => handleSelectOption("bikeType", "all_road")}
                  >
                    <div className="card-icon">
                      <img
                        src="/data/assets/icon_bikes_allroad.svg"
                        alt="Commuter / All-Road"
                        className="quiz-card-svg-icon"
                      />
                    </div>
                    <div className="card-text">
                      <span className="card-headline">Commuter / All-Road</span>
                      <span className="card-subtext">28mm – 35mm Tires • Paved & Smooth Dirt</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`rg-quiz-card ${selections.bikeType === "gravel" ? "selected" : ""}`}
                    onClick={() => handleSelectOption("bikeType", "gravel")}
                  >
                    <div className="card-icon">
                      <img
                        src="/data/assets/icon_bikes_fattire.svg"
                        alt="Standard Gravel"
                        className="quiz-card-svg-icon"
                      />
                    </div>
                    <div className="card-text">
                      <span className="card-headline">Fat-Tire</span>
                      <span className="card-subtext">38mm – 45mm Tires • Forest Roads & Dirt</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`rg-quiz-card ${selections.bikeType === "rugged" ? "selected" : ""}`}
                    onClick={() => handleSelectOption("bikeType", "rugged")}
                  >
                    <div className="card-icon">
                      <img
                        src="/data/assets/icon_bikes_emtb.svg"
                        alt="Rugged / Monster"
                        className="quiz-card-svg-icon"
                      />
                    </div>
                    <div className="card-text">
                      <span className="card-headline">Mountain Bike</span>
                      <span className="card-subtext">45mm+ Tires • Native Surfaces & Deep Ruts</span>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* 🎯 CONTEXTUAL OPT-IN UNLOCK BANNER (SHOWN WHEN BASE STEPS COMPLETE & LOCKED) */}
            {isStep3Done && !isUnlocked && (
              <div className="rg-quiz-inline-unlock-banner">
                <div className="unlock-banner-top-header">
                  <span className="benefits-card-badge">
                    Filter Routes by Drive-Time and Current Route Conditions
                  </span>
                </div>

                <div className="unlock-banner-three-cols">
                  <div className="unlock-benefits-card">
                    <div className="unlock-benefit-items-stack">
                      <div className="unlock-benefit-feature-row">
                        <div className="benefit-icon-circle">
                          <img
                            src="/data/assets/icon_benefits_drivetime.svg"
                            alt="Drive Time Radii"
                            className="benefit-svg-icon"
                          />
                        </div>
                        <div className="benefit-content-block">
                          <h5 className="benefit-feature-title">Home-to-Trail Radii</h5>
                          <p className="benefit-feature-desc">
                            Drive times calculated directly from{" "}
                            <strong className="mellow-highlight">your starting location</strong>.
                          </p>
                        </div>
                      </div>

                      <div className="unlock-benefit-feature-row">
                        <div className="benefit-icon-circle">
                          <img
                            src="/data/assets/icon_benefits_conditions.svg"
                            alt="Route Conditions"
                            className="benefit-svg-icon"
                          />
                        </div>
                        <div className="benefit-content-block">
                          <h5 className="benefit-feature-title">10-Day "Prime Dirt"</h5>
                          <p className="benefit-feature-desc">
                            Live soil saturation tracking &{" "}
                            <strong className="mellow-highlight">Weather Joy Scores</strong>.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="unlock-col-center-stack">
                    <h4>Enter Your Email Address Below</h4>
                    <div className="unlock-form-container">
                      <TacticalLeadForm
                        layout="stacked"
                        sourceGroupTag="quiz_inline_telemetry_unlock"
                        buttonLabel="Unlock Pro Filtering"
                        placeholderText="Enter email address..."
                        onSuccess={() => handleUnlockSuccess()}
                      />
                    </div>
                  </div>

                  <div className="unlock-col-right-group">
                    <div className="unlock-col-divider">
                      <span className="divider-line" />
                      <span className="divider-text">OR</span>
                      <span className="divider-line" />
                    </div>

                    <div className="unlock-col-skip">
                      <h4>Standard Search</h4>
                      <p className="skip-subtext">
                        View filtered backcountry routes immediately using terrain metrics.
                      </p>
                      <button
                        type="button"
                        className="rg-skip-show-routes-btn"
                        onClick={() => {
                          onApplyQuiz(selections);
                          onClose();
                        }}
                      >
                        Skip & Show {quizMatchesCount} Routes →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 🎯 STEP 4: DRIVE-TIME ACCORDION */}
            <div
              ref={step4Ref}
              className={`rg-quiz-column step-4 ${
                !isStep3Done ? "step-locked" : activeStep === 4 ? "step-current" : "step-active"
              } ${openStep !== 4 && isStep4Done ? "is-collapsed" : ""}`}
            >
              <div
                className="rg-quiz-column-title clickable"
                onClick={() => isStep3Done && setOpenStep((prev) => (prev === 4 ? null : 4))}
              >
                <span className={`step-num ${isStep4Done ? "completed" : activeStep === 4 ? "current" : ""}`}>
                  {!isUnlocked ? "🔒" : isStep4Done ? "✓" : "4"}
                </span>
                <h3>How Far to Drive?</h3>
                {openStep !== 4 && isStep4Done && (
                  <span className="step-selected-summary">{getDriveSummary()}</span>
                )}
                <span className="accordion-chevron">{openStep === 4 ? "▲" : "▼"}</span>
              </div>

              {openStep === 4 && isUnlocked && (
                <>
                  <div className="rg-origin-input-box">
                    <span className="origin-label">Starting Location:</span>
                    <input
                      type="text"
                      value={originAddress}
                      onChange={(e) => setOriginAddress(e.target.value)}
                      className="rg-origin-text-input"
                      placeholder="City or Zip Code..."
                    />
                  </div>
                  <div className="rg-drive-time-controls-row">
                    <div className="rg-quiz-cards-stack horizontal-drive-stack">
                      <button
                        type="button"
                        className={`rg-quiz-card compact ${selections.driveTimeMax === 60 ? "selected" : ""}`}
                        onClick={() => handleDriveTimeClick(60)}
                      >
                        <span className="card-headline">Under 1 Hour</span>
                      </button>
                      <button
                        type="button"
                        className={`rg-quiz-card compact ${selections.driveTimeMax === 90 ? "selected" : ""}`}
                        onClick={() => handleDriveTimeClick(90)}
                      >
                        <span className="card-headline">1 – 1.5 Hours</span>
                      </button>
                      <button
                        type="button"
                        className={`rg-quiz-card compact ${selections.driveTimeMax === 180 ? "selected" : ""}`}
                        onClick={() => handleDriveTimeClick(180)}
                      >
                        <span className="card-headline">1.5 – 3 Hours</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* 🎯 STEP 5: BEST RIDE WINDOW ACCORDION */}
            <div
              ref={step5Ref}
              className={`rg-quiz-column step-5 ${
                !isStep4Done ? "step-locked" : activeStep === 5 ? "step-current" : "step-active"
              } ${openStep !== 5 && isStep5Done ? "is-collapsed" : ""}`}
            >
              <div
                className="rg-quiz-column-title clickable"
                onClick={() => isStep4Done && setOpenStep((prev) => (prev === 5 ? null : 5))}
              >
                <span className={`step-num ${isStep5Done ? "completed" : activeStep === 5 ? "current" : ""}`}>
                  {!isUnlocked ? "🔒" : isStep5Done ? "✓" : "5"}
                </span>
                <h3>Best Ride Window?</h3>
                {openStep !== 5 && isStep5Done && (
                  <span className="step-selected-summary">{getRideDaySummary()}</span>
                )}
                <span className="accordion-chevron">{openStep === 5 ? "▲" : "▼"}</span>
              </div>

              {openStep === 5 && isUnlocked && (
                <div className="rg-weather-days-row">
                  {tenDayWindow.map((day) => {
                    const isSelected = selections.selectedRideDay === day.iso;
                    return (
                      <div
                        key={day.iso}
                        className={`rg-weather-day-chip ${isSelected ? "selected" : ""}`}
                        onClick={() =>
                          handleSelectOption(
                            "selectedRideDay",
                            isSelected ? null : day.iso
                          )
                        }
                      >
                        <span className="chip-day">{day.label}</span>
                        <span className="chip-joy">
                          {day.icon} {day.temp}
                        </span>
                        <span className="chip-status">{day.status}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ─── TAB 2: MANUAL CONTROLS ─── */
        <div className="rg-manual-tuning-body">
          {/* 🎯 ROUTE SEARCH INPUT EXCLUSIVELY FOR ADVANCED FILTERING TAB */}
          <div className="styleable-autocomplete-wrapper top-level-search" ref={autocompleteRef}>
            <div className="autocomplete-input-inner-row">
              <img
                src="/data/assets/icon_search.svg"
                alt="Search"
                className="search-input-prefix-icon"
              />
              <input
                type="text"
                placeholder="SEARCH ROUTE NAME..."
                value={engine.searchName}
                onChange={(e) => {
                  engine.setSearchName(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="finder-text-input autocomplete-input-field"
                autoComplete="off"
              />
              <span
                className="autocomplete-dropdown-arrow-icon"
                onClick={() => setShowSuggestions(!showSuggestions)}
              ></span>
            </div>

            {showSuggestions && dynamicSuggestions.length > 0 && (
              <ul className="autocomplete-suggestions-dropdown-overlay">
                {dynamicSuggestions.map((suggestionText: string) => (
                  <li
                    key={suggestionText}
                    onClick={() => {
                      engine.setSearchName(suggestionText);
                      setShowSuggestions(false);

                      const searchPool =
                        routesData.length > 0 ? routesData : engine.filteredRoutes;
                      const matchedRoute = searchPool.find(
                        (r) =>
                          String(r.properties?.NAME || "")
                            .trim()
                            .toLowerCase() ===
                          suggestionText.trim().toLowerCase()
                      );

                      if (matchedRoute && onRouteSelect) {
                        onRouteSelect(matchedRoute);
                        onClose();
                      }
                    }}
                    className="suggestion-interactive-item"
                  >
                    {suggestionText}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <p className="rg-tuning-intro">
            Fine-tune exact numeric parameter thresholds for distance, grade, and route difficulty class:
          </p>

          <div className="rg-manual-tuning-grid">
            <div className="rg-tuning-control-card">
              <div className="rg-tuning-label-row">
                <label className="rg-tuning-label">Max Route Class</label>
                <span className="rg-tuning-value">{currentClassObj.label}</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={engine.maxClassLevel}
                onChange={(e) => engine.setMaxClassLevel(parseInt(e.target.value))}
                className="finder-range-slider"
                style={{
                  ["--value-percent" as any]: `${((engine.maxClassLevel - 1) / (5 - 1)) * 100}%`,
                }}
              />
            </div>

            <DualRangeSlider
              label="Distance Range"
              minLimit={0}
              maxLimit={30}
              minValue={engine.minDistance}
              maxValue={engine.maxDistance}
              unit=" MI"
              onMinChange={(val) => engine.setSearchMinDistance(val)}
              onMaxChange={(val) => engine.setSearchMaxDistance(val)}
            />

            <DualRangeSlider
              label="Incline Grade Range"
              minLimit={0}
              maxLimit={25}
              minValue={engine.minGrade}
              maxValue={engine.maxGrade}
              unit="%"
              onMinChange={(val) => engine.setSearchMinGrade(val)}
              onMaxChange={(val) => engine.setSearchMaxGrade(val)}
            />
          </div>
        </div>
      )}

    {/* ─── TRAY FOOTER ─── */}
    <div className="rg-mega-dropdown-footer">
        <div className="footer-col-center">
          {activeTab === "quiz" ? (
            (isUnlocked || !isStep3Done) && (
              <button
                type="button"
                className={`rg-apply-quiz-btn ${isAllBaseStepsComplete ? "highlighted" : "disabled"}`}
                disabled={!isAllBaseStepsComplete}
                onClick={() => {
                  if (!isAllBaseStepsComplete) return;
                  onApplyQuiz(selections);
                  onClose();
                }}
              >
                {isAllBaseStepsComplete
                  ? `Show ${quizMatchesCount} of ${totalCount} Matching Routes`
                  : "Complete Steps 1–3 to Filter Routes"}
              </button>
            )
          ) : (
            <button type="button" className="rg-apply-quiz-btn" onClick={onClose}>
              ✓ Apply Parameters ({engine.filteredRoutes.length} of {totalCount} Matches)
            </button>
          )}
        </div>
          </div>
        </>
      )}
    </div>
  );
}