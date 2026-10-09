import { useEffect, useState, type ReactNode } from 'react';
import { MODULES } from '../data/modules';
import { isUnlocked, levelInfo, useStore } from '../store/store';
import type { ThemePref } from '../services/storage';

const NAV_EXTRA = [
  { id: 'lab', label: 'Laboratorio libre', glyph: '⌬' },
  { id: 'desafios', label: 'Desafíos', glyph: '◆' },
  { id: 'cuaderno', label: 'Cuaderno', glyph: '✎' },
  { id: 'calculadora', label: 'Calculadora', glyph: '∑' },
  { id: 'progreso', label: 'Progreso', glyph: '▤' },
];

function ThemeSwitch() {
  const { state, setTheme } = useStore();
  const order: ThemePref[] = ['system', 'light', 'dark'];
  const label = { system: 'Tema: sistema', light: 'Tema: claro', dark: 'Tema: oscuro' }[state.settings.theme];
  const icon = {
    system: <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden><circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M8 1.8a6.2 6.2 0 0 1 0 12.4z" fill="currentColor" /></svg>,
    light: <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden><circle cx="8" cy="8" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.5" />{[0, 45, 90, 135, 180, 225, 270, 315].map((a) => <line key={a} x1={8 + 5 * Math.cos((a * Math.PI) / 180)} y1={8 + 5 * Math.sin((a * Math.PI) / 180)} x2={8 + 6.8 * Math.cos((a * Math.PI) / 180)} y2={8 + 6.8 * Math.sin((a * Math.PI) / 180)} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />)}</svg>,
    dark: <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden><path d="M13.5 10.2A6 6 0 0 1 5.8 2.5a6 6 0 1 0 7.7 7.7z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>,
  }[state.settings.theme];
  return (
    <button type="button" title={label} aria-label={label} className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-panel text-[15px] hover:border-accent"
      onClick={() => setTheme(order[(order.indexOf(state.settings.theme) + 1) % 3])}>
      {icon}
    </button>
  );
}

function NavItem({ id, label, glyph, active, go, status }: { id: string; label: string; glyph: string; active: boolean; go: (r: string) => void; status?: 'done' | 'locked' | 'open' | 'visited' }) {
  return (
    <a
      href={`#${id}`}
      onClick={(e) => { e.preventDefault(); go(id); }}
      aria-current={active ? 'page' : undefined}
      className={`group flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13.5px] transition-colors ${active ? 'bg-accent/10 text-ink' : 'text-muted hover:bg-panel2 hover:text-ink'}`}
    >
      <span className={`num flex h-7 w-9 shrink-0 items-center justify-center rounded-md border text-[11px] font-semibold ${active ? 'border-accent text-accent' : status === 'done' ? 'border-ok/50 text-ok' : 'border-line'}`}>
        {glyph}
      </span>
      <span className={`min-w-0 flex-1 truncate ${active ? 'font-semibold' : ''}`}>{label}</span>
      {status === 'done' && <span className="text-[12px] text-ok" aria-label="completado">✓</span>}
      {status === 'locked' && <span className="text-[11px] opacity-60" aria-label="bloqueado">🔒</span>}
    </a>
  );
}

