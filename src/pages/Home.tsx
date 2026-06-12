/* src/pages/Home.tsx */


// 🎯 DIRECT IMPORTS FROM THE PROJECT PATH VERIFIED IN image_87af64.png
import PreviewExplorer from "../store/PreviewExplorer";

export default function Home() {
  return (
    <main className="page">

      {/* HERO SECTION */}
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

      {/* 🆕 INLINE FIELD BLUEPRINT ONBOARDING EXPLORER EXPLORER SECTION */}
      <section className="rg-inline-blueprint-explorer-section" style={{ padding: "40px 0", background: "#f8fafc" }}>
        <div style={{ width: "100%", maxWidth: "940px", margin: "0 auto", padding: "0 24px" }}>
          <h2 style={{ textAlign: "center", fontSize: "22px", fontWeight: 800, marginBottom: "4px", color: "#0f172a" }}>
            The Interactive Field Blueprint
          </h2>
          <p style={{ textAlign: "center", fontSize: "12px", color: "#64748b", fontWeight: 500, marginBottom: "24px" }}>
            Hover over any widget option on the sample RideGuide configuration layout sheet below to test our dynamic calculations framework nodes.
          </p>
          
          <PreviewExplorer />
        </div>
      </section>

      
      {/* 🧭 RELOCATED PILLARS MISSION SECTION (Moved securely lower down the viewport hierarchy stack) */}
      <section id="pillars" className="pillars" style={{ marginTop: "48px" }}>
        {/* COMMUNITY BUILDING */}
        <a href="/community" className="pillar">
          <div className="pillar-icon">
            <img src="/images/icons/community.png" alt="Community Building Icon" />
          </div>
          <h3 className="pillar-title">Community Building</h3>
          <p className="pillar-text">
            We connect North Georgia riders with group rides, route intel, and a crew that actually knows the mountains.
          </p>
        </a>

        {/* RIDER EDUCATION */}
        <div className="pillar">
          <div className="pillar-icon">
            <img src="/images/icons/education.png" alt="Rider Education Icon" />
          </div>
          <h3 className="pillar-title">Rider Education</h3>
          <p className="pillar-text">
            We help riders understand terrain, slope, weather windows, and equipment choices so every outing feels intentional and safe.
          </p>
        </div>

        {/* LOCAL PARTNERSHIPS */}
        <div className="pillar">
          <div className="pillar-icon">
            <img src="/images/icons/partnerships.png" alt="Local Partnerships Icon" />
          </div>
          <h3 className="pillar-title">Local Partnerships</h3>
          <p className="pillar-text">
            We collaborate with shops, land stewards, and regional outdoor groups to strengthen access and trail stewardship across North Georgia.
          </p>
        </div>
      </section>

    </main>
  );
}