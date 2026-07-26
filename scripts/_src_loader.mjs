// Node module hooks so guard scripts can IMPORT AND RUN real src/ modules, not just
// read them as text. Static guards can only assert that a line of code looks right;
// this lets a guard actually call the code and assert on what it does.
//
// Two translations are needed, both because src/ is written for Vite:
//   1. `@/x`            -> <repo>/src/x   (the alias defined in vite.config.js)
//   2. `import.meta.env` -> a plain object the guard controls
//
// No new dependency: this uses node:module's built-in customization hooks.
// Register it with:  node --import ./scripts/_src_loader.mjs scripts/my_check.mjs

import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

// The hooks below run in a separate loader thread, so this file registers itself
// and then the hook implementations are supplied via the data URL module.
if (!process.env.__SRC_LOADER_REGISTERED) {
  process.env.__SRC_LOADER_REGISTERED = '1';
  register(new URL('./_src_loader_hooks.mjs', import.meta.url), pathToFileURL('./'));
}
