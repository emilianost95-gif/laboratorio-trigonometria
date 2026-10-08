import { tryEvaluate } from '../math/calculator';
import type { CheckResult, Problem } from './types';

/** Tolerancia: acepta redondeo a 2 decimales (±0,011) o un 0,6 % relativo. */
export function within(value: number, target: number, tol?: number): boolean {
  const t = tol ?? Math.max(0.011, Math.abs(target) * 0.006);
  return Math.abs(value - target) <= t;
}

/**
 * Corrige una respuesta numérica o de opción múltiple.
 * Si es incorrecta, intenta explicar el error: primero con los errores
 * "esperables" del ejercicio, luego con detectores genéricos.
 */
export function checkAnswer(p: Problem, raw: string | number): CheckResult {
  if (p.kind === 'choice') {
    const idx = typeof raw === 'number' ? raw : Number(raw);
    const correct = idx === p.answer;
    const explain = p.choiceExplain?.[idx];
    return { correct, parsed: idx, diagnosis: !correct && explain ? { label: 'Revisemos esa opción', explain } : undefined };
  }
  const txt = String(raw).trim();
  if (!txt) return { correct: false, parsed: null, parseError: 'Escribe una respuesta.' };
  const v = tryEvaluate(txt.replace(/[a-zA-Z²³°%]+$/u, (m) => (/^(pi|π)$/i.test(m) ? m : '')), 'DEG');
  if (v === null) return { correct: false, parsed: null, parseError: 'No pude leer ese número. Usa dígitos, coma o punto decimal, fracciones (3/4) o raíces (√2).' };
  if (within(v, p.answer, p.tolerance)) return { correct: true, parsed: v };

  for (const m of p.mistakes ?? []) {
    if (within(v, m.value, p.tolerance)) return { correct: false, parsed: v, diagnosis: { label: m.label, explain: m.explain } };
  }
  return { correct: false, parsed: v, diagnosis: genericDiagnosis(v, p.answer) };
}

function genericDiagnosis(v: number, ans: number): CheckResult['diagnosis'] {
  if (ans !== 0 && within(-v, ans)) return { label: 'Error de signo', explain: 'El número es correcto pero el **signo** no. Revisa las restas con negativos y el cuadrante.' };
  if (within(v * Math.PI / 180, ans) || within(v * 180 / Math.PI, ans)) return { label: 'Grados ↔ radianes', explain: 'Tu resultado corresponde al correcto en la **otra unidad** de ángulo. Revisa el modo DEG/RAD.' };
  if (ans !== 0 && Math.abs(v - ans) / Math.abs(ans) < 0.05) return { label: 'Muy cerca', explain: 'Estás muy cerca: probablemente redondeaste demasiado pronto. Mantén 4 decimales en los pasos intermedios y redondea solo al final.' };
  for (const k of [10, 100, 0.1, 0.01]) if (within(v, ans * k)) return { label: 'Coma decimal', explain: 'Tu resultado es el correcto desplazado por un factor de 10: revisa la posición de la coma o las unidades.' };
  if (ans !== 0 && within(v * v, ans)) return { label: '¿Raíz de más?', explain: 'Tu resultado al cuadrado da la respuesta: quizás sacaste una raíz que no correspondía.' };
  if (ans > 0 && within(Math.sqrt(Math.abs(v)), ans)) return { label: 'Faltó la raíz', explain: 'La raíz cuadrada de tu resultado es la respuesta correcta: te faltó ese último paso.' };
  return undefined;
}
