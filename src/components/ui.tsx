import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { RichText } from './Tex';

export function Panel({ title, eyebrow, actions, children, className = '', pad = true }: { title?: ReactNode; eyebrow?: string; actions?: ReactNode; children: ReactNode; className?: string; pad?: boolean }) {
  return (
    <section className={`rounded-xl border border-line bg-panel min-w-0 ${className}`}>
      {(title || eyebrow || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2.5">
          <div className="min-w-0">
            {eyebrow && <div className="eyebrow">{eyebrow}</div>}
            {title && <h3 className="text-[15px] font-semibold leading-tight">{title}</h3>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-1.5">{actions}</div>}
        </header>
      )}
      <div className={pad ? 'p-4' : ''}>{children}</div>
    </section>
  );
}

type BtnVariant = 'primary' | 'ghost' | 'outline' | 'soft' | 'danger';
export function Button({ variant = 'outline', size = 'md', className = '', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: 'sm' | 'md' }) {
  const v: Record<BtnVariant, string> = {
    primary: 'bg-accent text-accentInk border-accent hover:brightness-110',
    outline: 'bg-panel text-ink border-line hover:border-accent hover:text-accent',
    ghost: 'bg-transparent text-muted border-transparent hover:text-ink hover:bg-panel2',
    soft: 'bg-panel2 text-ink border-transparent hover:bg-line/60',
    danger: 'bg-panel text-bad border-bad/50 hover:bg-bad hover:text-white',
  };
  const s = size === 'sm' ? 'h-8 px-2.5 text-[13px]' : 'h-10 px-3.5 text-sm';
  return (
    <button
      type="button"
      className={`inline-flex select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${v[variant]} ${s} ${className}`}
      {...rest}
    />
  );
}

/** Slider con etiqueta, valor numérico editable y color semántico. */
export function Slider({ id, label, value, min, max, step = 1, onChange, unit = '', color = 'accent', decimals = 1, disabled }: {
  id: string; label: ReactNode; value: number; min: number; max: number; step?: number; onChange: (v: number) => void;
  unit?: string; color?: 'accent' | 'opp' | 'adj' | 'hyp' | 'ang'; decimals?: number; disabled?: boolean;
}) {
  const [txt, setTxt] = useState(String(+value.toFixed(decimals)).replace('.', ','));
  useEffect(() => { setTxt(String(+value.toFixed(decimals)).replace('.', ',')); }, [value, decimals]);
  const commit = (s: string) => {
    const v = Number(s.replace(',', '.'));
    if (Number.isFinite(v)) onChange(Math.min(max, Math.max(min, v)));
    else setTxt(String(+value.toFixed(decimals)).replace('.', ','));
  };
  return (
    <div className="min-w-0">
      <div className="mb-0.5 flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-[13px] font-medium" style={{ color: `rgb(var(--${color === 'accent' ? 'ink' : color}))` }}>{label}</label>
        <span className="flex items-center gap-1">
          <input
            aria-label={typeof label === 'string' ? `${label} (valor)` : 'valor'}
            className="num h-7 w-[4.6rem] rounded-md border border-line bg-panel2 px-1.5 text-right text-[13px]"
            value={txt}
            inputMode="decimal"
            disabled={disabled}
            onChange={(e) => setTxt(e.target.value)}
            onBlur={(e) => commit(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') commit((e.target as HTMLInputElement).value); }}
          />
          {unit && <span className="num w-5 text-[12px] text-muted">{unit}</span>}
        </span>
      </div>
      <input id={id} type="range" className="slider" style={{ ['--c' as string]: `var(--${color})` }} min={min} max={max} step={step} value={value} disabled={disabled} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

export function Segmented<T extends string>({ value, options, onChange, size = 'md', ariaLabel }: { value: T; options: { value: T; label: ReactNode }[]; onChange: (v: T) => void; size?: 'sm' | 'md'; ariaLabel?: string }) {
  return (
    <div role="tablist" aria-label={ariaLabel} className="inline-flex max-w-full flex-wrap rounded-lg border border-line bg-panel2 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          type="button"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-md font-medium transition-colors ${size === 'sm' ? 'px-2 py-1 text-[12px]' : 'px-3 py-1.5 text-[13px]'} ${value === o.value ? 'bg-panel text-ink shadow-sm' : 'text-muted hover:text-ink'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Badge({ tone = 'muted', children, className = '' }: { tone?: 'muted' | 'accent' | 'ok' | 'warn' | 'bad' | 'opp' | 'adj' | 'hyp' | 'ang'; children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11.5px] font-medium ${className}`} style={{ color: `rgb(var(--${tone}))`, borderColor: `rgb(var(--${tone}) / 0.35)`, background: `rgb(var(--${tone}) / 0.08)` }}>
      {children}
    </span>
  );
}

/** Lectura numérica tipo instrumento. */
export function Readout({ label, value, tone = 'ink', sub }: { label: ReactNode; value: ReactNode; tone?: string; sub?: ReactNode }) {
  return (
    <div className="min-w-0 rounded-lg border border-line bg-panel2/60 px-3 py-2">
      <div className="eyebrow truncate">{label}</div>
      <div className="num truncate text-[19px] font-semibold leading-tight" style={{ color: `rgb(var(--${tone}))` }}>{value}</div>
      {sub && <div className="mt-0.5 truncate text-[12px] text-muted">{sub}</div>}
    </div>
  );
}

export function Callout({ tone = 'accent', title, children }: { tone?: 'accent' | 'ok' | 'warn' | 'bad' | 'muted'; title?: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-lg border px-3.5 py-2.5 text-[14px]" style={{ borderColor: `rgb(var(--${tone}) / 0.4)`, background: `rgb(var(--${tone}) / 0.07)` }}>
      {title && <div className="mb-0.5 font-semibold" style={{ color: `rgb(var(--${tone}))` }}>{title}</div>}
      <div className="text-ink">{children}</div>
    </div>
  );
}

export function RT({ children, className }: { children: string; className?: string }) {
  return <RichText text={children} className={className} />;
}

/** Revelado progresivo: muestra los pasos uno por uno. */
export function Reveal({ steps, startAt = 1, label = 'Siguiente paso' }: { steps: ReactNode[]; startAt?: number; label?: string }) {
  const [n, setN] = useState(startAt);
  return (
    <div className="space-y-2">
      <ol className="space-y-2">
        {steps.slice(0, n).map((s, i) => (
          <li key={i} className="fade-up flex gap-2.5">
            <span className="num mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-panel2 text-[11px] text-muted">{i + 1}</span>
            <div className="min-w-0 flex-1">{s}</div>
          </li>
        ))}
      </ol>
      <div className="flex gap-2">
        {n < steps.length && <Button size="sm" variant="soft" onClick={() => setN(n + 1)}>{label} →</Button>}
        {n < steps.length && <Button size="sm" variant="ghost" onClick={() => setN(steps.length)}>Ver todo</Button>}
        {n > startAt && <Button size="sm" variant="ghost" onClick={() => setN(startAt)}>Reiniciar</Button>}
      </div>
    </div>
  );
}

export function Toggle({ id, checked, onChange, label }: { id: string; checked: boolean; onChange: (v: boolean) => void; label: ReactNode }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer select-none items-center gap-2 text-[13px]">
      <span className="relative inline-flex h-5 w-9 shrink-0 items-center">
        <input id={id} type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="absolute inset-0 rounded-full bg-line transition-colors peer-checked:bg-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent" />
        <span className="absolute left-0.5 h-4 w-4 rounded-full bg-panel shadow transition-transform peer-checked:translate-x-4" />
      </span>
      <span>{label}</span>
    </label>
  );
}
