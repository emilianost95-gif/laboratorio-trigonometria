import { DEG, approx, norm360 } from './core';

/**
 * Trigonometría en grados con valores EXACTOS en múltiplos de 90°.
 * Math.sin(Math.PI) = 1.22e-16, no 0: para un estudiante eso es un error visible,
 * así que en los ángulos cuadrantales devolvemos el valor exacto.
 */
export function sinDeg(deg: number): number {
  const n = norm360(deg);
  if (approx(n, 0) || approx(n, 180)) return 0;
  if (approx(n, 90)) return 1;
  if (approx(n, 270)) return -1;
  if (approx(n, 30) || approx(n, 150)) return 0.5;
  if (approx(n, 210) || approx(n, 330)) return -0.5;
  return Math.sin(deg * DEG);
}

export function cosDeg(deg: number): number {
  const n = norm360(deg);
  if (approx(n, 90) || approx(n, 270)) return 0;
  if (approx(n, 0)) return 1;
  if (approx(n, 180)) return -1;
  if (approx(n, 60) || approx(n, 300)) return 0.5;
  if (approx(n, 120) || approx(n, 240)) return -0.5;
  return Math.cos(deg * DEG);
}

/** Tangente en grados; devuelve ±Infinity donde no está definida (cos θ = 0). */
export function tanDeg(deg: number): number {
  const c = cosDeg(deg);
  const s = sinDeg(deg);
  if (c === 0) return s > 0 ? Infinity : -Infinity;
  const n = norm360(deg);
  if (approx(n, 45) || approx(n, 225)) return 1;
  if (approx(n, 135) || approx(n, 315)) return -1;
  return s / c;
}

export const asinDeg = (x: number) => Math.asin(x) / DEG;
export const acosDeg = (x: number) => Math.acos(x) / DEG;
export const atanDeg = (x: number) => Math.atan(x) / DEG;

/** Cuadrante de un ángulo (0 = sobre un eje). */
export function angleQuadrant(deg: number): 0 | 1 | 2 | 3 | 4 {
  const n = norm360(deg);
  if ([0, 90, 180, 270].some((q) => approx(n, q))) return 0;
  if (n < 90) return 1;
  if (n < 180) return 2;
  if (n < 270) return 3;
  return 4;
}

/** Ángulo de referencia (agudo, respecto al eje X). */
export function referenceAngle(deg: number): number {
  const n = norm360(deg);
  if (n <= 90) return n;
  if (n <= 180) return 180 - n;
  if (n <= 270) return n - 180;
  return 360 - n;
}

// ---------- Valores exactos de ángulos notables ----------

const SQ2 = '\\tfrac{\\sqrt{2}}{2}';
const SQ3 = '\\tfrac{\\sqrt{3}}{2}';
const HALF = '\\tfrac{1}{2}';

/** Valor exacto en TeX de sin/cos/tan para ángulos notables (múltiplos de 30° y 45°). */
export function exactTex(fn: 'sin' | 'cos' | 'tan', deg: number): string | null {
  const n = Math.round(norm360(deg) * 1e6) / 1e6;
  if (!Number.isInteger(n) || (n % 30 !== 0 && n % 45 !== 0)) return null;
  const ref = referenceAngle(n);
  const s = sinDeg(n);
  const c = cosDeg(n);
  const sign = (v: number) => (v < 0 ? '-' : '');
  const mag: Record<number, { sin: string; cos: string; tan: string }> = {
    0: { sin: '0', cos: '1', tan: '0' },
    30: { sin: HALF, cos: SQ3, tan: '\\tfrac{\\sqrt{3}}{3}' },
    45: { sin: SQ2, cos: SQ2, tan: '1' },
    60: { sin: SQ3, cos: HALF, tan: '\\sqrt{3}' },
    90: { sin: '1', cos: '0', tan: '\\text{no definida}' },
  };
  const m = mag[ref];
  if (!m) return null;
  if (fn === 'sin') return s === 0 ? '0' : sign(s) + m.sin;
  if (fn === 'cos') return c === 0 ? '0' : sign(c) + m.cos;
  if (c === 0) return '\\text{no definida}';
  const t = s / c;
  return t === 0 ? '0' : sign(t) + m.tan;
}

/** Radianes como fracción de π en TeX (para ángulos múltiplos de 15°). */
export function radTex(deg: number): string {
  const n = Math.round(deg * 1e6) / 1e6;
  if (!Number.isInteger(n) || n % 15 !== 0) return `${(n * DEG).toFixed(3).replace('.', '{,}')}`;
  if (n === 0) return '0';
  const g = gcd(Math.abs(n), 180);
  const num = n / g;
  const den = 180 / g;
  const numStr = num === 1 ? '' : num === -1 ? '-' : String(num);
  return den === 1 ? `${numStr}\\pi` : `\\tfrac{${numStr}\\pi}{${den}}`;
}

export function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}
