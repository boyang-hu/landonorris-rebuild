// src/vite.config.ts — the readable source's build. Root is this directory: pages are the
// strategy-A shells under site/ (generated from the mirror by scripts/skill/build-site.mjs
// with scripts/shell-config.src.mjs and committed, so a copy of src/ builds without the
// mirror), the entry is /app/main.ts, and every mirrored asset lives under public/ext/<host>/
// (restored by `npm run assets:restore`, ledger in ASSETS.md) so the build is self-contained.
import { defineConfig, type Plugin } from 'vite';
import { extname, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));

const PAGES: Record<string, string> = {
  '/': 'site/index.html',
  '/calendar': 'site/calendar/index.html',
  '/on-track': 'site/on-track/index.html',
  '/off-track': 'site/off-track/index.html',
  '/partnerships': 'site/partnerships/index.html',
  '/legal/privacy-policy': 'site/legal/privacy-policy/index.html',
  '/legal/terms-conditions': 'site/legal/terms-conditions/index.html',
  '/404': 'site/404.html',
};

/** Dev only: clean URLs -> shells; unknown clean URLs -> the origin's 404 template (Webflow semantics). */
function shellRouter(): Plugin {
  return {
    name: 'shell-router',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const url = (req.url ?? '').split('?')[0].replace(/\/$/, '') || '/';
        if (PAGES[url]) req.url = '/' + PAGES[url];
        else if (!extname(url) && !/^\/(site|ext|images|@|app|node_modules)/.test(url)) req.url = '/site/404.html';
        next();
      });
    },
  };
}

export default defineConfig({
  root: ROOT,
  appType: 'mpa',
  publicDir: resolve(ROOT, 'public'),
  plugins: [shellRouter()],
  server: { port: 5180, strictPort: true },
  build: {
    outDir: resolve(ROOT, 'dist'),
    emptyOutDir: true,
    rollupOptions: { input: Object.fromEntries(Object.entries(PAGES).map(([route, rel]) => [route === '/' ? 'home' : route.slice(1).replace(/\//g, '-'), resolve(ROOT, rel)])) },
  },
});
