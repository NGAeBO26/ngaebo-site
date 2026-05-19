/* src/features/Discovery/components/RideFinder.tsx */
import { useState, useMemo, useEffect, useRef } from "react";

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
    return Array.from(new Set(names)).sort(); // Optional: sorted alphabetically for clean dropdown lists
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
    return routesData.filter((route) => {
      const props = route.properties ?? {};
      const name = props.NAME ?? "";
      const matchesName = name.toLowerCase().includes(searchName.toLowerCase());

      const fcsLabel = props.v3_fcs_label ?? "";
      const matchesClass = selectedClass === "ALL" || fcsLabel === selectedClass;

      const distance = parseFloat(props.GIS_MILES ?? 0);
      const matchesDistance = distance <= maxDistance;

      const grade = parseFloat(props.v3_avg_grade ?? 0);
      const matchesGrade = Math.abs(grade) <= maxGrade;

      return matchesName && matchesClass && matchesDistance && matchesGrade;
    });
  }, [routesData, searchName, selectedClass, maxDistance, maxGrade]);

  useEffect(() => {
    onFilterChange(filteredRoutes);
  }, [filteredRoutes, onFilterChange]);

  return {
    searchName, setSearchName,
    selectedClass, setSelectedClass,
    maxDistance, setSearchDistance,
    maxGrade, setSearchGrade,
    routeClasses,
    autocompleteNames,
    filteredRoutes
  };
}

interface FilterBarProps {
  engine: ReturnType<typeof useRideFinderEngine>;
  totalCount: number;
}

export function RideFilterBar({ engine, totalCount }: FilterBarProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // FIXED: Returns all names if input is empty, otherwise screens names dynamically based on typing matches
  const dynamicSuggestions = useMemo(() => {
    const query = engine.searchName.trim().toLowerCase();
    if (!query) return engine.autocompleteNames; 
    return engine.autocompleteNames.filter(name => 
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
    <header className="finder-header-row">
      <div className="finder-brand-block">
        <img 
          src="/images/RideGuide_embroid-v1.svg" 
          alt="RideGuide Logo" 
          className="finder-brand-logo"
        />
        <span className="finder-brand-subtitle">RideFinder Pro</span>
      </div>
      
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
            />
            {/* Arrow click toggles display regardless of whether text is present or empty */}
            <span className="autocomplete-dropdown-arrow-icon" onClick={() => setShowSuggestions(!showSuggestions)}></span>
          </div>

          {showSuggestions && dynamicSuggestions.length > 0 && (
            <ul className="autocomplete-suggestions-dropdown-overlay">
              {dynamicSuggestions.map((suggestionText) => (
                <li
                  key={suggestionText}
                  onClick={() => {
                    engine.setSearchName(suggestionText);
                    setShowSuggestions(false);
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
            >
              {engine.routeClasses.map((cls) => (
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
            <span style={{ color: "#94a3b8" }}>Max Distance</span>
            <span style={{ color: "#f59e0b", fontWeight: "bold" }}>{engine.maxDistance} MI</span>
          </div>
          <input
            type="range"
            min="1"
            max="25"
            step="1"
            value={engine.maxDistance}
            onChange={(e) => engine.setSearchDistance(parseInt(e.target.value))}
            className="finder-range-slider"
            style={{
              ["--value-percent" as any]: `${((engine.maxDistance - 1) / (25 - 1)) * 100}%`
            }}
          />
        </div>

        <div className="control-slider-group">
          <div className="slider-header-labels">
            <span style={{ color: "#94a3b8" }}>Max Grade</span>
            <span style={{ color: "#f59e0b", fontWeight: "bold" }}>{engine.maxGrade}%</span>
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
              ["--value-percent" as any]: `${((engine.maxGrade - 2) / (25 - 2)) * 100}%`
            }}
          />
        </div>

        <div className="yield-counter-panel">
          <span style={{ fontSize: "9px", color: "#94a3b8", fontFamily: "monospace", textTransform: "uppercase", fontWeight: "bold" }}>Yield</span>
          <div style={{ fontSize: "12px", fontFamily: "monospace", fontWeight: "bold", color: "#e2e8f0", marginTop: "2px" }}>
            <span style={{ color: "#f59e0b", fontSize: "14px", fontWeight: "900" }}>{engine.filteredRoutes.length}</span> / {totalCount}
          </div>
        </div>
      </div>
    </header>
  );
}

interface GalleryProps {
  routes: any[];
  activeHoverId: string | null;
  setActiveHoverId: (id: string | null) => void;
}

export function RideResultGallery({ routes, activeHoverId, setActiveHoverId }: GalleryProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!activeHoverId || !scrollContainerRef.current) return;

    // Search out the child element carrying the target matching dataset attribute ID token
    const matchingCardElement = scrollContainerRef.current.querySelector(
      `[data-route-id="${activeHoverId}"]`
    );

    if (matchingCardElement) {
      matchingCardElement.scrollIntoView({
        behavior: "smooth",
        block: "nearest" // Positions the target card elegantly inside the visible scrolling window boundaries
      });
    }
  }, [activeHoverId]);

  return (
    <aside className={`side-drawer-panel ${isCollapsed ? "drawer-collapsed" : ""}`}>
      

      <div className="drawer-header-title">
        <h2>MATCHING ROUTES: ({routes.length})</h2>
      </div>

      <button 
        className="drawer-toggle-tab-btn"
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? "Open Results Panel" : "Collapse Results Panel"}
      >
        {isCollapsed ? "«" : "»"}
      </button>

      <div className="vertical-cards-scroll-container" ref={scrollContainerRef}>
        {routes.length === 0 ? (
          <div className="gallery-empty-state">
            No matching routes found...<br/>Soften your constraints.
          </div>
        ) : (
          routes.map((route: any) => {
            const id = route.id ?? route.properties?.ID ?? route.properties?.fid;
            const name = route.properties?.NAME ?? "Unnamed Route";
            const miles = route.properties?.GIS_MILES ?? "0";
            const grade = route.properties?.v3_avg_grade ?? "0";
            const tier = route.properties?.v3_fcs_label ?? "Unclassed";
            const isCurrentlyHovered = String(id) === activeHoverId;

            const badgeType = tier.toLowerCase() || 'default';
            const fcsBadgePath = `${BADGES_BASE}/fcs-badge-${badgeType}.png`;
            
            return (
              <div
                key={id}
                data-route-id={id}
                onMouseEnter={() => setActiveHoverId(String(id))}
                onMouseLeave={() => setActiveHoverId(null)}
                onClick={() => {
                  const routeID = route.properties?.profile_id;
                  if (routeID) window.open(`/report/${routeID}`, '_blank', 'noopener,noreferrer');
                }}
                className={`route-finder-card-vertical ${isCurrentlyHovered ? "card-active-hover" : ""}`}
              >
                <div className="card-left-details-block">
                  <div className="card-title-block">
                    <div className="card-id-row">
                      <h3 className="card-route-title" style={{ color: isCurrentlyHovered ? "#f59e0b" : "#334155" }}>
                        {name}
                      </h3>
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
                  <img 
                    src={fcsBadgePath} 
                    alt={`${tier} classification badge`}
                    className="card-route-badge-image-scaled"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}