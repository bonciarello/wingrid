<script>
  import { gridCols, gridRows, windows, occupiedCells, addWindowToGrid, removeWindow, moveWindow, resizeWindow, checkCollision, isOutOfBounds } from './store.js';
  import { get } from 'svelte/store';

  let gridEl = $state(null);
  let dragOver = $state(null); // { x, y, w, h, valid }
  let draggedTemplate = $state(null);

  // ---- HTML5 Drag & Drop from panel ----
  function handleDragOver(e) {
    e.preventDefault();
    if (!e.dataTransfer.types.includes('application/wingrid-template')) return;
    e.dataTransfer.dropEffect = 'copy';

    const tpl = draggedTemplate;
    if (!tpl) {
      try {
        const raw = e.dataTransfer.getData('application/wingrid-template');
        draggedTemplate = JSON.parse(raw);
      } catch {}
    }
    if (!draggedTemplate) return;

    const pos = gridPosFromEvent(e, draggedTemplate.w || 3, draggedTemplate.h || 2);
    if (pos) {
      dragOver = pos;
    }
  }

  function handleDragLeave(e) {
    // Only clear if actually leaving the grid
    if (e.currentTarget.contains(e.relatedTarget)) return;
    dragOver = null;
  }

  function handleDrop(e) {
    e.preventDefault();
    if (!draggedTemplate) return;

    const tpl = draggedTemplate;
    const pos = gridPosFromEvent(e, tpl.w || 3, tpl.h || 2);

    if (pos && pos.valid) {
      addWindowToGridAt(tpl, pos.x, pos.y);
    }
    dragOver = null;
    draggedTemplate = null;
  }

  function gridPosFromEvent(e, w, h) {
    if (!gridEl) return null;
    const rect = gridEl.getBoundingClientRect();
    const cols = get(gridCols);
    const rows = get(gridRows);
    const cellW = rect.width / cols;
    const cellH = rect.height / rows;

    const relX = e.clientX - rect.left;
    const relY = e.clientY - rect.top;

    // Snap to cell center
    let cx = Math.floor(relX / cellW - w / 2);
    let cy = Math.floor(relY / cellH - h / 2);

    // Clamp
    cx = Math.max(0, Math.min(cols - w, cx));
    cy = Math.max(0, Math.min(rows - h, cy));

    const collides = checkCollision(get(windows), '__new__', cx, cy, w, h);
    const outOfBounds = isOutOfBounds(cx, cy, w, h, cols, rows);

    return { x: cx, y: cy, w, h, valid: !collides && !outOfBounds };
  }

  function addWindowToGridAt(tpl, x, y) {
    const win = {
      id: 'win_' + Date.now(),
      name: tpl.name,
      color: tpl.color,
      priority: tpl.priority || 'medium',
      x, y,
      w: tpl.w || 3,
      h: tpl.h || 2,
    };
    windows.update(wins => [...wins, win]);
  }

  // ---- Grid cell computation ----
  let gridCells = $derived.by(() => {
    const cols = $gridCols;
    const rows = $gridRows;
    const wins = $windows;
    const cells = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let occupiedBy = null;
        for (const win of wins) {
          if (c >= win.x && c < win.x + win.w && r >= win.y && r < win.y + win.h) {
            occupiedBy = win;
            break;
          }
        }
        cells.push({ c, r, occupiedBy });
      }
    }
    return cells;
  });

  // ---- Track when the drag overlay should show a window from the panel ----
  let dragHighlightStyle = $derived.by(() => {
    if (!dragOver) return '';
    const cols = $gridCols;
    const rows = $gridRows;
    const pctW = (100 / cols);
    const pctH = (100 / rows);
    return `
      left: ${dragOver.x * pctW}%;
      top: ${dragOver.y * pctH}%;
      width: ${dragOver.w * pctW}%;
      height: ${dragOver.h * pctH}%;
    `;
  });
</script>

<div
  class="grid-stage"
  bind:this={gridEl}
  style="--cols: {$gridCols}; --rows: {$gridRows}"
  role="application"
  aria-label="Griglia di layout finestre — trascina qui le finestre dal pannello"
  ondragover={handleDragOver}
  ondragleave={handleDragLeave}
  ondrop={handleDrop}
