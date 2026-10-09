import katex from 'katex';
import { Fragment, memo, useMemo, type ReactNode } from 'react';

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** Fórmula renderizada con KaTeX (sin dangerouslySetInnerHTML con texto del usuario sin escapar: KaTeX escapa). */
export const Tex = memo(function Tex({ children, display = false, className = '' }: { children: string; display?: boolean; className?: string }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(children, { displayMode: display, throwOnError: false, strict: 'ignore', output: 'html', trust: false, maxExpand: 200, maxSize: 20 });
    } catch {
      return escapeHtml(children);
    }
  }, [children, display]);
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
});

function renderInline(text: string, keyBase: string): ReactNode[] {
  // **negrita**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith('**') && p.endsWith('**') ? <strong key={`${keyBase}-${i}`} className="font-semibold">{p.slice(2, -2)}</strong> : <Fragment key={`${keyBase}-${i}`}>{p}</Fragment>,
  );
}

/** Texto con $TeX$ en línea, $$TeX$$ en bloque y **negritas**. */
export const RichText = memo(function RichText({ text, className = '' }: { text: string; className?: string }) {
  const nodes = useMemo(() => {
    const out: ReactNode[] = [];
    const re = /\$\$([^$]+)\$\$|\$([^$]+)\$/g;
    let last = 0;
    let m: RegExpExecArray | null;
    let k = 0;
    while ((m = re.exec(text))) {
      if (m.index > last) out.push(...renderInline(text.slice(last, m.index), `t${k++}`));
      if (m[1] !== undefined) out.push(<span key={`d${k++}`} className="block"><Tex display>{m[1]}</Tex></span>);
      else out.push(<Tex key={`i${k++}`}>{m[2]}</Tex>);
      last = re.lastIndex;
    }
    if (last < text.length) out.push(...renderInline(text.slice(last), `t${k++}`));
    return out;
  }, [text]);
  return <span className={className}>{nodes}</span>;
});
