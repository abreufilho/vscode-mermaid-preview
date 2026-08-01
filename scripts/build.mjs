// Assembles what ships in the VSIX:
//   extension.js      bundled host code, with dependency licences appended
//   dist/webview/     preview script and stylesheet, loaded by the webview
//   dist/vendor/      Mermaid, bundled so previews never reach a CDN
import { cp, mkdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');

const MERMAID_BUNDLE = resolve(root, 'node_modules/mermaid/dist/mermaid.min.js');

await rm(dist, { recursive: true, force: true });
await rm(resolve(root, 'extension.js'), { force: true });

await build({
  entryPoints: [resolve(root, 'src/extension.js')],
  outfile: resolve(root, 'extension.js'),
  bundle: true,
  platform: 'node',
  target: 'node18',
  external: ['vscode'],
  // Attribution for everything pulled into the bundle, generated rather than
  // maintained by hand.
  legalComments: 'eof',
});

await mkdir(resolve(dist, 'webview'), { recursive: true });
await cp(resolve(root, 'src/webview'), resolve(dist, 'webview'), { recursive: true });

await mkdir(resolve(dist, 'vendor'), { recursive: true });
await cp(MERMAID_BUNDLE, resolve(dist, 'vendor/mermaid.min.js'));

console.log('build: extension.js, dist/webview, dist/vendor');
