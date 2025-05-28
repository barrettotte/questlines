<script setup lang="ts">
  import { storeToRefs } from 'pinia';
  import { Plus, Trash2, Save, Download, UploadCloud, FileJson, FileText, Zap } from 'lucide-vue-next';

  import { useQuestStore } from '../stores/questStore';

  const store = useQuestStore();
  const { currQuestline, isLoading } = storeToRefs(store);

</script>

<template>
  <div class="toolbar">
    <span class="toolbar-title">Questlines</span>
    <input type="text" class="toolbar-input" placeholder="Questline Name" v-model="currQuestline.name"/>

    <div class="toolbar-group">
      <button class="btn btn-primary" @click="store.loadQuestline(null)" title="New Questline">
        <Plus :size="16" class="btn-icon"/> New
      </button>
      <button class="btn btn-secondary" @click="store.toggleLoadModal(true)" title="Load Questline">
        <UploadCloud :size="16" class="btn-icon"/> Load
      </button>
      <button class="btn btn-success" @click="store.saveCurrentQuestline" :disabled="isLoading" title="Save Questline">
        <Save :size="16" class="btn-icon"/> {{ isLoading ? 'Saving...' : 'Save' }}
      </button>
    </div>
    <div class="toolbar-divider"></div>

    <div class="toolbar-group">
      <button class="btn btn-info" @click="store.addQuestNode" title="Add New Quest">
        <Zap :size="16" class="btn-icon"/> Add Quest
      </button>
    </div>
    <div class="toolbar-divider"></div>

    <div class="toolbar-group">
      <div class="toolbar-export-menu">
        <button class="btn btn-info" title="Export">
          <Download :size="16" class="btn-icon"/> Export
        </button>
        <div class="dropdown-content">
          <a href="#" @click.prevent="store.triggerExport('json')">
            <FileJson :size="16"/> JSON
          </a>
          <a href="#" @click.prevent="store.triggerExport('yaml')">
            <FileText :size="16"/> YAML
          </a>
        </div>
      </div>
      <button class="btn btn-danger" @click="store.deleteCurrentQuestline" :disabled="isLoading" title="Delete Saved Questline">
        <Trash2 :size="16" class="btn-icon"/> Delete
      </button>
    </div>

  </div>
</template>

<style scoped>
  .toolbar-input {
    margin-right: 10px;
  }
</style>
