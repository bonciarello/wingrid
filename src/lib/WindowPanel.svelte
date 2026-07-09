<script>
  import { templates, WINDOW_COLORS, addWindowToGrid, uid } from './store.js';
  import { windows, gridCols, gridRows, checkCollision } from './store.js';
  import { get } from 'svelte/store';

  let newName = $state('');
  let newColor = $state(WINDOW_COLORS[0].hex);
  let newPriority = $state('medium');
  let newW = $state(4);
  let newH = $state(3);
  let showAddForm = $state(false);
  let errors = $state({});

  function validate() {
    const errs = {};
    if (!newName.trim()) errs.name = 'Il nome è obbligatorio';
    if (newW < 1 || newW > 64) errs.w = 'Larghezza tra 1 e 64';
    if (newH < 1 || newH > 36) errs.h = 'Altezza tra 1 e 36';
    errors = errs;
    return Object.keys(errs).length === 0;
  }

  function handleAdd() {
    if (!validate()) return;
    addWindowToGrid({
      name: newName.trim(),
      color: newColor,
      priority: newPriority,
      w: newW,
      h: newH,
    });
    newName = '';
    newW = 4;
    newH = 3;
    showAddForm = false;
    errors = {};
  }

  function handleAddTemplate(tpl) {
    addWindowToGrid(tpl);
  }

  function handleDragStart(e, tpl) {
    e.dataTransfer.setData('application/wingrid-template', JSON.stringify(tpl));
    e.dataTransfer.effectAllowed = 'copy';
  }

  function priorityLabel(p) {
    if (p === 'high') return 'Alta';
    if (p === 'medium') return 'Media';
    return 'Bassa';
  }
</script>

