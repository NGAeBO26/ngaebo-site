// src/types/global.d.ts
export {};

declare global {
  interface Window {
    dataLayer?: Array<Record<string, any>>;
    __openUnlockModal?: () => void;

    realMap?: import("maplibre-gl").Map;
    maplibregl?: typeof import("maplibre-gl");
  }
}

