import { tex } from './core';
import { asinDeg, acosDeg, cosDeg, sinDeg } from './trig';

/**
 * Solucionador de triángulos CUALESQUIERA (ley del seno y ley del coseno).
 * Notación: lados a, b, c opuestos a los ángulos A, B, C.
 * Casos: LLL, LAL, ALA/AAL y LLA (caso ambiguo: 0, 1 o 2 triángulos).
 */

export type OKey = 'a' | 'b' | 'c' | 'A' | 'B' | 'C';
export type OInputs = Partial<Record<OKey, number>>;
export interface OStep { title: string; lines: string[] }
export interface OSolution { a: number; b: number; c: number; A: number; B: number; C: number; steps: OStep[] }
export interface OResult { ok: boolean; error?: string; caseName?: string; caseText?: string; solutions: OSolution[]; note?: string }

const S = ['a', 'b', 'c'] as const;
const G = ['A', 'B', 'C'] as const;
const t4 = (x: number) => tex(x, 4);

function lawSinesSide(sol: number[], ang: number[], known: number, target: number, steps: OStep[]) {
  // sol[target] = sol[known] * sin(ang[target]) / sin(ang[known])
  sol[target] = (sol[known] * sinDeg(ang[target])) / sinDeg(ang[known]);
  steps.push({
    title: `Lado ${S[target]} con la ley del seno`,
    lines: [
      `Conozco el par completo $${S[known]}$ y $${G[known]}$ (lado y ángulo opuesto), y el ángulo $${G[target]}$ → **ley del seno**.`,
      `$\\dfrac{${S[target]}}{\\sin ${G[target]}} = \\dfrac{${S[known]}}{\\sin ${G[known]}} \\Rightarrow ${S[target]} = \\dfrac{${t4(sol[known])}\\cdot\\sin ${t4(ang[target])}°}{\\sin ${t4(ang[known])}°}$`,
      `$${S[target]} \\approx ${t4(sol[target])}$`,
    ],
  });
}

function check(sol: number[], ang: number[]): OStep {
  const r = sol.map((s, i) => s / sinDeg(ang[i]));
  const c2 = sol[0] ** 2 + sol[1] ** 2 - 2 * sol[0] * sol[1] * cosDeg(ang[2]);
  return {
    title: 'Comprobación',
    lines: [
      `Ángulos: $${t4(ang[0])}° + ${t4(ang[1])}° + ${t4(ang[2])}° = ${tex(ang[0] + ang[1] + ang[2], 6)}°$ ✔`,
      `Ley del seno: $\\dfrac{a}{\\sin A} \\approx ${t4(r[0])}$, $\\dfrac{b}{\\sin B} \\approx ${t4(r[1])}$, $\\dfrac{c}{\\sin C} \\approx ${t4(r[2])}$ ✔ (iguales)`,
      `Ley del coseno: $a^2 + b^2 - 2ab\\cos C \\approx ${t4(c2)}$ y $c^2 \\approx ${t4(sol[2] ** 2)}$ ✔`,
    ],
  };
}

const pack = (sol: number[], ang: number[], steps: OStep[]): OSolution => ({ a: sol[0], b: sol[1], c: sol[2], A: ang[0], B: ang[1], C: ang[2], steps: [...steps, check(sol, ang)] });

