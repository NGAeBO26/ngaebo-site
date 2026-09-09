# Homepage Section 1 Conversion Optimization — Implementation Plan

## Document Metadata
* **Target Section:** Homepage Section 1 (Hero / Top Fold) & Section 2 Transition
* **Target Files:** `src/pages/Home.tsx`, `src/pages/Home.css`
* **Strategy Reference:** `Homepage Optimization - Section 1.md`
* **Primary Objective:** Convert first-time visitors into **RideBuilder** users by establishing it as the fastest, smartest way to select a North Georgia route tailored to today's weather and terrain.

---

## 🏛️ Core Product Terminology Alignment
All copy and UI components must maintain strict product hierarchy boundaries:
* **RideAtlas:** The core interactive map application.
* **RideBuilder:** The 5-step route-matching experience inside RideAtlas.
* **RideGuide:** The route-specific digital guide unlocked after completing RideBuilder.

---

## 🎯 Conversion Architecture & Copy Requirements

### 1. Left Column (Hero Content Stack)

| Component / Layer | Final Recommended Copy | Implementation Target (`Home.tsx`) |
| :--- | :--- | :--- |
| **Eyebrow / Tagline** | `Plan Faster. Ride Smarter.` | Position above `<h1>` as `.hero-eyebrow-blue` |
| **Headline (`<h1>`)** | `Find the Right North Georgia Ride for Today’s Conditions — Before You Roll Out` | Replace existing `hero-home-title` text |
| **Supporting Copy** | `Use **RideBuilder** inside **RideAtlas** to match your bike, your time, and the kind of ride you want to a route that fits today. Then unlock a **RideGuide** with current-weather-powered ride intelligence so you can ride safer, avoid surprises, and know what to expect before you go.` | Replace existing `hero-text` paragraph |
| **Trust / Proof Bar** | `Built for North Georgia riders • Current-weather-powered ride intelligence • No subscription required` | Render as micro-text `.hero-trust-line` positioned directly above the Action Card |
| **Action Card Wrapper** | Container holding CTAs + Bridge Line to unify left-column action elements | Render as `.hero-action-card` |
| **Primary CTA** | `Find My Ride with RideBuilder` | `<a href="/rides" className="btn btn-funnel-main">` |
| **Secondary CTA** | `See 3 Free Sample RideGuides` | `<a href="#free-sample-pack" className="btn btn-funnel-sub">` |
| **Rider-Value Bridge** | **Know Before You Go.** See when to ride, how hard it’ll feel, and what to watch before you commit. | Render as interior card footer `.hero-bridge-line` |

---

### 2. Right Column (Authentic RideBuilder Mobile UI Replica inside Phone Bezel)

Instead of a generic stylized graphic or abstract 3x3 HUD gauges, the right column renders an authentic 1:1 DOM representation of the mobile **`RideBuilder`** interface inside a high-contrast phone bezel, paired with an auto-rotating feature accordion (`DigitalProductShowcase` engine):

| Element / Region | UI / Copy Architecture | Outcome Framing |
| :--- | :--- | :--- |
| **Interactive Accordion Driver** | 3 Auto-cycling tabs matching `DigitalProductShowcase` style (`effort`, `weather`, `terrain`) | Guides rider focus step-by-step through RideBuilder outcomes |
| **App Navigation Header** | `RIDEATLAS` brand header with close icon `✕` and cart counter `🛒1` | Authentic app framing matching live mobile interface |
| **App Header Banner** | `MY NEXT RIDE IS: CHOOSE FROM THE OPTIONS BELOW TO GET STARTED!` | Establishes action-oriented route selector intent |
| **Mode Toggle Tabs** | Active pill: `RIDEBUILDER` • Inactive pill: `ADVANCED FILTERING` | Mirrors live mobile app navigation options |
| **5-Step Stepper Row** | `1 Effort` (active) • `2 Distance` • `3 Bike` • `4 Drive` • `5 Window` | Demonstrates 30-second selector speed |
| **Active Step Drawer** | `(1) HOW HARD TO PUSH?` with options: `Casual Spin`, `Solid Workout` (selected), `Tough Grunt` | Authentic selector dials |
| **Collapsed Drawers** | `(2) HOW LONG ON TRAIL?`, `(3) WHAT ARE YOU RIDING?`, `(4) HOW FAR TO DRIVE?`, `(5) BEST RIDE WINDOW?` | Visual representation of selector depth |
| **Sticky Counter Bar** | `AVAILABLE RIDEGUIDES (784)` | Immediate visual feedback on filtering outcome |
| **Spotlight Overlay** | Glowing ring overlay (`.blueprint-hotspot-highlight-overlay`) with `Tap to Launch RideBuilder →` | Dynamic highlight synced to active accordion tab |

