<script setup lang="ts">
  import { storeToRefs } from 'pinia';
  import { ref, watch } from 'vue';
  import { X } from 'lucide-vue-next';

  import { useQuestStore } from '../stores/questStore';
  import type { Quest } from '../types';

  const store = useQuestStore();
  const { selectedQuestForEdit, showQuestEditor } = storeToRefs(store);

  const localQuestData = ref<Quest | null>(null);

  watch(selectedQuestForEdit, (newVal) => {
    localQuestData.value = newVal ? { ...newVal } : null;
  });

  const saveChanges = () => {
    if (localQuestData.value) {
      store.updateQuestDetails(localQuestData.value);
    }
  };

  const predefinedColors = [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#FED766',
    '#2AB7CA',
    '#F0B67F',
    '#8A6FDF',
    '#A1DE93',
    '#F4A261',
    '#E76F51',
    '#2A9D8F',
    '#264653',
  ];

</script>

<template>
  <div v-if="showQuestEditor && localQuestData" class="modal-overlay" @click.self="store.closeQuestEditor">
    <div class="modal-content">
      <div class="modal-header">
        <span>Edit Quest</span>
        <button class="close-btn" @click="store.closeQuestEditor">
          <X :size="20"/>
        </button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label for="questTitle">Title</label>
          <input id="questTitle" type="text" class="input-field" v-model="localQuestData.title"/>
        </div>
        <div class="form-group">
          <label for="questDescription">Description</label>
          <textarea id="questDescription" rows="3" class="textarea-field" v-model="localQuestData.description"></textarea>
        </div>
        <div class="form-group">
          <label for="questColor">Color</label>
          <div class="color-swatches">
            <button v-for="color in predefinedColors"
              :key="color" class="color-swatch" 
              :class="{ selected: localQuestData.color === color}"
              :style="{ backgroundColor: color }"
              @click="localQuestData!.color = color"
            ></button>
          </div>
          <input id="questColor" type="color" class="color-picker-input" v-model="localQuestData.color"/>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="store.closeQuestEditor">Cancel</button>
        <button class="btn btn-primary" @click="saveChanges">Save</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
  /* */
</style>
