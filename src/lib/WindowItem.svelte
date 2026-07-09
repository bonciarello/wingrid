<script>
  import { windows, moveWindow, resizeWindow, removeWindow, checkCollision, isOutOfBounds as boundsCheck } from './store.js';
  import { get } from 'svelte/store';

  let { win, cols, rows } = $props();

  // ---- Drag to reposition ----
  let dragging = $state(false);
  let dragStartX = $state(0);
  let dragStartY = $state(0);
  let origX = $state(0);
  let origY = $state(0);

  // ---- Resize ----
  let resizing = $state(false);
  let resizeDir = $state(''); // 'e', 's', 'se'
  let resizeStartX = $state(0);
  let resizeStartY = $state(0);
  let origW = $state(0);
  let origH = $state(0);

  // ---- Hover state ----
  let hovered = $state(false);

  let el = $state(null);

  function handlePointerDown(e, type) {
    if (type === 'move') {
      dragging = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      origX = win.x;
      origY = win.y;
      el.setPointerCapture(e.pointerId);
    } else {
      resizing = true;
      resizeDir = type;
      resizeStartX = e.clientX;
      resizeStartY = e.clientY;
      origW = win.w;
      origH = win.h;
      el.setPointerCapture(e.pointerId);
    }
    e.preventDefault();
    e.stopPropagation();
  }

  function handlePointerMove(e) {
    if (!dragging && !resizing) return;

    const rect = el.parentElement.getBoundingClientRect();
    const cellW = rect.width / cols;
    const cellH = rect.height / rows;

    if (dragging) {
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;
      const dcx = Math.round(dx / cellW);
      const dcy = Math.round(dy / cellH);

      let newX = origX + dcx;
      let newY = origY + dcy;
      newX = Math.max(0, Math.min(cols - win.w, newX));
      newY = Math.max(0, Math.min(rows - win.h, newY));

      // Check collision with other windows
      const allWins = get(windows);
      if (!checkCollision(allWins, win.id, newX, newY, win.w, win.h)) {
        moveWindow(win.id, newX, newY);
      }
    }

    if (resizing) {
      const dx = e.clientX - resizeStartX;
      const dy = e.clientY - resizeStartY;
      const dcx = Math.round(dx / cellW);
      const dcy = Math.round(dy / cellH);

      let newW = origW;
      let newH = origH;
      let newX = win.x;
      let newY = win.y;

      if (resizeDir.includes('e')) {
        newW = Math.max(1, Math.min(cols - win.x, origW + dcx));
      }
      if (resizeDir.includes('s')) {
        newH = Math.max(1, Math.min(rows - win.y, origH + dcy));
      }

      const allWins = get(windows);
      if (!checkCollision(allWins, win.id, newX, newY, newW, newH)) {
        resizeWindow(win.id, newW, newH);
      }
    }
  }

  function handlePointerUp(e) {
    if (dragging) {
      dragging = false;
      el.releasePointerCapture(e.pointerId);
    }
    if (resizing) {
      resizing = false;
      resizeDir = '';
      el.releasePointerCapture(e.pointerId);
    }
  }

  function handleRemove() {
    removeWindow(win.id);
  }

  function handleKeyDown(e) {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      handleRemove();
    }
    if (e.key === 'ArrowLeft') { e.preventDefault(); tryMove(-1, 0); }
    if (e.key === 'ArrowRight') { e.preventDefault(); tryMove(1, 0); }
    if (e.key === 'ArrowUp') { e.preventDefault(); tryMove(0, -1); }
    if (e.key === 'ArrowDown') { e.preventDefault(); tryMove(0, 1); }
  }

  function tryMove(dx, dy) {
    let nx = Math.max(0, Math.min(cols - win.w, win.x + dx));
    let ny = Math.max(0, Math.min(rows - win.h, win.y + dy));
    const allWins = get(windows);
    if (!checkCollision(allWins, win.id, nx, ny, win.w, win.h)) {
      moveWindow(win.id, nx, ny);
    }
  }

  function priorityLabel(p) {
    if (p === 'high') return 'Alta';
    if (p === 'medium') return 'Media';
    return 'Bassa';
  }

  function priorityClass(p) {
    return 'prio-' + p;
  }

  // Position
  let stylePos = $derived.by(() => {
    const pctW = 100 / cols;
    const pctH = 100 / rows;
    return `
      left: ${win.x * pctW}%;
      top: ${win.y * pctH}%;
      width: ${win.w * pctW}%;
      height: ${win.h * pctH}%;
    `;
  });
