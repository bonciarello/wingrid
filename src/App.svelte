<script>
  import Toolbar from './lib/Toolbar.svelte';
  import WindowPanel from './lib/WindowPanel.svelte';
  import Grid from './lib/Grid.svelte';
  import { gridCols, gridRows } from './lib/store.js';

  let showPanel = $state(true);
</script>

<div class="app-shell">
  <header class="app-header">
    <Toolbar bind:showPanel />
  </header>

  <div class="app-body">
    {#if showPanel}
      <aside class="app-panel" aria-label="Libreria finestre">
        <WindowPanel />
      </aside>
    {/if}

    <main class="app-main" aria-label="Griglia di lavoro">
      <Grid />
    </main>
  </div>

  <footer class="app-footer">
    <span>WinGrid</span>
    <span class="footer-dim">{$gridCols}×{$gridRows}</span>
  </footer>
</div>

<style>
  .app-shell {
    display: flex;
    flex-direction: column;
    height: 100dvh;
    overflow: hidden;
  }

  .app-header {
    flex-shrink: 0;
    background: var(--surface-0);
    border-bottom: 1px solid var(--border);
    padding: var(--space-2) var(--space-4);
    z-index: 10;
  }

  .app-body {
    flex: 1;
    display: flex;
    overflow: hidden;
    min-height: 0;
  }

  .app-panel {
    width: 280px;
    flex-shrink: 0;
    border-right: 1px solid var(--border);
    background: var(--surface-1);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }

  .app-main {
    flex: 1;
    overflow: auto;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: var(--space-6);
    background: var(--surface-0);
  }

  .app-footer {
    flex-shrink: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-1) var(--space-4);
    background: var(--surface-1);
    border-top: 1px solid var(--border);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--text-tertiary);
    letter-spacing: 0.04em;
  }

  .footer-dim {
    color: var(--text-secondary);
  }

  /* Mobile */
  @media (max-width: 720px) {
    .app-body {
      flex-direction: column;
    }
    .app-panel {
      width: 100%;
      max-height: 40vh;
      border-right: none;
      border-bottom: 1px solid var(--border);
    }
    .app-main {
      padding: var(--space-3);
    }
  }
</style>
