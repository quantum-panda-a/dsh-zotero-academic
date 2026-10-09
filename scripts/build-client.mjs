/**
 * Build browser client bundle for DeepSeek Harness Web UI using esbuild.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const PLUGIN_ID = 'dsh-zotero-academic';

const EXTERNALS = [
  'react',
  'react/jsx-runtime',
  'react-dom',
  '@deepseek-ai/dsh-client-store',
  '@deepseek-ai/dsh-client-ui-primitives',
];

async function build() {
  console.log(`[esbuild] Building client bundle for ${PLUGIN_ID}...`);
  try {
    await esbuild.build({
      entryPoints: [path.join(root, 'src/client/index.ts')],
      outfile: path.join(root, 'dist/client.js'),
      bundle: true,
      format: 'cjs',
      platform: 'browser',
      target: 'es2022',
      jsx: 'automatic',
      sourcemap: true,
      external: EXTERNALS,
      banner: {
        js: `window.__ModuleLoader__.load({ id: ${JSON.stringify(PLUGIN_ID)}, factory: (require) => { var module = { exports: {} }; var exports = module.exports;`,
      },
      footer: {
        js: 'return module.exports; } });',
      },
    });
    console.log(`[esbuild] Client bundle successfully emitted to dist/client.js`);
  } catch (err) {
    console.error(`[esbuild] Client build failed:`, err);
    process.exit(1);
  }
}

build();
