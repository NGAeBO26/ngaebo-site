export default function RedditHybridSection() {
  // Your simple array of Reddit post URLs
  const posts = [
    {
      url: "https://www.reddit.com/r/NorthGeorgiaEbikes/comments/1s7q3uc/new_ebike_laws_are_sweeping_across_us_states_in/",
    },
    {
      url: "https://www.reddit.com/r/NorthGeorgiaEbikes/comments/1s6fpop/whats_your_favorite_accessory_the_one_you_would/",
    },
  ];

  // Convert normal Reddit URL → embed URL
  function toEmbedUrl(url: string) {
    return url.replace("www.reddit.com", "embed.reddit.com") + "?embed=true&theme=light";
  }

  return (
    <div>
      {posts.map((post, i) => (
        <div key={i} className="reddit-embed-card">
          <iframe
            src={toEmbedUrl(post.url)}
            loading="lazy"
            title={`reddit-post-${i}`}
            scrolling="no"
          style={{ height: "350px", overflow: "hidden" }}
          ></iframe>

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
