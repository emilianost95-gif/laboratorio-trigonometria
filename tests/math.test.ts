import { describe, expect, it } from 'vitest';
import { evaluate, tryEvaluate } from '../src/math/calculator';
import { cosDeg, sinDeg, tanDeg, exactTex, radTex, referenceAngle, angleQuadrant } from '../src/math/trig';
import { dist, slope, slopeKind, quadrant, triangleFromSides, angleKind } from '../src/math/geometry';
import { solveRight } from '../src/math/solver';
import { fmt, tex, round } from '../src/math/core';
import { generate } from '../src/modules/generators';
import { checkAnswer } from '../src/modules/checker';
import { CATEGORY_NAMES, type Category, type Level } from '../src/modules/types';

describe('identidad fundamental sin²θ + cos²θ = 1', () => {
  it('se cumple para 0°..360° en pasos de 0,25°', () => {
    let maxErr = 0;
    for (let d = 0; d <= 360; d += 0.25) maxErr = Math.max(maxErr, Math.abs(sinDeg(d) ** 2 + cosDeg(d) ** 2 - 1));
    expect(maxErr).toBeLessThan(1e-15);
  });
  it('se cumple para 10 000 ángulos aleatorios (incl. negativos y > 360°)', () => {
    for (let i = 0; i < 10000; i++) {
      const d = (Math.random() - 0.5) * 4000;
      expect(Math.abs(sinDeg(d) ** 2 + cosDeg(d) ** 2 - 1)).toBeLessThan(1e-14);
    }
  });
});

describe('trigonometría en grados', () => {
  it('valores notables exactos', () => {
    expect(sinDeg(30)).toBe(0.5);
    expect(cosDeg(60)).toBe(0.5);
    expect(sinDeg(90)).toBe(1);
    expect(cosDeg(90)).toBe(0);
    expect(sinDeg(180)).toBe(0);
    expect(cosDeg(180)).toBe(-1);
    expect(sinDeg(270)).toBe(-1);
    expect(sinDeg(360)).toBe(0);
    expect(tanDeg(45)).toBe(1);
    expect(tanDeg(135)).toBe(-1);
    expect(tanDeg(90)).toBe(Infinity);
    expect(tanDeg(270)).toBe(-Infinity);
    expect(sinDeg(45)).toBeCloseTo(Math.SQRT2 / 2, 15);
    expect(cosDeg(30)).toBeCloseTo(Math.sqrt(3) / 2, 15);
    expect(tanDeg(60)).toBeCloseTo(Math.sqrt(3), 14);
  });
  it('coincide con Math.* en radianes', () => {
    for (let d = -720; d <= 720; d += 7.3) {
      expect(sinDeg(d)).toBeCloseTo(Math.sin((d * Math.PI) / 180), 12);
      expect(cosDeg(d)).toBeCloseTo(Math.cos((d * Math.PI) / 180), 12);
    }
  });
  it('tan = sin/cos donde está definida', () => {
    for (let d = 1; d < 360; d += 3) if (d % 90 !== 0) expect(tanDeg(d)).toBeCloseTo(sinDeg(d) / cosDeg(d), 10);
  });
  it('valores exactos en TeX y signos por cuadrante', () => {
    expect(exactTex('sin', 30)).toBe('\\tfrac{1}{2}');
    expect(exactTex('cos', 120)).toBe('-\\tfrac{1}{2}');
    expect(exactTex('sin', 225)).toBe('-\\tfrac{\\sqrt{2}}{2}');
    expect(exactTex('tan', 90)).toContain('no definida');
    expect(exactTex('sin', 37)).toBeNull();
    expect(radTex(30)).toBe('\\tfrac{\\pi}{6}');
    expect(radTex(180)).toBe('\\pi');
    expect(radTex(270)).toBe('\\tfrac{3\\pi}{2}');
    expect(referenceAngle(210)).toBe(30);
    expect(referenceAngle(300)).toBe(60);
    expect(angleQuadrant(135)).toBe(2);
    expect(angleQuadrant(-30)).toBe(4);
    expect(angleQuadrant(90)).toBe(0);
  });
});

