<script setup lang="ts">
  import { storeToRefs } from 'pinia';
  import { nextTick, onMounted, onUnmounted, ref } from 'vue';

  import Toolbar from './components/Toolbar.vue';
  import QuestBoard from './components/QuestBoard.vue';
  import QuestEditor from './components/QuestEditor.vue';
  import LoadModal from './components/LoadModal.vue';
  import HelpModal from './components/HelpModal.vue';

  import { useQuestStore } from './stores/questStore';
  import type { ExposedQuestBoard } from './types';

  const store = useQuestStore();
  const { errorMsg, successMsg, isLoading, isDarkMode } = storeToRefs(store);

  const questBoardRef = ref<ExposedQuestBoard | null>(null);

  onMounted(() => {
    store.fetchAllQuestlines();
    store.loadQuestline(null);
    window.addEventListener('keydown', handleWindowLevelShortcuts);
  });

  onUnmounted(() => {
    window.removeEventListener('keydown', handleWindowLevelShortcuts);
  });

  const handleWindowLevelShortcuts = (event: KeyboardEvent) => {
    const k = event.key.toLowerCase();

    // ctrl +
    if (event.ctrlKey || event.metaKey) {
      if (k === 's') {
        event.preventDefault();
        store.saveCurrentQuestline();
      } else if (k === ' ') {
        questBoardRef.value?.addNewQuestAtViewportCenter();
      }
    } else if (k === 'Escape') {
      store.closeAllModals();

      nextTick(() => {
        if (document.activeElement && typeof (document.activeElement as HTMLElement).blur === 'function') {
          (document.activeElement as HTMLElement).blur();
        }
      });
    } 
  };

</script>

<template>
  <div id="app-container" :class="{ 'dark': isDarkMode }">
    <Toolbar :quest-board-instance="questBoardRef"/>
    <main>
      <QuestBoard ref="questBoardRef"/>
    </main>
    <QuestEditor/>
    <LoadModal/>
    <HelpModal/>

    <div v-if="isLoading" class="global-message loading-indicator">
      Loading...
    </div>
    <div v-if="errorMsg" class="global-message error-indicator">
      {{ errorMsg }}
    </div>
    <div v-if="successMsg" class="global-message success-indicator">
      {{ successMsg }}
    </div>
  </div>
</template>

<style scoped>
  #app-container {
    height: 100vh;
    width: 100vw;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background-color: var(--bg-color);
    color: var(--text-color);
    transition: background-color 0.2s ease, color 0.2s ease;
  }

  main {
    flex-grow: 1;
    position: relative; /* for VueFlow overlays */
  }
</style>
