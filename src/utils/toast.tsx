import { useEffect, useState } from 'react';

type Toast = { id: number; text: string; tone: 'ok' | 'accent' | 'bad' };
let listeners: ((t: Toast) => void)[] = [];
let seq = 0;

export function toast(text: string, tone: Toast['tone'] = 'ok') {
  const t = { id: ++seq, text, tone };
  listeners.forEach((l) => l(t));
}

export function Toaster() {
  const [items, setItems] = useState<Toast[]>([]);
  useEffect(() => {
    const l = (t: Toast) => {
      setItems((xs) => [...xs, t]);
      window.setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== t.id)), 2600);
    };
    listeners.push(l);
    return () => { listeners = listeners.filter((x) => x !== l); };
  }, []);
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 z-[60] flex flex-col items-center gap-2 px-4" style={{ bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}>
      {items.map((t) => (
        <div key={t.id} className="fade-up rounded-lg border bg-panel px-3.5 py-2 text-[13.5px] shadow-lg" style={{ borderColor: `rgb(var(--${t.tone}) / 0.5)`, color: `rgb(var(--ink))` }}>
          <span style={{ color: `rgb(var(--${t.tone}))` }}>● </span>{t.text}
        </div>
      ))}
    </div>
  );
}
