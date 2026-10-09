/** true si el sistema pide reducir animaciones: las animaciones largas saltan a su estado final. */
export const prefersReducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
