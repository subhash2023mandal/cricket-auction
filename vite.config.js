import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The site is hosted on GitHub Pages at
// https://subhash2023mandal.github.io/cricket-auction/, so all built assets
// need to be served from that subpath. In dev (`npm run dev`) the base is '/'.
const isProd = process.env.NODE_ENV === 'production';

export default defineConfig({
  plugins: [react()],
  base: isProd ? '/cricket-auction/' : '/',
  server: {
    port: 5173,
    open: false,
  },
});
