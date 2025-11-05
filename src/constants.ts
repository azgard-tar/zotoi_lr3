import type { LinguisticTerm } from "./types";

export const CRITERIA_TERMS: LinguisticTerm[] = [
  { name: "Very Low (VL)", shortName: "VL", tri: { l: 0.0, m: 0.1, u: 0.3 } },
  { name: "Low (L)", shortName: "L", tri: { l: 0.1, m: 0.3, u: 0.5 } },
  { name: "Medium (M)", shortName: "M", tri: { l: 0.3, m: 0.5, u: 0.7 } },
  { name: "High (H)", shortName: "H", tri: { l: 0.5, m: 0.7, u: 0.9 } },
  { name: "Very High (VH)", shortName: "VH", tri: { l: 0.7, m: 0.9, u: 1.0 } },
];

export const ALTERNATIVE_TERMS: LinguisticTerm[] = [
  { name: "Very Poor (VP)", shortName: "VP", tri: { l: 0.0, m: 0.0, u: 0.2 } },
  { name: "Poor (P)", shortName: "P", tri: { l: 0.0, m: 0.2, u: 0.4 } },
  { name: "Fair (F)", shortName: "F", tri: { l: 0.2, m: 0.4, u: 0.6 } },
  { name: "Good (G)", shortName: "G", tri: { l: 0.4, m: 0.6, u: 0.8 } },
  { name: "Very Good (VG)", shortName: "VG", tri: { l: 0.6, m: 0.8, u: 1.0 } },
  { name: "Excellent (E)", shortName: "E", tri: { l: 0.8, m: 0.9, u: 1.0 } },
];

export const CRITERIA_MAP = new Map(
  CRITERIA_TERMS.map((t) => [t.shortName, t.tri])
);
export const ALTERNATIVE_MAP = new Map(
  ALTERNATIVE_TERMS.map((t) => [t.shortName, t.tri])
);