export function solveOblique(input: OInputs): OResult {
  const sides = S.map((k) => input[k]);
  const angs = G.map((k) => input[k]);
  const nS = sides.filter((v) => v !== undefined).length;
  const nA = angs.filter((v) => v !== undefined).length;
  if (nS + nA !== 3) return { ok: false, error: 'Marca exactamente tres datos: con tres (al menos un lado) el triángulo queda determinado.', solutions: [] };
  if (nS === 0) return { ok: false, error: 'Con tres ángulos solo conoces la FORMA: hay infinitos triángulos semejantes. Necesitas al menos un lado.', solutions: [] };
  for (const v of sides) if (v !== undefined && !(v > 0)) return { ok: false, error: 'Los lados deben ser positivos.', solutions: [] };
  for (const v of angs) if (v !== undefined && !(v > 0 && v < 180)) return { ok: false, error: 'Cada ángulo debe estar entre 0° y 180°.', solutions: [] };
  const sumA = angs.reduce<number>((s, v) => s + (v ?? 0), 0);
  if (sumA >= 180) return { ok: false, error: `Los ángulos dados ya suman ${tex(sumA, 2)}°: en un triángulo los tres suman exactamente 180°.`, solutions: [] };

  const sol = sides.map((v) => v ?? NaN);
  const ang = angs.map((v) => v ?? NaN);
  const steps: OStep[] = [{ title: 'Identificar los datos', lines: [...S.filter((_, i) => sides[i] !== undefined).map((k, _j) => `$${k} = ${t4(input[k]!)}$`), ...G.filter((_, i) => angs[i] !== undefined).map((k) => `$${k} = ${t4(input[k]!)}°$`)] }];

  // ---------- LLL ----------
  if (nS === 3) {
    const [a, b, c] = sol;
    if (!(a + b > c && a + c > b && b + c > a)) return { ok: false, error: 'Desigualdad triangular: cada lado debe ser menor que la suma de los otros dos. Con estos lados el triángulo no se cierra.', solutions: [] };
    for (const i of [0, 1]) {
      const j = (i + 1) % 3, k = (i + 2) % 3;
      const cosv = (sol[j] ** 2 + sol[k] ** 2 - sol[i] ** 2) / (2 * sol[j] * sol[k]);
      ang[i] = acosDeg(cosv);
      steps.push({ title: `Ángulo ${G[i]} con la ley del coseno`, lines: [
        'Tres lados y ningún ángulo → **ley del coseno**, despejando el coseno del ángulo.',
        `$\\cos ${G[i]} = \\dfrac{${S[j]}^2 + ${S[k]}^2 - ${S[i]}^2}{2${S[j]}${S[k]}} = \\dfrac{${t4(sol[j] ** 2)} + ${t4(sol[k] ** 2)} - ${t4(sol[i] ** 2)}}{${t4(2 * sol[j] * sol[k])}} \\approx ${t4(cosv)}$`,
        `$${G[i]} = \\cos^{-1}(${t4(cosv)}) \\approx ${t4(ang[i])}°$`,
      ] });
    }
    ang[2] = 180 - ang[0] - ang[1];
    steps.push({ title: 'Tercer ángulo', lines: [`$C = 180° - A - B \\approx ${t4(ang[2])}°$`] });
    return { ok: true, caseName: 'LLL', caseText: 'Tres lados → ley del coseno', solutions: [pack(sol, ang, steps)] };
  }

  // ---------- un lado y dos ángulos (ALA / AAL) ----------
  if (nS === 1) {
    const mi = ang.findIndex((v) => Number.isNaN(v));
    ang[mi] = 180 - ang.reduce((s, v) => s + (Number.isNaN(v) ? 0 : v), 0);
    steps.push({ title: 'Tercer ángulo', lines: ['Los ángulos de un triángulo suman $180°$.', `$${G[mi]} = 180° - ${G.filter((_, i) => i !== mi).map((k) => `${t4(ang[G.indexOf(k)])}°`).join(' - ')} = ${t4(ang[mi])}°$`] });
    const ks = sol.findIndex((v) => !Number.isNaN(v));
    for (let i = 0; i < 3; i++) if (i !== ks) lawSinesSide(sol, ang, ks, i, steps);
    return { ok: true, caseName: 'ALA / AAL', caseText: 'Un lado y dos ángulos → ley del seno', solutions: [pack(sol, ang, steps)] };
  }

  // ---------- dos lados y un ángulo ----------
  const ka = ang.findIndex((v) => !Number.isNaN(v));
  const missingSide = sol.findIndex((v) => Number.isNaN(v));
  if (ka === missingSide) {
    // LAL: el ángulo está entre los dos lados conocidos
    const j = (ka + 1) % 3, k = (ka + 2) % 3;
    sol[ka] = Math.sqrt(sol[j] ** 2 + sol[k] ** 2 - 2 * sol[j] * sol[k] * cosDeg(ang[ka]));
    steps.push({ title: `Lado ${S[ka]} con la ley del coseno`, lines: [
      `Dos lados y el ángulo **comprendido** entre ellos → **ley del coseno**.`,
      `$${S[ka]}^2 = ${S[j]}^2 + ${S[k]}^2 - 2${S[j]}${S[k]}\\cos ${G[ka]} = ${t4(sol[j] ** 2)} + ${t4(sol[k] ** 2)} - ${t4(2 * sol[j] * sol[k])}\\cdot${t4(cosDeg(ang[ka]))}$`,
      `$${S[ka]} \\approx \\sqrt{${t4(sol[ka] ** 2)}} \\approx ${t4(sol[ka])}$`,
      ang[ka] > 90 ? `Como $${G[ka]} > 90°$, $\\cos ${G[ka]} < 0$ y el término $-2${S[j]}${S[k]}\\cos ${G[ka]}$ **suma**: el lado sale mayor que con Pitágoras.` : `Si $${G[ka]}$ fuera $90°$, el término con coseno sería 0 y quedaría Pitágoras.`,
    ] });
    // ángulo con coseno (evita ambigüedad del seno)
    const cosj = (sol[k] ** 2 + sol[ka] ** 2 - sol[j] ** 2) / (2 * sol[k] * sol[ka]);
    ang[j] = acosDeg(cosj);
    steps.push({ title: `Ángulo ${G[j]}`, lines: [
      'Uso otra vez la ley del coseno (con el seno habría que decidir entre dos ángulos posibles).',
      `$\\cos ${G[j]} = \\dfrac{${S[k]}^2 + ${S[ka]}^2 - ${S[j]}^2}{2${S[k]}${S[ka]}} \\approx ${t4(cosj)} \\Rightarrow ${G[j]} \\approx ${t4(ang[j])}°$`,
    ] });
    ang[k] = 180 - ang[ka] - ang[j];
    steps.push({ title: `Ángulo ${G[k]}`, lines: [`$${G[k]} = 180° - ${G[ka]} - ${G[j]} \\approx ${t4(ang[k])}°$`] });
    return { ok: true, caseName: 'LAL', caseText: 'Dos lados y el ángulo comprendido → ley del coseno', solutions: [pack(sol, ang, steps)] };
  }

  // LLA: el ángulo conocido es opuesto a uno de los lados conocidos (caso ambiguo)
  const other = [0, 1, 2].find((i) => i !== ka && i !== missingSide)!; // lado conocido sin su ángulo
  const s = (sol[other] * sinDeg(ang[ka])) / sol[ka];
  const base: OStep = { title: `Ángulo ${G[other]} con la ley del seno`, lines: [
    `Conozco el par $${S[ka]}$, $${G[ka]}$ y el lado $${S[other]}$ → **ley del seno** para el ángulo $${G[other]}$.`,
    `$\\sin ${G[other]} = \\dfrac{${S[other]}\\cdot\\sin ${G[ka]}}{${S[ka]}} = \\dfrac{${t4(sol[other])}\\cdot${t4(sinDeg(ang[ka]))}}{${t4(sol[ka])}} \\approx ${t4(s)}$`,
  ] };
  if (s > 1 + 1e-12) {
    return { ok: false, caseName: 'LLA', error: `Caso ambiguo sin solución: sería sin ${G[other]} ≈ ${tex(s, 4)} > 1, y ningún ángulo tiene un seno mayor que 1. El lado ${S[ka]} es demasiado corto para alcanzar la base: el triángulo no existe.`, solutions: [] };
  }
  const B1 = asinDeg(Math.min(1, s));
  const candidates = Math.abs(s - 1) < 1e-12 ? [B1] : [B1, 180 - B1];
  const solutions: OSolution[] = [];
  candidates.forEach((Bv, n) => {
    if (ang[ka] + Bv >= 180 - 1e-9) return;
    const sol2 = [...sol], ang2 = [...ang];
    const st: OStep[] = [...steps, { ...base, lines: [...base.lines, candidates.length === 2 ? `Hay **dos** ángulos con ese seno: $${t4(B1)}°$ y $180° - ${t4(B1)}° = ${t4(180 - B1)}°$. ${n === 0 ? 'Solución 1: el agudo.' : 'Solución 2: el obtuso.'}` : `$${G[other]} = 90°$ (seno igual a 1).`, `$${G[other]} \\approx ${t4(Bv)}°$`] }];
    ang2[other] = Bv;
    ang2[missingSide] = 180 - ang2[ka] - Bv;
    st.push({ title: `Ángulo ${G[missingSide]}`, lines: [`$${G[missingSide]} = 180° - ${t4(ang2[ka])}° - ${t4(Bv)}° \\approx ${t4(ang2[missingSide])}°$`] });
    lawSinesSide(sol2, ang2, ka, missingSide, st);
    solutions.push(pack(sol2, ang2, st));
  });
  if (!solutions.length) return { ok: false, caseName: 'LLA', error: 'Caso ambiguo sin solución: los ángulos resultantes suman 180° o más.', solutions: [] };
  return {
    ok: true, caseName: 'LLA (caso ambiguo)', caseText: 'Dos lados y un ángulo NO comprendido → ley del seno, con cuidado',
    solutions,
    note: solutions.length === 2 ? 'Caso ambiguo: los mismos datos producen DOS triángulos distintos. El lado opuesto al ángulo conocido puede "abrirse" hacia dos posiciones.' : candidates.length === 2 ? 'Caso ambiguo: el segundo candidato (ángulo obtuso) no cabe, así que hay un solo triángulo.' : undefined,
  };
}
