import { useEffect, useState } from 'react';

/** Ruta basada en hash (#m3, #lab…): funciona en GitHub Pages, como archivo local y embebida. */
export function useHashRoute(): [string, (r: string) => void] {
  const read = () => (window.location.hash.replace(/^#\/?/, '') || 'inicio').split(/[?&]/)[0];
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const on = () => { setRoute(read()); window.scrollTo({ top: 0 }); };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  const go = (r: string) => {
    if (r === route) return;
    window.location.hash = r;
  };
  return [route, go];
}

export function useMediaQuery(q: string): boolean {
  const [m, setM] = useState(() => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(q).matches : false));
  useEffect(() => {
    const mq = window.matchMedia(q);
    const on = () => setM(mq.matches);
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, [q]);
  return m;
}
