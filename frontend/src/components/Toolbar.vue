<script setup lang="ts">
  import { computed } from 'vue';
  import { storeToRefs } from 'pinia';
  import { Download, HelpCircle, ListChecks, Moon, Plus, Save, Sun, UploadCloud, Zap, ScrollText, Trash2, FileCheck, FileText } from 'lucide-vue-next';

  import { useQuestlineStore } from '../stores/questlineStore';
  import type { ExposedQuestBoard } from '../types';

  const store = useQuestlineStore();
  const { currQuestline, isLoading, isDarkMode, hasUnsavedChanges } = storeToRefs(store);

  const props = defineProps<{ questBoardInstance: ExposedQuestBoard | null }>();

  const questlineProgress = computed(() => {
    if (!currQuestline.value || !currQuestline.value.quests) {
      return '0 / 0';
    }
    const completed = currQuestline.value.quests.filter(q => q.completed).length;
    const total = currQuestline.value.quests.length;
    return `${completed} / ${total}`;
  });

  const handleAddQuest = () => {
    if (props.questBoardInstance && typeof props.questBoardInstance.addNewQuestAtViewportCenter === 'function') {
      props.questBoardInstance.addNewQuestAtViewportCenter();
    } else {
      console.warn("QuestBoard instance or method not available in Toolbar.");
      store.addQuestNode({ x: Math.random() * 200 + 50, y: Math.random() * 200 + 50 });
    }
  };

  const handleNameInput = (event: Event) => {
    const target = event.target as HTMLInputElement;
    store.updateQuestlineName(target.value);
  };

</script>

<template>
  <div class="toolbar">
    <div class="toolbar-title-container">
      <ScrollText :size="20" class="toolbar-title-icon"/>
      <span class="toolbar-title">Questlines</span>
    </div>
    <div class="toolbar-spacer"></div>

    <input type="text" class="toolbar-input questline-name-input" placeholder="Questline Name" name="questline-name"
      v-model="currQuestline.name" @input="handleNameInput"
    />
    <div class="save-status-container" :title="hasUnsavedChanges ? 'Unsaved changes' : 'All changes saved'">
      <FileText v-if="hasUnsavedChanges" :size="24" class="unsaved-icon"/>
      <FileCheck v-else :size="24" class="saved-icon"/>
    </div>

    <!-- Questline stats -->
    <div v-if="currQuestline && currQuestline.id" class="quest-stats" title="Questline Progress">
      <ListChecks :size="16" class="stats-icon"/>
      <span>{{ questlineProgress }} </span>
    </div>
    <div class="toolbar-divider"></div>

    <!-- Questline actions -->
    <div class="toolbar-group">
      <button class="btn btn-primary" @click="store.loadQuestline(null)" title="New Questline">
        <Plus :size="16" class="btn-icon"/> New
      </button>

      <button class="btn btn-secondary" @click="store.openLoadModal" title="Load Questline">
        <UploadCloud :size="16" class="btn-icon"/> Load
      </button>

      <button class="btn btn-success" @click="store.saveCurrentQuestline" title="Save Questline" :disabled="isLoading">
        <Save :size="16" class="btn-icon"/> Save
      </button>

      <button class="btn btn-danger" @click="store.deleteCurrentQuestline" title="Delete Saved Questline" :disabled="isLoading">
        <Trash2 :size="16" class="btn-icon"/> Delete
      </button>

      <button class="btn btn-success" @click="store.triggerExport('json')" title="Export Questline to JSON" :disabled="isLoading">
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
      <button class="btn btn-secondary icon-only" @click="store.openHelpModal()" title="Help & About">
        <HelpCircle :size="18" class="btn-icon" />
      </button>

      <button class="btn btn-secondary icon-only" @click="store.toggleDarkMode" :title="isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'">
        <Moon v-if="!isDarkMode" :size="16" class="btn-icon"/>
        <Sun v-else :size="18" class="btn-icon"/>
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

  .toolbar-title-container {
    display: flex;
    align-items: center;
    margin-right: 20px;
  }

  .toolbar-title-icon {
    margin-right: 8px;
    color: var(--toolbar-text);
    flex-shrink: 0;
    position: relative;
    top: 2px;
  }

  .toolbar-title {
    font-size: 1.2em;
    font-weight: bold;
    white-space: nowrap;
    color: var(--toolbar-text);
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
    flex-shrink: 0;
  }

  .toolbar-divider {
    width: 1px;
    height: 25px;
    background-color: #555;
    margin: 0 10px;
    flex-shrink: 0;
  }

  .toolbar-spacer {
    flex-grow: 1;
  }

  .questline-name-input {
    padding: 8px 12px;
    border: 1px solid var(--toolbar-input-border);
    border-radius: 4px;
    background-color: var(--toolbar-input-bg);
    color: var(--toolbar-text);
    flex-grow: 0;
    flex-shrink: 0;
    flex-basis: 250px;
    margin-right: 8px;
  }

  .save-status-container {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    margin-right: 10px;
    flex-shrink: 0;
  }

  .unsaved-icon {
    color: var(--warning-color);
  }

  .saved-icon {
    color: var(--success-color);
  }

  .quest-stats {
    display: inline-flex;
    align-items: center;
    padding: 6px 10px;
    margin-right: 10px;
    font-size: 0.9em;
    color: var(--toolbar-text);
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    white-space: nowrap;
    flex-shrink: 0;
  }
  html.dark .quest-stats {
    background-color: rgba(0, 0, 0, 0.2);
  }

  .stats-icon {
    margin-right: 8px;
    opacity: 0.8;
  }

</style>
