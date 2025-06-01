<script setup lang="ts">
  import { Handle, Position, type NodeProps } from '@vue-flow/core';
  import { computed } from 'vue';
  import { Edit3, Trash2, ClipboardList } from 'lucide-vue-next';

  import type { Quest } from '../types';
  import { useQuestStore } from '../stores/questStore';

  interface CustomNodeProps extends NodeProps {
    data: Quest;
  }

  const props = defineProps<CustomNodeProps>();

  const store = useQuestStore();
  const questData = computed(() => props.data);

  const handleEdit = () => {
    store.openQuestForEdit(questData.value);
  };

  const handleDelete = () => {
    store.removeQuestNodes([props.data.id]);
  };

  const nodeStyle = computed(() => ({
    borderColor: questData.value.color || 'var(--node-border)',
  }));

  const questProgress = computed(() => {
    if (!questData.value.objectives || questData.value.objectives.length === 0) {
      return null;
    }
    const completed = questData.value.objectives.filter(o => o.completed).length;
    return `${completed}/${questData.value.objectives.length}`;
  });

</script>

<template>
  <div class="quest-node" :style="nodeStyle" :title="questData.title" 
    :class="{ 'is-selected': selected, 'is-dragging': dragging }"
  >
    <div class="quest-header">{{ questData.title || 'Untitled' }}</div>
    <div class="quest-spacer"></div>

    <div class="quest-footer">
      <div v-if="questProgress" class="quest-progress">
        <ClipboardList :size="13" class="progress-icon"/> <span>{{ questProgress }}</span>
      </div>
      <div v-else class="progress-placeholder"></div>

      <div class="quest-actions">
        <button @click.stop="handleEdit" title="Edit Quest" class="edit-btn">
          <Edit3 :size="13"/>
        </button>
        <button @click.stop="handleDelete" title="Delete Quest" class="delete-btn">
          <Trash2 :size="13"/>
        </button>
      </div>

      <Handle type="source" :position="Position.Right"/>
      <Handle type="target" :position="Position.Left"/>
    </div>
  </div>
</template>

<style scoped>

  .quest-node {
    display: flex;
    flex-direction: column;
    min-width: 200px;
    max-width: 275px;
    min-height: 70px;
    box-sizing: border-box;
    padding: 10px 12px;
    
    text-align: center;
    font-size: 14px;
    border-width: 2px;
    border-style: solid;
    border-radius: 8px;
    background-color: var(--node-bg);
    color: var(--node-text);
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    transition: transform 0.15s ease-in-out, box-shadow 0.15s ease-in-out, border-color 0.15s ease-in-out;
  }
  .quest-node:hover {
    transform: scale(1.03);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
  html.dark .quest-node {
    box-shadow: 0 2px 5px rgba(0,0,0,0.3);
  }
  html.dark .quest-node:hover {
    box-shadow: 0 4px 15px rgba(0,0,0,0.4);
  }

  .quest-node.is-selected:not(.is-dragging) {
    box-shadow: 0 0 0 2px var(--bg-color),
                0 0 0 4px var(--vue-flow-selected),
                0 6px 18px rgba(0,0,0,0.2);
  }
  html.dark .quest-node.is-selected:not(.is-dragging) {
    box-shadow: 0 0 0 2px var(--bg-color),
                0 0 0 4px var(--info-color),
                0 6px 20px rgba(0,0,0,0.5);
  }

  .quest-node.is-dragging {
    box-shadow: 0 5px 15px rgba(0,0,0,0.15);
  }
  html.dark .quest-node.is-dragging {
    box-shadow: 0 5px 15px rgba(0,0,0,0.3);
  }

  .quest-header {
    font-weight: bold;
    margin-bottom: 12px;
    color: var(--node-text);
    text-align: center;
    width: 100%;
    white-space: normal;
    overflow-wrap: break-word;
    line-height: 1.3;
  }

  .quest-spacer {
    flex-grow: 1;
  }

  .quest-footer {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-top: auto;
    padding-top: 6px;
    width: 100%;
    flex-shrink: 0;
  }

  .quest-progress {
    display: flex;
    align-items: center;
    font-size: 12px;
    font-weight: 500;
    color: var(--node-desc-text);
    white-space: nowrap;
    line-height: 1;
    padding-bottom: 2px;
  }

  .progress-icon {
    margin-right: 4px;
    flex-shrink: 0;
  }

  .progress-placeholder {
    flex-grow: 1;
    min-width: 0;
  }

  .quest-actions {
    display: flex;
    gap: 5px;
    flex-shrink: 0;
  }

  .quest-actions button {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--node-desc-text);
    display: flex;
    transition: color 0.2s ease;
  }
  .quest-actions button:hover {
    color: var(--node-text);
  }
  html.dark .quest-actions button {
    color: #bbb;
  }
  html.dark .quest-actions button:hover {
    color: #fff;
  }

  .quest-actions .delete-btn:hover {
    color: var(--danger-color) !important;
  }
  .quest-actions .edit-btn:hover {
    color: var(--primary-color) !important;
  }

</style>
