/**
 * Serves the exported web app from dist/ the way a real host would, for testing it locally:
 * applies the `/*` headers from public/_headers and falls back to index.html for unknown routes.
 *
 *   npm run build:web && npm run serve:web      (then open http://localhost:8090)
 *
 * Optional: PORT=8091 and DIST_DIR=<folder> to serve a different port or build.
 */
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const dist = process.env.DIST_DIR ?? join(root, 'dist');
const port = Number(process.env.PORT ?? 8090);

if (!existsSync(join(dist, 'index.html'))) {
  console.error(`${dist} has no index.html. Run \`npm run build:web\` first.`);
  process.exit(1);
}

/** Headers for the `/*` block of a Netlify/Cloudflare-style _headers file. */
function globalHeaders() {
  const lines = readFileSync(join(root, 'public', '_headers'), 'utf8').split(/\r?\n/);
  const headers = {};
  let inGlobal = false;
  for (const line of lines) {
    if (!line.trim()) continue;
    if (!line.startsWith(' ')) inGlobal = line.trim() === '/*';
    else if (inGlobal) {
      const [name, ...value] = line.trim().split(':');
      headers[name.trim()] = value.join(':').trim();
    }
  }
  return headers;
}

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
  '.ttf': 'font/ttf',
  '.ico': 'image/x-icon',
};

const headers = globalHeaders();

createServer((req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '');
  let file = join(dist, path);
  if (!file.startsWith(dist) || !existsSync(file) || statSync(file).isDirectory()) {
    file = join(dist, 'index.html'); // single-page app: unknown routes get the shell
  }
  const noCache = file.endsWith('index.html') || file.endsWith('sw.js');
  res.writeHead(200, {
    ...headers,
    'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream',
    'Cache-Control': noCache ? 'no-cache' : 'public, max-age=31536000, immutable',
  });
  createReadStream(file).pipe(res);
}).listen(port, () =>
  console.log(`Fair Paws web: http://localhost:${port}  (headers: ${Object.keys(headers).join(', ')})`),
);
