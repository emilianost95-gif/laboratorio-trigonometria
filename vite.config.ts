import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Política de contenido solo en el build: en desarrollo Vite necesita su websocket y scripts en línea propios.
// La app no hace peticiones de red; lo único externo son las tipografías de Google Fonts.
const CSP = [
  "default-src 'none'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data:",
  "connect-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ');
const csp = () => ({
  name: 'labtrig-csp',
  apply: 'build' as const,
  transformIndexHtml: (html: string) => html.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`),
});

// `--mode single` genera un único index.html autocontenido (para publicar como artifact / abrir sin servidor).
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [react(), csp(), ...(mode === 'single' ? [viteSingleFile()] : [])],
  build: {
    outDir: mode === 'single' ? 'dist-single' : 'dist',
    assetsInlineLimit: mode === 'single' ? 100_000_000 : 4096,
    chunkSizeWarningLimit: 1500,
  },
  test: { globals: true, environment: 'node', include: ['tests/**/*.test.ts'] },
}));
