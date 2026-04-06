// pages/Home.tsx
import TrailMap from "../components/TrailMap";
import { useUnlockModal } from "../components/modal/useUnlockModal";

export default function Home() {
  const { isUnlocked, open } = useUnlockModal();

  return (
    <main className="page">

      {/* HERO */}
      <section className="hero">
        <h1 className="hero-title">
          North Georgia's Off‑Road eBike Community Starts Here
        </h1>

        <p className="hero-text">
          Safety, trail knowledge, and local events for riders exploring the
          North Georgia backcountry.
        </p>

        <div className="hero-actions">
          <a href="/trail-guides" className="btn btn-primary">
            Explore Trail Guides
          </a>

          <a href="#pillars" className="btn btn-secondary">
            Our Mission
          </a>
        </div>
      </section>

      {/* PILLARS */}
      <section id="pillars" className="pillars">

        {/* COMMUNITY BUILDING */}
        <a href="/community" className="pillar">
          <div className="pillar-icon">
            <img
              src="/images/icons/community.png"
              alt="Community Building Icon"
            />
          </div>
          <h3 className="pillar-title">Community Building</h3>
          <p className="pillar-text">
            We connect North Georgia riders with group rides, route intel, and a crew that actually knows the mountains.
          </p>
        </a>

        {/* RIDER EDUCATION */}
        <div className="pillar">
          <div className="pillar-icon">
            <img
              src="/images/icons/education.png"
              alt="Rider Education Icon"
            />
          </div>
          <h3 className="pillar-title">Rider Education</h3>
          <p className="pillar-text">
            We help riders understand terrain, slope, weather windows, and equipment choices so every outing feels intentional and safe.
          </p>
        </div>

        {/* LOCAL PARTNERSHIPS */}
        <div className="pillar">
          <div className="pillar-icon">
            <img
              src="/images/icons/partnerships.png"
              alt="Local Partnerships Icon"
            />
          </div>
          <h3 className="pillar-title">Local Partnerships</h3>
          <p className="pillar-text">
            We collaborate with shops, land stewards, and regional outdoor groups to strengthen access and trail stewardship across North Georgia.
          </p>
        </div>

      </section>

      {/* TRAIL MAP */}
      <section className="trail">

        <h2 className="trail-title">North Georgia Gravel Guide v1.0</h2>
        <p className="trail-text">
          Explore epic routes across the Chattahoochee‑Oconee National Forest.
        </p>

        {/* MAP WRAPPER WITH LOCK + BLUR */}
        <div className="trail-map-wrapper">

          {/* Blur + lock overlay (only when locked) */}
          {!isUnlocked && (
            <div className="trail-map-overlay">
              <div className="cta-panel">
                <button className="unlock-cta" onClick={open}>
                  Unlock the Gravel Guide
                </button>
              </div>
            </div>
          )}

          {/* Map itself */}
          <div className={isUnlocked ? "trail-map" : "trail-map locked"}>
            <TrailMap />
          </div>

        </div>

        <a href="/trail-guides" className="btn btn-primary">
          View All Trail Guides
        </a>

      </section>

    </main>
  );
}
