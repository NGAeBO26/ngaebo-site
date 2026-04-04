// src/components/socials/useEnsureRedditWidgets.tsx
import { useEffect } from 'react';

declare global {
  interface Window {
    reddit?: {
      widgets?: {
        load?: () => void;
      };
    };
    __reddit_hook_ran?: boolean;
  }
}

export function useEnsureRedditWidgets() {
  useEffect(() => {
    // debug helpers — remove after debugging
    window.__reddit_hook_ran = true;
    console.log('useEnsureRedditWidgets mounted');

    // Remove any inline/data: reddit stubs that might interfere
    Array.from(document.scripts).forEach((s) => {
      try {
        if (
          (s.src && s.src.includes('embed.reddit.com/widgets.js')) ||
          (s.src && s.src.startsWith('data:text/javascript') && s.src.includes('embed.reddit.com')) ||
          (!s.src && (s.innerText || '').includes('embed.reddit.com/widgets.js'))
        ) {
          s.remove();
        }
      } catch {
        // ignore removal errors
      }
    });

    // Ensure the official script is present (append if missing)
    const ensureScript = () => {
      const existing = Array.from(document.scripts).find((s) =>
        s.src && s.src.includes('embed.reddit.com/widgets.js')
      );
      if (!existing) {
        const s = document.createElement('script');
        s.src = 'https://embed.reddit.com/widgets.js';
        s.async = true;
        s.onload = () => {
          console.log('widgets.js appended (onload)');
          // try aligning iframes and hiding share buttons immediately after script load
          alignIframes();
          hideShareButtons();
        };
        s.onerror = (e) => console.error('widgets.js failed to load', e);
        document.body.appendChild(s);
      } else {
        // If script exists but may not have initialized, attach a safe onload listener
        try {
          existing.addEventListener('load', () => {
            console.log('existing widgets.js load event');
            alignIframes();
            hideShareButtons();
          });
        } catch {
          // ignore
        }
      }
    };

    // Align reddit iframes to the header column: remove width attribute and set maxWidth
    const alignIframes = () => {
      try {
        const header = document.querySelector('.social-channels-header');
        const headerMax =
          header && getComputedStyle(header).maxWidth !== 'none'
            ? getComputedStyle(header).maxWidth
            : header
            ? Math.round(header.getBoundingClientRect().width) + 'px'
            : '1200px';

        document.querySelectorAll<HTMLIFrameElement>('.reddit-embed-card iframe').forEach((ifr) => {
          try {
            // remove fixed width attribute that Reddit injects
            ifr.removeAttribute('width');
            // apply inline styles so CSS can take effect reliably
            ifr.style.width = '100%';
            ifr.style.maxWidth = headerMax;
            ifr.style.margin = '0 auto';
            ifr.style.boxSizing = 'border-box';
            ifr.style.display = 'block';
          } catch (e) {
            // ignore cross-origin or other errors
          }
        });
      } catch (e) {
        console.warn('alignIframes error', e);
      }
    };

    // Hide or remove the share button(s). Prefer removal; fallback to hiding + aria-hidden.
    const hideShareButtons = () => {
      try {
        document.querySelectorAll<HTMLElement>('.reddit-share-btn').forEach((btn) => {
          try {
            // Prefer removing the node entirely
            if (btn.parentElement) {
              btn.remove();
              return;
            }
          } catch {
            // ignore remove errors and fall back to hiding
          }
          try {
            btn.style.display = 'none';
            btn.style.visibility = 'hidden';
            btn.style.pointerEvents = 'none';
            btn.setAttribute('aria-hidden', 'true');
            btn.setAttribute('tabindex', '-1');
          } catch {
            // ignore
          }
        });
      } catch (e) {
        console.warn('hideShareButtons error', e);
      }
    };

    ensureScript();

    // Poll for reddit object and call load() when ready (timeout after 10s)
    const start = Date.now();
    const pollInterval = 200;
    const timeoutMs = 10000;
    const poll = setInterval(() => {
      if (window.reddit && window.reddit.widgets && typeof window.reddit.widgets.load === 'function') {
        try {
          window.reddit.widgets.load();
          console.log('reddit.widgets.load() called (poll)');
        } catch (err) {
          console.warn('reddit.widgets.load() error (poll)', err);
        }

        // Align iframes and hide share buttons immediately after load
        try {
          alignIframes();
          hideShareButtons();
          // run again shortly after to catch late injections
          setTimeout(() => {
            alignIframes();
            hideShareButtons();
          }, 800);
        } catch {}

        clearInterval(poll);
        return;
      }

      // If script never initializes, try re-appending once after 2s
      if (Date.now() - start > 2000 && Date.now() - start < 2000 + pollInterval) {
        // attempt a single re-ensure (safe no-op if already present)
        ensureScript();
      }

      if (Date.now() - start > timeoutMs) {
        clearInterval(poll);
        console.warn('reddit.widgets did not initialize within 10s');
      }
    }, pollInterval);

    // MutationObserver to catch late iframe/button injections and keep them aligned/hidden
    const observer = new MutationObserver((mutations) => {
      let sawRelevant = false;
      for (const m of mutations) {
        if (m.addedNodes && m.addedNodes.length) {
          for (const n of Array.from(m.addedNodes)) {
            if (
              (n instanceof HTMLElement && n.matches && (n.matches('.reddit-embed-card') || n.matches('.reddit-share-btn'))) ||
              (n instanceof HTMLIFrameElement && n.closest && n.closest('.reddit-embed-card'))
            ) {
              sawRelevant = true;
              break;
            }
          }
        }
        if (sawRelevant) break;
      }
      if (sawRelevant) {
        // small debounce
        setTimeout(() => {
          alignIframes();
          hideShareButtons();
        }, 120);
      }
    });

    try {
      observer.observe(document.body, { childList: true, subtree: true });
    } catch {
      // ignore if observe fails in some environments
    }

    // Also run a short-lived interval to repeatedly attempt alignment and hiding for the first few seconds
    const alignInterval = setInterval(() => {
      alignIframes();
      hideShareButtons();
    }, 600);
    const alignTimeout = setTimeout(() => clearInterval(alignInterval), 5000);

    return () => {
      clearInterval(poll);
      clearInterval(alignInterval);
      clearTimeout(alignTimeout);
      try {
        observer.disconnect();
      } catch {}
    };
  }, []);
}