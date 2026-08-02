import assert from 'node:assert/strict';
import test from 'node:test';
import { extractMermaidBlocks } from '../src/lib/markdown';

void test('extracts multiple Mermaid fences with stable ids', () => {
  const blocks = extractMermaidBlocks(
    '```mermaid\ngraph TD\n  A --> B\n```\n\n```MERMAID\r\nsequenceDiagram\r\n  A->>B: Hi\r\n```'
  );

  assert.deepEqual(blocks, [
    { id: 0, code: 'graph TD\n  A --> B' },
    { id: 1, code: 'sequenceDiagram\r\n  A->>B: Hi' },
  ]);
});

void test('ignores non-Mermaid code fences', () => {
  assert.deepEqual(extractMermaidBlocks('```js\nconsole.log(1)\n```'), []);
});

void test('ignores a fence that does not start its own line', () => {
  assert.deepEqual(extractMermaidBlocks('See ```mermaid\ngraph TD\n```'), []);
});

void test('keeps a nested fence as diagram content instead of ending the block', () => {
  const blocks = extractMermaidBlocks('````mermaid\ngraph TD\n```\n````');

  assert.deepEqual(blocks, [{ id: 0, code: 'graph TD\n```' }]);
});

void test('extracts an indented fence and keeps its closing marker aligned', () => {
  const blocks = extractMermaidBlocks('- item\n\n  ```mermaid\n  graph TD\n  ```\n');

  assert.equal(blocks.length, 1);
  assert.match(blocks[0]!.code, /graph TD/);
});

void test('skips fences with no diagram content', () => {
  assert.deepEqual(extractMermaidBlocks('```mermaid\n\n```'), []);
});

void test('returns an empty list for non-string or empty input', () => {
  assert.deepEqual(extractMermaidBlocks(''), []);
  assert.deepEqual(extractMermaidBlocks(undefined), []);
});
