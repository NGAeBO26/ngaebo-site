import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import "../styles/RedditTopPosts.css";

// 🔍 Debug: component mount
console.log(
  "%c[RedditTopPosts] MOUNT",
  "color:#2196F3; font-weight:bold; font-size:14px;"
);

interface RedditPost {
  id: string;
  title: string;
  permalink: string;
  selftext?: string;
  ups: number;
  created_utc: number;
}

interface SubredditAbout {
  display_name_prefixed: string;
  public_description: string;
}

export default function RedditTopPosts() {
  const location = useLocation();
  const [posts, setPosts] = useState<RedditPost[] | null>(null);
  const [about, setAbout] = useState<SubredditAbout | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔥 Debug: effect runs on route change
  useEffect(() => {
    console.log(
      "%c[RedditTopPosts] EFFECT RUN — pathname:",
      "color:#03A9F4; font-weight:bold;",
      location.pathname
    );

    setLoading(true);
    setPosts(null);
    setAbout(null);

    // 🔥 Fetch from your server-side proxy instead of Reddit
    fetch("/api/reddit")
      .then((res) => {
        console.log("%c[RedditTopPosts] Fetching /api/reddit…", "color:#00BCD4;");
        return res.json();
      })
      .then((data) => {
        console.log(
          "%c[RedditTopPosts] Posts received:",
          "color:#0097A7;",
          data.posts
        );
        console.log(
          "%c[RedditTopPosts] About received:",
          "color:#0097A7;",
          data.about
        );

        setPosts(data.posts);
        setAbout(data.about);
      })
      .catch((err) => {
        console.error("%c[RedditTopPosts] ERROR:", "color:red;", err);
      })
      .finally(() => {
        console.log("%c[RedditTopPosts] Loading complete", "color:#4CAF50;");
        setLoading(false);
      });
  }, [location.pathname]);

  function handleShare(post: RedditPost) {
    const url = `https://reddit.com${post.permalink}`;

    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: "Check out this post on r/NorthGeorgiaEBikes",
        url,
      });
    } else {
      navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    }
  }

  return (
    <div className="reddit-top-posts">

      {/* Reddit subsection header */}
      {about && (
        <div className="community-card reddit-card-header">
          <div
            className="reddit-card-banner floating-banner"
            style={{
              backgroundImage: `url(/images/reddit-highlands-sunset.png)`,
            }}
          >
            <h3 className="reddit-card-title floating-title">
              Reddit — {about.display_name_prefixed}
            </h3>
          </div>

          <div className="reddit-card-header-content below-banner">
            <p className="reddit-card-description">
              {about.public_description}
            </p>

            <a
              href="https://reddit.com/r/NorthGeorgiaEBikes"
              target="_blank"
              className="btn btn-primary reddit-card-button"
            >
              Visit Subreddit
            </a>
          </div>
        </div>
      )}

      <h3 className="reddit-subheader">Top Posts This Week</h3>

      {loading && (
        <div className="reddit-grid">
          <div className="reddit-mini-card skeleton" />
          <div className="reddit-mini-card skeleton" />
          <div className="reddit-mini-card skeleton" />
        </div>
      )}

      {!loading && posts && posts.length === 0 && (
        <div className="reddit-mini-card quiet">
          <p>No top posts yet — be the first to share something!</p>
        </div>
      )}

      {!loading && posts && posts.length > 0 && (
        <div className="reddit-grid">
          {posts.map((post) => (
            <div key={post.id} className="reddit-mini-card">

              {/* Thin banner */}
              <div className="reddit-mini-banner" />

              {/* Title row */}
              <div className="reddit-mini-title-row">
                <h4 className="mini-card-title">{post.title}</h4>
                <div className="mini-card-badge-placeholder"></div>
              </div>

              {/* Accent bar */}
              <div className="reddit-mini-accent"></div>

              {/* Content row */}
              <div className="reddit-mini-content">
                {post.selftext && (
                  <p className="mini-card-text">
                    {post.selftext.slice(0, 120)}…
                  </p>
                )}
                <p className="mini-card-meta">⬆ {post.ups} upvotes</p>
              </div>

              {/* Share button anchored bottom-right */}
              <button
                className="reddit-mini-share"
                type="button"
                onClick={() => handleShare(post)}
                aria-label="Share post"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}