describe('geometría', () => {
  it('distancia, pendiente y cuadrantes', () => {
    expect(dist({ x: 1, y: 2 }, { x: 4, y: 6 })).toBe(5);
    expect(slope({ x: 0, y: 0 }, { x: 2, y: 6 })).toBe(3);
    expect(slopeKind({ x: 1, y: 1 }, { x: 1, y: 5 })).toBe('vertical');
    expect(slopeKind({ x: 1, y: 1 }, { x: 4, y: 1 })).toBe('cero');
    expect(slopeKind({ x: 0, y: 3 }, { x: 4, y: 1 })).toBe('negativa');
    expect(quadrant({ x: -2, y: 3 })).toBe(2);
    expect(quadrant({ x: 0, y: 3 })).toBe(0);
    expect(angleKind(90)).toBe('recto');
    expect(angleKind(120)).toBe('obtuso');
  });
  it('triángulos: ángulos suman 180°, Herón y clasificación', () => {
    const t = triangleFromSides(3, 4, 5);
    expect(t.valid).toBe(true);
    expect(t.angles.reduce((a, b) => a + b)).toBeCloseTo(180, 10);
    expect(t.area).toBeCloseTo(6, 10);
    expect(t.byAngles).toBe('rectángulo');
    expect(t.bySides).toBe('escaleno');
    expect(triangleFromSides(5, 5, 5).bySides).toBe('equilátero');
    expect(triangleFromSides(5, 5, 8).byAngles).toBe('obtusángulo');
    expect(triangleFromSides(1, 2, 3).valid).toBe(false);
  });
});

describe('calculadora', () => {
  it('aritmética, precedencia y multiplicación implícita', () => {
    expect(evaluate('2+3*4')).toBe(14);
    expect(evaluate('(2+3)*4')).toBe(20);
    expect(evaluate('2^3^2')).toBe(512);
    expect(evaluate('-2^2')).toBe(-4);
    expect(evaluate('2π')).toBeCloseTo(2 * Math.PI, 12);
    expect(evaluate('3(4)')).toBe(12);
    expect(evaluate('√2/2')).toBeCloseTo(Math.SQRT2 / 2, 12);
    expect(evaluate('√(9)+1')).toBe(4);
    expect(evaluate('7÷2')).toBe(3.5);
    expect(evaluate('3,5×2')).toBe(7);
    expect(evaluate('5²')).toBe(25);
  });
  it('modo DEG y RAD', () => {
    expect(evaluate('sin(30)', { mode: 'DEG' })).toBe(0.5);
    expect(evaluate('sin30', { mode: 'DEG' })).toBe(0.5);
    expect(evaluate('sen(30)', { mode: 'DEG' })).toBe(0.5);
    expect(evaluate('cos(60)', { mode: 'DEG' })).toBe(0.5);
    expect(evaluate('sin(180)', { mode: 'DEG' })).toBe(0);
    expect(evaluate('sin(π/6)', { mode: 'RAD' })).toBe(0.5);
    expect(evaluate('cos(π)', { mode: 'RAD' })).toBe(-1);
    expect(evaluate('asin(0.5)', { mode: 'DEG' })).toBe(30);
    expect(evaluate('atan(1)', { mode: 'DEG' })).toBe(45);
    expect(evaluate('acos(0)', { mode: 'RAD' })).toBeCloseTo(Math.PI / 2, 12);
    expect(evaluate('sin(30)', { mode: 'RAD' })).toBeCloseTo(Math.sin(30), 12);
    expect(evaluate('sin(37)^2+cos(37)^2', { mode: 'DEG' })).toBe(1);
  });
  it('errores con mensaje', () => {
    expect(() => evaluate('tan(90)', { mode: 'DEG' })).toThrow(/no está definida/);
    expect(() => evaluate('asin(2)')).toThrow(/entre −1 y 1/);
    expect(() => evaluate('√(-4)')).toThrow();
    expect(() => evaluate('1/0')).toThrow(/cero/);
    expect(() => evaluate('(2+3')).toThrow(/paréntesis/);
    expect(tryEvaluate('2+')).toBeNull();
    expect(evaluate('ans*2', { mode: 'DEG', ans: 21 })).toBe(42);
  });
});

describe('formato', () => {
  it('coma decimal y redondeo', () => {
    expect(fmt(3.14159)).toBe('3,14');
    expect(fmt(-2.5)).toBe('−2,5');
    expect(tex(0.5)).toBe('0{,}5');
    expect(round(1.005, 2)).toBe(1.01);
    expect(round(-0.0001, 2)).toBe(0);
  });
});

