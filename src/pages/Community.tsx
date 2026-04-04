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
    <main className="page">
      {/* SMALL HERO */}
      <section className="hero hero--small">
        <h1 className="hero-title">Your North Georgia eBike Community Hub</h1>
        <p className="hero-text">
          Social channels, upcoming events, and long‑form articles—all in one
          place.
        </p>
      </section>

      {/* COMMUNITY PILLARS */}
      <section className="pillars">
        <a href="#social" className="pillar">
          <div className="pillar-icon">
            <img src="/images/icons/community.png" alt="Social Icon" />
          </div>
          <h3 className="pillar-title">Social</h3>
          <p className="pillar-text">
            Join the subreddit and connect with riders across North Georgia.
          </p>
        </a>

        <a href="#events" className="pillar">
          <div className="pillar-icon">
            <img src="/images/icons/events.png" alt="Events Icon" />
          </div>
          <h3 className="pillar-title">Events</h3>
          <p className="pillar-text">
            View upcoming group rides, meetups, and community gatherings.
          </p>
        </a>

        <a href="#articles" className="pillar">
          <div className="pillar-icon">
            <img src="/images/icons/articles.png" alt="Articles Icon" />
          </div>
          <h3 className="pillar-title">Articles</h3>
          <p className="pillar-text">
            Read long‑form posts, ride breakdowns, and community updates.
          </p>
        </a>
      </section>

      {/* SOCIAL SECTION */}
      <section id="social" className="community-section">
        <h2 className="social-channels-header">Social Channels</h2>
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
      <section id="events" className="community-section">
        <h2 className="section-title">Events & Group Rides</h2>
        <p className="section-text">
          Your central hub for upcoming rides, meetups, and community
          gatherings.
        </p>

        <div className="community-card">
          <iframe
            src="https://calendar.google.com/calendar/embed?src=c_28b7fc29d19428f3910907714eb5caddb6cfd0d4027dbb1adc22de0467ea12ba%40group.calendar.google.com&ctz=America%2FNew_York"
            className="calendar-embed"
            title="Community Calendar"
          ></iframe>
        </div>
      </section>

      {/* ARTICLES SECTION */}
      <section id="articles" className="community-section">
        <h2 className="section-title">Articles & Updates</h2>
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
    </main>
  );
}