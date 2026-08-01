# Security Policy

## Supported Versions

The latest release receives fixes. Older versions do not.

## Reporting a Vulnerability

Report privately through
[GitHub Security Advisories](https://github.com/abreufilho/vscode-mermaid-preview/security/advisories/new).
Please do not open a public issue for a vulnerability.

This is a personal project maintained on a best-effort basis. There is no
response time commitment. If a report needs a fix that I cannot make, I will say
so rather than leave it open.

## Scope

The extension renders diagrams from Markdown files the user opens. That content
is untrusted, so the preview:

- runs Mermaid with `securityLevel: 'strict'`, which keeps its HTML sanitiser on;
- serves the webview under a Content Security Policy where scripts run by nonce
  only and no origin is reachable;
- writes render errors as text, since the message quotes the diagram source;
- bundles Mermaid instead of loading it from a CDN, so a preview makes no
  network request.

A report showing that a Markdown file can escape any of these is in scope.
