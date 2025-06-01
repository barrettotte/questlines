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
    store.removeQuestNodes([props.data.id]);
  };

  const nodeStyle = computed(() => ({
    borderColor: questData.value.color || '#cccccc',
  }));

</script>

<template>
  <div class="quest-node" :style="nodeStyle" :title="questData.title">
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
  </div>
</template>

<style scoped>
  /* */
</style>
