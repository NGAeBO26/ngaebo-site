/* src/features/Discovery/components/RideFinder.tsx */
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import RideBuilder, { type QuizSelections } from "./RideBuilder";
import useIsochrone, {
  type IsochroneBandResult,
} from "../../../hooks/useIsochrone";

const BADGES_BASE = "/images/badges/fcs";

export const DIFFICULTY_STEPS = [
  { level: 1, key: "Cruiser", label: "Cruiser", descriptor: "Easy" },
  { level: 2, key: "Rambler", label: "Rambler", descriptor: "Moderate" },
  { level: 3, key: "Grinder", label: "Grinder", descriptor: "Challenging" },
  { level: 4, key: "Frontier", label: "Frontier", descriptor: "Strenuous" },
  { level: 5, key: "Apex", label: "ALL (Apex)", descriptor: "Expert / All" },
];

const CLASS_RANK_MAP: Record<string, number> = {
  Cruiser: 1,
  Rambler: 2,
  Grinder: 3,
  Frontier: 4,
  Apex: 5,
};

export function useRideFinderEngine(
  routesData: any[],
  onFilterChange: (filtered: any[]) => void,
) {
  const [searchName, setSearchName] = useState("");
  const [maxClassLevel, setMaxClassLevel] = useState(5);
  const [minDistance, setSearchMinDistance] = useState(0);
  const [maxDistance, setSearchMaxDistance] = useState(30);
  const [minGrade, setSearchMinGrade] = useState(0);
  const [maxGrade, setSearchMaxGrade] = useState(25);
  const [allowedSurfaces, setAllowedSurfaces] = useState<string[] | null>(null);

  // 🎯 Sorting State (Supports Match %, Proximity, Name, Distance, Grade, Ride Window Joy)
  const [sortBy, setSortByState] = useState<
    "match" | "name" | "distance" | "grade" | "proximity" | "joy"
  >("match");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Auto-sync default sort direction whenever sort metric changes
  const setSortBy = useCallback(
    (
      newSortBy: "match" | "name" | "distance" | "grade" | "proximity" | "joy",
    ) => {
      setSortByState(newSortBy);
      const DEFAULT_ORDERS: Record<string, "asc" | "desc"> = {
        match: "desc",
        name: "asc",
        distance: "asc",
        grade: "desc",
        proximity: "asc",
        joy: "desc",
      };
      setSortOrder(DEFAULT_ORDERS[newSortBy] || "asc");
    },
    [],
  );

  // 🎯 Track Active Natural Language Quiz Choices for Header HUD
  const [activeQuizSelections, setActiveQuizSelections] =
    useState<QuizSelections | null>(null);

  // 🎯 SINGLETON ISOCHRONE / DISTANCE MATRIX ENGINE INSTANCE
  const isochrone = useIsochrone();

  const autocompleteNames = useMemo(() => {
    if (!routesData || !Array.isArray(routesData)) return [];
    const names = routesData
      .map((r) => r.properties?.NAME)
      .filter(
        (name): name is string =>
          typeof name === "string" && name.trim() !== "",
      );
    return Array.from(new Set(names)).sort();
  }, [routesData]);

  const filteredRoutes = useMemo(() => {
    if (!routesData || !Array.isArray(routesData)) return [];

    const result = routesData.filter((route) => {
      const p = route.properties || {};

      const matchesName =
        !searchName.trim() ||
        (p.NAME &&
          p.NAME.toLowerCase().includes(searchName.toLowerCase().trim()));

      const routeLabel = String(p.v3_fcs_label || "").trim();
      const routeRank = CLASS_RANK_MAP[routeLabel] || 1;
      const matchesClass = maxClassLevel === 5 || routeRank <= maxClassLevel;

      const miles = p.GIS_MILES ? parseFloat(p.GIS_MILES) : 0;
      const matchesDistance = miles >= minDistance && miles <= maxDistance;

      const grade = p.v3_avg_grade ? parseFloat(p.v3_avg_grade) : 0;
      const matchesGrade = grade >= minGrade && grade <= maxGrade;

      const surfaceType = String(p.v3_surface || "").trim();
      const matchesSurface =
        !allowedSurfaces ||
        allowedSurfaces.length === 0 ||
        allowedSurfaces.includes(surfaceType);

      return (
        matchesName &&
        matchesClass &&
        matchesDistance &&
        matchesGrade &&
        matchesSurface
      );
    });

    // 🎯 DYNAMIC MULTI-METRIC SORTING COMPARATOR (INCLUDES PROXIMITY)
    return result.sort((a, b) => {
      const pA = a.properties || {};
      const pB = b.properties || {};
      const idA = String(pA.profile_id || a.id || pA.id || "");
      const idB = String(pB.profile_id || b.id || pB.id || "");
      let comparison = 0;

      if (sortBy === "match") {
        const scoreA = calculateRouteMatchScore(
          a,
          activeQuizSelections,
          isochrone.driveTimesMap,
        );
        const scoreB = calculateRouteMatchScore(
          b,
          activeQuizSelections,
          isochrone.driveTimesMap,
        );
        comparison = scoreA - scoreB; // Ascending: lowest match % to highest match %
      } else if (sortBy === "joy") {
        const dayIso = activeQuizSelections?.selectedRideDay || "";
        const scoreA = getRouteJoyScore(a, dayIso).score;
        const scoreB = getRouteJoyScore(b, dayIso).score;
        comparison = scoreA - scoreB; // Ascending: lowest joy score to highest joy score
      } else if (sortBy === "proximity") {
        const timeA = isochrone.driveTimesMap[idA]?.durationMins ?? 9999;
        const timeB = isochrone.driveTimesMap[idB]?.durationMins ?? 9999;
        comparison = timeA - timeB;
      } else if (sortBy === "name") {
        const nameA = String(pA.NAME || "")
          .trim()
          .toLowerCase();
        const nameB = String(pB.NAME || "")
          .trim()
          .toLowerCase();
        comparison = nameA.localeCompare(nameB);
      } else if (sortBy === "distance") {
        const distA = pA.GIS_MILES ? parseFloat(pA.GIS_MILES) : 0;
        const distB = pB.GIS_MILES ? parseFloat(pB.GIS_MILES) : 0;
        comparison = distA - distB;
      } else if (sortBy === "grade") {
        const gradeA = pA.v3_avg_grade ? parseFloat(pA.v3_avg_grade) : 0;
        const gradeB = pB.v3_avg_grade ? parseFloat(pB.v3_avg_grade) : 0;
        comparison = gradeA - gradeB;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [
    routesData,
    searchName,
    maxClassLevel,
    minDistance,
    maxDistance,
    minGrade,
    maxGrade,
    allowedSurfaces,
    sortBy,
    sortOrder,
    isochrone.driveTimesMap,
  ]);

  // 🎯 DISPATCH FILTER UPDATES TO PARENT
  useEffect(() => {
    onFilterChange(filteredRoutes);
  }, [filteredRoutes, onFilterChange]);

  // 🎯 RESET FILTERS HANDLER
  const resetFilters = useCallback(() => {
    setSearchName("");
    setMaxClassLevel(5);
    setSearchMinDistance(0);
    setSearchMaxDistance(30);
    setSearchMinGrade(0);
    setSearchMaxGrade(25);
    setAllowedSurfaces(null);
    setActiveQuizSelections(null);
  }, []);

  const setSelectedClass = useCallback((clsName: string) => {
    const rank = CLASS_RANK_MAP[clsName] ?? 5;
    setMaxClassLevel(rank);
  }, []);

  const selectedClass = useMemo(() => {
    if (maxClassLevel === 5) return "ALL";
    const found = DIFFICULTY_STEPS.find((s) => s.level === maxClassLevel);
    return found ? found.key : "ALL";
  }, [maxClassLevel]);

  const toggleSortOrder = useCallback(() => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  }, []);

  return {
    searchName,
    setSearchName,
    selectedClass,
    setSelectedClass,
    maxClassLevel,
    setMaxClassLevel,
    minDistance,
    setSearchMinDistance,
    maxDistance,
    setSearchDistance: setSearchMaxDistance,
    setSearchMaxDistance,
    minGrade,
    setSearchMinGrade,
    maxGrade,
    setSearchGrade: setSearchMaxGrade,
    setSearchMaxGrade,
    allowedSurfaces,
    setAllowedSurfaces,
    activeQuizSelections,
    setActiveQuizSelections,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    toggleSortOrder,
    autocompleteNames,
    filteredRoutes,
    resetFilters,
    // Expose Isochrone methods on engine
    fetchIsochrones: isochrone.fetchIsochrones,
    evaluateRouteProximity: isochrone.evaluateRouteProximity,
    driveTimesMap: isochrone.driveTimesMap,
    isochroneFeatureCollection: isochrone.isochroneFeatureCollection,
  };
}

// 🎯 100-POINT PERCENT MATCH SCORE ENGINE
export function calculateRouteMatchScore(
  route: any,
  quiz: QuizSelections | null,
  driveTimesMap: Record<string, any>,
): number {
  if (!quiz) return 100;

  let totalScore = 0;

  // 1. Bike & Surface Match (25 Points)
  if (quiz.bikeType) {
    const surface = String(route.properties?.v3_surface || "").trim();
    if (quiz.bikeType === "all_road" || quiz.bikeType === "gravel") {
      if (surface === "Paved / Chipseal" || surface === "Improved Gravel") {
        totalScore += 25;
      } else {
        totalScore += 12;
      }
    } else if (quiz.bikeType === "rugged") {
      totalScore += 25;
    }
  } else {
    totalScore += 25;
  }

  // 2. Effort & Class Match (25 Points)
  if (quiz.effortLevel) {
    const routeLabel = String(route.properties?.v3_fcs_label || "").trim();
    const routeRank = CLASS_RANK_MAP[routeLabel] || 1;
    let targetRank = 5;
    if (quiz.effortLevel === "casual") targetRank = 1;
    else if (quiz.effortLevel === "workout") targetRank = 2;
    else if (quiz.effortLevel === "grunt") targetRank = 3;
    else if (quiz.effortLevel === "sufferfest") targetRank = 5;

    const diff = Math.abs(routeRank - targetRank);
    if (diff === 0) totalScore += 25;
    else if (diff === 1) totalScore += 16;
    else if (diff === 2) totalScore += 8;
  } else {
    totalScore += 25;
  }

  // 3. Distance Range (20 Points)
  if (quiz.distanceRange) {
    const miles = route.properties?.GIS_MILES
      ? parseFloat(route.properties.GIS_MILES)
      : 0;
    let targetMin = 0,
      targetMax = 30;
    if (quiz.distanceRange === "quick") {
      targetMin = 0;
      targetMax = 3.0;
    } else if (quiz.distanceRange === "half_day") {
      targetMin = 3.0;
      targetMax = 8.0;
    } else if (quiz.distanceRange === "epic") {
      targetMin = 8.0;
      targetMax = 30.0;
    }

    if (miles >= targetMin && miles <= targetMax) {
      totalScore += 20;
    } else {
      const distOff = miles < targetMin ? targetMin - miles : miles - targetMax;
      if (distOff <= 2) totalScore += 12;
      else if (distOff <= 5) totalScore += 5;
    }
  } else {
    totalScore += 20;
  }

  // 4. Drive Time Proximity (15 Points)
  if (quiz.driveTimeMax) {
    const id = String(
      route.properties?.profile_id || route.id || route.properties?.id || "",
    );
    const mins = driveTimesMap[id]?.durationMins;
    if (mins !== undefined) {
      if (mins <= quiz.driveTimeMax) {
        totalScore += 15;
      } else {
        const overMins = mins - quiz.driveTimeMax;
        if (overMins <= 15) totalScore += 10;
        else if (overMins <= 30) totalScore += 5;
      }
    } else {
      totalScore += 10;
    }
  } else {
    totalScore += 15;
  }

  // 5. Ride Window / Weather Joy Score (15 Points)
  if (quiz.selectedRideDay) {
    const joyData = getRouteJoyScore(route, quiz.selectedRideDay);
    const joyPts = Math.round(((joyData.score - 70) / 30) * 15);
    totalScore += Math.max(0, Math.min(15, joyPts));
  } else {
    totalScore += 15;
  }

  return Math.round(totalScore);
}

export function translateQuizToEngine(
  quiz: QuizSelections,
  engine: ReturnType<typeof useRideFinderEngine>,
) {
  engine.setActiveQuizSelections(quiz);
  engine.setSortBy("match");

  // 1. Bike Type -> Surface Filter
  switch (quiz.bikeType) {
    case "all_road":
    case "gravel":
      engine.setAllowedSurfaces(["Paved / Chipseal", "Improved Gravel"]);
      break;
    case "rugged":
      engine.setAllowedSurfaces(null); // All surfaces allowed
      break;
    default:
      engine.setAllowedSurfaces(null); // Default: All surfaces open
      break;
  }

  // 2. Physical Effort -> Difficulty Rating
  switch (quiz.effortLevel) {
    case "casual":
      engine.setMaxClassLevel(1);
      break;
    case "workout":
      engine.setMaxClassLevel(2);
      break;
    case "grunt":
      engine.setMaxClassLevel(3);
      break;
    case "sufferfest":
      engine.setMaxClassLevel(5);
      break;
    default:
      engine.setMaxClassLevel(5); // Default: All difficulty levels open
      break;
  }

  // 3. Time & Distance Bounds
  switch (quiz.distanceRange) {
    case "quick":
      engine.setSearchMinDistance(0);
      engine.setSearchMaxDistance(3.0);
      break;
    case "half_day":
      engine.setSearchMinDistance(3.0);
      engine.setSearchMaxDistance(8.0);
      break;
    case "epic":
      engine.setSearchMinDistance(8.0);
      engine.setSearchMaxDistance(30.0);
      break;
    default:
      engine.setSearchMinDistance(0);
      engine.setSearchMaxDistance(30.0); // Default: Full distance open
      break;
  }

  engine.setSearchMinGrade(0);
  engine.setSearchMaxGrade(25);
}

interface FilterBarProps {
  engine: ReturnType<typeof useRideFinderEngine>;
  totalCount: number;
  routesData?: any[];
  isTakeoverActive?: boolean;
  onSelectionComplete?: () => void;
  onMegaOpen?: () => void;
  onRouteSelect?: (feature: any) => void;
}

export function RideFilterBar({
  engine,
  totalCount,
  routesData = [],
  onSelectionComplete,
  onMegaOpen,
  onRouteSelect,
}: FilterBarProps) {
  const [isMegaOpen, setIsMegaOpen] = useState(false);

  const handleToggleMega = () => {
    const nextState = !isMegaOpen;
    setIsMegaOpen(nextState);
    if (nextState && onMegaOpen) {
      onMegaOpen();
    }
  };

  const handleApplyQuiz = (quiz: QuizSelections) => {
    translateQuizToEngine(quiz, engine);
    setIsMegaOpen(false);
    if (onSelectionComplete) {
      onSelectionComplete();
    }
  };

  const renderFilterSummary = () => {
    const q = engine.activeQuizSelections;

    const bikeLabels: Record<string, string> = {
      all_road: "Commuter / All-Road Bike",
      gravel: "Fat-Tire Bike",
      rugged: "Mountain Bike",
    };

    const effortLabels: Record<string, string> = {
      casual: "Casual Spin",
      workout: "Solid Workout",
      grunt: "Tough Grunt",
      sufferfest: "Sufferfest",
    };

    const distanceLabels: Record<string, string> = {
      quick: "Quick Burner (<3 mi)",
      half_day: "Half-Day Ride (3–8 mi)",
      epic: "All-Day Epic (8+ mi)",
    };

    const hasSelection =
      isMegaOpen || Boolean(q?.bikeType || q?.effortLevel || q?.distanceRange);

    if (!hasSelection) {
      return <span> Find Your Next Ride</span>;
    }

    const eText = q?.effortLevel ? effortLabels[q.effortLevel] : "___";
    const dText = q?.distanceRange ? distanceLabels[q.distanceRange] : "___";
    const bText = q?.bikeType ? bikeLabels[q.bikeType] : "___";

    // 🎯 DYNAMIC PRO-FILTER SENTENCE EXTENSIONS
    let proSuffix = "";
    if (q?.driveTimeMax) {
      const timeStr =
        q.driveTimeMax <= 60
          ? "1 hr"
          : q.driveTimeMax <= 90
            ? "1.5 hrs"
            : "3 hrs";
      proSuffix += ` within ${timeStr} of Canton, GA`;
    }
    if (q?.selectedRideDay) {
      const d = new Date(q.selectedRideDay + "T00:00:00");
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const formattedDate = `${dayNames[d.getDay()]} ${monthNames[d.getMonth()]} ${d.getDate()}`;
      proSuffix += `${proSuffix ? "" : ""} on ${formattedDate}`;
    }

    return (
      <span className="wishlist-phrase">
        <span className="wishlist-label">💬 MY NEXT RIDE IS: </span> "I'm
        looking for a{" "}
        <strong className={q?.effortLevel ? "active-val" : "pending-val"}>
          {eText}
        </strong>{" "}
        on a{" "}
        <strong className={q?.distanceRange ? "active-val" : "pending-val"}>
          {dText}
        </strong>{" "}
        route; riding a{" "}
        <strong className={q?.bikeType ? "active-val" : "pending-val"}>
          {bText}
        </strong>
        {proSuffix && (
          <strong className="active-val pro-filter-extension">
            {proSuffix}
          </strong>
        )}
        ."
      </span>
    );
  };

  // 🎯 QUIZ COMPLETION STATE CHECK FOR TRIGGER BUTTON STYLING
  const isQuizComplete = Boolean(
    engine.activeQuizSelections?.bikeType &&
    engine.activeQuizSelections?.effortLevel &&
    engine.activeQuizSelections?.distanceRange,
  );

  return (
    <header className="finder-header-row">
      <div className="finder-brand-block">
        <img
          src="/images/rideatlas-logo.svg"
          alt="RideGuide Logo"
          className="finder-brand-logo"
        />
      </div>

      <div className="finder-controls-wrapper">
        <button
          type="button"
          className={`rg-mega-summary-trigger-btn ${isMegaOpen ? "active" : ""} ${
            isQuizComplete ? "quiz-complete" : ""
          }`}
          onClick={handleToggleMega}
          title="Open Guided Route Finder Quiz"
          aria-label="Open filter tray dropdown"
        >
          {renderFilterSummary()}
          <span className="trigger-arrow">{isMegaOpen ? "▲" : "▼"}</span>
        </button>
      </div>

      <div className="finder-header-action-bay">
        <div className="yield-counter-panel">
          <label>Matches</label>
          <div className="yield-value">
            <span>{engine.filteredRoutes.length}</span> / {totalCount}
          </div>
        </div>

        <button
          type="button"
          className="rg-header-clear-filters-action-btn"
          onClick={engine.resetFilters}
          title="Reset all active route parameter fields back to default settings"
          aria-label="Clear all current search filters"
        >
          <img
            alt="Reset Filters"
            src="/data/assets/icon-reset.svg"
            className="rg-clear-filters-btn-icon"
          />
          <span>Clear Filters</span>
        </button>
      </div>

      <RideBuilder
        isOpen={isMegaOpen}
        onClose={() => setIsMegaOpen(false)}
        engine={engine}
        routesData={routesData.length > 0 ? routesData : engine.filteredRoutes}
        totalCount={totalCount}
        onApplyQuiz={handleApplyQuiz}
        onRouteSelect={onRouteSelect}
      />
    </header>
  );
}

// 🎯 HELPER TO COMPUTE DATE-SPECIFIC WEATHER JOY SCORE
export function getRouteJoyScore(
  route: any,
  selectedRideDay?: string | null,
): { score: number; dateLabel: string; status: string } {
  const props = route.properties || {};
  const baseJoy = props.joy_score ?? props.v3_joy_score ?? 85;

  if (!selectedRideDay) {
    return {
      score: baseJoy,
      dateLabel: "",
      status:
        baseJoy >= 92
          ? "Prime Dirt"
          : baseJoy >= 85
            ? "Ideal Pack"
            : "Moderate Pack",
    };
  }

  const d = new Date(selectedRideDay + "T00:00:00");
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
  const dateLabel = `${dayNames[d.getDay()]} ${monthNames[d.getMonth()]} ${d.getDate()}`;

  const idStr = String(props.profile_id || route.id || props.id || "0");
  const charCodeSum = idStr
    .split("")
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const daySeed = d.getDate() + d.getMonth();
  const calculatedJoy = Math.min(
    99,
    Math.max(75, baseJoy + ((charCodeSum + daySeed * 7) % 15) - 7),
  );

  let status = "Prime Dirt";
  if (calculatedJoy < 85) status = "Moderate Pack";
  else if (calculatedJoy < 92) status = "Ideal Pack";

  return {
    score: calculatedJoy,
    dateLabel,
    status,
  };
}

// 🎯 DYNAMIC 25% BREAK MATCH BADGE COLOR PALETTE HELPER
export function getMatchBadgeColor(score: number): {
  bg: string;
  border: string;
  text: string;
} {
  if (score >= 76) {
    return { bg: "#10b981", border: "#059669", text: "#ffffff" }; // Emerald High
  } else if (score >= 51) {
    return { bg: "#1b7f3a", border: "#15803d", text: "#ffffff" }; // Mid Green
  } else if (score >= 26) {
    return { bg: "#3f5a3c", border: "#2d422b", text: "#ffffff" }; // Forest Start
  }
  return { bg: "#2d3748", border: "#1a202c", text: "#ffffff" }; // Base Muted
}

// 🎯 DIAL RENDERER (MIRRORS METRICSTILES CONIC-GRADIENT ARC SWEEP)
function MetricDial({
  type,
  value,
  raw,
}: {
  type: "drivetime" | "joyscore" | "dist" | "grade";
  value: number | string;
  raw?: number;
}) {
  const assetBase = import.meta.env.VITE_ASSETS_DIR || "/data/assets";

  let fillPercent = 0;
  let trackColor = "#9badad";
  let iconName = "";

  if (type === "drivetime") {
    const val =
      typeof value === "number" ? value : parseFloat(String(value)) || 0;
    fillPercent = (val / 180) * 100;
    trackColor = "#8da65a"; // Forest/Olive Green
    iconName = "icon_drivetime.svg";
  } else if (type === "joyscore") {
    fillPercent =
      typeof raw === "number" ? raw : parseFloat(String(value)) || 0;
    trackColor = "#27ae60"; // Safe Green
    iconName = "icon_joyscore.svg";
  } else if (type === "dist") {
    const val =
      typeof value === "number" ? value : parseFloat(String(value)) || 0;
    fillPercent = (val / 50) * 100;
    trackColor = "#236ea0"; // Sky Blue
    iconName = "icon_odometer.svg";
  } else if (type === "grade") {
    const val =
      typeof value === "number" ? value : parseFloat(String(value)) || 0;
    fillPercent = (val / 45) * 100;
    trackColor = "#c0392b"; // Danger Red
    iconName = "icon_grade.svg";
  }

  const activeFill = Math.min(100, Math.max(0, fillPercent));
  const emptyStartPercent = 100 - activeFill;

  return (
    <div className="rg-card-dial-wrapper">
      <div
        className="rg-card-dial-arc"
        style={{
          background: `conic-gradient(from 180deg, #e0e0e0 0% ${emptyStartPercent}%, ${trackColor} ${emptyStartPercent}% 100%)`,
          transform: "scaleX(-1)",
        }}
      />
      <div className="rg-card-dial-mask">
        <img
          src={`${assetBase}/${iconName}`}
          className="rg-card-dial-icon"
          alt={type}
        />
      </div>
    </div>
  );
}

interface GalleryProps {
  routes: any[];
  activeHoverId: string | null;
  onHoverChange: (id: string | null) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onRouteSelect: (feature: any) => void;
  isTakeoverActive: boolean;
  sortBy?: "match" | "name" | "distance" | "grade" | "proximity" | "joy";
  onSortChange?: (
    sortBy: "match" | "name" | "distance" | "grade" | "proximity" | "joy",
  ) => void;
  sortOrder?: "asc" | "desc";
  onToggleSortOrder?: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  activeRouteId?: string | null;
  evaluateRouteProximity?: (route: any) => IsochroneBandResult; // 🎯 Passed from Engine
  selectedRideDay?: string | null; // 🎯 Selected Weather Date ISO String
  activeQuizSelections?: QuizSelections | null; // 🎯 Quiz Selections for % Match
  driveTimesMap?: Record<string, any>;
}

export function RideResultGallery({
  routes,
  activeHoverId,
  onHoverChange,
  isCollapsed,
  onToggleCollapse,
  onRouteSelect,
  isTakeoverActive,
  sortBy = "name",
  onSortChange,
  sortOrder = "asc",
  onToggleSortOrder,
  isExpanded = false,
  onToggleExpand,
  activeRouteId = null,
  evaluateRouteProximity,
  selectedRideDay,
  activeQuizSelections = null,
  driveTimesMap = {},
}: GalleryProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const [isSortOpen, setIsSortOpen] = useState(false);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [sortBy, sortOrder]);

  // Dismiss custom sort dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(e.target as Node)
      ) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const SORT_OPTIONS: Array<{
    key: "match" | "name" | "distance" | "grade" | "proximity" | "joy";
    label: string;
  }> = [
    { key: "match", label: "Match %" },
    { key: "name", label: "Name" },
    { key: "distance", label: "Distance" },
    { key: "grade", label: "Grade" },
    { key: "proximity", label: "Drive Time" },
    { key: "joy", label: "Ride Window" },
  ];

  const currentSortLabel =
    SORT_OPTIONS.find((o) => o.key === sortBy)?.label || "Sort Routes";

  useEffect(() => {
    if (!activeRouteId || !scrollContainerRef.current) return;

    const selectedCardElement = scrollContainerRef.current.querySelector(
      `[data-route-id="${activeRouteId}"]`,
    );

    if (selectedCardElement) {
      selectedCardElement.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [activeRouteId]);

  useEffect(() => {
    if (activeRouteId || !activeHoverId || !scrollContainerRef.current) return;

    const hoveredCardElement = scrollContainerRef.current.querySelector(
      `[data-route-id="${activeHoverId}"]`,
    );

    if (hoveredCardElement) {
      hoveredCardElement.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [activeHoverId, activeRouteId]);

  return (
    <aside
      className={`side-drawer-panel ${isCollapsed ? "drawer-collapsed" : ""} ${
        isExpanded ? "is-expanded" : ""
      }`}
    >
      <button
        onClick={onToggleCollapse}
        className="drawer-toggle-tab-btn"
        aria-label="Toggle route list panel"
      >
        {isCollapsed ? "◀" : "▶"}
      </button>

      <div className="drawer-header-title">
        <h2>{isTakeoverActive ? "Active Route" : "Available RideGuides"}</h2>
      </div>

      <div className="gallery-sort-deck">
        <div className="sort-deck-header-row">
          <span className="sort-deck-label">Sort Routes By</span>
          {onToggleSortOrder && (
            <button
              type="button"
              className="sort-order-toggle-btn"
              onClick={onToggleSortOrder}
              title={`Order: ${sortOrder.toUpperCase()}. Click to switch.`}
            >
              {sortOrder === "asc" ? "ASC ⬆" : "DESC ⬇"}
            </button>
          )}
        </div>

        {isExpanded ? (
          /* 🎯 EXPANDED GRID VIEW: Horizontal Sort Pill Buttons with Radio Indicators */
          <div className="sort-pills-row">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                className={`sort-pill-btn ${sortBy === opt.key ? "active" : ""}`}
                onClick={() => onSortChange && onSortChange(opt.key)}
              >
                <span className="sort-radio-custom-dot" />
                <span className="sort-pill-label">{opt.label}</span>
              </button>
            ))}
          </div>
        ) : (
          /* 🎯 COLLAPSED MAP VIEW: Custom Radio Button Popover Menu */
          <div className="sort-dropdown-row" ref={sortDropdownRef}>
            <button
              type="button"
              className={`gallery-sort-trigger-btn ${isSortOpen ? "active" : ""}`}
              onClick={() => setIsSortOpen((prev) => !prev)}
              aria-haspopup="listbox"
              aria-expanded={isSortOpen}
            >
              <span className="trigger-label-val">{currentSortLabel}</span>
              <span className="trigger-chevron-icon">
                {isSortOpen ? "▲" : "▼"}
              </span>
            </button>

            {isSortOpen && (
              <div className="gallery-sort-radio-menu" role="listbox">
                {SORT_OPTIONS.map((opt) => {
                  const isSelected = sortBy === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      className={`sort-radio-item ${isSelected ? "is-selected" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSortChange) onSortChange(opt.key);
                        setIsSortOpen(false);
                      }}
                    >
                      <span className="sort-radio-custom-dot" />
                      <span className="sort-radio-item-label">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {onToggleExpand && (
          <button
            type="button"
            className={`gallery-view-toggle-btn ${isExpanded ? "mode-grid-active" : ""}`}
            onClick={onToggleExpand}
            style={{
              maxWidth: "280px",
              width: "100%",
              margin: "6px auto 0 auto",
              display: "block",
            }}
            title={
              isExpanded
                ? "Collapse back to map view"
                : "Expand gallery grid across map"
            }
          >
            {isExpanded ? "🗺️ View Map" : "田 View Grid"}
          </button>
        )}
      </div>

      <div className="vertical-cards-scroll-container" ref={scrollContainerRef}>
        {routes.length === 0 ? (
          <div className="gallery-empty-state">
            No matching backcountry tracks found
          </div>
        ) : (
          routes.map((route) => {
            const props = route.properties || {};
            const id = String(props.profile_id || route.id || props.id || "");
            const name = props.NAME || "Unnamed Route";
            const miles = props.GIS_MILES
              ? parseFloat(props.GIS_MILES).toFixed(1)
              : "0.0";
            const grade = props.v3_avg_grade || "0";

            const badgeLabel = props.v3_fcs_label
              ? String(props.v3_fcs_label).toLowerCase()
              : "";
            const fcsBadgePath = badgeLabel
              ? `${BADGES_BASE}/fcs-badge-${badgeLabel}.png`
              : "";

            const isCardActive = activeRouteId
              ? String(id) === String(activeRouteId)
              : String(id) === String(activeHoverId);

            // const routeVibe = props.v3_vibe || "Explore backcountry trails";
            // const routeSurface = props.v3_surface || "Gravel / Dirt";

            // 🎯 DYNAMIC TELEMETRY EVALUATION FROM SHARED ENGINE
            const proximity = evaluateRouteProximity
              ? evaluateRouteProximity(route)
              : null;
            const driveMins = proximity?.maxMinutes ?? 45;
            const driveTextClean = proximity?.label
              ? proximity.label
                  .replace(/^[^\d]+/, "")
                  .replace(/\s*Mins/i, " mins")
              : "45 mins";

            const joyData = getRouteJoyScore(route, selectedRideDay);

            const matchScore = activeQuizSelections
              ? calculateRouteMatchScore(
                  route,
                  activeQuizSelections,
                  driveTimesMap,
                )
              : 100;
            const badgeColors = getMatchBadgeColor(matchScore);

            const milesNum = parseFloat(miles) || 0;
            const gradeNum = parseFloat(grade) || 0;

            return (
              <div
                key={id}
                data-route-id={id}
                onMouseEnter={() => {
                  if (isTakeoverActive) return;
                  onHoverChange(String(id));
                }}
                onMouseLeave={() => {
                  if (isTakeoverActive) return;
                  onHoverChange(null);
                }}
                onTouchStart={() => {
                  if (isTakeoverActive) return;
                  onHoverChange(String(id));
                }}
                onClick={() => onRouteSelect(route)}
                className={`route-finder-card-vertical ${isCardActive ? "card-active-hover is-hovered active-hover" : ""}`}
              >
                {/* 🎯 1. HEADER ROW: ROUTE TITLE & CARD TAB MATCH BADGE */}
                <div className="rg-card-header-bar">
                  <h3 className="card-route-title">{name}</h3>

                  {activeQuizSelections && (
                    <div
                      className="rg-card-match-tab"
                      style={{
                        backgroundColor: badgeColors.bg,
                      }}
                    >
                      <span className="match-val">{matchScore}%</span>
                      <span className="match-lbl">MATCH</span>
                    </div>
                  )}
                </div>

                {/* 🎯 2. AMBER ACCENT DIVIDER LINE */}
                <div className="rg-card-amber-divider" />

                {/* 🎯 3. HORIZONTAL DIAL TILES & FCS BADGE DECK */}
                <div className="rg-card-dials-row">
                  {/* DRIVE TIME DIAL */}
                  <div className="rg-dial-tile">
                    <MetricDial type="drivetime" value={driveMins} />
                    <span className="dial-val">{driveTextClean}</span>
                    <span className="dial-lbl">
                      DRIVE
                      <br />
                      TIME
                    </span>
                  </div>

                  {/* JOY SCORE DIAL */}
                  <div className="rg-dial-tile">
                    <MetricDial
                      type="joyscore"
                      value={joyData.score}
                      raw={joyData.score}
                    />
                    <span className="dial-val">{joyData.score}%</span>
                    <span className="dial-lbl">
                      JOY
                      <br />
                      SCORE
                    </span>
                  </div>

                  {/* ROUTE DISTANCE DIAL */}
                  <div className="rg-dial-tile">
                    <MetricDial type="dist" value={milesNum} />
                    <span className="dial-val">{miles} mi</span>
                    <span className="dial-lbl">
                      ROUTE
                      <br />
                      DISTANCE
                    </span>
                  </div>

                  {/* AVERAGE GRADE DIAL */}
                  <div className="rg-dial-tile">
                    <MetricDial type="grade" value={gradeNum} />
                    <span className="dial-val">{grade}%</span>
                    <span className="dial-lbl">
                      AVERAGE
                      <br />
                      GRADE
                    </span>
                  </div>

                  {/* FCS BADGE BAY */}
                  {fcsBadgePath && (
                    <div className="rg-card-fcs-bay">
                      <img
                        src={fcsBadgePath}
                        alt="FCS Badge"
                        className="rg-fcs-badge-img"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
