import { DEG, clean } from './core';

/**
 * Evaluador de expresiones (parser descendente recursivo, sin eval()).
 * Soporta: + − × ÷ ^ √ ( ) π e ans, sin cos tan, asin acos atan (y arcsin/sen…),
 * ln log abs, multiplicación implícita (2π, 3(4), 2sin30, √2/2) y coma decimal.
 */

export type AngleMode = 'DEG' | 'RAD';

export class CalcError extends Error {}

type Tok =
  | { t: 'num'; v: number }
  | { t: 'id'; v: string }
  | { t: 'op'; v: string }
  | { t: 'lp' }
  | { t: 'rp' };

const FUNCS = new Set(['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sqrt', 'ln', 'log', 'abs', 'cbrt']);
const ALIASES: Record<string, string> = {
  sen: 'sin', arcsin: 'asin', arcsen: 'asin', asen: 'asin', arccos: 'acos', arctan: 'atan', arctg: 'atan',
  tg: 'tan', raiz: 'sqrt', 'raíz': 'sqrt', pi: 'π',
};

function normalize(src: string): string {
  return src
    .replace(/×|·|⋅/g, '*')
    .replace(/÷|:/g, '/')
    .replace(/−|–/g, '-')
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
    .replace(/sin⁻¹|sen⁻¹/g, 'asin')
    .replace(/cos⁻¹/g, 'acos')
    .replace(/tan⁻¹/g, 'atan')
    .replace(/°/g, '')
    .replace(/(\d),(\d)/g, '$1.$2'); // coma decimal → punto
}

function tokenize(src: string): Tok[] {
  const s = normalize(src);
  const out: Tok[] = [];
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (/\s/.test(ch)) { i++; continue; }
    if (/[0-9.]/.test(ch)) {
      let j = i;
      while (j < s.length && /[0-9.]/.test(s[j])) j++;
      if (s[j] === 'e' && /[0-9+-]/.test(s[j + 1] ?? '') && !/[a-z]/i.test(s[j + 1] ?? '')) {
        // notación científica 1e-3
        let k = j + 1;
        if (s[k] === '+' || s[k] === '-') k++;
        while (k < s.length && /[0-9]/.test(s[k])) k++;
        j = k;
      }
      const txt = s.slice(i, j);
      const v = Number(txt);
      if (!Number.isFinite(v) || (txt.match(/\./g) ?? []).length > 1) throw new CalcError(`Número mal escrito: "${txt}"`);
      out.push({ t: 'num', v });
      i = j;
      continue;
    }
    if (ch === 'π') { out.push({ t: 'id', v: 'π' }); i++; continue; }
    if (ch === '√') { out.push({ t: 'id', v: 'sqrt' }); i++; continue; }
    if (/[a-záéíóú]/i.test(ch)) {
      let j = i;
      while (j < s.length && /[a-záéíóú]/i.test(s[j])) j++;
      let word = s.slice(i, j).toLowerCase();
      word = ALIASES[word] ?? word;
      // "sin30" sin paréntesis o "pie" → separar identificadores conocidos pegados
      out.push(...splitWord(word));
      i = j;
      continue;
    }
    if ('+-*/^'.includes(ch)) { out.push({ t: 'op', v: ch }); i++; continue; }
    if (ch === '(' || ch === '[') { out.push({ t: 'lp' }); i++; continue; }
    if (ch === ')' || ch === ']') { out.push({ t: 'rp' }); i++; continue; }
    throw new CalcError(`Símbolo no reconocido: "${ch}"`);
  }
  return out;
}

function splitWord(word: string): Tok[] {
  const known = [...FUNCS, 'ans', 'π', 'e'].sort((a, b) => b.length - a.length);
  const res: Tok[] = [];
  let rest = word;
  while (rest.length) {
    const alias = Object.keys(ALIASES).sort((a, b) => b.length - a.length).find((k) => rest.startsWith(k));
    if (alias) { res.push({ t: 'id', v: ALIASES[alias] }); rest = rest.slice(alias.length); continue; }
    const k = known.find((w) => rest.startsWith(w));
    if (!k) throw new CalcError(`Función desconocida: "${word}"`);
    res.push({ t: 'id', v: k });
    rest = rest.slice(k.length);
  }
  return res;
}

export interface EvalOptions { mode: AngleMode; ans?: number }

