import { prefersReducedMotion } from './motion';

const TONES = ['accent', 'opp', 'adj', 'hyp', 'ang', 'ok'];

/**
 * Confeti en un <canvas> a pantalla completa (no toca el DOM de React ni bloquea clics).
 * Se usa solo en momentos raros (completar un módulo), así que puede permitirse ser vistoso.
 */
export function celebrate() {
  if (typeof document === 'undefined' || prefersReducedMotion()) return;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = window.innerWidth, H = window.innerHeight;
  canvas.width = W * dpr; canvas.height = H * dpr;
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:70';
  document.body.appendChild(canvas);
  ctx.scale(dpr, dpr);

  const css = getComputedStyle(document.documentElement);
  const colors = TONES.map((t) => `rgb(${css.getPropertyValue(`--${t}`).trim().split(/\s+/).join(',')})`);
  const N = 160;
  const parts = Array.from({ length: N }, (_, i) => {
    const left = i % 2 === 0; // dos cañones, desde las esquinas inferiores hacia el centro
    const angle = (left ? -60 : -120) * (Math.PI / 180) + (Math.random() - 0.5) * 0.9;
    const speed = 9 + Math.random() * 11;
    return {
      x: left ? 0 : W, y: H * 0.92,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      w: 5 + Math.random() * 6, h: 3 + Math.random() * 4,
      rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.4,
      color: colors[i % colors.length], tri: i % 5 === 0,
    };
  });

  const DURATION = 2200;
  const start = performance.now();
  let last = start;
  const frame = (now: number) => {
    const k = Math.min(3, (now - last) / 16.67); // independiente de los Hz del monitor
    last = now;
    const life = (now - start) / DURATION;
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = Math.max(0, 1 - Math.max(0, life - 0.6) / 0.4);
    for (const p of parts) {
      p.vy += 0.32 * k; p.vx *= 0.992 ** k; p.vy *= 0.992 ** k;
      p.x += p.vx * k; p.y += p.vy * k; p.rot += p.vr * k;
      ctx.save();
      ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.tri) { ctx.beginPath(); ctx.moveTo(-p.w / 2, p.w / 2); ctx.lineTo(p.w / 2, p.w / 2); ctx.lineTo(p.w / 2, -p.w / 2); ctx.closePath(); ctx.fill(); }
      else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (life < 1) requestAnimationFrame(frame);
    else canvas.remove();
  };
  requestAnimationFrame(frame);
}
