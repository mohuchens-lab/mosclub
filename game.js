// ────────────────────────────────────
//  羊了个羊 — 多层堆叠三消（多形状版）
// ────────────────────────────────────

const ICONS_FULL = ['🌸', '🍎', '🍋', '🍇', '🫐', '🧅', '🧤', '🎩', '🌟', '💎', '🍀', '🔥'];
const BAR_MAX = 7;

let icons = ICONS_FULL.slice(0, 9); // active icon subset
let numTypes = 9;

// ── Shape generators ──────────────

// Rectangle: rows × cols at a given layer
function rect(rows, cols, layer) {
  const out = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      out.push({ r, c, layer });
  return out;
}

// Diamond: Manhattan-diamond of given radius at given layer
// radius=3 → 7-rows diamond (1+3+5+7+5+3+1=25 tiles)
function diamond(radius, layer) {
  const out = [];
  for (let dr = -radius; dr <= radius; dr++) {
    const cols = radius - Math.abs(dr);
    const row = radius + dr;
    for (let dc = -cols; dc <= cols; dc++) {
      out.push({ r: row, c: radius + dc, layer });
    }
  }
  return out;
}

// Cross / plus shape: arm-thick lines through center
// size = half-width of entire shape
function cross(size, arm, layer) {
  const out = [];
  const center = size;
  for (let r = 0; r <= size * 2; r++) {
    for (let c = 0; c <= size * 2; c++) {
      const inRow = Math.abs(r - center) < arm;
      const inCol = Math.abs(c - center) < arm;
      if (inRow || inCol) out.push({ r, c, layer });
    }
  }
  return out;
}

// Circle: approximate with euclidean distance
function circle(radius, layer) {
  const out = [];
  const cx = radius, cy = radius;
  for (let r = 0; r <= radius * 2; r++) {
    for (let c = 0; c <= radius * 2; c++) {
      if (Math.hypot(r - cy, c - cx) <= radius + 0.1) out.push({ r, c, layer });
    }
  }
  return out;
}

// Random scatter: n tiles scattered in a bounds area
function scatter(n, rows, cols, layer) {
  const out = [];
  const used = new Set();
  while (out.length < n) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    const key = `${r},${c}`;
    if (!used.has(key)) {
      used.add(key);
      out.push({ r, c, layer });
    }
  }
  return out;
}

// ── Layout definitions ────────────
// All layouts target 216 tiles (12 types × 18 each = 6 clears/type)

const LAYOUTS = [
  {
    name: '金字塔',
    tileColor: 'linear-gradient(145deg, #a8d8c8 0%, #7ab898 100%)',
    generate() {
      const tiles = [
        ...rect(10, 10, 0),
        ...rect(8, 8, 1),
        ...rect(6, 6, 2),
        ...rect(4, 4, 3),
      ];
      return { tiles, maxExtent: 12 };
    }
  },
  {
    name: '钻石',
    tileColor: 'linear-gradient(145deg, #c0ddf0 0%, #90bcd8 100%)',
    generate() {
      const tiles = [
        ...diamond(6, 0),
        ...diamond(5, 1),
        ...diamond(4, 2),
        ...diamond(3, 3),
      ];
      return { tiles: padTiles(tiles, 216, 3), maxExtent: 15 };
    }
  },
  {
    name: '十字架',
    tileColor: 'linear-gradient(145deg, #b0d0b8 0%, #80a888 100%)',
    generate() {
      const tiles = [
        ...cross(5, 3, 0),
        ...cross(4, 2, 1),
        ...cross(3, 2, 2),
        ...cross(2, 1, 3),
        ...cross(1, 1, 4),
      ];
      return { tiles: padTiles(tiles, 216, 4), maxExtent: 14 };
    }
  },
  {
    name: '圆环',
    tileColor: 'linear-gradient(145deg, #c0c8e8 0%, #9098c8 100%)',
    generate() {
      const tiles = [
        ...circle(5, 0),
        ...circle(4, 1),
        ...circle(3, 2),
        ...circle(2, 3),
        ...circle(1, 4),
      ];
      return { tiles: padTiles(tiles, 216, 4), maxExtent: 13 };
    }
  },
  {
    name: '散落',
    tileColor: 'linear-gradient(145deg, #c8bcd8 0%, #a894c0 100%)',
    generate() {
      const tiles = [
        ...scatter(42, 11, 11, 0),
        ...scatter(38, 10, 10, 1),
        ...scatter(34, 9, 9, 2),
        ...scatter(30, 8, 8, 3),
        ...scatter(26, 7, 7, 4),
        ...scatter(24, 6, 6, 5),
        ...scatter(22, 5, 5, 6),
      ];
      return { tiles, maxExtent: 14 };
    }
  },
  {
    name: '双塔',
    tileColor: 'linear-gradient(145deg, #b8ccc8 0%, #88a8a0 100%)',
    generate() {
      const tower = (baseR, baseC, sz, l) => {
        const out = [];
        for (let r = 0; r < sz; r++)
          for (let c = 0; c < sz; c++)
            out.push({ r: baseR + r, c: baseC + c, layer: l });
        return out;
      };
      const tiles = [
        ...tower(0, 0, 7, 0),
        ...tower(0, 8, 7, 0),
        ...tower(1, 1, 5, 1),
        ...tower(1, 9, 5, 1),
        ...tower(2, 2, 4, 2),
        ...tower(2, 10, 4, 2),
        ...tower(3, 3, 2, 3),
        ...tower(3, 11, 2, 3),
      ];
      return { tiles: padTiles(tiles, 216, 3), maxExtent: 17 };
    }
  },
];

