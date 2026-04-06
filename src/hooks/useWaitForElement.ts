// src/hooks/useWaitForElement.ts
import { useCallback } from "react";

type Options = {
  timeoutMs?: number;
  pollIntervalMs?: number;
};

export default function useWaitForElement() {
  const waitFor = useCallback(
    (selector: string, opts: Options = {}) =>
      new Promise<HTMLElement | null>((resolve) => {
        const { timeoutMs = 2000, pollIntervalMs = 16 } = opts;
        const found = document.querySelector<HTMLElement>(selector);
        if (found) return resolve(found);

        let timedOut = false;
        const timeout = window.setTimeout(() => {
          timedOut = true;
          resolve(document.querySelector<HTMLElement>(selector));
        }, timeoutMs);

        const tryFrame = () => {
          if (timedOut) return;
          const el = document.querySelector<HTMLElement>(selector);
          if (el) {
            clearTimeout(timeout);
            return resolve(el);
          }
          requestAnimationFrame(tryFrame);
        };
        tryFrame();

        const poll = window.setInterval(() => {
          if (timedOut) {
            clearInterval(poll);
            return;
          }
          const el = document.querySelector<HTMLElement>(selector);
          if (el) {
            clearTimeout(timeout);
            clearInterval(poll);
            resolve(el);
          }
        }, pollIntervalMs);
      }),
    []
  );

  return { waitFor };
}