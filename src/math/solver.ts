import { tex } from './core';
import { acosDeg, asinDeg, atanDeg, cosDeg, sinDeg, tanDeg } from './trig';

/**
 * Solucionador de triángulos rectángulos con procedimiento explicado.
 * Notación: ángulo recto en C; catetos a (frente a A) y b (frente a B); hipotenusa c.
 * Respecto del ángulo A: a = opuesto, b = adyacente.
 */

export type Known = 'a' | 'b' | 'c' | 'A' | 'B';
export type Inputs = Partial<Record<Known, number>>;

export interface SolveStep { title: string; lines: string[] } // líneas: texto con $TeX$
export interface SolveResult {
  ok: boolean;
  error?: string;
  values?: { a: number; b: number; c: number; A: number; B: number };
  steps: SolveStep[];
}

const NAMES: Record<Known, string> = {
  a: 'cateto $a$', b: 'cateto $b$', c: 'hipotenusa $c$', A: 'ángulo $A$', B: 'ángulo $B$',
};

export function solveRight(input: Inputs): SolveResult {
  const given = (Object.keys(input) as Known[]).filter((k) => input[k] !== undefined && Number.isFinite(input[k]));
  const steps: SolveStep[] = [];

  // ---------- Validaciones con explicación ----------
  if (given.length < 2) return { ok: false, error: 'Necesito exactamente dos datos (al menos uno debe ser un lado).', steps };
  if (given.length > 2) return { ok: false, error: 'Marca solo dos datos: con dos ya queda determinado el triángulo; un tercero podría contradecirlos.', steps };
  for (const k of given) {
    const v = input[k]!;
    if (v <= 0) return { ok: false, error: `El ${NAMES[k].replace(/\$/g, '')} debe ser positivo.`, steps };
    if ((k === 'A' || k === 'B') && v >= 90)
      return { ok: false, error: 'En un triángulo rectángulo los ángulos agudos miden menos de 90° (el de 90° ya es C).', steps };
  }
  if (given.every((k) => k === 'A' || k === 'B'))
    return { ok: false, error: 'Con dos ángulos conoces la FORMA pero no el TAMAÑO: hay infinitos triángulos semejantes. Necesitas al menos un lado.', steps };
  if (input.c !== undefined && ((input.a ?? 0) >= input.c || (input.b ?? 0) >= input.c))
    return { ok: false, error: 'La hipotenusa es siempre el lado más largo: un cateto no puede medir lo mismo o más que ella.', steps };

  let { a, b, c, A, B } = input as Required<Inputs>;
  const known = new Set(given);

  // 1. Identificar datos
  steps.push({
    title: 'Identificar los datos',
    lines: [
      'Triángulo rectángulo con el ángulo recto en $C$ ($C = 90°$).',
      ...given.map((k) => `Dato: ${NAMES[k]} $= ${tex(input[k]!, 4)}${k === 'A' || k === 'B' ? '°' : ''}$`),
    ],
  });

  // 2. Identificar desconocidos
  const unknown = (['a', 'b', 'c', 'A', 'B'] as Known[]).filter((k) => !known.has(k));
  steps.push({
    title: 'Identificar lo que falta',
    lines: [`Faltan: ${unknown.map((k) => NAMES[k]).join(', ')}.`, 'Recuerda: respecto de $A$, el cateto $a$ es el **opuesto** y $b$ es el **adyacente**; $c$ es la **hipotenusa**.'],
  });

  const add = (title: string, lines: string[]) => steps.push({ title, lines });

  // Si tenemos un ángulo, sacamos el otro (suma 180°)
  if (known.has('A') || known.has('B')) {
    if (known.has('A')) {
      B = 90 - A;
      add('Ángulo complementario', [`Los ángulos de un triángulo suman $180°$ y $C = 90°$, así que $A + B = 90°$.`, `$B = 90° - ${tex(A, 4)}° = ${tex(B, 4)}°$`]);
    } else {
      A = 90 - B;
      add('Ángulo complementario', [`Los ángulos de un triángulo suman $180°$ y $C = 90°$, así que $A + B = 90°$.`, `$A = 90° - ${tex(B, 4)}° = ${tex(A, 4)}°$`]);
    }
    // Trabajamos siempre respecto del ángulo A
    if (known.has('c')) {
      a = c * sinDeg(A);
      b = c * cosDeg(A);
      add('Elegir la razón para el cateto $a$', [
        'Conozco la **hipotenusa** y busco el lado **opuesto** a $A$ → la razón que une opuesto e hipotenusa es el **seno** (SOH).',
        `$\\sin A = \\dfrac{a}{c} \\;\\Rightarrow\\; a = c\\cdot \\sin A$`,
        `Sustituir: $a = ${tex(c, 4)} \\cdot \\sin ${tex(A, 4)}° = ${tex(c, 4)} \\cdot ${tex(sinDeg(A), 4)}$`,
        `Resolver: $a \\approx ${tex(a, 4)}$`,
      ]);
      add('Elegir la razón para el cateto $b$', [
        'Conozco la **hipotenusa** y busco el lado **adyacente** a $A$ → **coseno** (CAH).',
        `$\\cos A = \\dfrac{b}{c} \\;\\Rightarrow\\; b = c\\cdot \\cos A$`,
        `Sustituir: $b = ${tex(c, 4)} \\cdot \\cos ${tex(A, 4)}° = ${tex(c, 4)} \\cdot ${tex(cosDeg(A), 4)}$`,
        `Resolver: $b \\approx ${tex(b, 4)}$`,
      ]);
    } else if (known.has('a')) {
      c = a / sinDeg(A);
      b = a / tanDeg(A);
      add('Elegir la razón para la hipotenusa $c$', [
        'Conozco el **opuesto** a $A$ y busco la **hipotenusa** → **seno** (SOH).',
        `$\\sin A = \\dfrac{a}{c} \\;\\Rightarrow\\; c = \\dfrac{a}{\\sin A}$`,
        `Sustituir: $c = \\dfrac{${tex(a, 4)}}{\\sin ${tex(A, 4)}°} = \\dfrac{${tex(a, 4)}}{${tex(sinDeg(A), 4)}}$`,
        `Resolver: $c \\approx ${tex(c, 4)}$`,
        'Ojo: la incógnita quedó en el **denominador**, por eso se **divide** (multiplicar sería un error algebraico típico).',
      ]);
      add('Elegir la razón para el cateto $b$', [
        'Conozco el **opuesto** y busco el **adyacente** → **tangente** (TOA).',
        `$\\tan A = \\dfrac{a}{b} \\;\\Rightarrow\\; b = \\dfrac{a}{\\tan A}$`,
        `Sustituir: $b = \\dfrac{${tex(a, 4)}}{${tex(tanDeg(A), 4)}}$`,
        `Resolver: $b \\approx ${tex(b, 4)}$`,
      ]);
    } else {
      // conocemos b
      c = b / cosDeg(A);
      a = b * tanDeg(A);
      add('Elegir la razón para el cateto $a$', [
        'Conozco el **adyacente** a $A$ y busco el **opuesto** → **tangente** (TOA).',
        `$\\tan A = \\dfrac{a}{b} \\;\\Rightarrow\\; a = b\\cdot\\tan A$`,
        `Sustituir: $a = ${tex(b, 4)} \\cdot ${tex(tanDeg(A), 4)}$`,
        `Resolver: $a \\approx ${tex(a, 4)}$`,
      ]);
      add('Elegir la razón para la hipotenusa $c$', [
        'Conozco el **adyacente** y busco la **hipotenusa** → **coseno** (CAH).',
        `$\\cos A = \\dfrac{b}{c} \\;\\Rightarrow\\; c = \\dfrac{b}{\\cos A}$`,
        `Sustituir: $c = \\dfrac{${tex(b, 4)}}{${tex(cosDeg(A), 4)}}$`,
        `Resolver: $c \\approx ${tex(c, 4)}$`,
      ]);
    }
  } else {
    // Dos lados: Pitágoras + razón inversa
    if (known.has('a') && known.has('b')) {
      c = Math.hypot(a, b);
      add('Tercer lado con Pitágoras', [
        'Conozco los dos catetos y busco la hipotenusa → **Pitágoras**: $c^2 = a^2 + b^2$.',
        `$c = \\sqrt{${tex(a, 4)}^2 + ${tex(b, 4)}^2} = \\sqrt{${tex(a * a, 4)} + ${tex(b * b, 4)}}$`,
        `$c \\approx ${tex(c, 4)}$`,
      ]);
      A = atanDeg(a / b);
      add('Ángulo $A$ con la tangente inversa', [
        'Conozco **opuesto** ($a$) y **adyacente** ($b$) a $A$ → **tangente**, y como busco el ángulo uso su inversa.',
        `$\\tan A = \\dfrac{a}{b} = \\dfrac{${tex(a, 4)}}{${tex(b, 4)}} \\;\\Rightarrow\\; A = \\arctan\\left(${tex(a / b, 4)}\\right)$`,
        `$A \\approx ${tex(A, 4)}°$ (calculadora en modo **DEG**)`,
      ]);
    } else {
      const leg = known.has('a') ? 'a' : 'b';
      const legV = (leg === 'a' ? a : b);
      const other = Math.sqrt(c * c - legV * legV);
      if (leg === 'a') b = other; else a = other;
      add('Tercer lado con Pitágoras', [
        'Conozco la hipotenusa y un cateto → despejo el otro cateto: $\\text{cateto}^2 = c^2 - \\text{otro}^2$ (se **resta**: la hipotenusa es la mayor).',
        `$${leg === 'a' ? 'b' : 'a'} = \\sqrt{${tex(c, 4)}^2 - ${tex(legV, 4)}^2} = \\sqrt{${tex(c * c, 4)} - ${tex(legV * legV, 4)}}$`,
        `$${leg === 'a' ? 'b' : 'a'} \\approx ${tex(other, 4)}$`,
      ]);
      if (leg === 'a') {
        A = asinDeg(a / c);
        add('Ángulo $A$ con el seno inverso', [
          'Conozco el **opuesto** a $A$ y la **hipotenusa** → **seno**; busco el ángulo, uso $\\sin^{-1}$.',
          `$\\sin A = \\dfrac{${tex(a, 4)}}{${tex(c, 4)}} = ${tex(a / c, 4)} \\;\\Rightarrow\\; A = \\sin^{-1}(${tex(a / c, 4)})$`,
          `$A \\approx ${tex(A, 4)}°$`,
        ]);
      } else {
        A = acosDeg(b / c);
        add('Ángulo $A$ con el coseno inverso', [
          'Conozco el **adyacente** a $A$ y la **hipotenusa** → **coseno**; busco el ángulo, uso $\\cos^{-1}$.',
          `$\\cos A = \\dfrac{${tex(b, 4)}}{${tex(c, 4)}} = ${tex(b / c, 4)} \\;\\Rightarrow\\; A = \\cos^{-1}(${tex(b / c, 4)})$`,
          `$A \\approx ${tex(A, 4)}°$`,
        ]);
      }
    }
    B = 90 - A;
    add('Ángulo $B$', [`$B = 90° - A = 90° - ${tex(A, 4)}° \\approx ${tex(B, 4)}°$`]);
  }

  // Resultado
  add('Resultado', [
    `$a \\approx ${tex(a, 3)}$, $\\; b \\approx ${tex(b, 3)}$, $\\; c \\approx ${tex(c, 3)}$`,
    `$A \\approx ${tex(A, 2)}°$, $\\; B \\approx ${tex(B, 2)}°$, $\\; C = 90°$`,
  ]);
  // Comprobación independiente
  const pyth = a * a + b * b;
  add('Comprobación', [
    `Pitágoras: $a^2 + b^2 = ${tex(pyth, 4)}$ y $c^2 = ${tex(c * c, 4)}$ → ${Math.abs(pyth - c * c) < 1e-6 * Math.max(1, c * c) ? '✔ coinciden' : '✘ no coinciden'}.`,
    `Ángulos: $A + B + C = ${tex(A + B + 90, 4)}°$ ✔`,
    `Razón de control: $\\sin A = ${tex(a / c, 4)}$ y $\\sin(${tex(A, 2)}°) = ${tex(sinDeg(A), 4)}$ ✔`,
  ]);

  return { ok: true, values: { a, b, c, A, B }, steps };
}
