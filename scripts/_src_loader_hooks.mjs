// Loader hooks for _src_loader.mjs — see that file for why these exist.
//
// resolve: rewrites Vite's `@/…` alias to a real path under src/, trying the common
//          extensions the way Vite's resolver does.
// load:    rewrites `import.meta.env` (Vite-only) to `globalThis.__VITE_ENV__`, an
//          object the guard sets up. Leaving it alone would throw at module load,
//          since `import.meta.env` is undefined in Node.

import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const EXTENSIONS = ['', '.js', '.jsx', '.mjs', '.json', '/index.js', '/index.jsx'];

export function resolve(specifier, context, nextResolve) {
  // Opt-in only (SS_SUPABASE_STUB=1), set by guards that need to inspect the exact
  // row the data layer would write. Never active in a normal run.
  if (specifier === '@supabase/supabase-js' && process.env.SS_SUPABASE_STUB === '1') {
    return {
      url: pathToFileURL(path.join(ROOT, 'scripts', '_supabase_stub.mjs')).href,
      shortCircuit: true,
    };
  }
  if (specifier.startsWith('@/')) {
    const base = path.join(SRC, specifier.slice(2));
    for (const ext of EXTENSIONS) {
      const candidate = base + ext;
      if (existsSync(candidate)) {
        return { url: pathToFileURL(candidate).href, shortCircuit: true };
      }
    }
    throw new Error(`[_src_loader] could not resolve "${specifier}" under src/`);
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url.startsWith('file://') && fileURLToPath(url).startsWith(SRC)) {
    const filePath = fileURLToPath(url);
    if (/\.(js|jsx|mjs)$/.test(filePath)) {
      const source = await readFile(filePath, 'utf8');
      return {
        format: 'module',
        shortCircuit: true,
        // `globalThis.__VITE_ENV__ ?? {}` so a module that reads env at import time
        // sees an empty object rather than throwing, exactly like an unconfigured build.
        source: source.replaceAll('import.meta.env', '(globalThis.__VITE_ENV__ ?? {})'),
      };
    }
  }
  return nextLoad(url, context);
}
