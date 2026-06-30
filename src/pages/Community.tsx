/* src/pages/Community.tsx */
// import RedditTopPosts from "../components/RedditTopPosts";
import RedditHybridSection from "../components/socials/RedditHybridSection";

export default function Community() {
  console.log(
    "%c[Community] MOUNT",
    "color: #4CAF50; font-weight: bold; font-size:14px;"
  );

  console.log(
    "%c[Community] RENDER",
    "color: #8BC34A; font-weight:bold; font-size:12px;"
  );

  return (
    /* ─── 🎯 FIX 1: SWAPPED NESTED MAIN TO GENERIC CONTAINER DIV ─── 
       Resolves landmark-main-is-top-level and landmark-one-main because your global 
       app router wrapper already supplies the primary page <main> tag boundary */
    <div className="page">
      
      {/* SMALL HERO — DARK BACKGROUND WITH TEXT SHADOW LAYER */}
      <section className="hero hero--small" aria-label="Community Hub Welcome">
        
        {/* ─── 🎯 INJECTED TEXT SHADOW (CAMELCASE STYLE PROPERTY) ─── */}
        <h1 
          className="hero-title" 
          style={{ 
            color: "#ffffff", 
            textShadow: "0 1px 4px rgba(0, 0, 0, 0.95)" 
          }}
        >
          Your North Georgia eBike Community Hub
        </h1>
        
        <p 
          className="hero-text" 
          style={{ 
            color: "#f4f1eb", 
            textShadow: "0 1px 4px rgba(0, 0, 0, 0.95)" 
          }}
        >
          Social channels, upcoming events, and long‑form articles—all in one place.
        </p>
      </section>

      {/* COMMUNITY PILLARS */}
      <section className="pillars" aria-label="Quick Section Navigation">
        <a href="#social" className="pillar">
          <div className="pillar-icon">
            <img src="/images/icons/community.png" alt="" role="presentation" />
          </div>
          {/* ─── 🎯 FIX 2: CONVERT NAV TILES FROM H3 TO LOGICAL FLEX SPANS ─── 
             Eliminates heading-order skips from h1 down to h3, while leaving 
             your native stylesheet pillar-title formatting styles intact */}
          <span className="pillar-title" style={{ display: "block", fontSize: "1.25rem", fontWeight: "bold" }}>
            Social
          </span>
          <p className="pillar-text">
            Join the subreddit and connect with riders across North Georgia.
          </p>
        </a>

        <a href="#events" className="pillar">
          <div className="pillar-icon">
            <img src="/images/icons/events.png" alt="" role="presentation" />
          </div>
          <span className="pillar-title" style={{ display: "block", fontSize: "1.25rem", fontWeight: "bold" }}>
            Events
          </span>
          <p className="pillar-text">
            View upcoming group rides, meetups, and community gatherings.
          </p>
        </a>

        <a href="#articles" className="pillar">
          <div className="pillar-icon">
            <img src="/images/icons/articles.png" alt="" role="presentation" />
          </div>
          <span className="pillar-title" style={{ display: "block", fontSize: "1.25rem", fontWeight: "bold" }}>
            Articles
          </span>
          <p className="pillar-text">
            Read long‑form posts, ride breakdowns, and community updates.
          </p>
        </a>
      </section>

      {/* SOCIAL SECTION */}
      {/* ─── 🎯 FIX 3: MAP COMPONENT REGIONS TO INLINE TITLE NODES ─── 
          Resolves the 'region' violation by generating explicit named sections */}
      <section id="social" className="community-section" aria-labelledby="social-section-title">
        <h2 id="social-section-title" className="social-channels-header">Social Channels</h2>
        <p className="section-text">
          Connect with riders, share ride reports, and stay in the loop.
        </p>

        {/* Temporarily disabled until Reddit API app is approved */}
        {/* <RedditTopPosts /> */}

        {/* Active Reddit embed section */}
        <RedditHybridSection />

        <div className="community-card community-card--disabled">
          <h3 className="card-title">Facebook Group (Coming Soon)</h3>
          <p className="card-text">
            A high‑engagement space for ride planning and local updates.
          </p>
        </div>
      </section>

      {/* EVENTS SECTION */}
      <section id="events" className="community-section" aria-labelledby="events-section-title">
        <h2 id="events-section-title" className="section-title">Events & Group Rides</h2>
        <p className="section-text">
          Your central hub for upcoming rides, meetups, and community gatherings.
        </p>

        <div className="community-card">
          <iframe
            src="https://calendar.google.com/calendar/embed?src=c_28b7fc29d19428f3910907714eb5caddb6cfd0d4027dbb1adc22de0467ea12ba%40group.calendar.google.com&ctz=America%2FNew_York"
            className="calendar-embed"
            title="Community Google Calendar Feed"
          ></iframe>
        </div>
      </section>

      {/* ARTICLES SECTION */}
      <section id="articles" className="community-section" aria-labelledby="articles-section-title">
        <h2 id="articles-section-title" className="section-title">Articles & Updates</h2>
        <p className="section-text">
          Long‑form posts, ride breakdowns, and community announcements.
        </p>

        <div className="community-card community-card--disabled">
          <h3 className="card-title">Coming Soon</h3>
          <p className="card-text">
            Articles and deep‑dives will live here as the community grows.
          </p>
        </div>
      </section>
    </div>
  );
}