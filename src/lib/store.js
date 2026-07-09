import { writable, derived } from 'svelte/store';

// ---- Helpers ----
let _nextId = 1;
export function uid() {
  return 'win_' + (_nextId++);
}

// ---- Available colors ----
export const WINDOW_COLORS = [
  { name: 'Blu', hex: '#3B82F6' },
  { name: 'Rosso', hex: '#EF4444' },
  { name: 'Verde', hex: '#10B981' },
  { name: 'Ambra', hex: '#F59E0B' },
  { name: 'Viola', hex: '#8B5CF6' },
  { name: 'Rosa', hex: '#EC4899' },
  { name: 'Ciano', hex: '#0891B2' },
  { name: 'Arancio', hex: '#EA580C' },
  { name: 'Indaco', hex: '#6366F1' },
  { name: 'Verde acqua', hex: '#14B8A6' },
  { name: 'Corallo', hex: '#F43F5E' },
  { name: 'Lime', hex: '#65A30D' },
];

// ---- Grid config ----
export const gridCols = writable(16);
export const gridRows = writable(9);

// ---- Windows on grid ----
export const windows = writable([]);

// ---- Window templates (library) ----
export const templates = writable([
  { id: uid(), name: 'Browser', color: '#3B82F6', priority: 'medium', w: 6, h: 4 },
  { id: uid(), name: 'Terminale', color: '#1E293B', priority: 'high', w: 5, h: 3 },
  { id: uid(), name: 'Editor codice', color: '#8B5CF6', priority: 'high', w: 5, h: 4 },
  { id: uid(), name: 'File manager', color: '#F59E0B', priority: 'medium', w: 4, h: 3 },
  { id: uid(), name: 'Chat / Slack', color: '#10B981', priority: 'low', w: 4, h: 4 },
  { id: uid(), name: 'Monitor risorse', color: '#0891B2', priority: 'medium', w: 3, h: 2 },
  { id: uid(), name: 'Note / Documenti', color: '#EC4899', priority: 'low', w: 4, h: 3 },
  { id: uid(), name: 'Anteprima / Preview', color: '#6366F1', priority: 'low', w: 5, h: 3 },
]);

// ---- Derived: occupied cells map ----
export const occupiedCells = derived(windows, ($wins) => {
  const map = new Map();
  for (const win of $wins) {
    for (let r = win.y; r < win.y + win.h; r++) {
      for (let c = win.x; c < win.x + win.w; c++) {
        map.set(`${c},${r}`, win.id);
      }
    }
  }
  return map;
});

// ---- Derived: grid windows with computed properties ----
export const gridWindows = derived([windows, occupiedCells], ([$wins, $occupied]) => {
  return $wins.map(w => ({ ...w }));
});

// ---- Actions ----
export function addWindowToGrid(template) {
  windows.update(wins => {
    // Find first available position
    const maxCols = 16; // get from store? use default
    const maxRows = 9;
    const w = template.w || 3;
    const h = template.h || 2;

    // Build occupancy map
    const occ = new Set();
    for (const win of wins) {
      for (let r = win.y; r < win.y + win.h; r++) {
        for (let c = win.x; c < win.x + win.w; c++) {
          occ.add(`${c},${r}`);
        }
      }
    }

    // Find first free spot
    for (let y = 0; y <= maxRows - h; y++) {
      for (let x = 0; x <= maxCols - w; x++) {
        let fits = true;
        for (let ry = y; ry < y + h && fits; ry++) {
          for (let rx = x; rx < x + w && fits; rx++) {
            if (occ.has(`${rx},${ry}`)) fits = false;
          }
        }
        if (fits) {
          return [...wins, {
            id: uid(),
            name: template.name,
            color: template.color,
            priority: template.priority || 'medium',
            x, y, w, h,
          }];
        }
      }
    }
    // No space — place at origin anyway (user can move it)
    return [...wins, {
      id: uid(),
      name: template.name,
      color: template.color,
      priority: template.priority || 'medium',
      x: 0, y: 0, w, h,
    }];
  });
}

export function removeWindow(id) {
  windows.update(wins => wins.filter(w => w.id !== id));
}

export function moveWindow(id, x, y) {
  windows.update(wins => wins.map(w => w.id === id ? { ...w, x, y } : w));
}

export function resizeWindow(id, w, h) {
  windows.update(wins => wins.map(win => win.id === id ? { ...win, w: Math.max(1, w), h: Math.max(1, h) } : win));
}

export function updateWindow(id, props) {
  windows.update(wins => wins.map(w => w.id === id ? { ...w, ...props } : w));
}

export function clearGrid() {
  windows.set([]);
}

// ---- Monitor presets ----
export const MONITOR_PRESETS = [
  { name: 'Singolo 16:9', cols: 16, rows: 9 },
  { name: 'Doppio 16:9', cols: 32, rows: 9 },
  { name: 'Triplo 16:9', cols: 48, rows: 9 },
  { name: 'Ultra-wide 21:9', cols: 21, rows: 9 },
  { name: 'Verticale 9:16', cols: 9, rows: 16 },
  { name: '4K (16:9)', cols: 16, rows: 9 },
  { name: 'Doppio 4K', cols: 32, rows: 9 },
];

// ---- Export ----
export function exportConfig() {
  let config = {};
  const unsub1 = gridCols.subscribe(v => config.cols = v)();
  const unsub2 = gridRows.subscribe(v => config.rows = v)();
  const unsub3 = windows.subscribe(v => config.windows = v)();
  return JSON.stringify(config, null, 2);
}

// ---- Collision detection ----
export function checkCollision(windowsArr, id, newX, newY, newW, newH) {
  for (const win of windowsArr) {
    if (win.id === id) continue;
    // AABB overlap
    if (
      newX < win.x + win.w &&
      newX + newW > win.x &&
      newY < win.y + win.h &&
      newY + newH > win.y
    ) {
      return true;
    }
  }
  return false;
}

export function isOutOfBounds(x, y, w, h, cols, rows) {
  return x < 0 || y < 0 || x + w > cols || y + h > rows;
}
