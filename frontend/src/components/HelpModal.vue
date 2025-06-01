<script setup lang="ts">
  import { storeToRefs } from 'pinia';
  import { X, Keyboard, Info } from 'lucide-vue-next';

  import { useQuestStore } from '../stores/questStore';

  const store = useQuestStore();
  const { showHelpModal } = storeToRefs(store);

</script>

<template>
  <div v-if="showHelpModal" class="modal-overlay" @click.self="store.closeHelpModal()">
    <div class="modal-content help-modal-content">
      <div class="modal-header">
        <h3>Help & About</h3>
        <button class="close-btn" @click="store.closeHelpModal()" title="Close">
          <X :size="24" />
        </button>
      </div>

      <div class="modal-body">
        <div class="help-section">
          <h4><Keyboard :size="18" class="help-icon"/> Key Shortcuts</h4>
          <ul class="help-list">
            <li><strong>Delete:</strong> Deletes selected quest(s) or edge(s).</li>
            <li><strong>Shift + Drag:</strong> Box selection for multiple items.</li>
            <li><strong>Shift + Click:</strong> Add/remove individual item to/from selection.</li>
            <li><strong>Ctrl + S:</strong> Save current questline.</li>
            <li><strong>Ctrl + Spacebar:</strong> Add a new quest to current questline.</li>
          </ul>
        </div>
        <div class="help-section-divider"></div>

        <div class="help-section">
          <h4><Info :size="18" class="help-icon"/> About</h4>
          <div class="help-text-content">
            <p class="small-text">An app to build questlines for organized and trackable self-learning goals.</p>
            <p class="small-text">Built with Vue.js, Go, SQLite, and VueFlow.</p>
            <p><a href="https://github.com/barrettotte/questlines">https://github.com/barrettotte/questlines</a></p>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-primary" @click="store.closeHelpModal()">Close</button>
      </div>

    </div>
  </div>
</template>

<style scoped>
  .help-modal-content {
    max-width: 600px;
  }

  .help-section {
    margin-bottom: 20px;
  }
  .help-section:last-child {
    margin-bottom: 0;
  }

  .help-section h4 {
    font-size: 1.1em;
    font-weight: 600;
    margin-top: 0;
    margin-bottom: 16px;
    color: var(--text-color);
    display: flex;
    align-items: center;
  }
  html.dark .help-section h4 {
    color: var(--text-color);
  }
  
  .help-icon {
    margin-right: 8px;
  }

  .help-list,
  .help-text-content {
    padding-left: 25px;
  }

  .help-section a {
    color: var(--text-color);
  }
  .help-section a:hover {
    color: blue;
  }

  .help-list {
    list-style-type: none;
    margin-top: 5px;
    margin-bottom: 10px;
  }

  .help-list li {
    margin-bottom: 6px;
  }

  .help-text-content p {
    margin-top: 0;
    margin-bottom: 8px;
    line-height: 1.6;
  }

  .help-section .small-text {
    font-size: 0.9em;
    opacity: 0.9;
  }

  .help-section .made-with {
    opacity: 0.7;
    margin-top: 15px;
    font-style: italic;
  }

  .help-section-divider {
    height: 1px;
    background-color: var(--border-color);
    margin: 20px 0;
  }
  
</style>
