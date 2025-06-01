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
  .toolbar-input {
    margin-right: 10px;
  }
</style>
