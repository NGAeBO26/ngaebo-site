# Homepage Section 2 Conversion & Value Proof — Implementation Plan & Task List

## Document Metadata
* **Target Section:** Homepage Section 2 (Problem-to-Solution, Interactive Proof Showcase, & Proof Cards)
* **Target Files:** `src/pages/Home.tsx`, `src/pages/Home.css`
* **Strategy Reference:** Homepage Optimization — Section 2 Strategy Handoff
* **Primary Objective:** Convert first-time visitors into **RideBuilder** users by establishing the clear value of unlocking a **RideGuide** ($6.99) prior to route commitment (focusing on Prime Ride Time, Effort Gauge, and Risk Radar outcomes).

---

## 💰 Third-Party API Cost & Financial Safety Audit
* **API Cost Impact:** **$0.00**.
* **Billing Risk Analysis:** Operates strictly on local React state (`useState`), static SVGs/images, and standard CSS transitions. Zero billable calls to Google Maps, Geocoding, Distance Matrix, or Weather APIs.

---

## 🏛️ Core Product Terminology Alignment
* **RideAtlas:** The core interactive map application.
* **RideBuilder:** The 5-step route selector that ranks routes by overall **percent match** (free/open access).
* **RideGuide:** The route-specific digital guide ($6.99 single unlock or token redemption) active for 7 days with offline field capability.
* **Joy Score:** Kept strictly distinct from percent match and RideGuide output metrics.

---

## 📋 Implementation Checklist

### Phase 1: State Engine & Content Setup (`src/pages/Home.tsx`)
- [ ] **1.1 Local State Initializer:** Add `activeProofPanel` local state (`'weather' | 'effort' | 'risk'`) defaulting to `'weather'`.
- [ ] **1.2 Approved Problem-to-Solution Copy:** Update Section 2 text block:
  - Eyebrow: `Know Before You Go.`
  - Headline: `Find a Ride That Fits Today—Before You Commit to the Wrong Route`
  - Body: `North Georgia routes can look great on a map and still feel wrong once weather, surface conditions, and climbing start working against you. RideBuilder helps you find routes that fit your bike, your time, and how hard you want the day to feel. Then the unlocked RideGuide helps you know when to ride, what the route may ask of you, and what to watch before you head out—so the plan feels clearer before you commit.`

---

### Phase 2: Interactive Showcase Construction (`src/pages/Home.tsx`)
- [ ] **2.1 Showcase Header:**
  - Main Title: `A Route Line is NOT a Ride Plan`
  - Sub-Title: `RideBuilder matches you with the ride you want. RideGuide helps you choose the best ride window, anticipate your effort, and prepare for the current route conditions.`
- [ ] **2.2 Interactive Proof Tabs (Left Column):**
  - [ ] **Tab 1 (`weather`):** `When should I ride? — Prime Ride Time`
    - Body: `For the route you choose, the unlocked RideGuide highlights the best 3-hour window using current and rolling 10-day weather plus route and surface conditions.`
    - Decision Benefit: `Choose a better time before you make the trip.`
  - [ ] **Tab 2 (`effort`):** `How hard will it feel? — Effort Gauge`
    - Body: `The unlocked RideGuide translates terrain intensity, traction, and surface saturation into a clearer view of how the route may feel today.`
    - Decision Benefit: `Match the challenge to your bike, energy, and plans.`
  - [ ] **Tab 3 (`risk`):** `What should I watch? — Risk Radar`
    - Body: `Risk Radar gives you a quick, route-specific view of factors worth reviewing, including trail status, surface saturation, elevation context, cellular availability, and nearby planning information.`
    - Decision Benefit: `Know what deserves attention before you leave the trailhead.`
- [ ] **2.3 Visual Display Container (Right Column):**
  - Render active sample RideGuide sheet corresponding to the `activeProofPanel` state.
- [ ] **2.4 Showcase Footer & Helper Copy:**
  - Helper Text: `RideBuilder ranks routes by overall percent match. Unlock a RideGuide for the route you choose to see current conditions, Prime Ride Time, effort insight, and route-specific risk.`
  - Dominant CTA: `Build Your Next Ride` (`/rides`)

---

### Phase 3: Supporting Proof Cards (5-Card Row) (`src/pages/Home.tsx`)
- [ ] **3.1 Card 1:** `See more before you commit` — *Get the route map, elevation profile, current conditions, Prime Ride Time, effort insight, Risk Radar, and key route context in one downloadable guide.* (`/data/assets/icon_route.svg`)
- [ ] **3.2 Card 2:** `Keep it current for 7 days` — *Regenerate during the active window to refresh timing, route conditions, and effort.* (`/data/assets/icon_time_quick.svg`)
- [ ] **3.3 Card 3:** `Download once. Ride with less guesswork.` — *Save or print before leaving so the route details remain useful when cell service is limited.* (`/data/assets/icon_no_cell_signal.svg`)
- [ ] **3.4 Card 4:** `Start with one route` — *One route-specific RideGuide for $6.99; no recurring subscription required.* (`/data/assets/icon_credit_card.svg`)
- [ ] **3.5 Card 5:** `Use tokens for future rides` — *Each token unlocks one RideGuide, and its 7-day active period begins when redeemed.* (`/data/assets/icon_safety.svg`)
- [ ] **3.6 Separate Sample Path Link:** Render isolated bottom link `See Free Sample Pack →` (`/samples`).

---

### Phase 4: CSS Architecture & Styling (`src/pages/Home.css`)
- [ ] **4.1 Namespaced Scope:** Enforce all new CSS declarations strictly under `.funnel-landing-page .problem-hook-section` or `.funnel-landing-page .section2-proof-showcase`.
- [ ] **4.2 Zero Wildcard Selectors:** Verify no wildcard selectors (`> *`, `> div`) are used.
- [ ] **4.3 Eyebrow & Typography Tokens:** Set `.section2-eyebrow-amber` to `#92400e` (burnt amber, compliant with WCAG AA 4.5:1 contrast).
- [ ] **4.4 Active Tab Styling:** Apply high-contrast sky-blue indicators (`var(--brand-sky)`) and active state transformations on selected proof tabs.
- [ ] **4.5 Proof Card Grid:** Implement responsive auto-fit grid (`grid-template-columns: repeat(auto-fit, minmax(220px, 1fr))`).
- [ ] **4.6 Mobile Responsive Overrides (`@media (max-width: 767px)`):**
  - Convert side-by-side showcase into a vertical stack sequence.
  - Set default open accordion panel for single-column mobile viewports.
  - Scale text sizes and spacing safely without horizontal overflow.

---

### Phase 5: QA, Routing & Compiler Pre-Flight Audit
- [ ] **5.1 CTA Routing Verification:**
  - Verify every `Build Your Next Ride` button links strictly to `/rides`.
  - Verify `Free Sample Pack` links link strictly to `/samples`.
- [ ] **5.2 Terminology Compliance:**
  - Verify RideBuilder is referenced as ranking routes by **percent match**.
  - Verify RideGuide is referenced as providing **current conditions, Prime Ride Time, effort insight, and risk awareness**.
- [ ] **5.3 TypeScript Pre-Flight Check (TS6133 / TS6134):**
  - Verify zero unused variables or unread inline callback parameters.
  - Prefix positional unread callback parameters with `_` if required.
- [ ] **5.4 Selector Existence Parity:**
  - Cross-reference all JSX `className` strings against `Home.css` to guarantee 100% selector existence.