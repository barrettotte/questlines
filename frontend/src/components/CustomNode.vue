<script setup lang="ts">
  import { Handle, Position, type NodeProps } from '@vue-flow/core';
  import { computed } from 'vue';
  import { Edit3, Trash2 } from 'lucide-vue-next';

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
    store.removeQuestNode(props.id);
  };

  function lighten(hex: string, percent: number): string {
    try {
      hex = hex.replace(/^#/, '');
      if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
      }

      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);

      const newR = Math.min(255, r + Math.floor((255 - r) * percent));
      const newG = Math.min(255, g + Math.floor((255 - g) * percent));
      const newB = Math.min(255, b + Math.floor((255 - b) * percent));

      return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    } catch (e) {
      return '#f0f0f0';
    }
  }

  const nodeStyle = computed(() => ({
    borderColor: questData.value.color || '#cccccc',
    backgroundColor: lighten(questData.value.color || '#cccccc', 0.85),
  }));

</script>

<template>
  <div class="quest-node" :style="nodeStyle">
    <div class="quest-node-header">{{ questData.title || 'Untitled' }}</div>
    <div v-if="questData.description" class="quest-node-description">
      {{ questData.description }}
    </div>
    <div class="quest-node-actions">
      <button @click="handleEdit" title="Edit Quest" class="edit-btn">
        <Edit3 :size="14"/>
      </button>
      <button @click="handleDelete" title="Delete Quest" class="delete-btn">
        <Trash2 :size="14"/>
      </button>
    </div>
    <Handle type="source" :position="Position.Right"/>
    <Handle type="target" :position="Position.Left"/>
    <Handle type="source" :position="Position.Top"/>
    <Handle type="target" :position="Position.Bottom"/>
  </div>
</template>

<style scoped>
  /* */
</style>
