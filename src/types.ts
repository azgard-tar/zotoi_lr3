/**
 * Трикутне нечітке число (l, m, u)
 */
export type TriangularNumber = {
  l: number; // lower
  m: number; // middle
  u: number; // upper
};

/**
 * Лінгвістичний терм
 */
export type LinguisticTerm = {
  name: string;
  shortName: string;
  tri: TriangularNumber;
};

/**
 * Структура для зберігання результатів ранжування
 */
export type RankedAlternative = {
  altIndex: number;
  altLabel: string;
  s: number;
  r: number;
  q: number;
};

/**
 * Структура для збереження всіх результатів VIKOR
 */
export type CalculationResults = {
  step2_criteria: TriangularNumber[];
  step2_alternatives: TriangularNumber[][];
  step3_fStar: TriangularNumber[];
  step3_fNadir: TriangularNumber[];
  step4_normalizedDiff: TriangularNumber[][];
  step5_S: TriangularNumber[];
  step5_R: TriangularNumber[];
  step6_Q: TriangularNumber[];
  step7_S_defuzz: number[];
  step7_R_defuzz: number[];
  step7_Q_defuzz: number[];
  step8_rankedS: RankedAlternative[];
  step8_rankedR: RankedAlternative[];
  step8_rankedQ: RankedAlternative[];
  step9_Adv: number;
  step9_DQ: number;
  step9_C1_met: boolean;
  step9_C2_met: boolean;
  step9_compromiseSet: string[];
};