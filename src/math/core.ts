// Núcleo numérico: conversiones, redondeo y formato (coma decimal, como se escribe en Chile).

export const DEG = Math.PI / 180;
export const toRad = (deg: number) => deg * DEG;
export const toDeg = (rad: number) => rad / DEG;

/** Redondea a `d` decimales evitando -0 y errores de representación tipo 0.30000000000000004. */
export function round(x: number, d = 2): number {
  const f = 10 ** d;
  const r = Math.round((x + Number.EPSILON * Math.sign(x)) * f) / f;
  return Object.is(r, -0) ? 0 : r;
}

/** Limpia ruido de coma flotante (15 cifras significativas): 0.49999999999999994 → 0.5. */
export function clean(x: number): number {
  if (!Number.isFinite(x)) return x;
  if (Math.abs(x) < 1e-12) return 0;
  return Number.parseFloat(x.toPrecision(15));
}

/** Número para mostrar en texto: coma decimal, sin ceros sobrantes. */
export function fmt(x: number, d = 2): string {
  if (!Number.isFinite(x)) return x > 0 ? '∞' : x < 0 ? '−∞' : '—';
  const s = round(x, d).toString();
  return s.replace('-', '−').replace('.', ',');
}

/** Número para insertar en TeX (coma decimal sin espacio extra). */
export function tex(x: number, d = 2): string {
  if (!Number.isFinite(x)) return x > 0 ? '\\infty' : '-\\infty';
  return round(x, d).toString().replace('.', '{,}');
}

/** TeX con paréntesis si es negativo: útil al sustituir en fórmulas. */
export function texP(x: number, d = 2): string {
  return x < 0 ? `(${tex(x, d)})` : tex(x, d);
}

export const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
export const approx = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) <= eps;

/** Normaliza un ángulo en grados a [0, 360). */
export function norm360(deg: number): number {
  const r = ((deg % 360) + 360) % 360;
  return approx(r, 360) ? 0 : r;
}
