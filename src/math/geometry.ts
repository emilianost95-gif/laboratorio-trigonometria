import { DEG, approx } from './core';

export interface Pt { x: number; y: number }

export const dist = (a: Pt, b: Pt) => Math.hypot(b.x - a.x, b.y - a.y);

/** Pendiente m = Δy/Δx. Devuelve Infinity para rectas verticales. */
export function slope(a: Pt, b: Pt): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (approx(dx, 0)) return dy === 0 ? NaN : Infinity;
  return dy / dx;
}

export type SlopeKind = 'positiva' | 'negativa' | 'cero' | 'vertical' | 'indefinida';
export function slopeKind(a: Pt, b: Pt): SlopeKind {
  const m = slope(a, b);
  if (Number.isNaN(m)) return 'indefinida';
  if (!Number.isFinite(m)) return 'vertical';
  if (approx(m, 0)) return 'cero';
  return m > 0 ? 'positiva' : 'negativa';
}

/** Cuadrante de un punto: 1..4, o 0 si está sobre un eje. */
export function quadrant(p: Pt): 0 | 1 | 2 | 3 | 4 {
  if (approx(p.x, 0) || approx(p.y, 0)) return 0;
  if (p.x > 0) return p.y > 0 ? 1 : 4;
  return p.y > 0 ? 2 : 3;
}

export const QUAD_NAMES = ['sobre un eje', 'I', 'II', 'III', 'IV'] as const;

export type AngleKind = 'nulo' | 'agudo' | 'recto' | 'obtuso' | 'llano' | 'cóncavo' | 'completo';
export function angleKind(deg: number, eps = 0.5): AngleKind {
  if (Math.abs(deg) < eps) return 'nulo';
  if (Math.abs(deg - 90) < eps) return 'recto';
  if (Math.abs(deg - 180) < eps) return 'llano';
  if (Math.abs(deg - 360) < eps) return 'completo';
  if (deg < 90) return 'agudo';
  if (deg < 180) return 'obtuso';
  return 'cóncavo';
}

// ---------- Triángulos ----------

export interface TriangleInfo {
  valid: boolean;
  sides: [number, number, number]; // a = BC, b = CA, c = AB
  angles: [number, number, number]; // A, B, C en grados
  perimeter: number;
  area: number;
  bySides: 'equilátero' | 'isósceles' | 'escaleno';
  byAngles: 'acutángulo' | 'rectángulo' | 'obtusángulo';
}

/** Desigualdad triangular: cada lado menor que la suma de los otros dos. */
export const triangleInequality = (a: number, b: number, c: number) =>
  a > 0 && b > 0 && c > 0 && a + b > c && a + c > b && b + c > a;

/** Ángulo opuesto al lado `opp` por el teorema del coseno. */
export function angleFromSides(opp: number, s1: number, s2: number): number {
  const c = (s1 * s1 + s2 * s2 - opp * opp) / (2 * s1 * s2);
  return Math.acos(Math.min(1, Math.max(-1, c))) / DEG;
}

/** `tol` es relativa: 0.005 = lados iguales con 0,5 % de diferencia (útil al arrastrar puntos). */
export function classifyBySides(a: number, b: number, c: number, tol = 0.005): TriangleInfo['bySides'] {
  const eq = (u: number, v: number) => Math.abs(u - v) <= tol * Math.max(u, v);
  const e1 = eq(a, b), e2 = eq(b, c), e3 = eq(a, c);
  if (e1 && e2 && e3) return 'equilátero';
  if (e1 || e2 || e3) return 'isósceles';
  return 'escaleno';
}

export function classifyByAngles(angles: number[], tol = 0.5): TriangleInfo['byAngles'] {
  const max = Math.max(...angles);
  if (Math.abs(max - 90) <= tol) return 'rectángulo';
  return max > 90 ? 'obtusángulo' : 'acutángulo';
}

export function triangleFromSides(a: number, b: number, c: number, sideTol = 0.005, angleTol = 0.5): TriangleInfo {
  const valid = triangleInequality(a, b, c);
  if (!valid) {
    return { valid, sides: [a, b, c], angles: [NaN, NaN, NaN], perimeter: a + b + c, area: 0, bySides: 'escaleno', byAngles: 'acutángulo' };
  }
  const A = angleFromSides(a, b, c);
  const B = angleFromSides(b, a, c);
  const C = 180 - A - B;
  const s = (a + b + c) / 2;
  const area = Math.sqrt(Math.max(0, s * (s - a) * (s - b) * (s - c))); // Herón
  return {
    valid, sides: [a, b, c], angles: [A, B, C], perimeter: a + b + c, area,
    bySides: classifyBySides(a, b, c, sideTol), byAngles: classifyByAngles([A, B, C], angleTol),
  };
}

export function triangleFromPoints(A: Pt, B: Pt, C: Pt, sideTol = 0.03, angleTol = 1): TriangleInfo {
  return triangleFromSides(dist(B, C), dist(C, A), dist(A, B), sideTol, angleTol);
}

/** Área con signo (fórmula del cordón): permite detectar puntos alineados. */
export const signedArea = (A: Pt, B: Pt, C: Pt) => ((B.x - A.x) * (C.y - A.y) - (C.x - A.x) * (B.y - A.y)) / 2;

/** Coloca un triángulo dado por sus lados: A en el origen, B sobre el eje X (lado c). */
export function placeTriangle(a: number, b: number, c: number): [Pt, Pt, Pt] {
  const A = { x: 0, y: 0 };
  const B = { x: c, y: 0 };
  const x = (b * b + c * c - a * a) / (2 * c);
  const y = Math.sqrt(Math.max(0, b * b - x * x));
  return [A, B, { x, y }];
}