// ── Utility ────────────────────────

function padTiles(tiles, target, topLayer) {
  const diff = target - tiles.length;
  if (diff <= 0) return tiles;
  const side = Math.ceil(Math.sqrt(diff));
  const extra = scatter(diff, side, side, topLayer + 1);
  return [...tiles, ...extra];
}

function pickTypeCount(total) {
  for (let n = 12; n >= 4; n--) {
    if (total % n === 0 && (total / n) % 3 === 0) return n;
  }
  return 6;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// ── Game state ─────────────────────

let tiles = [];
let bar = [];
let processing = false;
let currentLayout = null;
let gameId = 0;                   // incremented each new game; stale ops bail
let boardEl, barEl, remainingEl, overlayEl, titleEl;
let tileSize = 0, offsetX = 0, offsetY = 0;

function init() {
  boardEl = document.getElementById('board');
  barEl = document.getElementById('bar');
  remainingEl = document.getElementById('remaining');
  overlayEl = document.getElementById('overlay');
  titleEl = document.getElementById('layout-name');
  document.getElementById('new-game').addEventListener('click', newGame);
  document.getElementById('overlay-btn').addEventListener('click', newGame);
  newGame();
}

function newGame() {
  tiles = [];
  bar = [];
  processing = false;
  gameId++;                       // invalidate any in-flight async ops
  overlayEl.classList.add('hidden');
  generateTiles();
  renderAll();
}

function generateTiles() {
  // Pick random layout
  const layout = LAYOUTS[Math.floor(Math.random() * LAYOUTS.length)];
  currentLayout = layout;
  const { tiles: positions } = layout.generate();

  const total = positions.length;
  numTypes = pickTypeCount(total);
  icons = ICONS_FULL.slice(0, numTypes);
  const perType = total / numTypes;

  // Build type pool
  const pool = [];
  for (let t = 0; t < numTypes; t++) {
    for (let i = 0; i < perType; i++) pool.push(t);
  }
  shuffle(pool);

  // Create tile objects
  tiles = positions.map((pos, i) => ({
    id: i,
    type: pool[i],
    row: pos.r,
    col: pos.c,
    layer: pos.layer,
  }));

  titleEl.textContent = '布局：' + layout.name;
}

// ── Blocking ────────────────────────

function isFree(tile) {
  for (const other of tiles) {
    if (other.id === tile.id) continue;
    if (other.layer <= tile.layer) continue;
    if (tilesOverlap(tile, other)) return false;
  }
  return true;
}

function tilesOverlap(a, b) {
  const ax = a.col + a.layer * 0.5;
  const ay = a.row + a.layer * 0.5;
  const bx = b.col + b.layer * 0.5;
  const by = b.row + b.layer * 0.5;
  return Math.abs(ax - bx) < 0.95 && Math.abs(ay - by) < 0.95;
}

// ── Rendering ───────────────────────

function renderAll() {
  const boardW = boardEl.clientWidth;
  const boardH = boardEl.clientHeight;

  // Scan actual tile extent (including layer offset)
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  for (const t of tiles) {
    const x = t.col + t.layer * 0.5;
    const y = t.row + t.layer * 0.5;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const contentW = maxX - minX + 1;
  const contentH = maxY - minY + 1;

  // Scale to fill board, keeping tiles as large as possible
  tileSize = Math.floor(Math.min(boardW / contentW, boardH / contentH));

  // Center the actual content
  const usedW = contentW * tileSize;
  const usedH = contentH * tileSize;
  offsetX = Math.floor((boardW - usedW) / 2) - Math.floor(minX * tileSize);
  offsetY = Math.floor((boardH - usedH) / 2) - Math.floor(minY * tileSize);

  renderBoard();
  renderBar();
  remainingEl.textContent = '剩余 ' + tiles.length;
}

function renderBoard() {
  boardEl.innerHTML = '';
  if (tiles.length === 0) return;

  const sorted = [...tiles].sort((a, b) => a.layer - b.layer);

  for (const tile of sorted) {
    const free = isFree(tile);
    const el = document.createElement('div');
    el.className = 'tile' + (free ? ' free' : ' blocked');
    el.style.width = tileSize + 'px';
    el.style.height = tileSize + 'px';

    const left = offsetX + (tile.col + tile.layer * 0.5) * tileSize;
    const top = offsetY + (tile.row + tile.layer * 0.5) * tileSize;
    el.style.left = left + 'px';
    el.style.top = top + 'px';
    el.style.zIndex = tile.layer * 100 + tile.row * 10 + tile.col;
    el.style.background = currentLayout.tileColor;

    const icon = document.createElement('span');
    icon.className = 'tile-icon';
    icon.textContent = icons[tile.type];
    el.appendChild(icon);

    if (free) {
      el.addEventListener('click', () => selectTile(tile));
    }

    boardEl.appendChild(el);
  }
}

function renderBar() {
  barEl.innerHTML = '';
  for (let i = 0; i < BAR_MAX; i++) {
    const slot = document.createElement('div');
    slot.className = 'bar-slot';
    if (i < bar.length) {
      slot.classList.add('filled');
      slot.textContent = icons[bar[i]];
    }
    barEl.appendChild(slot);
  }
  if (bar.length >= 5) {
    barEl.style.boxShadow = '0 0 16px rgba(255,80,80,0.5)';
  } else {
    barEl.style.boxShadow = '';
  }
}

// ── Selection ───────────────────────

async function selectTile(tile) {
  if (processing) return;
  if (!isFree(tile)) return;

  const started = gameId;        // snapshot — bail if game restarts mid-op
  processing = true;

  tiles = tiles.filter(t => t.id !== tile.id);
  bar.push(tile.type);
  renderAll();

  await delay(150);
  if (gameId !== started) return;  // new game started, abandon

  const indices = findMatch();
  if (indices) {
    await animateMatch(indices);
    renderAll();
  }
  if (gameId !== started) return;

  if (tiles.length === 0) {
    await delay(200);
    if (gameId !== started) return;
    win();
    processing = false;
    return;
  }

  if (bar.length >= BAR_MAX) {
    await delay(300);
    if (gameId !== started) return;
    lose();
  }

  processing = false;
}

function findMatch() {
  const count = {};
  for (let i = 0; i < bar.length; i++) {
    const t = bar[i];
    if (!count[t]) count[t] = [];
    count[t].push(i);
    if (count[t].length === 3) return count[t];
  }
  return null;
}

async function animateMatch(indices) {
  const slots = barEl.children;
  for (const i of indices) {
    if (slots[i]) {
      slots[i].classList.add('matching');
      slots[i].textContent = '💥';
    }
  }
  await delay(300);
  bar = bar.filter((_, i) => !indices.includes(i));
}

// ── End states ──────────────────────

function win() {
  overlayEl.classList.remove('hidden');
  document.getElementById('overlay-icon').textContent = '🎉';
  document.getElementById('overlay-title').textContent = '恭喜过关！';
  document.getElementById('overlay-sub').textContent = '「' + currentLayout.name + '」被你清空了';
}

function lose() {
  overlayEl.classList.remove('hidden');
  document.getElementById('overlay-icon').textContent = '😵';
  document.getElementById('overlay-title').textContent = '槽位已满';
  document.getElementById('overlay-sub').textContent = '「' + currentLayout.name + '」再试一次吧';
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ── Service Worker ──────────────────

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js', { scope: '/' });
}

// ── Start ───────────────────────────

document.addEventListener('DOMContentLoaded', init);