describe('solucionador de triángulos rectángulos', () => {
  it('ejemplo del enunciado: c = 10, A = 30° → a = 5', () => {
    const r = solveRight({ c: 10, A: 30 });
    expect(r.ok).toBe(true);
    expect(r.values!.a).toBeCloseTo(5, 12);
    expect(r.values!.b).toBeCloseTo(5 * Math.sqrt(3), 12);
    expect(r.values!.B).toBe(60);
    expect(r.steps.length).toBeGreaterThanOrEqual(6);
  });
  it('todas las combinaciones válidas son consistentes', () => {
    const base = { a: 7, b: 24, c: 25, A: (Math.atan(7 / 24) * 180) / Math.PI };
    const B = 90 - base.A;
    const all = { ...base, B };
    const keys = ['a', 'b', 'c', 'A', 'B'] as const;
    for (let i = 0; i < keys.length; i++)
      for (let j = i + 1; j < keys.length; j++) {
        const k1 = keys[i], k2 = keys[j];
        if ((k1 === 'A' || k1 === 'B') && (k2 === 'A' || k2 === 'B')) continue;
        const r = solveRight({ [k1]: all[k1], [k2]: all[k2] });
        expect(r.ok, `${k1}+${k2}`).toBe(true);
        for (const k of keys) expect(r.values![k], `${k1}+${k2} → ${k}`).toBeCloseTo(all[k], 9);
        const v = r.values!;
        expect(Math.abs(v.a ** 2 + v.b ** 2 - v.c ** 2) / v.c ** 2).toBeLessThan(1e-12);
      }
  });
  it('rechaza datos imposibles con explicación', () => {
    expect(solveRight({ A: 30, B: 60 }).error).toMatch(/TAMAÑO/);
    expect(solveRight({ a: 12, c: 10 }).error).toMatch(/hipotenusa/);
    expect(solveRight({ c: 10, A: 95 }).error).toMatch(/menos de 90/);
    expect(solveRight({ c: 10 }).ok).toBe(false);
  });
});

describe('generador de problemas', () => {
  const cats = Object.keys(CATEGORY_NAMES) as Category[];
  it('genera 40 problemas por categoría y nivel, con datos válidos', () => {
    for (const c of cats)
      for (const l of [1, 2, 3, 4, 5] as Level[])
        for (let i = 0; i < 40; i++) {
          const p = generate(c, l);
          const tag = `${c}/${l}: ${p.title}`;
          expect(p.statement.length, tag).toBeGreaterThan(10);
          expect(p.hints.length, tag).toBeGreaterThan(0);
          expect(p.steps.length, tag).toBeGreaterThan(0);
          expect(Number.isFinite(p.answer), tag).toBe(true);
          expect(p.statement, tag).not.toMatch(/undefined|NaN|Infinity/);
          expect(p.steps.join(' '), tag).not.toMatch(/undefined|NaN/);
          if (p.kind === 'choice') {
            expect(p.choices!.length, tag).toBeGreaterThanOrEqual(2);
            expect(p.answer).toBeGreaterThanOrEqual(0);
            expect(new Set(p.choices).size, tag + ' opciones repetidas').toBe(p.choices!.length);
            expect(checkAnswer(p, p.answer).correct).toBe(true);
          } else {
            // la respuesta correcta (redondeada a 2 decimales y con coma) se acepta
            expect(checkAnswer(p, String(round(p.answer, 2)).replace('.', ',')).correct, tag).toBe(true);
            // ningún error "esperable" coincide con la respuesta
            for (const m of p.mistakes ?? []) {
              expect(checkAnswer(p, String(m.value)).correct, `${tag} · ${m.label}`).toBe(false);
              expect(m.explain.length, `${tag} · ${m.label}`).toBeGreaterThan(10);
            }
          }
        }
  });
  it('detecta errores típicos con su explicación', () => {
    // seno ↔ coseno
    let found = false;
    for (let i = 0; i < 30 && !found; i++) {
      const p = generate('sin', 2);
      const swapped = p.mistakes!.find((m) => m.label === 'Seno ↔ coseno');
      if (swapped) {
        const r = checkAnswer(p, swapped.value.toFixed(3));
        expect(r.correct).toBe(false);
        expect(r.diagnosis?.label).toBe('Seno ↔ coseno');
        found = true;
      }
    }
    expect(found).toBe(true);
    // Pitágoras al revés
    const p = generate('pythagoras', 3);
    const rev = p.mistakes!.find((m) => m.label === 'Pitágoras al revés')!;
    expect(checkAnswer(p, rev.value.toFixed(2)).diagnosis?.label).toBe('Pitágoras al revés');
    // radianes en problema de tangente
    const t = generate('tan', 4);
    const rad = t.mistakes!.find((m) => m.label === 'Calculadora en radianes');
    if (rad) expect(checkAnswer(t, rad.value.toFixed(3)).diagnosis?.label).toBe('Calculadora en radianes');
    // signo genérico
    const u = generate('unit', 2);
    if (u.answer !== 0) expect(checkAnswer(u, String(-u.answer)).diagnosis?.label).toMatch(/[Ss]igno/);
  });
  it('acepta respuestas exactas: √3/2, π/6, fracciones', () => {
    const p = { ...generate('angles', 2), answer: Math.PI / 6 };
    expect(checkAnswer(p, 'π/6').correct).toBe(true);
    const q = { ...generate('unit', 2), answer: Math.sqrt(3) / 2, mistakes: [] };
    expect(checkAnswer(q, '√3/2').correct).toBe(true);
    expect(checkAnswer(q, '0,866').correct).toBe(true);
    expect(checkAnswer(q, 'hola').parseError).toBeTruthy();
  });
});

