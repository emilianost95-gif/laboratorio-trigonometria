import { acosDeg, asinDeg, atanDeg } from './trig';
import { round } from './core';

export type TrigFn = 'sin' | 'cos' | 'tan';

/** Valor principal de la inversa, en grados (null fuera del dominio). */
export function principalDeg(fn: TrigFn, k: number): number | null {
  if (fn === 'tan') return atanDeg(k);
  if (Math.abs(k) > 1) return null;
  return fn === 'sin' ? asinDeg(k) : acosDeg(k);
}

export interface TrigEqSolution {
  /** Ángulo principal u₁ = f⁻¹(k). */
  principal: number | null;
  /** Ángulos base para u = Bx (una familia por cada uno). */
  bases: number[];
  /** Período de f en u (360° o 180°). */
  period: number;
  /** Soluciones x en [lo, hi), ordenadas, con la familia de la que salen. */
  solutions: { x: number; family: number }[];
}

/**
 * Resuelve f(Bx) = k para x en [lo, hi) (grados).
 * sen: u = u₁ + 360n  ó  u = 180 − u₁ + 360n
 * cos: u = ±u₁ + 360n
 * tan: u = u₁ + 180n
 */
export function solveTrigEq(fn: TrigFn, k: number, B = 1, lo = 0, hi = 360): TrigEqSolution {
  const period = fn === 'tan' ? 180 : 360;
  const p = principalDeg(fn, k);
  if (p === null || B === 0) return { principal: p, bases: [], period, solutions: [] };
  const second = fn === 'sin' ? 180 - p : fn === 'cos' ? -p : null;
  const bases = second === null || Math.abs((((second - p) % 360) + 360) % 360) < 1e-9 ? [p] : [p, second];
  const seen = new Set<number>();
  const solutions: { x: number; family: number }[] = [];
  bases.forEach((u, family) => {
    const step = period / Math.abs(B);
    const x0 = u / B;
    const n0 = Math.ceil((lo - x0) / step - 1e-9);
    for (let n = n0; ; n++) {
      const x = round(x0 + n * step, 6);
      if (x >= hi - 1e-9) break;
      if (x < lo - 1e-9 || seen.has(x)) continue;
      seen.add(x);
      solutions.push({ x: Math.max(lo, x), family });
    }
  });
  solutions.sort((a, b) => a.x - b.x);
  return { principal: p, bases, period, solutions };
}
