const COLS = 31;
const ROWS = 17;
const CELL = 20;

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

canvas.width = COLS * CELL;
canvas.height = ROWS * CELL;

let w = 1;
let animDelay = 160;

let grid = [];
let start = [1, 1];
let goal = [COLS - 2, ROWS - 2];

let running = false;

const C = {
  wall: '#1F2937',
  open: '#F9FAFB',
  explored: '#93C5FD',
  frontier: '#C4B5FD',
  path: '#FDE68A',
  start: '#4ADE80',
  goal: '#F87171',
  border: '#E5E7EB',
};

function initGrid() {

  grid = [];

  for (let y = 0; y < ROWS; y++) {

    grid.push([]);

    for (let x = 0; x < COLS; x++) {
      grid[y].push(0);
    }
  }

  for (let x = 0; x < COLS; x++) {
    grid[0][x] = 1;
    grid[ROWS - 1][x] = 1;
  }

  for (let y = 0; y < ROWS; y++) {
    grid[y][0] = 1;
    grid[y][COLS - 1] = 1;
  }

  for (let i = 0; i < COLS * ROWS * 0.18; i++) {

    const x = 1 + Math.floor(Math.random() * (COLS - 2));
    const y = 1 + Math.floor(Math.random() * (ROWS - 2));

    if (
      (x === start[0] && y === start[1]) ||
      (x === goal[0] && y === goal[1])
    ) continue;

    grid[y][x] = 1;
  }

  carvePassage(start[0], start[1]);
}

function carvePassage(x, y) {

  const dirs = [
    [1, 0],
    [0, 1],
    [-1, 0],
    [0, -1]
  ].sort(() => Math.random() - 0.5);

  for (const [dx, dy] of dirs) {

    const nx = x + dx * 2;
    const ny = y + dy * 2;

    if (
      ny > 0 &&
      ny < ROWS - 1 &&
      nx > 0 &&
      nx < COLS - 1 &&
      grid[ny][nx] === 1 &&
      Math.random() < 0.45
    ) {

      grid[y + dy][x + dx] = 0;
      grid[ny][nx] = 0;

      carvePassage(nx, ny);
    }
  }
}

function drawGrid({
  explored = new Set(),
  frontier = new Set(),
  path = new Set()
} = {}) {

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < ROWS; y++) {

    for (let x = 0; x < COLS; x++) {

      const k = `${x},${y}`;

      if (x === start[0] && y === start[1]) {
        ctx.fillStyle = C.start;
      }

      else if (x === goal[0] && y === goal[1]) {
        ctx.fillStyle = C.goal;
      }

      else if (path.has(k)) {
        ctx.fillStyle = C.path;
      }

      else if (explored.has(k)) {
        ctx.fillStyle = C.explored;
      }

      else if (frontier.has(k)) {
        ctx.fillStyle = C.frontier;
      }

      else if (grid[y][x] === 1) {
        ctx.fillStyle = C.wall;
      }

      else {
        ctx.fillStyle = C.open;
      }

      ctx.fillRect(x * CELL, y * CELL, CELL, CELL);

      ctx.strokeStyle = C.border;
      ctx.lineWidth = 0.5;

      ctx.strokeRect(
        x * CELL,
        y * CELL,
        CELL,
        CELL
      );
    }
  }
}

function h(x, y) {
  return Math.abs(x - goal[0]) + Math.abs(y - goal[1]);
}

function key(x, y) {
  return `${x},${y}`;
}