import { solveOblique, type OKey } from '../src/math/oblique';

describe('ley del seno y del coseno (triángulos cualesquiera)', () => {
  const ref = { a: 7, b: 9, c: 11 } as Record<string, number>;
  const cosA = (ref.b ** 2 + ref.c ** 2 - ref.a ** 2) / (2 * ref.b * ref.c);
  const cosB = (ref.a ** 2 + ref.c ** 2 - ref.b ** 2) / (2 * ref.a * ref.c);
  ref.A = (Math.acos(cosA) * 180) / Math.PI;
  ref.B = (Math.acos(cosB) * 180) / Math.PI;
  ref.C = 180 - ref.A - ref.B;
  const keys: OKey[] = ['a', 'b', 'c', 'A', 'B', 'C'];
  it('todas las combinaciones de 3 datos (con un lado) recuperan el triángulo', () => {
    let n = 0;
    for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) for (let k = j + 1; k < 6; k++) {
      const ks = [keys[i], keys[j], keys[k]];
      if (ks.every((x) => x === x.toUpperCase())) continue;
      const r = solveOblique(Object.fromEntries(ks.map((x) => [x, ref[x]])));
      expect(r.ok, ks.join('')).toBe(true);
      // alguna de las soluciones (caso ambiguo) es la de referencia
      const match = r.solutions.some((s) => keys.every((x) => Math.abs(s[x] - ref[x]) < 1e-9));
      expect(match, ks.join('')).toBe(true);
      for (const s of r.solutions) {
        expect(s.A + s.B + s.C).toBeCloseTo(180, 9);
        expect(s.a / Math.sin((s.A * Math.PI) / 180)).toBeCloseTo(s.c / Math.sin((s.C * Math.PI) / 180), 9);
      }
      n++;
    }
    expect(n).toBe(19);
  });
  it('caso ambiguo LLA: 2, 1 y 0 soluciones', () => {
    expect(solveOblique({ a: 8, b: 10, A: 40 }).solutions.length).toBe(2);
    expect(solveOblique({ a: 12, b: 10, A: 40 }).solutions.length).toBe(1);
    expect(solveOblique({ a: 5, b: 10, A: 40 }).ok).toBe(false);
    expect(solveOblique({ a: 5, b: 10, A: 30 }).solutions.length).toBe(1); // sin B = 1 → B = 90°
  });
  it('validaciones', () => {
    expect(solveOblique({ A: 50, B: 60, C: 70 }).error).toMatch(/FORMA/);
    expect(solveOblique({ a: 1, b: 2, c: 5 }).error).toMatch(/Desigualdad/);
    expect(solveOblique({ a: 3, A: 100, B: 90 }).error).toMatch(/180/);
  });
  it('LAL con ángulo recto se reduce a Pitágoras', () => {
    expect(solveOblique({ a: 3, b: 4, C: 90 }).solutions[0].c).toBeCloseTo(5, 12);
  });
});
