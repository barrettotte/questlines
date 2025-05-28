<script setup lang="ts">
  import { storeToRefs } from 'pinia';
  import { X } from 'lucide-vue-next';

  import { useQuestStore } from '../stores/questStore';

  const store = useQuestStore();
  const { allQuestlines, showLoadModal, isLoading } = storeToRefs(store);

  const selectAndLoad = (id: string) => {
    store.loadQuestline(id);
    store.toggleLoadModal(false);
  };

</script>

<template>
  <div v-if="showLoadModal" class="modal-overlay" @click.self="store.toggleLoadModal(false)">
    <div class="modal-content">
      <div class="modal-header">
        <span>Load Questline</span>
        <button class="close-btn" @click="store.toggleLoadModal(false)">
          <X :size="20"/>
        </button>
      </div>
      <div class="modal-body">
        <div v-if="isLoading">Loading...</div>
        <div v-else-if="!allQuestlines || allQuestlines.length === 0">
          No saved questlines found.
        </div>
        <ul v-else class="modal-list">
          <li v-for="q in allQuestlines" :key="q.id" @click="selectAndLoad(q.id)">
            {{ q.name || 'Untitled' }} ({{ q.id.substring(0, 6) }}...)
          </li>
        </ul>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="store.toggleLoadModal(false)">Close</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .modal-list li {
    display: flex;
    justify-content: space-between;
  }
</style>
