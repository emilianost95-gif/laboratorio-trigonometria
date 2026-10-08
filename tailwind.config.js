/** @type {import('tailwindcss').Config} */
const v = (n) => `rgb(var(--${n}) / <alpha-value>)`;
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: v('bg'), panel: v('panel'), panel2: v('panel2'), line: v('line'),
        ink: v('ink'), muted: v('muted'), accent: v('accent'), accentInk: v('accent-ink'),
        opp: v('opp'), adj: v('adj'), hyp: v('hyp'), ang: v('ang'),
        ok: v('ok'), warn: v('warn'), bad: v('bad'),
      },
      fontFamily: {
        display: ['"Instrument Sans"', '"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        sans: ['"IBM Plex Sans"', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};
