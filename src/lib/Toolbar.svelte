<script>
  import { gridCols, gridRows, windows, clearGrid, exportConfig, MONITOR_PRESETS } from './store.js';

  let { showPanel = true } = $props();

  let colsInput = $state($gridCols);
  let rowsInput = $state($gridRows);
  let exportMsg = $state('');

  function applyGridSize() {
    const c = Math.max(4, Math.min(64, parseInt(colsInput) || 16));
    const r = Math.max(3, Math.min(36, parseInt(rowsInput) || 9));
    gridCols.set(c);
    gridRows.set(r);
    colsInput = c;
    rowsInput = r;
  }

  function applyPreset(preset) {
    gridCols.set(preset.cols);
    gridRows.set(preset.rows);
    colsInput = preset.cols;
    rowsInput = preset.rows;
  }

  function handleExport() {
    const json = exportConfig();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wingrid-config.json';
    a.click();
    URL.revokeObjectURL(url);
    exportMsg = 'Configurazione esportata!';
    setTimeout(() => exportMsg = '', 2500);
  }

  function handleClear() {
    if ($windows.length === 0) return;
    if (confirm('Rimuovere tutte le finestre dalla griglia?')) {
      clearGrid();
    }
  }
</script>

<div class="toolbar">
  <div class="toolbar-left">
    <button class="btn-icon" onclick={() => showPanel = !showPanel} aria-label={showPanel ? 'Nascondi pannello' : 'Mostra pannello'} title={showPanel ? 'Nascondi pannello' : 'Mostra pannello'}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        {#if showPanel}
          <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/>
        {:else}
          <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="M15 3v18"/>
        {/if}
      </svg>
    </button>

    <h1 class="toolbar-title">WinGrid</h1>
  </div>

  <div class="toolbar-center">
    <label class="preset-label" for="preset-select">Layout:</label>
    <select id="preset-select" class="preset-select" onchange={(e) => {
      const preset = MONITOR_PRESETS.find(p => p.name === e.target.value);
      if (preset) applyPreset(preset);
    }}>
      <option value="">Personalizzato</option>
      {#each MONITOR_PRESETS as preset}
        <option value={preset.name}>{preset.name} ({preset.cols}×{preset.rows})</option>
      {/each}
    </select>

    <div class="size-group" role="group" aria-label="Dimensioni griglia">
      <label class="size-label" for="grid-cols">Colonne</label>
      <input
        id="grid-cols"
        type="number"
        class="size-input"
        min="4" max="64"
        bind:value={colsInput}
        onchange={applyGridSize}
      />
      <span class="size-sep">×</span>
      <label class="size-label" for="grid-rows">Righe</label>
      <input
        id="grid-rows"
        type="number"
        class="size-input"
        min="3" max="36"
        bind:value={rowsInput}
        onchange={applyGridSize}
      />
    </div>
  </div>

  <div class="toolbar-right">
    <button class="btn btn-outline" onclick={handleClear} disabled={$windows.length === 0}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
      Pulisci
    </button>
    <button class="btn btn-primary" onclick={handleExport}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      Esporta JSON
    </button>
    {#if exportMsg}
      <span class="export-toast" role="status">{exportMsg}</span>
    {/if}
  </div>
</div>

<style>
  .toolbar {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    flex-wrap: wrap;
    min-height: 44px;
  }

  .toolbar-left {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .toolbar-title {
    font-family: var(--font-display);
    font-size: var(--text-xl);
    font-weight: 700;
    color: var(--primary);
    letter-spacing: -0.02em;
    line-height: 1;
    white-space: nowrap;
  }

  .btn-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--surface-0);
    color: var(--text-secondary);
    cursor: pointer;
    transition: all var(--dur-fast) var(--ease-out);
  }
  .btn-icon:hover {
    background: var(--surface-2);
    color: var(--text);
  }
  .btn-icon:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
  }

  .toolbar-center {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex: 1;
    min-width: 0;
    flex-wrap: wrap;
  }

  .preset-label {
    font-size: var(--text-sm);
    color: var(--text-secondary);
    white-space: nowrap;
  }

  .preset-select {
    font-family: var(--font-body);
    font-size: var(--text-sm);
    padding: var(--space-1) var(--space-3);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--surface-0);
    color: var(--text);
    cursor: pointer;
    min-width: 150px;
    height: 32px;
  }
  .preset-select:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
  }

  .size-group {
    display: flex;
    align-items: center;
    gap: var(--space-1);
  }

  .size-label {
    font-size: var(--text-xs);
    color: var(--text-tertiary);
    font-family: var(--font-mono);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .size-input {
    width: 42px;
    height: 28px;
    text-align: center;
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--surface-0);
    color: var(--text);
    padding: 0 var(--space-1);
    -moz-appearance: textfield;
  }
  .size-input::-webkit-outer-spin-button,
  .size-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  .size-input:focus {
    border-color: var(--primary);
    outline: none;
    box-shadow: 0 0 0 2px var(--primary-light);
  }

  .size-sep {
    font-family: var(--font-mono);
    color: var(--text-tertiary);
    font-weight: 500;
  }

  .toolbar-right {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    position: relative;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-1) var(--space-3);
    font-family: var(--font-body);
    font-size: var(--text-sm);
    font-weight: 500;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all var(--dur-fast) var(--ease-out);
    white-space: nowrap;
    min-height: 32px;
    border: 1px solid transparent;
  }

  .btn-primary {
    background: var(--primary);
    color: #fff;
    border-color: var(--primary);
  }
  .btn-primary:hover {
    background: var(--primary-hover);
  }

  .btn-outline {
    background: var(--surface-0);
    color: var(--text-secondary);
    border-color: var(--border);
  }
  .btn-outline:hover {
    background: var(--surface-2);
    color: var(--text);
  }
  .btn-outline:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .btn:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
  }

  .export-toast {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: var(--space-1);
    background: var(--text);
    color: #fff;
    font-size: var(--text-xs);
    padding: var(--space-1) var(--space-3);
    border-radius: var(--radius-sm);
    white-space: nowrap;
    animation: toastIn var(--dur-normal) var(--ease-out);
  }

  @keyframes toastIn {
    from { opacity: 0; transform: translateY(-4px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @media (max-width: 720px) {
    .toolbar {
      flex-direction: column;
      align-items: stretch;
      gap: var(--space-2);
    }
    .toolbar-center {
      flex-wrap: wrap;
    }
    .toolbar-right {
      justify-content: flex-end;
    }
    .preset-select {
      min-width: 120px;
    }
  }
</style>
