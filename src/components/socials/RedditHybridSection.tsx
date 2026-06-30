// src/components/socials/RedditHybridSection.tsx
import { useEffect, useRef } from 'react';
import { useEnsureRedditWidgets } from './useEnsureRedditWidgets';

export default function RedditHybridSection() {
  useEnsureRedditWidgets();
  
  // ─── 🎯 FIX: CREATE A DOM CONTAINER REFERENCE ───
  const sectionRef = useRef<HTMLDivElement>(null);

  const posts = [
    {
      url: "https://www.reddit.com/r/NorthGeorgiaEbikes/comments/1s7q3uc/new_ebike_laws_are_sweeping_across_us_states_in/",
    },
    {
      url: "https://www.reddit.com/r/NorthGeorgiaEbikes/comments/1s6fpop/whats_your_favorite_accessory_the_one_you_would/",
    },
  ];

  // ─── 🎯 FIX: MUTATION OBSERVER ACCESSIBILITY INJECTOR ───
  useEffect(() => {
    if (!sectionRef.current) return;

    // Descriptive text titles mapped perfectly to your post indices
    const accessibilityTitles = [
      "Embedded Reddit social community post discussing new eBike laws sweeping across US states",
      "Embedded Reddit social community post thread discussing favorite trail riding accessories"
    ];

    const assignTitlesToDynamicIframes = () => {
      if (!sectionRef.current) return;
      
      // Target the runtime iframes generated inside your cards
      const cards = sectionRef.current.querySelectorAll('.reddit-embed-card');
      
      cards.forEach((card, index) => {
        const dynamicIframe = card.querySelector('iframe');
        // If the third-party iframe has arrived and doesn't have a title yet, patch it
        if (dynamicIframe && !dynamicIframe.hasAttribute('title')) {
          dynamicIframe.setAttribute('title', accessibilityTitles[index] || "Embedded Reddit Post Feed");
        }
      });
    };

    // Run a check immediately on mount
    assignTitlesToDynamicIframes();

    // Set up the listener to detect exactly when the Reddit script modifies the DOM
    const domObserver = new MutationObserver(() => {
      assignTitlesToDynamicIframes();
    });

    domObserver.observe(sectionRef.current, {
      childList: true,
      subtree: true,
    });

    // Cleanup connection stream on unmount
    return () => domObserver.disconnect();
  }, []);

  return (
    /* Bind the master ref handler to the grid layer container */
    <div ref={sectionRef} className="reddit-hybrid-section">
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