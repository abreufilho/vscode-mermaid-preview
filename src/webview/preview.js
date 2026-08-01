const vscode = acquireVsCodeApi();

let blocks = [];
let current = 0;
let scale = 1;
let tx = 0;
let ty = 0;
let dragging = false;
let lastX = 0;
let lastY = 0;

const canvas = document.getElementById('canvas');
const viewportEl = document.getElementById('viewport');
const diagram = document.getElementById('diagram');
const counter = document.getElementById('counter');
const empty = document.getElementById('empty');
const toolbarEl = document.getElementById('toolbar');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');

function applyTransform() {
  viewportEl.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
}

function fitToScreen() {
  const svg = diagram.querySelector('svg');
  if (!svg) return;

  const cw = canvas.clientWidth;
  const ch = canvas.clientHeight;

  let sw;
  let sh;
  const viewBox = svg.getAttribute('viewBox');
  if (viewBox) {
    const parts = viewBox.trim().split(/[\s,]+/);
    sw = parseFloat(parts[2]);
    sh = parseFloat(parts[3]);
  } else {
    sw = parseFloat(svg.getAttribute('width')) || svg.scrollWidth;
    sh = parseFloat(svg.getAttribute('height')) || svg.scrollHeight;
  }

  if (!sw || !sh) return;

  const diagramPadding = 64;
  const contentWidth = sw + diagramPadding;
  const contentHeight = sh + diagramPadding;
  scale = Math.min(cw / contentWidth, ch / contentHeight, 1.5) * 0.9;
  tx = (cw - contentWidth * scale) / 2;
  ty = (ch - contentHeight * scale) / 2;
  applyTransform();
}

canvas.addEventListener(
  'wheel',
  (event) => {
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const mx = event.clientX - rect.left;
    const my = event.clientY - rect.top;
    const delta = event.deltaY > 0 ? 0.85 : 1.15;
    const newScale = Math.min(Math.max(scale * delta, 0.05), 20);
    tx = mx - (mx - tx) * (newScale / scale);
    ty = my - (my - ty) * (newScale / scale);
    scale = newScale;
    applyTransform();
  },
  { passive: false }
);

canvas.addEventListener('mousedown', (event) => {
  if (event.button !== 0) return;
  dragging = true;
  lastX = event.clientX;
  lastY = event.clientY;
  canvas.style.cursor = 'grabbing';
});

window.addEventListener('mousemove', (event) => {
  if (!dragging) return;
  tx += event.clientX - lastX;
  ty += event.clientY - lastY;
  lastX = event.clientX;
  lastY = event.clientY;
  applyTransform();
});

window.addEventListener('mouseup', () => {
  dragging = false;
  canvas.style.cursor = 'grab';
});

btnPrev.addEventListener('click', () => {
  if (current > 0) {
    current -= 1;
    renderCurrent();
  }
});

btnNext.addEventListener('click', () => {
  if (current < blocks.length - 1) {
    current += 1;
    renderCurrent();
  }
});

document.getElementById('btn-fit').addEventListener('click', fitToScreen);

document.getElementById('btn-export').addEventListener('click', () => {
  const svg = diagram.querySelector('svg');
  if (!svg) return;

  const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `diagram-${current + 1}.svg`;
  link.click();
  URL.revokeObjectURL(url);
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft') btnPrev.click();
  if (event.key === 'ArrowRight') btnNext.click();
  if (event.key === 'f' || event.key === 'F') fitToScreen();
});

function showRenderError(message) {
  diagram.replaceChildren();

  const box = document.createElement('div');
  box.className = 'error';

  const label = document.createElement('strong');
  label.textContent = 'Render error:';

  const detail = document.createElement('pre');
  // textContent, never innerHTML: the message quotes the diagram source, which
  // comes from the document being previewed.
  detail.textContent = message;

  box.append(label, detail);
  diagram.append(box);
}

async function renderCurrent() {
  if (!blocks.length) return;

  diagram.replaceChildren();
  scale = 1;
  tx = 0;
  ty = 0;
  applyTransform();

  counter.textContent = `${current + 1} / ${blocks.length}`;
  btnPrev.disabled = current === 0;
  btnNext.disabled = current === blocks.length - 1;

  const block = blocks[current];
  const id = `mermaid-render-${block.id}-${Date.now()}`;

  try {
    const { svg } = await mermaid.render(id, block.code);
    diagram.innerHTML = svg;

    const svgEl = diagram.querySelector('svg');
    if (svgEl) {
      svgEl.style.maxWidth = 'none';
      svgEl.style.display = 'block';
    }

    requestAnimationFrame(fitToScreen);
  } catch (error) {
    showRenderError(error && error.message ? error.message : String(error));
  }
}

window.addEventListener('message', async (event) => {
  const message = event.data;
  if (!message || message.type !== 'render') return;

  blocks = Array.isArray(message.blocks) ? message.blocks : [];
  current = 0;

  mermaid.initialize({
    startOnLoad: false,
    theme: message.theme === 'dark' ? 'dark' : 'default',
    // strict keeps Mermaid's HTML sanitiser on and blocks click bindings; the
    // diagram source is untrusted document content.
    securityLevel: 'strict',
  });

  if (!blocks.length) {
    empty.style.display = 'flex';
    toolbarEl.style.display = 'none';
    canvas.style.display = 'none';
    return;
  }

  empty.style.display = 'none';
  toolbarEl.style.display = 'flex';
  canvas.style.display = 'flex';
  await renderCurrent();
});

vscode.postMessage({ type: 'ready' });
