/* src/features/Discovery/components/RideBuilder.tsx */
import { useState, useMemo, useEffect, useRef } from "react";
import {
  DIFFICULTY_STEPS,
  useRideFinderEngine,
  translateQuizToEngine,
} from "./RideFinder";
import TacticalLeadForm from "../../../components/TacticalLeadForm";
// import useIsochrone from "../../../hooks/useIsochrone";
import "../../../styles/RideBuilder.css";

export interface QuizSelections {
  bikeType: "all_road" | "gravel" | "rugged" | null;
  effortLevel: "casual" | "workout" | "grunt" | "sufferfest" | null;
  distanceRange: "quick" | "half_day" | "epic" | null;
  driveTimeMax?: number | null;
  selectedRideDay?: string | null;
}

interface MegaDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  engine: ReturnType<typeof useRideFinderEngine>;
  routesData: any[];
  totalCount: number;
  onApplyQuiz: (selections: QuizSelections) => void;
  onRouteSelect?: (route: any) => void; // 🎯 ADDED: Callback to trigger GravelPopup
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
    Math.min(100, ((minValue - minLimit) / (maxLimit - minLimit)) * 100),
  );
  const maxPercent = Math.max(
    0,
    Math.min(100, ((maxValue - minLimit) / (maxLimit - minLimit)) * 100),
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

export default function RideBuilder({
  isOpen,
  onClose,
  engine,
  routesData,
  totalCount,
  onApplyQuiz,
  onRouteSelect,
}: MegaDropdownProps) {
  const [activeTab, setActiveTab] = useState<"quiz" | "manual">("quiz");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    return localStorage.getItem("rideguide_lead_submitted") === "true";
  });

  const [originAddress, setOriginAddress] = useState<string>("Canton, GA");

  // 🎯 1. DECLARE SELECTIONS STATE BEFORE USEEFFECT HOOKS
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

  // 🎯 DYNAMIC 10-DAY WEATHER WINDOW GENERATOR (STARTING FROM TODAY)
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

      // Regional weather forecast seed
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

      days.push({
        iso,
        label,
        icon,
        temp: `${temp}°F`,
        status,
      });
    }
    return days;
  }, []);

  // Step Completion Validation & Current Step Calculation
  const isStep1Done = selections.effortLevel !== null;
  const isStep2Done = selections.distanceRange !== null;
  const isStep3Done = selections.bikeType !== null;
  const isAllBaseStepsComplete = isStep1Done && isStep2Done && isStep3Done;

  // 🎯 2. ISOCHRONE PROXIMITY HOOK INTEGRATION (DERIVED FROM SHARED ENGINE)
  const fetchIsochrones = engine.fetchIsochrones;
  const evaluateRouteProximity = engine.evaluateRouteProximity;
  const isochroneFeatureCollection = engine.isochroneFeatureCollection;

  // 🎯 EXPLICIT DRIVE-TIME SELECTION HANDLER (FIRES ONLY ON USER BUTTON CLICK)
  const handleDriveTimeClick = (minutes: number) => {
    const nextVal = selections.driveTimeMax === minutes ? null : minutes;
    handleSelectOption("driveTimeMax", nextVal);

    if (
      nextVal !== null &&
      originAddress.trim() &&
      engine.filteredRoutes &&
      engine.filteredRoutes.length > 0
    ) {
      console.log(
        `🗺️ [Drive-Time Trace] Explicit Button Click (${minutes}m): Requesting Distance Matrix for origin: "${originAddress}" with ${engine.filteredRoutes.length} candidate routes`,
      );
      fetchIsochrones(originAddress, engine.filteredRoutes);
    }
  };

  // 🎯 TRACE DRIVE-TIME EVALUATION WHEN MATRIX RESULTS UPDATE OR SELECTIONS CHANGE
  useEffect(() => {
    if (
      !isochroneFeatureCollection ||
      !engine.filteredRoutes ||
      !engine.filteredRoutes.length
    )
      return;

    console.group("🚗 [Drive-Time Execution Trace]");
    console.log("1. Origin Location:", originAddress);
    console.log(
      "2. Target Drive Threshold (Mins):",
      selections.driveTimeMax || "ALL",
    );
    console.log("3. Isochrone Feature Collection:", isochroneFeatureCollection);

    const counts: Record<string, number> = {
      under_60: 0,
      "60_90": 0,
      "90_180": 0,
      beyond: 0,
    };
    engine.filteredRoutes.forEach((route) => {
      const res = evaluateRouteProximity(route);
      counts[res.band]++;
    });

    console.log("4. Route Proximity Distribution:", counts);
    console.groupEnd();
  }, [
    isochroneFeatureCollection,
    engine.filteredRoutes,
    selections.driveTimeMax,
    originAddress,
    evaluateRouteProximity,
  ]);

  // 🎯 REAL-TIME OPTION SELECTION & LIVE YIELD DISPATCH
  const handleSelectOption = (key: keyof QuizSelections, value: any) => {
    const nextSelections = { ...selections, [key]: value };
    setSelections(nextSelections);
    translateQuizToEngine(nextSelections, engine);
  };

  // 🎯 SYNC WITH HEADER CLEAR FILTERS ACTION
  useEffect(() => {
    if (!engine.activeQuizSelections) {
      setSelections({
        bikeType: null,
        effortLevel: null,
        distanceRange: null,
        driveTimeMax: null,
        selectedRideDay: null,
      });
    }
  }, [engine.activeQuizSelections]);

  // Active step index (1, 2, or 3)
  const activeStep = !isStep1Done ? 1 : !isStep2Done ? 2 : !isStep3Done ? 3 : 4;

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
  };

  const dynamicSuggestions = useMemo(() => {
    const query = engine.searchName.trim().toLowerCase();
    if (!query) return engine.autocompleteNames;
    return engine.autocompleteNames.filter((name: string) =>
      name.toLowerCase().includes(query),
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

  if (!isOpen) return null;

  const currentClassObj =
    DIFFICULTY_STEPS.find((s) => s.level === engine.maxClassLevel) ||
    DIFFICULTY_STEPS[4];

  return (
    <div className="rg-mega-dropdown-tray">
      {/* ─── TRAY HEADER: SINGLE ROW (SEARCH -> TAB 1 -> TAB 2) ─── */}
      <div className="rg-mega-dropdown-header">
        <div className="rg-mode-toggle-group">
          {/* 🎯 1. TOP-LEVEL ROUTE SEARCH AUTOCOMPLETE FILTER */}
          <div
            className="styleable-autocomplete-wrapper top-level-search"
            ref={autocompleteRef}
          >
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

                      // 🎯 FIND MATCHING ROUTE FEATURE & OPEN GRAVEL POPUP IMMEDIATELY
                      const searchPool =
                        routesData.length > 0
                          ? routesData
                          : engine.filteredRoutes;
                      const matchedRoute = searchPool.find(
                        (r) =>
                          String(r.properties?.NAME || "")
                            .trim()
                            .toLowerCase() ===
                          suggestionText.trim().toLowerCase(),
                      );

                      // 🔍 TRACE EXECUTION LOGS
                      console.group("🔍 [Route Search Execution Trace]");
                      console.log("1. Selected Text:", suggestionText);
                      console.log("2. Search Pool Size:", searchPool.length);
                      console.log("3. Matched Route Object:", matchedRoute);
                      console.log(
                        "4. is onRouteSelect Passed?:",
                        typeof onRouteSelect === "function",
                      );
                      console.groupEnd();

                      if (matchedRoute && onRouteSelect) {
                        console.log(
                          "🚀 Triggering GravelPopup via onRouteSelect()...",
                        );
                        onRouteSelect(matchedRoute);
                        onClose(); // 🎯 Close mega dropdown tray so GravelPopup is visible
                      } else {
                        console.warn(
                          "⚠️ GravelPopup Failed to Open! Check reason above:",
                          {
                            reasonMissingRoute: !matchedRoute,
                            reasonMissingCallback: !onRouteSelect,
                          },
                        );
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

          {/* 🎯 2. GUIDED ROUTE FINDER TAB */}
          <button
            type="button"
            className={`rg-mode-tab-btn ${activeTab === "quiz" ? "active" : ""}`}
            onClick={() => setActiveTab("quiz")}
          >
            RideFinder Quiz
          </button>

          {/* 🎯 3. FINE-TUNE PARAMETERS TAB */}
          <button
            type="button"
            className={`rg-mode-tab-btn ${activeTab === "manual" ? "active" : ""}`}
            onClick={() => setActiveTab("manual")}
          >
            Advanced Filtering
          </button>
        </div>

        <button type="button" className="rg-mega-close-btn" onClick={onClose}>
          ✕ Close
        </button>
      </div>

      {/* ─── TAB 1: GUIDED QUIZ GRID ─── */}
      {activeTab === "quiz" ? (
        <div className="rg-quiz-grid-wrapper">
          <div className="rg-quiz-grid-body">
            {/* 🎯 STEP 1: PHYSICAL EFFORT (ALWAYS ACTIVE FIRST) */}
            <div
              className={`rg-quiz-column ${activeStep === 1 ? "step-current" : "step-active"}`}
            >
              <div className="rg-quiz-column-title">
                <span
                  className={`step-num ${isStep1Done ? "completed" : activeStep === 1 ? "current" : ""}`}
                >
                  {isStep1Done ? "✓" : "1"}
                </span>
                <h3>How hard to push?</h3>
              </div>

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
                    <span className="card-subtext">
                      Cruiser • Low effort, gentle rolling
                    </span>
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
                    <span className="card-subtext">
                      Rambler • Moderate climbing
                    </span>
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
                    <span className="card-subtext">
                      Grinder • Steep backcountry ascents
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* 🎯 STEP 2: TIME & DISTANCE (LOCKED UNTIL STEP 1 IS DONE) */}
            <div
              className={`rg-quiz-column ${!isStep1Done ? "step-locked" : activeStep === 2 ? "step-current" : "step-active"}`}
            >
              <div className="rg-quiz-column-title">
                <span
                  className={`step-num ${isStep2Done ? "completed" : activeStep === 2 ? "current" : ""}`}
                >
                  {isStep2Done ? "✓" : "2"}
                </span>
                <h3>How long on trail?</h3>
              </div>

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
                    <span className="card-subtext">
                      Under 3 Miles • Quick segment outings
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  className={`rg-quiz-card ${selections.distanceRange === "half_day" ? "selected" : ""}`}
                  onClick={() =>
                    handleSelectOption("distanceRange", "half_day")
                  }
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
                    <span className="card-subtext">
                      3 – 8 Miles • 2 to 3 hours
                    </span>
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
                    <span className="card-subtext">
                      8+ Miles • Full backcountry outing
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* 🎯 STEP 3: BIKE & TIRES (LOCKED UNTIL STEP 2 IS DONE) */}
            <div
              className={`rg-quiz-column ${!isStep2Done ? "step-locked" : activeStep === 3 ? "step-current" : "step-active"}`}
            >
              <div className="rg-quiz-column-title">
                <span
                  className={`step-num ${isStep3Done ? "completed" : activeStep === 3 ? "current" : ""}`}
                >
                  {isStep3Done ? "✓" : "3"}
                </span>
                <h3>What are you Riding?</h3>
              </div>

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
                    <span className="card-subtext">
                      28mm – 35mm Tires • Suitable for: Paved & Smooth Dirt
                    </span>
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
                    <span className="card-subtext">
                      38mm – 45mm Tires • Suitable for: Forest Roads & Dirt
                    </span>
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
                    <span className="card-subtext">
                      45mm+ Tires • Suitable for: Native Surfaces & Deep Ruts
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* ─── CONTEXTUAL OPT-IN & ADVANCED TELEMETRY STATE MACHINE ─── */}
          {/* ─── CONTEXTUAL OPT-IN & ADVANCED TELEMETRY STATE MACHINE ─── */}
          {!isUnlocked ? (
            !isStep3Done ? (
              /* STATE A: PREVIEW DIMMED ROW DURING STEPS 1–3 */
              <div className="rg-quiz-preview-locked-row step-locked">
                <div className="rg-preview-column">
                  <div className="rg-quiz-column-title">
                    <span className="step-num">4</span>
                    <h3>How Far to Drive?</h3>
                  </div>
                  <div className="rg-origin-input-box">
                    <span className="origin-label">Starting Location:</span>
                    <input
                      type="text"
                      disabled
                      value="Canton, GA"
                      className="rg-origin-text-input"
                    />
                  </div>
                  <div className="rg-drive-time-controls-row">
                    <div className="drive-time-icon-wrapper">
                      <img
                        src="/data/assets/icon_benefits_drivetime.svg"
                        alt="Drive Time"
                        className="drive-time-svg-icon"
                      />
                    </div>
                    <div className="rg-quiz-cards-stack horizontal-drive-stack">
                      <div className="rg-quiz-card compact">
                        <span className="card-headline">Under 1 Hour</span>
                      </div>
                      <div className="rg-quiz-card compact">
                        <span className="card-headline">1 – 1.5 Hours</span>
                      </div>
                      <div className="rg-quiz-card compact">
                        <span className="card-headline">1.5 – 3 Hours</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rg-preview-column">
                  <div className="rg-quiz-column-title">
                    <span className="step-num">5</span>
                    <h3>Best Ride Window?</h3>
                  </div>
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
                              isSelected ? null : day.iso,
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
                </div>
              </div>
            ) : (
              /* 🎯 STATE B: REFACTORED 3-COLUMN UNLOCK BANNER WITH CENTERED OVERALL HEADER BADGE */
              <div className="rg-quiz-inline-unlock-banner">
                {/* 🎯 OVERALL CENTERED BANNER HEADER BADGE */}
                <div className="unlock-banner-top-header">
                  <span className="benefits-card-badge">
                    Filter Routes by Drive-Time and Current Route Conditions
                  </span>
                </div>

                <div className="unlock-banner-three-cols">
                  {/* COLUMN 1: STACKED FEATURE CARD (LEFT) */}
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
                          <h5 className="benefit-feature-title">
                            Home-to-Trail Radii
                          </h5>
                          <p className="benefit-feature-desc">
                            Drive times calculated directly from{" "}
                            <strong className="mellow-highlight">
                              your starting location
                            </strong>
                            .
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
                          <h5 className="benefit-feature-title">
                            10-Day "Prime Dirt"
                          </h5>
                          <p className="benefit-feature-desc">
                            Live soil saturation tracking &{" "}
                            <strong className="mellow-highlight">
                              Weather Joy Scores
                            </strong>
                            .
                          </p>
                        </div>
                      </div>

                      <div className="unlock-benefit-feature-row">
                        <div className="benefit-icon-circle">
                          <img
                            src="/data/assets/icon_benefits_sample.svg"
                            alt="Free Sample Pack"
                            className="benefit-svg-icon"
                          />
                        </div>
                        <div className="benefit-content-block">
                          <h5 className="benefit-feature-title">
                            Free Sample Pack
                          </h5>
                          <p className="benefit-feature-desc">
                            Includes GPX tracks, continuous profiles &{" "}
                            <strong className="mellow-highlight">
                              safety checklists
                            </strong>
                            .
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* COLUMN 2: DEAD-CENTERED PRO OPT-IN STACK */}
                  <div className="unlock-col-center-stack">
                    <h4>Enter Your Email Address Below</h4>
                    <div className="unlock-form-container">
                      <TacticalLeadForm
                        layout="stacked"
                        sourceGroupTag="quiz_inline_telemetry_unlock"
                        buttonLabel="Unlock Pro Filtering"
                        placeholderText="Enter email address..."
                        onSuccess={() => {
                          handleUnlockSuccess();
                          // 🎯 REVISED: Kept dropdown open to reveal Pro Filtering steps 4 & 5 in-place
                        }}
                      />
                    </div>
                  </div>

                  {/* COLUMN 3: DIVIDER + SKIP BUTTON (RIGHT) */}
                  <div className="unlock-col-right-group">
                    <div className="unlock-col-divider">
                      <span className="divider-line" />
                      <span className="divider-text">OR</span>
                      <span className="divider-line" />
                    </div>

                    <div className="unlock-col-skip">
                      <h4>Standard Search</h4>
                      <p className="skip-subtext">
                        View filtered backcountry routes immediately using
                        terrain metrics.
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
            )
          ) : (
            /* STATE C: UNLOCKED STEPS 4 & 5 FOR OPTED-IN USERS */
            <div className="rg-quiz-unlocked-row">
              <div className="rg-quiz-column step-active">
                <div className="rg-quiz-column-title">
                  <span className="step-num completed">✓</span>
                  <h3>How Far to Drive?</h3>
                </div>
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
                  <div className="drive-time-icon-wrapper">
                    <img
                      src="/data/assets/icon_benefits_drivetime.svg"
                      alt="Drive Time"
                      className="drive-time-svg-icon"
                    />
                  </div>
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
              </div>

              <div className="rg-quiz-column step-active">
                <div className="rg-quiz-column-title">
                  <span className="step-num completed">✓</span>
                  <h3>Best Ride Window?</h3>
                </div>
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
                            isSelected ? null : day.iso,
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
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ─── TAB 2: MANUAL CONTROLS (3 PARAMETER CARDS) ─── */
        <div className="rg-manual-tuning-body">
          <p className="rg-tuning-intro">
            Fine-tune exact numeric parameter thresholds for distance, grade,
            and route difficulty class:
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
                onChange={(e) =>
                  engine.setMaxClassLevel(parseInt(e.target.value))
                }
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
                  ? `🚀 Show ${quizMatchesCount} of ${totalCount} Matching Routes`
                  : "Complete Steps 1–3 to Filter Routes"}
              </button>
            )
          ) : (
            <button
              type="button"
              className="rg-apply-quiz-btn"
              onClick={onClose}
            >
              ✓ Apply Parameters ({engine.filteredRoutes.length} of {totalCount}{" "}
              Matches)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