<section class="panel" aria-labelledby="panel-heading">
  <div class="panel-header">
    <h2 id="panel-heading" class="panel-title">Libreria finestre</h2>
    <button
      class="btn-add"
      onclick={() => showAddForm = !showAddForm}
      aria-expanded={showAddForm}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        {showAddForm ? '<line x1="5" y1="12" x2="19" y2="12"/>' : '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>'}
      </svg>
      {showAddForm ? 'Chiudi' : 'Nuova'}
    </button>
  </div>

  {#if showAddForm}
    <form class="add-form" onsubmit={(e) => { e.preventDefault(); handleAdd(); }}>
      <div class="field">
        <label for="win-name">Nome</label>
        <input
          id="win-name"
          type="text"
          bind:value={newName}
          placeholder="es. Browser, Terminale…"
          maxlength="40"
          aria-invalid={errors.name ? 'true' : undefined}
          aria-describedby={errors.name ? 'err-name' : undefined}
        />
        {#if errors.name}<span id="err-name" class="field-error">{errors.name}</span>{/if}
      </div>

      <div class="field">
        <label for="win-color">Colore</label>
        <div class="color-picker">
          {#each WINDOW_COLORS as c}
            <button
              type="button"
              class="color-swatch"
              class:active={newColor === c.hex}
              style="background: {c.hex}"
              onclick={() => newColor = c.hex}
              aria-label={c.name}
              title={c.name}
            ></button>
          {/each}
        </div>
      </div>

      <div class="field">
        <label for="win-prio">Priorità</label>
        <select id="win-prio" bind:value={newPriority}>
          <option value="high">Alta</option>
          <option value="medium">Media</option>
          <option value="low">Bassa</option>
        </select>
      </div>

      <div class="field-row">
        <div class="field">
          <label for="win-w">Largh. (celle)</label>
          <input id="win-w" type="number" bind:value={newW} min="1" max="64" aria-invalid={errors.w ? 'true' : undefined} />
          {#if errors.w}<span class="field-error">{errors.w}</span>{/if}
        </div>
        <div class="field">
          <label for="win-h">Alt. (celle)</label>
          <input id="win-h" type="number" bind:value={newH} min="1" max="36" aria-invalid={errors.h ? 'true' : undefined} />
          {#if errors.h}<span class="field-error">{errors.h}</span>{/if}
        </div>
      </div>

      <button type="submit" class="btn-submit">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Aggiungi alla griglia
      </button>
    </form>
  {/if}

  <div class="panel-templates">
    <h3 class="templates-heading">Modelli rapidi</h3>
    <p class="templates-hint">Trascina sulla griglia o clicca per aggiungere</p>

    {#each $templates as tpl (tpl.id)}
      <button
        class="template-card"
        draggable="true"
        ondragstart={(e) => handleDragStart(e, tpl)}
        onclick={() => handleAddTemplate(tpl)}
        style="--tpl-color: {tpl.color}"
      >
        <span class="tpl-color-dot" style="background: {tpl.color}"></span>
        <span class="tpl-info">
          <span class="tpl-name">{tpl.name}</span>
          <span class="tpl-meta">{tpl.w}×{tpl.h} · {priorityLabel(tpl.priority)}</span>
        </span>
        <span class="tpl-arrow" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </span>
      </button>
    {/each}
  </div>
</section>

<style>
  .panel {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--border);
  }

  .panel-title {
    font-family: var(--font-display);
    font-size: var(--text-md);
    font-weight: 600;
    color: var(--text);
    letter-spacing: -0.01em;
  }

  .btn-add {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-1) var(--space-2);
    font-family: var(--font-body);
    font-size: var(--text-xs);
    font-weight: 500;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--surface-0);
    color: var(--primary);
    cursor: pointer;
    min-height: 28px;
    transition: all var(--dur-fast) var(--ease-out);
  }
  .btn-add:hover {
    background: var(--primary-light);
  }
  .btn-add:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
  }

  /* Add form */
  .add-form {
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    background: var(--surface-0);
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .field label {
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .field input,
  .field select {
    font-family: var(--font-body);
    font-size: var(--text-sm);
    padding: var(--space-1) var(--space-2);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--surface-0);
    color: var(--text);
    min-height: 32px;
  }
  .field input:focus,
  .field select:focus {
    border-color: var(--primary);
    outline: none;
    box-shadow: 0 0 0 2px var(--primary-light);
  }
  .field input[aria-invalid="true"] {
    border-color: var(--danger);
    box-shadow: 0 0 0 2px var(--danger-light);
  }

  .field-error {
    font-size: var(--text-xs);
    color: var(--danger);
    font-weight: 500;
  }

  .field-row {
    display: flex;
    gap: var(--space-3);
  }
  .field-row .field {
    flex: 1;
  }
  .field-row .field input {
    width: 100%;
    text-align: center;
    font-family: var(--font-mono);
  }

  .color-picker {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1);
  }

  .color-swatch {
    width: 28px;
    height: 28px;
    border-radius: var(--radius-sm);
    border: 2px solid transparent;
    cursor: pointer;
    transition: transform var(--dur-fast) var(--ease-out);
    padding: 0;
  }
  .color-swatch:hover {
    transform: scale(1.15);
  }
  .color-swatch.active {
    border-color: var(--text);
    transform: scale(1.1);
    box-shadow: 0 0 0 2px #fff, 0 0 0 4px var(--text);
  }

  .btn-submit {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-1);
    padding: var(--space-2) var(--space-3);
    font-family: var(--font-body);
    font-size: var(--text-sm);
    font-weight: 600;
    border: none;
    border-radius: var(--radius-sm);
    background: var(--primary);
    color: #fff;
    cursor: pointer;
    min-height: 36px;
    transition: background var(--dur-fast) var(--ease-out);
  }
  .btn-submit:hover {
    background: var(--primary-hover);
  }
  .btn-submit:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
  }

  /* Templates */
  .panel-templates {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-3) var(--space-4);
  }

  .templates-heading {
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: var(--space-1);
  }

  .templates-hint {
    font-size: var(--text-xs);
    color: var(--text-tertiary);
    margin-bottom: var(--space-3);
  }

  .template-card {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    width: 100%;
    padding: var(--space-2) var(--space-3);
    margin-bottom: var(--space-2);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--surface-0);
    cursor: grab;
    transition: all var(--dur-fast) var(--ease-out);
    text-align: left;
    font-family: inherit;
    min-height: 44px;
    position: relative;
  }
  .template-card:hover {
    border-color: var(--border-strong);
    box-shadow: var(--shadow-sm);
    transform: translateY(-1px);
  }
  .template-card:active {
    cursor: grabbing;
    transform: scale(0.98);
    box-shadow: var(--shadow-md);
  }
  .template-card:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
  }

  .tpl-color-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .tpl-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .tpl-name {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--text);
    line-height: 1.3;
  }

  .tpl-meta {
    font-size: var(--text-xs);
    color: var(--text-tertiary);
    font-family: var(--font-mono);
  }

  .tpl-arrow {
    color: var(--text-tertiary);
    opacity: 0;
    transition: opacity var(--dur-fast) var(--ease-out);
  }
  .template-card:hover .tpl-arrow {
    opacity: 1;
  }
</style>
