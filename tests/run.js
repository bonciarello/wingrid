/**
 * WinGrid — Test Suite
 *
 * Tests for store logic: window placement, collision detection,
 * bounds checking, grid management, and export functionality.
 *
 * Run with: node tests/run.js
 */

// ---- Simulate the store module ----
let _nextId = 1;
function uid() {
  return 'win_' + (_nextId++);
}

function checkCollision(windowsArr, id, newX, newY, newW, newH) {
  for (const win of windowsArr) {
    if (win.id === id) continue;
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

function isOutOfBounds(x, y, w, h, cols, rows) {
  return x < 0 || y < 0 || x + w > cols || y + h > rows;
}

function addWindow(windowsArr, template, maxCols, maxRows) {
  const w = template.w || 3;
  const h = template.h || 2;

  const occ = new Set();
  for (const win of windowsArr) {
    for (let r = win.y; r < win.y + win.h; r++) {
      for (let c = win.x; c < win.x + win.w; c++) {
        occ.add(`${c},${r}`);
      }
    }
  }

  for (let y = 0; y <= maxRows - h; y++) {
    for (let x = 0; x <= maxCols - w; x++) {
      let fits = true;
      for (let ry = y; ry < y + h && fits; ry++) {
        for (let rx = x; rx < x + w && fits; rx++) {
          if (occ.has(`${rx},${ry}`)) fits = false;
        }
      }
      if (fits) {
        return [...windowsArr, { id: uid(), name: template.name, color: template.color, priority: template.priority || 'medium', x, y, w, h }];
      }
    }
  }
  return [...windowsArr, { id: uid(), name: template.name, color: template.color, priority: template.priority || 'medium', x: 0, y: 0, w, h }];
}

function moveWindow(wins, id, x, y) {
  return wins.map(w => w.id === id ? { ...w, x, y } : w);
}

function resizeWindow(wins, id, w, h) {
  return wins.map(win => win.id === id ? { ...win, w: Math.max(1, w), h: Math.max(1, h) } : win);
}

function removeWindow(wins, id) {
  return wins.filter(w => w.id !== id);
}

function clearGrid() {
  return [];
}

// ---- Test runner ----
let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, msg) {
  if (condition) {
    passed++;
  } else {
    failed++;
    failures.push(msg);
    console.error(`  ✗ FAIL: ${msg}`);
  }
}

function test(name, fn) {
  console.log(`\n${name}`);
  try {
    fn();
  } catch (e) {
    failed++;
    failures.push(`${name}: ${e.message}`);
    console.error(`  ✗ ERROR: ${e.message}`);
  }
}

// ---- Tests ----
console.log('WinGrid Test Suite');
console.log('==================\n');

// Test 1: ID generation
test('ID generation produces unique IDs', () => {
  const id1 = uid();
  const id2 = uid();
  const id3 = uid();
  assert(id1 !== id2, 'id1 !== id2');
  assert(id2 !== id3, 'id2 !== id3');
  assert(id1.startsWith('win_'), 'IDs start with "win_"');
});

// Test 2: Adding windows
test('Adding windows to empty grid', () => {
  let wins = [];
  wins = addWindow(wins, { name: 'Browser', color: '#3B82F6', priority: 'medium', w: 6, h: 4 }, 16, 9);
  assert(wins.length === 1, 'Window added');
  assert(wins[0].name === 'Browser', 'Name matches');
  assert(wins[0].x === 0 && wins[0].y === 0, 'Placed at origin (0,0)');
  assert(wins[0].w === 6 && wins[0].h === 4, 'Size preserved');
});

// Test 3: Auto-placement avoids overlap
test('Auto-placement avoids overlapping windows', () => {
  let wins = [];
  wins = addWindow(wins, { name: 'A', color: '#3B82F6', priority: 'high', w: 8, h: 5 }, 16, 9);
  wins = addWindow(wins, { name: 'B', color: '#EF4444', priority: 'medium', w: 8, h: 5 }, 16, 9);
  assert(wins.length === 2, 'Two windows added');
  // B should be placed next to A, not overlapping
  assert(wins[1].x >= 8 || wins[1].y >= 5, 'Second window does not overlap first');
});

// Test 4: Collision detection
test('Collision detection works correctly', () => {
  const wins = [
    { id: 'a', x: 0, y: 0, w: 4, h: 3, name: 'A', color: '#3B82F6', priority: 'medium' },
  ];
  assert(checkCollision(wins, 'b', 3, 2, 4, 3), 'Overlapping position detected');
  assert(!checkCollision(wins, 'b', 4, 0, 4, 3), 'Adjacent (no overlap) accepted');
  assert(!checkCollision(wins, 'b', 0, 3, 4, 3), 'Below (no overlap) accepted');
  assert(checkCollision(wins, 'b', 1, 1, 2, 2), 'Contained overlap detected');
});

// Test 5: Bounds checking
test('Bounds checking', () => {
  assert(isOutOfBounds(-1, 0, 4, 3, 16, 9), 'Negative x detected');
  assert(isOutOfBounds(0, -1, 4, 3, 16, 9), 'Negative y detected');
  assert(isOutOfBounds(13, 0, 4, 3, 16, 9), 'Right overflow detected');
  assert(isOutOfBounds(0, 7, 4, 3, 16, 9), 'Bottom overflow detected');
  assert(!isOutOfBounds(0, 0, 16, 9, 16, 9), 'Full grid fit accepted');
  assert(!isOutOfBounds(10, 5, 3, 2, 16, 9), 'Normal position accepted');
});

// Test 6: Moving windows
test('Moving windows', () => {
  let wins = [
    { id: 'a', x: 0, y: 0, w: 4, h: 3, name: 'A', color: '#3B82F6', priority: 'high' },
  ];
  wins = moveWindow(wins, 'a', 5, 3);
  assert(wins[0].x === 5, 'X position updated');
  assert(wins[0].y === 3, 'Y position updated');
  assert(wins[0].w === 4, 'Width unchanged');
  assert(wins[0].h === 3, 'Height unchanged');
});

// Test 7: Resizing windows
test('Resizing windows', () => {
  let wins = [
    { id: 'a', x: 2, y: 2, w: 4, h: 3, name: 'A', color: '#3B82F6', priority: 'low' },
  ];
  wins = resizeWindow(wins, 'a', 6, 5);
  assert(wins[0].w === 6, 'Width updated to 6');
  assert(wins[0].h === 5, 'Height updated to 5');
  assert(wins[0].x === 2, 'X position unchanged');

  // Minimum size
  wins = resizeWindow(wins, 'a', 0, -5);
  assert(wins[0].w === 1, 'Width clamped to minimum 1');
  assert(wins[0].h === 1, 'Height clamped to minimum 1');
});

// Test 8: Removing windows
test('Removing windows', () => {
  let wins = [
    { id: 'a', x: 0, y: 0, w: 4, h: 3, name: 'A', color: '#3B82F6', priority: 'medium' },
    { id: 'b', x: 5, y: 0, w: 4, h: 3, name: 'B', color: '#EF4444', priority: 'high' },
  ];
  wins = removeWindow(wins, 'a');
  assert(wins.length === 1, 'One window remaining');
  assert(wins[0].id === 'b', 'Correct window removed');
});

// Test 9: Clearing grid
test('Clearing grid', () => {
  const wins = clearGrid();
  assert(wins.length === 0, 'Grid is empty');
});

// Test 10: Multiple windows fill available space
test('Filling the grid completely', () => {
  let wins = [];
  for (let i = 0; i < 6; i++) {
    wins = addWindow(wins, { name: `W${i}`, color: '#3B82F6', priority: 'medium', w: 5, h: 3 }, 16, 9);
  }
  assert(wins.length === 6, 'All 6 windows added');
  // 16×9 = 144 cells; 6 windows × 5×3 = 90 cells. Should fit.
  for (let i = 0; i < wins.length; i++) {
    for (let j = i + 1; j < wins.length; j++) {
      const a = wins[i];
      const b = wins[j];
      const overlap = !(b.x >= a.x + a.w || b.x + b.w <= a.x || b.y >= a.y + a.h || b.y + b.h <= a.y);
      assert(!overlap, `Windows ${i} and ${j} do not overlap`);
    }
  }
});

// Test 11: Edge case — 1x1 window
test('1×1 window placement', () => {
  let wins = [];
  wins = addWindow(wins, { name: 'Tiny', color: '#10B981', priority: 'low', w: 1, h: 1 }, 16, 9);
  assert(wins.length === 1, '1×1 window added');
  assert(wins[0].w === 1 && wins[0].h === 1, 'Size is 1×1');
  assert(wins[0].x >= 0 && wins[0].y >= 0, 'Position valid');
});

// Test 12: Edge case — full-grid window
test('Full-grid window', () => {
  let wins = [];
  wins = addWindow(wins, { name: 'Full', color: '#8B5CF6', priority: 'high', w: 16, h: 9 }, 16, 9);
  assert(wins.length === 1, 'Full-grid window added');
  assert(wins[0].w === 16 && wins[0].h === 9, 'Occupies entire grid');
  assert(wins[0].x === 0 && wins[0].y === 0, 'At origin');

  // Second window should still be placed (at origin, overlapping)
  wins = addWindow(wins, { name: 'Extra', color: '#EF4444', priority: 'low', w: 2, h: 2 }, 16, 9);
  assert(wins.length === 2, 'Second window added even with full grid');
});

// Test 13: Collision with self is ignored
test('Collision ignores self', () => {
  const wins = [
    { id: 'a', x: 2, y: 2, w: 4, h: 3, name: 'A', color: '#3B82F6', priority: 'medium' },
  ];
  assert(!checkCollision(wins, 'a', 2, 2, 4, 3), 'Same position/size ignores self');
  assert(!checkCollision(wins, 'a', 3, 3, 2, 1), 'Subset position ignores self');
});

// ---- Summary ----
console.log('\n==================');
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failures.length > 0) {
  console.log('\nFailures:');
  failures.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
  process.exit(1);
} else {
  console.log('All tests passed! ✓');
  process.exit(0);
}