export function Layout({ route, go, children }: { route: string; go: (r: string) => void; children: ReactNode }) {
  const { state, dispatch } = useStore();
  const [open, setOpen] = useState(false);
  const lv = levelInfo(state.stats.xp);
  const done = MODULES.filter((m) => state.modules[m.id]?.completed).length;
  useEffect(() => setOpen(false), [route]);

  const nav = (
    <nav aria-label="Módulos" className="flex flex-col gap-0.5">
      <NavItem id="inicio" label="Inicio" glyph="⌂" active={route === 'inicio'} go={go} />
      <div className="eyebrow mb-1 mt-3 px-2">El camino</div>
      <div className="relative">
        <span className="absolute bottom-3 left-[26px] top-3 w-px bg-line" aria-hidden />
        <div className="relative flex flex-col gap-0.5">
          {MODULES.map((m) => {
            const p = state.modules[m.id];
            const status = p?.completed ? 'done' : isUnlocked(state, m.id) ? (p?.visited ? 'visited' : 'open') : 'locked';
            return <NavItem key={m.id} id={m.id} label={`${m.n}. ${m.title}`} glyph={m.glyph} active={route === m.id} go={go} status={status} />;
          })}
        </div>
      </div>
      <div className="eyebrow mb-1 mt-3 px-2">Herramientas</div>
      {NAV_EXTRA.map((n) => <NavItem key={n.id} id={n.id} label={n.label} glyph={n.glyph} active={route === n.id} go={go} />)}
    </nav>
  );

  return (
    <div className="min-h-full">
      {/* Barra superior */}
      <header className="sticky z-40 border-b border-line bg-panel/90 backdrop-blur" style={{ top: 'env(safe-area-inset-top, 0px)' }}>
        <div className="mx-auto flex h-14 max-w-[1500px] items-center gap-3 px-4">
          <button type="button" className="flex h-9 w-9 items-center justify-center rounded-lg border border-line lg:hidden" aria-label="Abrir menú" aria-expanded={open} onClick={() => setOpen(!open)}>
            <span className="text-[18px] leading-none">≡</span>
          </button>
          <a href="#inicio" onClick={(e) => { e.preventDefault(); go('inicio'); }} className="flex min-w-0 items-center gap-2.5">
            <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden className="shrink-0">
              <rect x="0.5" y="0.5" width="29" height="29" rx="7" fill="rgb(var(--panel2))" stroke="rgb(var(--line))" />
              <polygon points="6,23 24,23 24,8" fill="rgb(var(--accent) / 0.15)" stroke="rgb(var(--accent))" strokeWidth="1.8" strokeLinejoin="round" />
              <path d="M 11.5 23 A 5.5 5.5 0 0 0 11 20.4" fill="none" stroke="rgb(var(--ang))" strokeWidth="1.8" />
              <rect x="20.5" y="19.5" width="3.5" height="3.5" fill="none" stroke="rgb(var(--muted))" strokeWidth="1" />
            </svg>
            <div className="min-w-0 leading-tight">
              <div className="truncate font-display text-[15px] font-semibold">Laboratorio de Matemáticas</div>
              <div className="eyebrow hidden truncate sm:block">Camino a la trigonometría</div>
            </div>
          </a>
          <div className="ml-auto flex items-center gap-2">
            <button type="button" title="Cambiar unidad angular por defecto" onClick={() => dispatch({ type: 'settings', patch: { angleMode: state.settings.angleMode === 'DEG' ? 'RAD' : 'DEG' } })}
              className="num hidden h-9 rounded-lg border border-line bg-panel px-2.5 text-[12px] font-semibold hover:border-accent sm:block">
              {state.settings.angleMode}
            </button>
            <a href="#progreso" onClick={(e) => { e.preventDefault(); go('progreso'); }} className="hidden items-center gap-2 rounded-lg border border-line bg-panel px-2.5 py-1 md:flex" title="Tu nivel">
              <span className="num text-[12px] text-muted">Nv {lv.index}</span>
              <span className="text-[13px] font-medium">{lv.name}</span>
              <span className="num text-[12px] text-muted">· {done}/{MODULES.length}</span>
              {state.streak.current > 0 && <span className="num text-[12px] text-ang" title="Racha de días">▲{state.streak.current}</span>}
            </a>
            <button type="button" aria-label="Abrir calculadora" title="Calculadora" onClick={() => window.dispatchEvent(new CustomEvent('labtrig:calc'))}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-panel font-semibold hover:border-accent">∑</button>
            <ThemeSwitch />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1500px]">
        {/* Barra lateral de escritorio */}
        <aside className="sticky hidden h-[calc(100vh-3.5rem)] w-[262px] shrink-0 overflow-y-auto border-r border-line px-3 py-4 scroll-thin lg:block" style={{ top: '3.5rem' }}>
          {nav}
        </aside>
        {/* Cajón móvil */}
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menú">
            <button type="button" aria-label="Cerrar menú" className="overlay-in absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
            <div className="drawer-panel absolute bottom-0 left-0 top-0 w-[290px] max-w-[85vw] overflow-y-auto border-r border-line bg-panel px-3 py-4" style={{ paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))' }}>
              <div className="mb-3 flex items-center justify-between px-2">
                <span className="font-display font-semibold">Navegación</span>
                <button type="button" className="h-8 w-8 rounded-md border border-line" aria-label="Cerrar" onClick={() => setOpen(false)}>✕</button>
              </div>
              {nav}
            </div>
          </div>
        )}
        <main className="min-w-0 flex-1 px-4 pb-16 pt-5 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
