<script setup="ts">
  import { storeToRefs } from 'pinia';
  import { onMounted } from 'vue';

  import Toolbar from './components/Toolbar.vue';
  import QuestBoard from './components/QuestBoard.vue';
  import QuestEditor from './components/QuestEditor.vue';
  import LoadModal from './components/LoadModal.vue';
  import { useQuestStore } from './stores/questStore';

  const store = useQuestStore();
  const { error, isLoading, darkMode } = storeToRefs(store);

  onMounted(() => {
    store.fetchAllQuestlines();
    store.loadQuestline(null);
  });

</script>

<template>
  <div id="app-container" :class="{ 'dark': darkMode }">
    <Toolbar/>
    <main>
      <QuestBoard/>
    </main>
    <QuestEditor/>
    <LoadModal/>

    <div v-if="isLoading" class="global-message loading-indicator">
      Loading...
    </div>
    <div v-if="error" class="global-message error-indicator">
      {{ error }}
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