</script>

<div
  class="window-item"
  class:window-dragging={dragging}
  class:window-resizing={resizing}
  class:window-hovered={hovered}
  bind:this={el}
  style={stylePos}
  style:--win-color={win.color}
  role="button"
  tabindex="0"
  aria-label="Finestra {win.name}, priorità {priorityLabel(win.priority)}, dimensione {win.w}×{win.h}"
  onpointerdown={(e) => { e.stopPropagation(); el.focus(); }}
  onkeydown={handleKeyDown}
  onmouseenter={() => hovered = true}
  onmouseleave={() => { if (!dragging && !resizing) hovered = false; }}
  onfocus={() => hovered = true}
  onblur={() => hovered = false}
>
  <!-- Header bar (drag handle) -->
  <div
    class="win-header"
    onpointerdown={(e) => handlePointerDown(e, 'move')}
    onpointermove={handlePointerMove}
    onpointerup={handlePointerUp}
    role="button"
    aria-label="Trascina per spostare {win.name}"
    tabindex="-1"
  >
    <div class="win-titlebar">
      <span class="win-dot" style="background: {win.color}"></span>
      <span class="win-name">{win.name}</span>
    </div>
    <div class="win-actions">
      <span class="win-badge {priorityClass(win.priority)}" title="Priorità {priorityLabel(win.priority)}">
        {priorityLabel(win.priority)}
      </span>
      <button
        class="win-remove"
        onclick={handleRemove}
        aria-label="Rimuovi {win.name}"
        title="Rimuovi finestra"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  </div>

  <!-- Body -->
  <div class="win-body">
    <span class="win-dim">{win.w}×{win.h} celle</span>
    <span class="win-pos">({win.x+1},{win.y+1})</span>
  </div>

  <!-- Resize handles -->
  <div
    class="resize-handle resize-e"
    class:active={resizeDir === 'e'}
    onpointerdown={(e) => handlePointerDown(e, 'e')}
    onpointermove={handlePointerMove}
    onpointerup={handlePointerUp}
    aria-label="Ridimensiona larghezza"
    tabindex="-1"
  ></div>
  <div
    class="resize-handle resize-s"
    class:active={resizeDir === 's'}
    onpointerdown={(e) => handlePointerDown(e, 's')}
    onpointermove={handlePointerMove}
    onpointerup={handlePointerUp}
    aria-label="Ridimensiona altezza"
    tabindex="-1"
  ></div>
  <div
    class="resize-handle resize-se"
    class:active={resizeDir === 'se'}
    onpointerdown={(e) => handlePointerDown(e, 'se')}
    onpointermove={handlePointerMove}
    onpointerup={handlePointerUp}
    aria-label="Ridimensiona larghezza e altezza"
    tabindex="-1"
  ></div>
</div>

