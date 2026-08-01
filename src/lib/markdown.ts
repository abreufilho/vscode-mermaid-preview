import type { MermaidBlock } from '../types';

// Fences must start at the beginning of a line: a ``` inside prose or inside an
// indented example is not a code block, and matching it would render text that
// the document never meant as a diagram.
const MERMAID_FENCE =
  /^(?<indent>[ \t]*)(?<fence>`{3,})mermaid[^\S\r\n]*\r?\n(?<code>[\s\S]*?)^\k<indent>\k<fence>`*[^\S\r\n]*$/gimu;

/** Extracts every fenced `mermaid` block from a Markdown document. */
export function extractMermaidBlocks(text: unknown): MermaidBlock[] {
  if (typeof text !== 'string' || text === '') {
    return [];
  }

  const blocks: MermaidBlock[] = [];
  MERMAID_FENCE.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = MERMAID_FENCE.exec(text)) !== null) {
    const code = match.groups?.code?.trim() ?? '';
    if (code !== '') {
      blocks.push({ id: blocks.length, code });
    }
  }

  return blocks;
}