export function evaluate(src: string, opts: EvalOptions = { mode: 'DEG' }): number {
  const toks = tokenize(src);
  if (toks.length === 0) throw new CalcError('Expresión vacía');
  let p = 0;
  const peek = () => toks[p];
  const next = () => toks[p++];

  const toInternal = (x: number) => (opts.mode === 'DEG' ? x * DEG : x);
  const fromInternal = (x: number) => (opts.mode === 'DEG' ? x / DEG : x);

  function startsPrimary(t: Tok | undefined): boolean {
    return !!t && (t.t === 'num' || t.t === 'id' || t.t === 'lp');
  }

  function expr(): number {
    let v = term();
    while (peek()?.t === 'op' && ((peek() as { v: string }).v === '+' || (peek() as { v: string }).v === '-')) {
      const op = (next() as { v: string }).v;
      const r = term();
      v = op === '+' ? v + r : v - r;
    }
    return v;
  }

  function term(): number {
    let v = unary();
    for (;;) {
      const t = peek();
      if (t?.t === 'op' && (t.v === '*' || t.v === '/')) {
        next();
        const r = unary();
        if (t.v === '/' && r === 0) throw new CalcError('División por cero');
        v = t.v === '*' ? v * r : v / r;
      } else if (startsPrimary(t)) {
        v = v * unary(); // multiplicación implícita
      } else break;
    }
    return v;
  }

  function unary(): number {
    const t = peek();
    if (t?.t === 'op' && (t.v === '-' || t.v === '+')) {
      next();
      const v = unary();
      return t.v === '-' ? -v : v;
    }
    return power();
  }

  function power(): number {
    const base = primary();
    if (peek()?.t === 'op' && (peek() as { v: string }).v === '^') {
      next();
      const e = unary(); // asociativa a la derecha: 2^3^2 = 2^9
      const r = Math.pow(base, e);
      if (Number.isNaN(r)) throw new CalcError('Potencia no definida en los reales');
      return r;
    }
    return base;
  }

  function arg(): number {
    // función con paréntesis o aplicada directamente: sin(30), sin30, √2
    if (peek()?.t === 'lp') {
      next();
      const v = expr();
      if (peek()?.t !== 'rp') throw new CalcError('Falta cerrar un paréntesis');
      next();
      return v;
    }
    return power();
  }

  function primary(): number {
    const t = next();
    if (!t) throw new CalcError('La expresión termina de forma incompleta');
    if (t.t === 'num') return t.v;
    if (t.t === 'lp') {
      const v = expr();
      if (peek()?.t !== 'rp') throw new CalcError('Falta cerrar un paréntesis');
      next();
      return v;
    }
    if (t.t === 'id') {
      if (t.v === 'π') return Math.PI;
      if (t.v === 'e') return Math.E;
      if (t.v === 'ans') return opts.ans ?? 0;
      const x = arg();
      switch (t.v) {
        case 'sin': return trig('sin', x);
        case 'cos': return trig('cos', x);
        case 'tan': return trig('tan', x);
        case 'asin':
          if (x < -1 || x > 1) throw new CalcError('arcsen solo acepta valores entre −1 y 1');
          return fromInternal(Math.asin(x));
        case 'acos':
          if (x < -1 || x > 1) throw new CalcError('arccos solo acepta valores entre −1 y 1');
          return fromInternal(Math.acos(x));
        case 'atan': return fromInternal(Math.atan(x));
        case 'sqrt':
          if (x < 0) throw new CalcError('No existe la raíz cuadrada real de un número negativo');
          return Math.sqrt(x);
        case 'cbrt': return Math.cbrt(x);
        case 'ln':
          if (x <= 0) throw new CalcError('ln solo acepta números positivos');
          return Math.log(x);
        case 'log':
          if (x <= 0) throw new CalcError('log solo acepta números positivos');
          return Math.log10(x);
        case 'abs': return Math.abs(x);
      }
    }
    throw new CalcError('Expresión mal formada');
  }

  function trig(fn: 'sin' | 'cos' | 'tan', x: number): number {
    if (opts.mode === 'DEG') {
      const n = ((x % 360) + 360) % 360;
      if (fn === 'tan' && (Math.abs(n - 90) < 1e-10 || Math.abs(n - 270) < 1e-10)) throw new CalcError(`tan(${clean(x)}°) no está definida: cos = 0`);
      // valores exactos en cuadrantales
      if (fn === 'sin' && (n === 0 || n === 180)) return 0;
      if (fn === 'cos' && (n === 90 || n === 270)) return 0;
      if (fn === 'tan' && (n === 0 || n === 180)) return 0;
    }
    const r = toInternal(x);
    if (fn === 'sin') return Math.sin(r);
    if (fn === 'cos') return Math.cos(r);
    if (Math.abs(Math.cos(r)) < 1e-15) throw new CalcError('tan no está definida aquí: cos = 0');
    return Math.tan(r);
  }

  const v = expr();
  if (p < toks.length) {
    const t = toks[p];
    if (t.t === 'rp') throw new CalcError('Sobra un paréntesis de cierre');
    throw new CalcError('Expresión mal formada');
  }
  if (!Number.isFinite(v)) throw new CalcError('Resultado infinito o no definido');
  return clean(v);
}

/** Versión segura: devuelve null si la expresión no se puede evaluar. */
export function tryEvaluate(src: string, mode: AngleMode = 'DEG'): number | null {
  try {
    return evaluate(src, { mode });
  } catch {
    return null;
  }
}
