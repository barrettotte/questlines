<script setup lang="ts">
  import { storeToRefs } from 'pinia';
  import { Plus, Trash2, Save, Download, UploadCloud, Zap, Moon, Sun, HelpCircle } from 'lucide-vue-next';

  import { useQuestStore } from '../stores/questStore';
  import type { ExposedQuestBoard } from '../types';

  const store = useQuestStore();
  const { currQuestline, isLoading, isDarkMode } = storeToRefs(store);

  const props = defineProps<{
    questBoardInstance: ExposedQuestBoard | null
  }>();

  const handleAddQuest = () => {
    if (props.questBoardInstance && typeof props.questBoardInstance.addNewQuestAtViewportCenter === 'function') {
      props.questBoardInstance.addNewQuestAtViewportCenter();
    } else {
      console.warn("QuestBoard instance or method not available in Toolbar.");
      store.addQuestNode({ x: Math.random() * 200 + 50, y: Math.random() * 200 + 50 });
    }
  };

</script>

<template>
  <div class="toolbar">
    <span class="toolbar-title">Questlines</span>
    <input type="text" class="toolbar-input" placeholder="Questline Name" name="questline-name" v-model="currQuestline.name"/>

    <!-- Questline actions -->
    <div class="toolbar-group">
      <button class="btn btn-primary" @click="store.loadQuestline(null)" title="New Questline">
        <Plus :size="16" class="btn-icon"/> New
      </button>

      <button class="btn btn-secondary" @click="store.openLoadModal" title="Load Questline">
        <UploadCloud :size="16" class="btn-icon"/> Load
      </button>

      <button class="btn btn-success" @click="store.saveCurrentQuestline" :disabled="isLoading" title="Save Questline">
        <Save :size="16" class="btn-icon"/> {{ isLoading ? 'Saving...' : 'Save' }}
      </button>

      <button class="btn btn-danger" @click="store.deleteCurrentQuestline" :disabled="isLoading" title="Delete Saved Questline">
        <Trash2 :size="16" class="btn-icon"/> Delete
      </button>

      <button class="btn btn-success" @click="store.triggerExport('json')" title="Export Questline to JSON">
        <Download :size="16" class="btn-icon"/> Export
      </button>
    </div>
    <div class="toolbar-divider"></div>

    <!-- Quest actions -->
    <div class="toolbar-group">
      <button class="btn btn-info" @click="handleAddQuest" title="Add New Quest">
        <Zap :size="16" class="btn-icon"/> Add Quest
      </button>
    </div>
    <div class="toolbar-divider"></div>

    <!-- Misc actions -->
    <div class="toolbar-group">
      <button class="btn btn-secondary" @click="store.openHelpModal()" title="Help & About">
        <HelpCircle :size="16" class="btn-icon" /> Help
      </button>

      <button class="btn btn-secondary icon-only" @click="store.toggleDarkMode" :title="isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'">
        <Moon v-if="!isDarkMode" :size="16" class="btn-icon"/>
        <Sun v-else :size="16" class="btn-icon"/>
      </button>
    </div>
  </div>
</template>

<style scoped>
  .toolbar {
    background-color: var(--toolbar-bg);
    color: var(--toolbar-text);
    padding: 10px 15px;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    z-index: 100;
    transition: background-color 0.2s ease, color 0.2s ease;
  }

  .toolbar-title {
    font-size: 1.2em;
    font-weight: bold;
    margin-right: 20px;
    white-space: nowrap;
  }

  .toolbar-input {
    padding: 8px 12px;
    border: 1px solid var(--toolbar-input-border);;
    border-radius: 4px;
    background-color: var(--toolbar-input-bg);
    color: var(--toolbar-text);
    flex-grow: 1;
    min-width: 200px;
    transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
  }

  .toolbar-group {
    display: flex;
    align-items: center;
  }

  .toolbar-divider {
    width: 1px;
    height: 25px;
    background-color: #555;
    margin: 0 10px;
  }

</style>