async function runSearch() {

  if (running) return;

  running = true;

  [
    's-explored',
    's-path',
    's-cost',
    's-time',
    's-opt'
  ].forEach(id => {
    document.getElementById(id).textContent = '…';
  });

  const open = [];

  const gScore = {};
  const cameFrom = {};

  const exploredSet = new Set();
  const frontierSet = new Set();

  const sk = key(start[0], start[1]);

  gScore[sk] = 0;

  open.push({
    x: start[0],
    y: start[1],
    f: w * h(start[0], start[1])
  });

  frontierSet.add(sk);

  const startTime = performance.now();

  let steps = 0;

  while (open.length) {

    open.sort((a, b) => a.f - b.f);

    const cur = open.shift();

    const ck = key(cur.x, cur.y);

    frontierSet.delete(ck);

    exploredSet.add(ck);

    if (cur.x === goal[0] && cur.y === goal[1]) {

      const path = new Set();

      let k = ck;

      while (k) {
        path.add(k);
        k = cameFrom[k];
      }

      drawGrid({
        explored: exploredSet,
        frontier: frontierSet,
        path
      });

      const cost =
        Math.round(gScore[ck] * 10) / 10;

      document.getElementById('s-explored').textContent =
        exploredSet.size;

      document.getElementById('s-path').textContent =
        path.size;

      document.getElementById('s-cost').textContent =
        cost;

      document.getElementById('s-time').textContent =
        `${Math.round(performance.now() - startTime)} ms`;

      document.getElementById('s-opt').textContent =
        w <= 1
          ? 'Sí'
          : 'No garantizado';

      running = false;

      return;
    }

    for (const [dx, dy] of [
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, -1]
    ]) {

      const nx = cur.x + dx;
      const ny = cur.y + dy;

      if (
        ny < 0 ||
        ny >= ROWS ||
        nx < 0 ||
        nx >= COLS ||
        grid[ny][nx] === 1
      ) continue;

      const nk = key(nx, ny);

      const ng =
        (gScore[ck] || 0) + 1;

      if (
        gScore[nk] === undefined ||
        ng < gScore[nk]
      ) {

        gScore[nk] = ng;

        cameFrom[nk] = ck;

        const f =
          ng + w * h(nx, ny);

        open.push({
          x: nx,
          y: ny,
          f
        });

        frontierSet.add(nk);
      }
    }

    steps++;

    if (steps % 4 === 0) {

      drawGrid({
        explored: exploredSet,
        frontier: frontierSet
      });

      await new Promise(r =>
        setTimeout(r, animDelay / 4)
      );
    }
  }

  drawGrid({
    explored: exploredSet
  });

  document.getElementById('s-explored').textContent =
    exploredSet.size;

  document.getElementById('s-path').textContent =
    'Sin camino';

  document.getElementById('s-cost').textContent =
    '—';

  document.getElementById('s-time').textContent =
    `${Math.round(performance.now() - startTime)} ms`;

  document.getElementById('s-opt').textContent =
    '—';

  running = false;
}

function onW(v) {

  w = +v;

  const wf =
    Math.round(w * 10) / 10;

  let label = `w = ${wf.toFixed(1)}`;

  if (wf === 0) {
    label += ' → Dijkstra (sin heurística)';
  }

  else if (wf === 1) {
    label += ' → A* estándar';
  }

  else if (wf <= 2) {
    label += ' → Más rápido, menos óptimo';
  }

  else {
    label += ' → Muy greedy';
  }

  document.getElementById('w-val').textContent =
    label;
}

function resetGrid() {

  running = false;

  [
    's-explored',
    's-path',
    's-cost',
    's-time',
    's-opt'
  ].forEach(id => {
    document.getElementById(id).textContent = '—';
  });

  initGrid();

  drawGrid();
}

canvas.addEventListener('click', e => {

  if (running) return;

  const rect =
    canvas.getBoundingClientRect();

  const scaleX =
    canvas.width / rect.width;

  const scaleY =
    canvas.height / rect.height;

  const cx = Math.floor(
    (e.clientX - rect.left) *
    scaleX / CELL
  );

  const cy = Math.floor(
    (e.clientY - rect.top) *
    scaleY / CELL
  );

  if (
    cx < 0 ||
    cx >= COLS ||
    cy < 0 ||
    cy >= ROWS
  ) return;

  if (
    (cx === start[0] && cy === start[1]) ||
    (cx === goal[0] && cy === goal[1])
  ) return;

  if (
    cx === 0 ||
    cx === COLS - 1 ||
    cy === 0 ||
    cy === ROWS - 1
  ) return;

  grid[cy][cx] =
    grid[cy][cx] ? 0 : 1;

  drawGrid();
});

initGrid();
drawGrid();