---

### 3. Section 2 Objection-Handling Block
Insert at the top of Section 2 (`.problem-hook-section`) to handle price objections cleanly without cluttering the main hero:

* **Header:** `Why it’s worth it`
* **Body:** `A RideGuide helps you avoid picking the wrong route for your bike, energy, or the day’s conditions. For **$6.99**, that means a safer, more enjoyable, and more predictable ride — with less wasted time and fewer bad surprises.`

---

## 📱 Mobile Responsive Stacking Sequence

Apply component-namespaced CSS rules in `@media (max-width: 767px)` using flex order properties:

1. `.hero-eyebrow-blue`
2. `.hero-home-title`
3. `.hero-text`
4. `.hero-trust-line`
5. `.hero-action-card` (Wrapper containing Primary CTA, Secondary CTA, and Bridge Line)
6. `.hero-bezel-showcase` (Interactive Accordion Stack + Scaled Phone Viewport)

---

## 🛠️ Step-by-Step Code Execution Plan

### Step 1: Clean Up & Update `src/pages/Home.tsx`
1. **Fix TS6133 Compiler Errors:** Completely delete retired math variables (`elevFill`, `elevEmptyStart`, `gradeFill`, `gradeEmptyStart`).
2. **Left Column Restructure:** Move `.hero-trust-line` above `.hero-action-card`. Wrap CTA buttons and `.hero-bridge-line` inside `.hero-action-card`.
3. **Right Column Mobile UI Replication:** Render the complete `RideAtlas` mobile DOM tree inside `.hero-mobile-app-mockup`, including navigation header, prompt banner, mode pills, 5-step stepper, active question card with dials, collapsed drawers, and bottom sticky counter.
4. **State Machine Sync:** Keep the auto-cycling `activeStep` state (`'effort' | 'weather' | 'terrain'`) synchronized with the highlight overlay coordinates.
5. **Section 2 Reassurance Card:** Retain the `.hero-value-reassurance` block directly at the top of `.problem-hook-section`.

### Step 2: Refine `src/pages/Home.css`
1. **Clean Up Legacy/Duplicate CSS:** Remove redundant HUD quadrant selectors (`.hero-hud-3x3-container`, `.hud-quadrant-card`, `.cell-top-left`, etc.) and duplicate media queries.
2. **Device Bezel Integration:** Style `.hero-phone-viewport` with sleek dark borders (`10px solid #0f172a`), 32px corner radius, and deep shadow to seamlessly mount the mobile UI.
3. **Authentic App Palette:** Use signature RideAtlas blue (`#1b4965` / `#1e5276`) for app headers, amber (`#fca311`) for active step highlights, and high-contrast typography.
4. **Component Scoping:** Ensure all CSS rules are strictly namespaced under `.funnel-landing-page .hero-funnel-section` without wildcard selectors (`> *`).

---

## 🛡️ Pre-Flight Verification Audit
Before approving the changes, verify:
* **TS6133 / TS6134 Check:** Zero unused variables or parameters in `Home.tsx`.
* **Selector Isolation:** No wildcard selectors (`> *`) added to `Home.css`.
* **Surgical Diff Anchors:** All `SEARCH`/`REPLACE` blocks use exact 3-line anchors from current source code.
* **API Cost Impact:** $0.00 billing risk (operates strictly on local React state and CSS transforms).