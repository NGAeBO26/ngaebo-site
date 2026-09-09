# MobileRideBuilder Migration Master Plan Tracker

- [x] **PHASE 1: STYLESHEET SANITIZATION & BOUNDARY LOCK**
  - [x] Task 1.1: Create isolated `src/styles/mobile/MobileRideBuilder.css`
  - [x] Task 1.2: Sanitize desktop `src/styles/RideBuilder.css`
  - [x] Task 1.3: Purge legacy quiz overrides from `src/styles/mobile/MobileHeader.css`

- [x] **PHASE 2: COMPONENT INTEGRATION & ENGINE SYNC**
  - [x] Task 2.1: Mount `MobileRideBuilder.tsx` in `src/pages/RideGuide.tsx` for mobile viewports
  - [x] Task 2.2: Verify 1:1 prop passing and shared engine state synchronization
  - [x] Task 2.3: TS Compiler Audit (Rule 5h) — Resolved TS6133/TS2552 in `RideGuide.tsx`

- [x] **PHASE 3: ACCORDION UX, DETERMINISTIC HEIGHT LOCK & STICKY STACKING**
  - [x] Task 3.1: **Deterministic 112px Wishlist Height Lock**: Pre-reserved Wishlist box height at 112px.
  - [x] Task 3.2: **Three-Tier Sticky Stacking Architecture**: 
    - Tier 1: Wishlist Header (`top: 0`, 112px height lock)
    - Tier 2: Mode Toggle Bar (`top: 112px`, 38px height lock)
    - Tier 3: Quiz Stepper Bar (`top: 150px`, 40px height lock)
  - [x] Task 3.3: **Scroll Clearance Lock**: Updated `.rg-quiz-column` scroll margin to `194px` to eliminate step overlapping.
  - [x] Task 3.4: **Stacked CTA Beacon Formatting**: Stacked `.wishlist-label` vertically above `.wishlist-phrase` with high-contrast white text for completed state.

- [x] **PHASE 4: MOBILE RESULTS CARDS & TELEMETRY GAUGES (DRIVE TIME & JOY SCORE)**
  - [x] Task 4.1: **OSRM Droplet Payload Slicing**: Confirmed `evaluateRouteProximity` and `getRouteJoyScore` execute strictly against `filteredRoutes`.
  - [x] Task 4.2: **4-Dial Layout Grid Expansion**: Expanded mobile card telemetry row in `MobileDrawer.css` to `grid-template-columns: repeat(4, 1fr) 56px !important`.
  - [x] Task 4.3: **Un-hide Mobile Telemetry Dials**: Removed the legacy CSS rule hiding Dial 1 (`Drive Time`) and Dial 2 (`Joy Score`) on mobile cards.
  - [x] Task 4.4: **Namespace Protection**: Scoped dial overrides strictly under `.discovery-dashboard-root .route-finder-card-vertical:not(.mobile-header-banner-takeover)`.

- [ ] **PHASE 5: DIAGNOSTIC AUDIT & DESKTOP REGRESSION FIREWALL**
  - [ ] Task 5.1: DevTools subpixel sub-grid alignment trace across 320px–430px mobile screens.
  - [ ] Task 5.2: Desktop viewport regression firewall check.