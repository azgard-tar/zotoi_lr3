/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TriangularNumber } from "./types";

export const T_ZERO: TriangularNumber = { l: 0, m: 0, u: 0 };

/**
 * Додавання: (a,b,c) + (d,e,f) = (a+d, b+e, c+f)
 */
export const triAdd = (
  t1: TriangularNumber,
  t2: TriangularNumber
): TriangularNumber => ({
  l: t1.l + t2.l,
  m: t1.m + t2.m,
  u: t1.u + t2.u,
});

/**
 * Віднімання: (a,b,c) - (d,e,f) = (a-f, b-e, c-d)
 */
export const triSubtract = (
  t1: TriangularNumber,
  t2: TriangularNumber
): TriangularNumber => ({
  l: t1.l - t2.u,
  m: t1.m - t2.m,
  u: t1.u - t2.l,
});

/**
 * Множення: (a,b,c) * (d,e,f) = (a*d, b*e, c*f)
 */
export const triMultiply = (
  t1: TriangularNumber,
  t2: TriangularNumber
): TriangularNumber => ({
  l: t1.l * t2.l,
  m: t1.m * t2.m,
  u: t1.u * t2.u,
});

/**
 * Множення на скаляр: (a,b,c) * k = (a*k, b*k, c*k)
 */
export const triMultiplyByScalar = (
  t: TriangularNumber,
  s: number
): TriangularNumber => ({
  l: t.l * s,
  m: t.m * s,
  u: t.u * s,
});

/**
 * Ділення на скаляр: (a,b,c) / k = (a/k, b/k, c/k)
 */
export const triDivideByScalar = (
  t: TriangularNumber,
  s: number
): TriangularNumber => {
  if (s === 0) {
    // console.warn("Fuzzy division by zero. Returning zero.");
    return T_ZERO;
  }
  return {
    l: t.l / s,
    m: t.m / s,
    u: t.u / s,
  };
};

/**
 * Компонентний максимум: MAX((a,b,c), (d,e,f)) = (max(a,d), max(b,e), max(c,f))
 */
export const triMax = (
  t1: TriangularNumber,
  t2: TriangularNumber
): TriangularNumber => ({
  l: Math.max(t1.l, t2.l),
  m: Math.max(t1.m, t2.m),
  u: Math.max(t1.u, t2.u),
});

/**
 * Компонентний мінімум: MIN((a,b,c), (d,e,f)) = (min(a,d), min(b,e), min(c,f))
 */
export const triMin = (
  t1: TriangularNumber,
  t2: TriangularNumber
): TriangularNumber => ({
  l: Math.min(t1.l, t2.l),
  m: Math.min(t1.m, t2.m),
  u: Math.min(t1.u, t2.u),
});

/**
 * Крок 7: Дефазифікація за формулою (l + 2m + u) / 4
 */
export const defuzzify = (t: TriangularNumber): number => {
  return (t.l + 2 * t.m + t.u) / 4;
};

/**
 * Транспонування матриці (rows -> cols)
 */
export const transpose = (matrix: any[][]): any[][] => {
  if (!matrix || matrix.length === 0 || matrix[0].length === 0) {
    return [];
  }
  return matrix[0].map((_, c) => matrix.map((r) => r[c]));
};

// --- Допоміжні функції ---

/**
 * Ініціалізація 2D-масиву
 */
export function create2DArray<T>(rows: number, cols: number, fill: T): T[][] {
  return Array.from({ length: rows }, () => Array(cols).fill(fill));
}

/**
 * Ініціалізація 3D-масиву
 */
export function create3DArray<T>(
  d1: number,
  d2: number,
  d3: number,
  fill: T
): T[][][] {
  return Array.from({ length: d1 }, () => create2DArray(d2, d3, fill));
}

/**
 * "Розумна" функція для зміни розміру масиву назв
 */
export const resizeLabels = (
  prevLabels: string[],
  newCount: number,
  prefix: string
): string[] => {
  const newLabels = Array.from({ length: newCount }, (_, i) =>
    prevLabels[i] !== undefined ? prevLabels[i] : `${prefix} ${i + 1}`
  );
  return newLabels;
};

/**
 * "Розумна" функція для зміни розміру 2D-масиву
 */
export const resize2DArray = <T,>(
  prevArray: T[][],
  newRows: number,
  newCols: number,
  fill: T
): T[][] => {
  const newArray = create2DArray(newRows, newCols, fill);
  const rowsToCopy = Math.min(newRows, prevArray.length);
  const colsToCopy = Math.min(newCols, prevArray[0]?.length || 0);
  for (let r = 0; r < rowsToCopy; r++) {
    for (let c = 0; c < colsToCopy; c++) {
      newArray[r][c] = prevArray[r][c];
    }
  }
  return newArray;
};

/**
 * "Розумна" функція для зміни розміру 3D-масиву
 */
export const resize3DArray = <T,>(
  prevArray: T[][][],
  d1: number,
  d2: number,
  d3: number,
  fill: T
): T[][][] => {
  const newArray = create3DArray(d1, d2, d3, fill);
  const d1ToCopy = Math.min(d1, prevArray.length);
  const d2ToCopy = Math.min(d2, prevArray[0]?.length || 0);
  const d3ToCopy = Math.min(d3, prevArray[0]?.[0]?.length || 0);
  for (let i = 0; i < d1ToCopy; i++) {
    for (let j = 0; j < d2ToCopy; j++) {
      for (let k = 0; k < d3ToCopy; k++) {
        newArray[i][j][k] = prevArray[i][j][k];
      }
    }
  }
  return newArray;
};