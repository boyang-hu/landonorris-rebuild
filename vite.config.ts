import { defineConfig, type Plugin } from 'vite';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join, extname, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const MIRROR_ASSETS = join(ROOT, 'legacy-mirror', 'assets');

const MIME: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.wasm': 'application/wasm',
  '.riv': 'application/octet-stream',
  '.glb': 'model/gltf-binary',
  '.hdr': 'application/octet-stream',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

/** Serve mirrored external-host assets at /ext/<host>/<path> in dev (deviation 6.2/6.4:
 *  heavy assets stay in legacy-mirror, never copied into the source tree). */
function extAssets(): Plugin {
  return {
    name: 'ext-assets',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = decodeURIComponent((req.url ?? '').split('?')[0]);
        if (!url.startsWith('/ext/')) return next();
        const file = join(MIRROR_ASSETS, url.slice('/ext/'.length));
        if (!existsSync(file)) return next();
        res.setHeader('content-type', MIME[extname(file).toLowerCase()] ?? 'application/octet-stream');
        res.setHeader('access-control-allow-origin', '*');
        res.end(await readFile(file));
      });
    },
  };
}

/** Map clean URLs onto the generated shells/ tree (dev only; build inputs are explicit). */
function shellRouter(): Plugin {
  const routes: Record<string, string> = {
    '/': '/shells/index.html',
    '/calendar': '/shells/calendar/index.html',
    '/on-track': '/shells/on-track/index.html',
    '/off-track': '/shells/off-track/index.html',
    '/partnerships': '/shells/partnerships/index.html',
    '/legal/privacy-policy': '/shells/legal/privacy-policy/index.html',
    '/legal/terms-conditions': '/shells/legal/terms-conditions/index.html',
    '/404': '/shells/404.html',
  };
  return {
    name: 'shell-router',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const url = (req.url ?? '').split('?')[0].replace(/\/$/, '') || '/';
        if (routes[url]) req.url = routes[url];
        next();
      });
    },
  };
}

export default defineConfig({
  appType: 'mpa',
  plugins: [extAssets(), shellRouter()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        home: resolve(ROOT, 'shells/index.html'),
        calendar: resolve(ROOT, 'shells/calendar/index.html'),
        onTrack: resolve(ROOT, 'shells/on-track/index.html'),
        offTrack: resolve(ROOT, 'shells/off-track/index.html'),
        partnerships: resolve(ROOT, 'shells/partnerships/index.html'),
        privacy: resolve(ROOT, 'shells/legal/privacy-policy/index.html'),
        terms: resolve(ROOT, 'shells/legal/terms-conditions/index.html'),
        notFound: resolve(ROOT, 'shells/404.html'),
      },
    },
  },
});
