# 📱 Mobile Architecture Isolation & Zero-Regression Refactor Plan

## 🎯 Primary Goal
Isolate mobile layout controllers, drawer mechanics, and route detail takeovers into dedicated components (`MobileGravelPopup.tsx`, `MobileGravelPopup.css`, `MobileRideGuide.tsx`) without altering desktop behavior, styling, or functionality.

---

## 🔒 Source-of-Truth Baseline Anchors (Verified 2026-08-13)
- Viewport Dimension: 450px x 826px
- Header Strip Height: 64.000px (z-index: 100000)
- Finder Header Row Height: 60.000px (z-index: 100010)
- Drag Handle Height: 54.000px (z-index: 100060)
- Expanded Drawer Takeover Height: 558.025px (z-index: 100050)
- Main Action CTA Button: Height 40.800px, Background rgb(27, 127, 58)

---

## 🛠️ File Isolation & Scope Matrix

| Target Component | Created/Modified File | Scope & Responsibility |
| :--- | :--- | :--- |
| **Mobile Detail Takeover** | `src/features/Discovery/components/MobileGravelPopup.tsx` | Selected route takeover view inside mobile bottom drawer (metrics, locked weather teaser, sparkline, CTA button). |
| **Mobile Detail Styles** | `src/features/Discovery/components/MobileGravelPopup.css` | Styles for locked weather teaser cards, blur effects, CTA flash animations, and layout parity with `GravelPopup.css`. |
| **Mobile Shell Controller** | `src/features/Discovery/components/MobileRideGuide.tsx` | Mobile-specific header strip, hamburger menu, top drawer (`MobileRideBuilder`), map layer, and bottom drawer coordination. |
| **Desktop Store Panel** | `src/store/StorePanel.tsx` | Cleaned up to handle **Desktop-only** cart, token wallet, and catalog vault. Mobile overrides removed. |
| **Page Route Controller** | `src/pages/RideGuide.tsx` | Top-level data manager & viewport switcher (`isMobile ? <MobileRideGuide/> : <RideGuideDesktop/>`). |

---

## 📋 Execution Phases & Verification Gates

### Phase 1: `MobileGravelPopup.tsx` & `MobileGravelPopup.css` Creation
- [x] Create `MobileGravelPopup.tsx` by extracting the mobile active route takeover JSX from `StorePanel.tsx`.
- [x] Create `MobileGravelPopup.css` and port mobile drawer takeover styles from `MobileDrawer.css`.
- [x] Add locked weather teaser card (`.teaser-locked-card`) with blur filter, unlock badge (`🔒 INCLUDED WITH $6.99 GUIDE`), and hover/tap green CTA pulse interaction matching `GravelPopup.css`.
- [x] Wire `MobileGravelPopup` into `RideGuide.tsx` mobile drawer pane for testing.
- [x] **Verification 1 Passed:** Live runtime verification confirmed subpixel geometry and interactive CTA flash parity.

---

### Phase 2: Decouple & Scrub `StorePanel.tsx` (Desktop Storefront Isolation)
- [ ] **Code Scrub:** Remove `if (isMobile) { ... }` mobile takeover return block from `StorePanel.tsx`.
- [ ] **Code Scrub:** Remove `isMobile` property from `StorePanelProps` interface definition.
- [ ] **Code Scrub:** Remove unused import `import MobileThreeDayForecast from '../features/Discovery/components/3DayForecast';`.
- [ ] Ensure `StorePanel.tsx` remains 100% intact for desktop cart and catalog vault operations.
- [ ] **Verification 2:** Test desktop cart dropdown and catalog print operations to verify zero desktop regression.

---

### Phase 3: Create `MobileRideGuide.tsx` Shell & Scrub `RideGuide.tsx`
- [ ] Create `MobileRideGuide.tsx` containing mobile header strips, hamburger menu, top drawer (`MobileRideBuilder`), WebGL map canvas (`GravelGuide`), and bottom drawer assembly.
- [ ] Mount `MobileGravelPopup` inside `MobileRideGuide` bottom drawer when `activeRouteProperties !== null`.
- [ ] Mount `RideResultGallery` inside `MobileRideGuide` bottom drawer when `activeRouteProperties === null`.
- [ ] **Code Scrub:** Extract mobile JSX block (`.rg-mobile-app-header-strip` and `.rg-mobile-unified-bottom-drawer`) out of `RideGuide.tsx`.
- [ ] **Code Scrub:** Move mobile-specific drawer state hooks out of `RideGuide.tsx` into `MobileRideGuide.tsx`.
- [ ] **Verification 3:** Run Phase 3 diagnostic script to verify seamless accordion toggling between top `MobileRideBuilder` drawer and bottom drawer.

---

### Phase 4: CSS Cleanup & Final Controller Clean-Up
- [ ] **Code Scrub:** Prune duplicate takeover CSS selectors (`.mobile-header-banner-takeover`, `.section-metrics-row`, `.section-weather-row`, `.section-elevation-graph`) from `MobileDrawer.css`.
- [ ] Update `RideGuide.tsx` to conditionally render `<MobileRideGuide />` on mobile viewports vs `<RideGuideDesktop />` on desktop.
- [ ] **Verification 4:** Final full-pass baseline diff check comparing runtime metrics against Phase 0 pre-refactor baseline.