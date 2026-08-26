# Section 2 — RideGuide proof module

## Section objective

Help visitors quickly understand why a RideGuide is worth unlocking, then move them into RideBuilder through one clear primary action.

## Final copy

### Lead-in

**Eyebrow:** Know Before You Go.

**Headline:** A Route Line is NOT a Ride Plan

**Support copy:** RideBuilder helps you find a route that fits your bike, time, and energy. Unlock a RideGuide to see when to ride, how it may feel, what to watch, and what the route looks like today.

### Central artifact

**Artifact label:** Sample RideGuide · sample content, not your route

**Interaction hint:** Explore the guide

### Interactive hotspot copy

All four hotspots are available at the same time. They are exploratory, not sequential.

#### When should I ride?

**Proof label:** Prime Ride Time

See the best 3-hour window for this route, based on current weather and route conditions.

#### How hard will it feel?

**Proof label:** Effort Gauge

See how terrain, traction, and surface saturation may change the ride today.

#### What should I watch?

**Proof label:** Risk Radar

Review route-specific factors worth a closer look before you go.

#### What are the route conditions?

**Proof label:** Route Conditions

See today’s trail and surface status before you make the drive.

### Helper copy

RideBuilder ranks routes by percent match. Unlock a RideGuide to see current conditions, Prime Ride Time, effort insight, and route-specific risk for the route you choose.

### Compact proof chips

- **7 days + regenerate**
- **Download or print**
- **$6.99 for one route**
- **Reusable tokens**

Optional supporting detail:

- **7 days + regenerate:** Refresh timing, conditions, and effort during the active window.
- **Download or print:** Useful when cell service is limited.
- **$6.99 for one route:** No recurring subscription required.
- **Reusable tokens:** One token unlocks one RideGuide.

### CTA hierarchy

**Primary button:** Build Your Next Ride

**Secondary link:** Free Sample Pack

- **Build Your Next Ride** opens RideBuilder.
- **Free Sample Pack** opens the email lead-in form at https://bogged-nanometer-criteria.ngrok-free.dev/#free-sample-pack.
- After email opt-in, `/samples` delivers the sample RideGuide PDFs and supporting proof/featured-gear content.
- Keep one dominant primary CTA beneath the interactive artifact. Do not give each hotspot its own CTA.

## Interaction requirements

- Use one central Sample RideGuide visual as the hub.
- Place four matching icon markers directly on the artifact and repeat those icons in the visible key:
  - clock/sun → Prime Ride Time;
  - mountain/gauge → Effort Gauge;
  - radar/shield → Risk Radar;
  - weather/route-status → Route Conditions.
- Do not use numerals, numbered steps, progress indicators, or arrows that imply order.
- Default state shows the artifact, all four markers, the four keys, and `Explore the guide`.
- Selecting a marker or key opens one compact widget that visibly grows from the matching point on the artifact.
- Keep only one widget open at a time. Selecting another hotspot morphs the open widget to the new anchor; it must not stack a second large card.
- Selecting the active hotspot or pressing Escape collapses the widget.
- Use restrained scale/opacity/position motion to show the widget unfolding from the guide. Do not use a carousel, scroll-jacking, decorative motion, or hover-only interaction.

## Responsive behavior

### Desktop

- Keep the Sample RideGuide visually dominant in the center.
- Place the four hotspot keys around the artifact without competing with it.
- Anchor the active widget to its matching on-guide marker.
- Place the proof chips and one primary CTA below the artifact.

### Mobile

- Keep the artifact first and preserve the four icon markers.
- Convert the keys into large tap targets below or around the artifact.
- Let the active widget expand below or partially over the artifact without requiring a long text read.
- Preserve the same non-sequential behavior and one-widget-at-a-time rule.
- Keep the primary CTA easy to reach after the module; keep Free Sample Pack secondary.

## Accessibility and performance

- Use native buttons for hotspot controls with visible focus states, descriptive accessible names, and synchronized `aria-expanded`/`aria-controls` state.
- Support pointer, touch, keyboard, and Escape-to-close behavior.
- Provide a fully understandable static state when `prefers-reduced-motion` is enabled.
- Keep all meaning available without animation or hover.
- Label the artifact as sample content and do not imply it is the visitor’s live route.
- Lazy-load heavier imagery/video assets and avoid autoplay video in this section.

## Implementation-only disclosures

- `Email opt-in unlocks advanced filters, including drive time and Prime Ride Time.` Basic ranked route matches remain available without opt-in.
- `RideBuilder ranks routes by percent match before unlock. The unlocked RideGuide adds current conditions, Prime Ride Time, effort insight, and route-specific risk for the route you choose.`
- Keep Joy Score out of this primary interaction unless it is displayed in the actual UI; if shown, label it separately.

## Acceptance criteria

- A first-time visitor can identify the Sample RideGuide and all four available questions at a glance.
- Route Conditions remains a distinct custom feature and is not merged into Risk Radar.
- The four icons match between the visible key and the artifact markers.
- The widget visibly grows from the selected marker, switches without stacking, and collapses on repeat selection or Escape.
- The section has one dominant Build Your Next Ride CTA and the corrected email-first Free Sample Pack path.
- The copy remains concise enough for the intended vertical space and works across desktop, mobile, keyboard, screen-reader, and reduced-motion states.