/* src/features/Discovery/components/RideFinder.tsx */
import { useState, useMemo, useEffect, useRef, useCallback } from "react";

const BADGES_BASE = "/images/badges/fcs";

export function useRideFinderEngine(routesData: any[], onFilterChange: (filtered: any[]) => void) {
  const [searchName, setSearchName] = useState("");
  const [selectedClass, setSelectedClass] = useState("ALL");
  const [maxDistance, setSearchDistance] = useState(30);
  const [maxGrade, setSearchGrade] = useState(25);

  const autocompleteNames = useMemo(() => {
    if (!routesData || !Array.isArray(routesData)) return [];
    const names = routesData
      .map((r) => r.properties?.NAME)
      .filter((name): name is string => typeof name === "string" && name.trim() !== "");
    return Array.from(new Set(names)).sort();
  }, [routesData]);

  const routeClasses = useMemo(() => {
    if (!routesData || !Array.isArray(routesData)) return ["ALL"];
    const labels = routesData
      .map((r) => r.properties?.v3_fcs_label)
      .filter((label): label is string => typeof label === "string" && label.trim() !== "");
    return ["ALL", ...Array.from(new Set(labels))];
  }, [routesData]);

  const filteredRoutes = useMemo(() => {
    if (!routesData || !Array.isArray(routesData)) return [];

    const result = routesData.filter((route) => {
      const p = route.properties || {};

      const matchesName =
        !searchName.trim() ||
        (p.NAME && p.NAME.toLowerCase().includes(searchName.toLowerCase().trim()));

      const matchesClass =
        selectedClass === "ALL" || p.v3_fcs_label === selectedClass;

      const miles = p.GIS_MILES ? parseFloat(p.GIS_MILES) : 0;
      const matchesDistance = miles <= maxDistance;

      const grade = p.v3_avg_grade ? parseFloat(p.v3_avg_grade) : 0;
      const matchesGrade = grade <= maxGrade;

      return matchesName && matchesClass && matchesDistance && matchesGrade;
    });

    return result.sort((a, b) => {
      const nameA = String(a.properties?.NAME || "").trim().toLowerCase();
      const nameB = String(b.properties?.NAME || "").trim().toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [routesData, searchName, selectedClass, maxDistance, maxGrade]);

  useEffect(() => {
    onFilterChange(filteredRoutes);
  }, [filteredRoutes, onFilterChange]);

  const resetFilters = useCallback(() => {
    setSearchName("");
    setSelectedClass("ALL");
    setSearchDistance(30);
    setSearchGrade(25);
  }, []);

  return {
    searchName,
    setSearchName,
    selectedClass,
    setSelectedClass,
    maxDistance,
    setSearchDistance,
    maxGrade,
    setSearchGrade,
    autocompleteNames,
    routeClasses,
    filteredRoutes,
    resetFilters,
  };
}

interface FilterBarProps {
  engine: ReturnType<typeof useRideFinderEngine>;
  totalCount: number;
  isTakeoverActive?: boolean;
  onSelectionComplete?: () => void; /* 🎯 Accept the new structural callback contract */
}

export function RideFilterBar({
  engine,
  totalCount,
  isTakeoverActive = false,
  onSelectionComplete,
}: FilterBarProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const dynamicSuggestions = useMemo(() => {
    const query = engine.searchName.trim().toLowerCase();
    if (!query) return engine.autocompleteNames;
    return engine.autocompleteNames.filter((name: string) =>
      name.toLowerCase().includes(query)
    );
  }, [engine.searchName, engine.autocompleteNames]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className={`finder-header-row ${isTakeoverActive ? "takeover-header-blue-blank" : ""}`}>
      <div className="finder-brand-block">
        <img
          src="/images/RideGuide_embroid-v1.svg"
          alt="RideGuide Logo"
          className="finder-brand-logo"
        />
        <span className="finder-brand-subtitle">RideFinder Pro</span>
      </div>

      {!isTakeoverActive ? (
        <>
          <div className="finder-controls-wrapper">
            <div className="control-input-group styleable-autocomplete-wrapper" ref={wrapperRef}>
              <label>Search Routes</label>
              <div className="autocomplete-input-inner-row">
                <input
                  type="text"
                  placeholder="ENTER ROUTE NAME..."
                  value={engine.searchName}
                  onChange={(e) => {
                    engine.setSearchName(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  className="finder-text-input autocomplete-input-field"
                  autoComplete="off"
                  aria-label="Search backcountry trails by route name"
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
                        
                        /* 🎯 THE TRIGGER: Fires the parent state shift to pull the matching card deck into view instantly */
                        if (onSelectionComplete) {
                          onSelectionComplete();
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

          <div className="control-input-group">
            <label>Route Class</label>
            <div className="class-select-input-inner-row">
              <select
                value={engine.selectedClass}
                onChange={(e) => engine.setSelectedClass(e.target.value)}
                className="finder-select-input"
                aria-label="Filter routes by trail difficulty classification"
              >
                {engine.routeClasses.map((cls: string) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
              <span className="class-dropdown-arrow-icon"></span>
            </div>
          </div>

          <div className="control-slider-group">
            <div className="slider-header-labels">
              <span >Max Distance</span>
              <span>{engine.maxDistance} MI</span>
            </div>
            <input
              type="range"
              min="1"
              max="30"
              step="1"
              value={engine.maxDistance}
              onChange={(e) => engine.setSearchDistance(parseInt(e.target.value))}
              className="finder-range-slider"
              style={{
                ["--value-percent" as any]: `${((engine.maxDistance - 1) / (30 - 1)) * 100}%`,
              }}
              aria-label="Filter routes by maximum distance range in miles"
            />
          </div>

          <div className="control-slider-group">
            <div className="slider-header-labels">
              <span>Max Grade</span>
              <span >{engine.maxGrade}%</span>
            </div>
            <input
              type="range"
              min="2"
              max="25"
              step="1"
              value={engine.maxGrade}
              onChange={(e) => engine.setSearchGrade(parseInt(e.target.value))}
              className="finder-range-slider"
              style={{
                ["--value-percent" as any]: `${((engine.maxGrade - 2) / (25 - 2)) * 100}%`,
              }}
              aria-label="Filter routes by maximum incline grade slope percentage"
            />
          </div>
        </div>

        <div className="yield-counter-panel">
          <label>Matches</label>
          <div className="yield-value">
            <span>{engine.filteredRoutes.length}</span> / {totalCount}
          </div>
        </div>
      </>
    ) : (
      <div className="takeover-header-center-void-lane" />
    )}
  </header>
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
}

export function RideResultGallery({
  routes,
  activeHoverId,
  onHoverChange,
  isCollapsed,
  onToggleCollapse,
  onRouteSelect,
  isTakeoverActive,
}: GalleryProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeHoverId || !scrollContainerRef.current) return;

    const matchingCardElement = scrollContainerRef.current.querySelector(
      `[data-route-id="${activeHoverId}"]`
    );

    if (matchingCardElement) {
      matchingCardElement.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [activeHoverId]);

  return (
    <aside className={`side-drawer-panel ${isCollapsed ? "drawer-collapsed" : ""} ${isTakeoverActive ? "takeover-force-hidden" : ""}`}>
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

      <div className="vertical-cards-scroll-container" ref={scrollContainerRef}>
        {routes.length === 0 ? (
          <div className="gallery-empty-state">No matching backcountry tracks found</div>
        ) : (
          routes.map((route) => {
            const props = route.properties || {};
            const id = String(props.profile_id || route.id || props.id || "");
            const name = props.NAME || "Unnamed Route";
            const miles = props.GIS_MILES ? parseFloat(props.GIS_MILES).toFixed(1) : "0.0";
            const grade = props.v3_avg_grade || "0";

            const badgeLabel = props.v3_fcs_label ? String(props.v3_fcs_label).toLowerCase() : "";
            const fcsBadgePath = badgeLabel ? `${BADGES_BASE}/fcs-badge-${badgeLabel}.png` : "";
            const isCurrentlyHovered = String(id) === String(activeHoverId);

            // Fetch surface data field criteria fallbacks
            const routeVibe = props.v3_vibe || "Explore backcountry trails";
            const routeSurface = props.v3_surface || "Gravel / Dirt";

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
                /* 🎯 FIX 1: CAPTURES MOBILE TOUCH INITIATION GESTURES IMMEDIATELY */
                onTouchStart={() => {
                  if (isTakeoverActive) return;
                  onHoverChange(String(id));
                }}
                onClick={() => onRouteSelect(route)}
                /* 🎯 FIX 2: ALIGNS BOTH LEGACY CLASS CHANNELS AND DISCOVERY WEATHER FIREWALL SELECTORS */
                className={`route-finder-card-vertical ${isCurrentlyHovered ? "card-active-hover is-hovered active-hover" : ""}`}
              >
                <div className="card-left-details-block">
                  <div className="card-title-block">
                    <div className="card-id-row">
                      <h3
                        className="card-route-title"
                        style={{ color: isCurrentlyHovered ? "var(--brand-white)" : "#334155" }}
                      >
                        {name}
                      </h3>
                    </div>
                  </div>

                  {/* ─── Renders surface and vibe into standard row cards ─── */}
                  <div className="card-subtitle-banner-row">
                    <div className="subtitle-item">
                      <span className="subtitle-label">Vibe:</span>
                      <strong className="mellow-highlight-value">{routeVibe}</strong>
                    </div>
                    <span className="banner-inline-divider">|</span>
                    <div className="subtitle-item">
                      <span className="subtitle-label">Type:</span>
                      <strong className="mellow-highlight-value">{routeSurface}</strong>
                    </div>
                  </div>

                  <div className="card-metrics-grid">
                    <div className="metric-column">
                      <span className="metric-label">Distance</span>
                      <span className="metric-value">{miles} MILES</span>
                    </div>
                    <div className="metric-column">
                      <span className="metric-label">Avg Grade</span>
                      <span className="metric-value">{grade}%</span>
                    </div>
                  </div>
                </div>

                <div className="card-right-badge-bay">
                  {fcsBadgePath && (
                    <img
                      src={fcsBadgePath}
                      alt="fcs classification badge"
                      className="card-route-badge-image-scaled"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
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