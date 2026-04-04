// src/components/socials/RedditHybridSection.tsx
import { useEnsureRedditWidgets } from './useEnsureRedditWidgets';

export default function RedditHybridSection() {
  useEnsureRedditWidgets();

  const posts = [
    {
      url: "https://www.reddit.com/r/NorthGeorgiaEbikes/comments/1s7q3uc/new_ebike_laws_are_sweeping_across_us_states_in/",
    },
    {
      url: "https://www.reddit.com/r/NorthGeorgiaEbikes/comments/1s6fpop/whats_your_favorite_accessory_the_one_you_would/",
    },
  ];

  return (
    <div className="reddit-hybrid-section">
      {posts.map((post, i) => (
        <div key={i} className="reddit-embed-card">
          <blockquote
            className="reddit-embed-bq"
            data-embed-height="350"
            data-embed-showmedia="true"
            data-embed-live="false"
          >
            <a href={post.url}></a>
          </blockquote>

          <div className="bottom-gradient-anchor"></div>

          <button
            className="reddit-share-btn"
            type="button"
            onClick={() => navigator.clipboard.writeText(post.url)}
            aria-label="Share post"
          />
        </div>
      ))}
    </div>
  );
}