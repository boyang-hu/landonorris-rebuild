#!/usr/bin/env node
/**
 * Zero-dependency local server for the legacy mirror (and later the rebuild).
 *
 *   node scripts/serve.mjs [--port 5177] [--root legacy-mirror]
 *
 * Serves legacy-mirror/ at the site root exactly like the origin:
 *   /            -> index.html
 *   /calendar    -> calendar/index.html
 *
 * External-host assets were mirrored under legacy-mirror/assets/<host>/<path>.
 * Instead of touching the mirrored files on disk, text responses are rewritten
 * on the fly so absolute URLs point at /ext/<host>/<path>, which this server
 * resolves back into the local mirror (same trick as samsyninja-rebuild).
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, normalize, extname } from 'node:path';

const args = process.argv.slice(2);
const flag = (name, dflt) => {
  const i = args.indexOf('--' + name);
  return i >= 0 ? args[i + 1] : dflt;
};
const PORT = Number(flag('port', 5177));
const ROOT = new URL('../' + flag('root', 'legacy-mirror') + '/', import.meta.url).pathname;

const EXT_HOSTS = [
  'cdn.prod.website-files.com',
  'lando.itsoffbrand.io',
  'assets.itsoffbrand.io',
  'd3e54v103j8qbb.cloudfront.net',
  'static.klaviyo.com',
  'cs.iubenda.com',
  'cdn.iubenda.com',
  'unpkg.com',
];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.wasm': 'application/wasm',
  '.riv': 'application/octet-stream',
  '.glb': 'model/gltf-binary',
  '.hdr': 'application/octet-stream',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
};

const TEXT_REWRITE = new Set(['.html', '.css', '.js', '.mjs', '.json', '.svg']);

function rewrite(text, ext) {
  for (const h of EXT_HOSTS) {
    text = text.replaceAll(`https://${h}/`, `/ext/${h}/`).replaceAll(`http://${h}/`, `/ext/${h}/`);
    // Protocol-relative form only in markup/styles: inside JS it is often
    // concatenated with a "https:" prefix and rewriting would corrupt it.
    if (ext === '.html' || ext === '.css') text = text.replaceAll(`//${h}/`, `/ext/${h}/`);
  }
  return text;
}

async function tryFile(p) {
  try {
    const s = await stat(p);
    if (s.isFile()) return p;
    if (s.isDirectory()) {
      const idx = join(p, 'index.html');
      const s2 = await stat(idx).catch(() => null);
      if (s2?.isFile()) return idx;
    }
  } catch {}
  return null;
}

createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    path = normalize(path).replace(/^(\.\.[/\\])+/, '');

    // Webflow GA reverse-proxy blobs: not mirrored, keep console quiet.
    if (/^\/(nvhc|avljl)/.test(path)) {
      res.writeHead(200, { 'content-type': 'text/javascript' });
      return res.end('/* ga proxy stub */');
    }

    let file;
    if (path.startsWith('/images/site/')) path = '/ext/cdn.iubenda.com' + path;
    if (path.startsWith('/ext/')) {
      file = await tryFile(join(ROOT, 'assets', path.slice('/ext/'.length)));
    } else {
      file = await tryFile(join(ROOT, path));
      if (!file && !extname(path)) file = await tryFile(join(ROOT, path, 'index.html'));
    }
    if (!file) {
      const notFound = await tryFile(join(ROOT, '404.html'));
      if (notFound && !path.startsWith('/ext/')) {
        const buf = await readFile(notFound);
        res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
        return res.end(rewrite(buf.toString('utf8'), '.html'));
      }
      res.writeHead(404, { 'content-type': 'text/plain' });
      return res.end('404 ' + path);
    }

    const ext = extname(file).toLowerCase();
    const type = MIME[ext] || 'application/octet-stream';
    let buf = await readFile(file);
    if (TEXT_REWRITE.has(ext)) buf = Buffer.from(rewrite(buf.toString('utf8'), ext));
    res.writeHead(200, {
      'content-type': type,
      'cache-control': 'no-store',
      'access-control-allow-origin': '*',
    });
    res.end(buf);
  } catch (e) {
    res.writeHead(500, { 'content-type': 'text/plain' });
    res.end(String(e));
  }
}).listen(PORT, () => console.log(`mirror served at http://localhost:${PORT}/ (root: ${ROOT})`));
