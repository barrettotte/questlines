<script setup lang="ts">
  import { ref } from 'vue';
  import { storeToRefs } from 'pinia';
  import { X, Upload, ListChecks } from 'lucide-vue-next';

  import { useQuestStore } from '../stores/questStore';
  import type { Questline } from '@/types';

  const store = useQuestStore();
  const { allQuestlineInfos, showLoadModal, isLoading } = storeToRefs(store);

  const fileInputRef = ref<HTMLInputElement | null>(null);

  const selectAndLoad = (id: string) => {
    store.loadQuestline(id);
    store.closeLoadModal();
  };

  const triggerFileInput = () => {
    fileInputRef.value?.click();
  };

  const handleFileLoad = (event: Event) => {
    const target = event.target as HTMLInputElement;

    if (target.files && target.files[0]) {
      const file = target.files[0];
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const fileContent = e.target?.result as string;
          const jsonData = JSON.parse(fileContent) as Questline;
          if (store.setQuestlineFromLoadedData(jsonData)) {
            store.closeLoadModal();
          }
        } catch (error) {
          console.error("Error reading or parsing file:", e);
          store.handleError(error, "Failed to load questline from file.");
        }
      };

      reader.onerror = (e) => {
        console.error("File reading error:", e);
        store.handleError(e, "Error reading selected file.");
      };

      reader.readAsText(file);
    }

    // reset file input
    if (target) {
      target.value = '';
    }
  };

</script>

<template>
  <div v-if="showLoadModal" class="modal-overlay" @click.self="store.closeLoadModal()">
    <div class="modal-content">
      <div class="modal-header">
        <span>Load Questline</span>
        <button class="close-btn" @click="store.closeLoadModal()">
          <X :size="20"/>
        </button>
      </div>

      <div class="modal-body">
        <div class="load-from-server">
          <p v-if="!isLoading && (!allQuestlineInfos || allQuestlineInfos.length === 0)" class="empty-list-message">
            No saved questlines found on server.
          </p>
          <div v-if="isLoading" class="loading-text">Loading from server...</div>

          <ul v-if="!isLoading && allQuestlineInfos && allQuestlineInfos.length > 0" class="modal-list">
            <li v-for="ql in allQuestlineInfos" :key="ql.id" @click="selectAndLoad(ql.id)">
              <span class="questline-name">{{ ql.name || 'Untitled' }}</span>
              <div class="questline-meta">
                <div class="questline-progress-container" title="Completed Quests / Total Quests">
                  <ListChecks :size="14" class="progress-list-icon"/>
                  <span>{{ ql.completedQuests }}/{{ ql.totalQuests }}</span>
                </div>
                <span class="questline-id-display">[{{ ql.id.slice(0,8) }}...]</span>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <div class="modal-footer">
        <div class="footer-left">
          <button class="btn btn-secondary btn-import" @click="triggerFileInput">
            <Upload :size="16" class="btn-icon"/> Import
          </button>
          <input type="file" ref="fileInputRef" @change="handleFileLoad" accept=".json" style="display: none;"/>
        </div>

        <div class="footer-right">
          <button class="btn btn-primary" @click="store.closeLoadModal()">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

  .file-load-label {
    font-size: 0.9em;
    color: var(--text-color);
    margin-bottom: 8px;
  }

  .load-from-server .empty-list-message,
  .load-from-server .loading-text {
    text-align: center;
    padding: 15px 0;
    color: var(--text-color);
    background-color: var(--border-color);
  }

  .modal-list li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    cursor: pointer;
    border-bottom: 1px solid var(--border-color);
  }
  .modal-list li:last-child {
    border-bottom: none;
  }
  .modal-list li:hover {
    background-color: rgba(0,0,0,0.05);
  }
  html.dark .modal-list li:hover {
    background-color: rgba(255,255,255,0.08);
  }

  .questline-name {
    font-weight: 500;
    margin-right: 10px;
    flex-shrink: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .questline-meta {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 0.85em;
    color: var(--text-color);
    white-space: nowrap;
    flex-shrink: 0;
  }

  .questline-progress-container {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 3px 6px;
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
    font-size: 0.95em;
  }
  .html.dark .questline-progress-container {
    background-color: rgba(0, 0, 0, 0.2);
  }

  .progress-list-icon {
    flex-shrink: 0;
  }

  .questline-id-display {
    padding-left: 6px;
    color: var(--text-color);
    opacity: 0.8;
  }

  .modal-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 30px;
    margin-top: 0;
  }

  .btn-import {
    padding: 8px 15px;
  }

</style>
