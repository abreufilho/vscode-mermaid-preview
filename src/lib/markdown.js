// Fences must start at the beginning of a line: a ``` inside prose or inside an
// indented example is not a code block, and matching it would render text that
// the document never meant as a diagram.
const MERMAID_FENCE =
  /^(?<indent>[ \t]*)(?<fence>`{3,})mermaid[^\S\r\n]*\r?\n(?<code>[\s\S]*?)^\k<indent>\k<fence>`*[^\S\r\n]*$/gimu;

/**
 * Extracts every fenced `mermaid` block from a Markdown document.
 *
 * @param {string} text Markdown source.
 * @returns {{ id: number, code: string }[]} Blocks in document order.
 */
function extractMermaidBlocks(text) {
  if (typeof text !== 'string' || text === '') {
    return [];
  }

  const blocks = [];
  MERMAID_FENCE.lastIndex = 0;

  let match;
  while ((match = MERMAID_FENCE.exec(text)) !== null) {
    const code = match.groups.code.trim();
    if (code !== '') {
      blocks.push({ id: blocks.length, code });
    }
  }

  return blocks;
}

module.exports = { extractMermaidBlocks };
