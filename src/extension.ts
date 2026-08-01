import * as crypto from 'node:crypto';
import * as path from 'node:path';
import * as vscode from 'vscode';
import { extractMermaidBlocks } from './lib/markdown';
import type { Theme, WebviewMessage } from './types';

const panels = new Map<string, vscode.WebviewPanel>();

function getNonce(): string {
  return crypto.randomBytes(16).toString('base64');
}

function getTheme(kind: vscode.ColorThemeKind): Theme {
  // HighContrast is the dark high-contrast theme; the light one is
  // HighContrastLight. There is no HighContrastDark member.
  const dark =
    kind === vscode.ColorThemeKind.Dark || kind === vscode.ColorThemeKind.HighContrast;
  return dark ? 'dark' : 'light';
}

function getWebviewContent(
  webview: vscode.Webview,
  nonce: string,
  scriptUri: vscode.Uri,
  styleUri: vscode.Uri,
  mermaidUri: vscode.Uri,
  theme: Theme
): string {
  // Scripts run by nonce only. Inline styles stay allowed because Mermaid sets
  // them on the SVG it generates.
  const csp = [
    "default-src 'none'",
    `script-src 'nonce-${nonce}'`,
    `style-src ${webview.cspSource} 'unsafe-inline'`,
    'img-src data: blob:',
    'font-src data:',
  ].join('; ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="${csp};">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="${styleUri.toString()}">
</head>
<body class="theme-${theme}">
  <div id="toolbar">
    <div id="nav">
      <button id="btn-prev" title="Previous diagram">&#8249;</button>
      <span id="counter">— / —</span>
      <button id="btn-next" title="Next diagram">&#8250;</button>
    </div>
    <div id="actions">
      <button id="btn-fit" title="Fit to screen">&#8861;</button>
      <button id="btn-export" title="Export SVG">&#8595; SVG</button>
    </div>
  </div>
  <div id="canvas">
    <div id="viewport">
      <div id="diagram"></div>
    </div>
  </div>
  <div id="empty">No Mermaid diagrams found in this file.</div>
  <script nonce="${nonce}" src="${mermaidUri.toString()}"></script>
  <script nonce="${nonce}" src="${scriptUri.toString()}"></script>
</body>
</html>`;
}

function openPreview(context: vscode.ExtensionContext): void {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const document = editor.document;
  const key = document.uri.toString();

  const existing = panels.get(key);
  if (existing) {
    existing.reveal();
    return;
  }

  const panel = vscode.window.createWebviewPanel(
    'mermaidPreview',
    `Mermaid: ${path.basename(document.fileName)}`,
    vscode.ViewColumn.Beside,
    {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'dist')],
      retainContextWhenHidden: true,
    }
  );

  panels.set(key, panel);

  const distUri = (...segments: string[]): vscode.Uri =>
    panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'dist', ...segments));

  panel.webview.html = getWebviewContent(
    panel.webview,
    getNonce(),
    distUri('webview', 'preview.js'),
    distUri('webview', 'styles.css'),
    distUri('vendor', 'mermaid.min.js'),
    getTheme(vscode.window.activeColorTheme.kind)
  );

  const sendBlocks = (source: vscode.TextDocument): void => {
    void panel.webview.postMessage({
      type: 'render',
      blocks: extractMermaidBlocks(source.getText()),
      theme: getTheme(vscode.window.activeColorTheme.kind),
    });
  };

  const subscriptions: vscode.Disposable[] = [
    panel.webview.onDidReceiveMessage((message: WebviewMessage) => {
      if (message.type === 'ready') sendBlocks(document);
    }),
    vscode.workspace.onDidSaveTextDocument((saved) => {
      if (saved.uri.toString() === key) sendBlocks(saved);
    }),
    vscode.window.onDidChangeActiveColorTheme(() => sendBlocks(document)),
  ];

  panel.onDidDispose(() => {
    panels.delete(key);
    subscriptions.forEach((subscription) => subscription.dispose());
  });
}

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('mermaid.preview', () => openPreview(context))
  );
}

export function deactivate(): void {
  panels.forEach((panel) => panel.dispose());
  panels.clear();
}
