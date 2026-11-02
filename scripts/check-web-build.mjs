/**
 * Sanity-checks dist/ after `expo export` so a broken upload can't happen quietly.
 * Run automatically by `npm run build:web`.
 */
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = process.env.DIST_DIR ?? join(fileURLToPath(new URL('.', import.meta.url)), '..', 'dist');

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? [full, ...walk(full)] : [full];
  });
}

const entries = walk(dist);
const problems = [];

for (const path of entries) {
  // Netlify's drag-and-drop (and git) skip folders named node_modules, which silently
  // drops the SQLite wasm and the fonts from a deployed site.
  if (statSync(path).isDirectory() && path.split(/[\\/]/).pop() === 'node_modules') {
    problems.push(`folder named node_modules: ${relative(dist, path)}`);
  }
}
for (const required of ['index.html', 'manifest.webmanifest', 'sw.js', '_headers', '_redirects']) {
  if (!existsSync(join(dist, required))) problems.push(`missing ${required}`);
}
if (!entries.some((p) => p.endsWith('.wasm'))) problems.push('no .wasm file (the SQLite engine)');
if (!entries.some((p) => p.endsWith('.ttf'))) problems.push('no .ttf font files');

if (problems.length > 0) {
  console.error('Web build check failed:\n  - ' + problems.join('\n  - '));
  process.exit(1);
}
console.log(`Web build check passed (${entries.filter((p) => statSync(p).isFile()).length} files).`);