>
  <!-- Grid pattern cells -->
  {#each gridCells as cell (cell.c + '-' + cell.r)}
    <div
      class="grid-cell"
      class:occupied={!!cell.occupiedBy}
      style={cell.occupiedBy ? `--cell-color: ${cell.occupiedBy.color}18; --cell-border: ${cell.occupiedBy.color}40` : ''}
      aria-label={cell.occupiedBy ? `Occupata da ${cell.occupiedBy.name}` : `Cella ${cell.c+1},${cell.r+1} libera`}
    ></div>
  {/each}

  <!-- Occupied area overlays (merged cells visual) -->
  {#each $windows as win (win.id)}
    {@const pctW = 100 / $gridCols}
    {@const pctH = 100 / $gridRows}
    <div
      class="win-occupied-overlay"
      style="
        left: {win.x * pctW}%;
        top: {win.y * pctH}%;
        width: {win.w * pctW}%;
        height: {win.h * pctH}%;
        background: {win.color}14;
        border: 1px solid {win.color}30;
        border-radius: var(--radius-md);
        pointer-events: none;
      "
    ></div>
  {/each}

  <!-- Windows on grid -->
  {#each $windows as win (win.id)}
    <WindowItem {win} cols={$gridCols} rows={$gridRows} />
  {/each}

  <!-- Drag overlay -->
  {#if dragOver}
    <div
      class="drag-overlay"
      class:invalid={!dragOver.valid}
      style={dragHighlightStyle}
    >
      <span class="drag-overlay-label">
        {dragOver.valid ? 'Rilascia per posizionare' : 'Spazio occupato'}
      </span>
    </div>
  {/if}

  <!-- Empty state -->
  {#if $windows.length === 0 && !dragOver}
    <div class="empty-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="empty-icon">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="4" rx="1"/>
        <rect x="14" y="10" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
      </svg>
      <p class="empty-text">Trascina una finestra qui dal pannello laterale</p>
      <p class="empty-hint">oppure clicca su un modello per posizionarlo automaticamente</p>
    </div>
  {/if}
</div>

<style>
  .grid-stage {
    position: relative;
    display: grid;
    grid-template-columns: repeat(var(--cols), 1fr);
    grid-template-rows: repeat(var(--rows), 1fr);
    width: 100%;
    max-width: 1100px;
    aspect-ratio: var(--cols) / var(--rows);
    background: var(--surface-0);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
    /* Grid pattern via repeating gradients */
    background-image:
      repeating-linear-gradient(
        to right,
        transparent,
        transparent calc(100% / var(--cols) - 0.5px),
        var(--grid-line) calc(100% / var(--cols) - 0.5px),
        var(--grid-line) calc(100% / var(--cols))
      ),
      repeating-linear-gradient(
        to bottom,
        transparent,
        transparent calc(100% / var(--rows) - 0.5px),
        var(--grid-line) calc(100% / var(--rows) - 0.5px),
        var(--grid-line) calc(100% / var(--rows))
      );
  }

  .grid-cell {
    /* Invisible hit areas — grid lines come from .grid-stage background */
    z-index: 0;
    transition: background var(--dur-fast) var(--ease-out);
  }
  .grid-cell.occupied {
    background: var(--cell-color);
  }

  .win-occupied-overlay {
    position: absolute;
    z-index: 1;
    transition: all var(--dur-normal) var(--ease-out);
  }

  /* Drag overlay */
  .drag-overlay {
    position: absolute;
    z-index: 50;
    background: color-mix(in srgb, var(--primary) 20%, transparent);
    border: 2px dashed var(--primary);
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity var(--dur-fast) var(--ease-out);
    pointer-events: none;
  }
  .drag-overlay.invalid {
    background: color-mix(in srgb, var(--danger) 15%, transparent);
    border-color: var(--danger);
  }

  .drag-overlay-label {
    font-family: var(--font-body);
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--primary);
    background: var(--surface-0);
    padding: var(--space-1) var(--space-3);
    border-radius: var(--radius-sm);
    box-shadow: var(--shadow-sm);
    white-space: nowrap;
  }
  .drag-overlay.invalid .drag-overlay-label {
    color: var(--danger);
  }

  /* Empty state */
  .empty-state {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 5;
    pointer-events: none;
    gap: var(--space-2);
  }

  .empty-icon {
    color: var(--text-tertiary);
    opacity: 0.5;
  }

  .empty-text {
    font-family: var(--font-display);
    font-size: var(--text-lg);
    font-weight: 500;
    color: var(--text-tertiary);
    text-align: center;
  }

  .empty-hint {
    font-size: var(--text-sm);
    color: var(--text-tertiary);
    opacity: 0.7;
    text-align: center;
  }

  @media (max-width: 720px) {
    .grid-stage {
      border-radius: var(--radius-md);
    }
    .empty-text {
      font-size: var(--text-md);
    }
  }
</style>
