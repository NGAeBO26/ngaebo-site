// src/lib/scoring/computeFinalSuitability.ts

export type SurfaceType =
  | "paved"
  | "gravel"
  | "dirt"
  | "clay"
  | "unknown";

export interface SuitabilityInput {
  baseScore: number;
  precip_24h: number;
  meanSlope: number;
  maxSlope: number;
  surfaceType: SurfaceType;
}

export type SuitabilityLabel =
  | "Highly Suitable"
  | "Somewhat Suitable"
  | "Likely Unsuitable";

function precipPenalty(mm: number): number {
  if (mm <= 2) return 0;
  if (mm <= 10) return -5;
  if (mm <= 25) return -15;
  return -30;
}

function surfacePenalty(surface: SurfaceType): number {
  switch (surface) {
    case "paved":
    case "gravel":
      return 0;
    case "dirt":
      return -5;
    case "clay":
      return -10;
    default:
      return -5;
  }
}

function slopePenalty(meanSlope: number, maxSlope: number): number {
  let p = 0;
  if (meanSlope > 10) p -= 5;
  if (maxSlope > 18) p -= 10;
  return p;
}

export function computeFinalSuitability(input: SuitabilityInput): SuitabilityLabel {
  const { baseScore, precip_24h, meanSlope, maxSlope, surfaceType } = input;

  const total =
    baseScore +
    precipPenalty(precip_24h) +
    surfacePenalty(surfaceType) +
    slopePenalty(meanSlope, maxSlope);

  const finalScore = Math.max(0, Math.min(100, total));

  if (finalScore >= 75) return "Highly Suitable";
  if (finalScore >= 40) return "Somewhat Suitable";
  return "Likely Unsuitable";
}