<style>
  .window-item {
    position: absolute;
    z-index: 10;
    display: flex;
    flex-direction: column;
    background: var(--surface-0);
    border: 2px solid var(--win-color);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-md);
    overflow: hidden;
    transition: box-shadow var(--dur-fast) var(--ease-out),
                border-color var(--dur-fast) var(--ease-out);
    cursor: default;
    min-width: 60px;
    min-height: 44px;
    outline: none;
  }

  .window-item:focus-visible {
    box-shadow: 0 0 0 3px var(--primary-light), var(--shadow-lg);
    border-color: var(--primary);
    z-index: 20;
  }

  .window-item:hover,
  .window-hovered {
    box-shadow: var(--shadow-lg);
    z-index: 15;
  }

  .window-dragging {
    opacity: 0.85;
    box-shadow: var(--shadow-xl);
    z-index: 100;
    cursor: grabbing;
    transition: none;
  }

  .window-resizing {
    z-index: 100;
    transition: none;
  }

  /* Header */
  .win-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-1) var(--space-2);
    background: color-mix(in srgb, var(--win-color) 12%, var(--surface-0));
    border-bottom: 1px solid color-mix(in srgb, var(--win-color) 20%, transparent);
    cursor: grab;
    user-select: none;
    -webkit-user-select: none;
    min-height: 28px;
    gap: var(--space-1);
  }

  .window-dragging .win-header {
    cursor: grabbing;
  }

  .win-titlebar {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    min-width: 0;
    flex: 1;
  }

  .win-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .win-name {
    font-family: var(--font-body);
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.2;
  }

  .win-actions {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    flex-shrink: 0;
  }

  .win-badge {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 1px 5px;
    border-radius: 3px;
    line-height: 1.4;
    white-space: nowrap;
  }
  .prio-high {
    background: var(--danger-light);
    color: var(--danger);
  }
  .prio-medium {
    background: var(--warning-light);
    color: var(--warning);
  }
  .prio-low {
    background: var(--surface-2);
    color: var(--text-tertiary);
  }

  .win-remove {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border: none;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-tertiary);
    cursor: pointer;
    padding: 0;
    opacity: 0;
    transition: all var(--dur-fast) var(--ease-out);
  }
  .window-item:hover .win-remove,
  .window-hovered .win-remove,
  .window-item:focus-visible .win-remove {
    opacity: 1;
  }
  .win-remove:hover {
    background: var(--danger-light);
    color: var(--danger);
  }

  /* Body */
  .win-body {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    padding: var(--space-1) var(--space-2);
    min-height: 0;
  }

  .win-dim,
  .win-pos {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-tertiary);
    white-space: nowrap;
  }

  /* Resize handles */
  .resize-handle {
    position: absolute;
    z-index: 5;
    transition: background var(--dur-fast) var(--ease-out);
  }

  .resize-e {
    right: 0;
    top: 4px;
    bottom: 4px;
    width: 8px;
    cursor: ew-resize;
  }
  .resize-e:hover,
  .resize-e.active {
    background: color-mix(in srgb, var(--win-color) 15%, transparent);
  }

  .resize-s {
    bottom: 0;
    left: 4px;
    right: 4px;
    height: 8px;
    cursor: ns-resize;
  }
  .resize-s:hover,
  .resize-s.active {
    background: color-mix(in srgb, var(--win-color) 15%, transparent);
  }

  .resize-se {
    right: 0;
    bottom: 0;
    width: 16px;
    height: 16px;
    cursor: nwse-resize;
    border-radius: 0 0 var(--radius-md) 0;
  }
  .resize-se:hover,
  .resize-se.active {
    background: color-mix(in srgb, var(--win-color) 20%, transparent);
  }
  .resize-se::after {
    content: '';
    position: absolute;
    right: 3px;
    bottom: 3px;
    width: 8px;
    height: 8px;
    border-right: 2px solid color-mix(in srgb, var(--win-color) 40%, transparent);
    border-bottom: 2px solid color-mix(in srgb, var(--win-color) 40%, transparent);
    opacity: 0;
    transition: opacity var(--dur-fast) var(--ease-out);
  }
  .window-item:hover .resize-se::after,
  .window-hovered .resize-se::after,
  .resize-se.active::after {
    opacity: 1;
  }

  /* Compact when window is very small */
  @container (max-width: 80px) {
    .win-body { display: none; }
    .win-name { font-size: 9px; }
  }
</style>
