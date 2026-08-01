/** A fenced `mermaid` block, in document order. */
export interface MermaidBlock {
  id: number;
  code: string;
}

export type Theme = 'dark' | 'light';

/** Host to webview: the diagrams to draw and the theme to draw them in. */
export interface RenderMessage {
  type: 'render';
  blocks: MermaidBlock[];
  theme: Theme;
}

/** Webview to host: the page is listening. */
export interface ReadyMessage {
  type: 'ready';
}

export type HostMessage = RenderMessage;
export type WebviewMessage = ReadyMessage;
