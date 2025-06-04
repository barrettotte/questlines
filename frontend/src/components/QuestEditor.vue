<script setup lang="ts">
  import { storeToRefs } from 'pinia';
  import { computed, ref, watch } from 'vue';
  import { TrashIcon, X } from 'lucide-vue-next';
  import { v4 as uuidv4 } from 'uuid';

  import { useQuestlineStore } from '../stores/questlineStore';
  import type { Quest } from '../types';

  const store = useQuestlineStore();
  const { selectedQuestForEdit, showQuestEditor } = storeToRefs(store);

  const localQuestData = ref<Quest | null>(null);
  const newObjectiveText = ref('');

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

  const isCurrentQuestCompletable = computed(() => {
    if (localQuestData.value && localQuestData.value.id) {
      if (localQuestData.value.completed) {
        return true;
      }
      return store.canCompleteQuest(localQuestData.value.id);
    }
    return false;
  });

  const saveChanges = () => {
    if (localQuestData.value) {
      store.updateQuestDetails(localQuestData.value);
    }
  };

  const handleAddObjective = () => {
    if (localQuestData.value) {
      if (!localQuestData.value.objectives) {
        localQuestData.value.objectives = [];
      }

      localQuestData.value.objectives.push({
        id: uuidv4(),
        text: newObjectiveText.value || 'New objective',
        completed: false,
        sortIndex: localQuestData.value.objectives.length,
      });
      newObjectiveText.value = '';
    }
  };

  const handleRemoveObjective = (objectiveId: string) => {
    if (localQuestData.value && localQuestData.value.objectives) {
      localQuestData.value.objectives = localQuestData.value.objectives.filter(o => o.id !== objectiveId);
    }
  };

  watch(selectedQuestForEdit, (newVal) => {
    localQuestData.value = newVal ? JSON.parse(JSON.stringify(newVal)) : null;

    if (localQuestData.value && !localQuestData.value.objectives) {
      localQuestData.value.objectives = [];
    }
    newObjectiveText.value = '';
  });

</script>

<template>
  <div v-if="showQuestEditor && localQuestData" class="modal-overlay" @click.self="store.closeQuestEditor">
    <div class="modal-content editor-modal-content">
      <div class="modal-header">
        <span>Edit Quest</span>
        <button class="close-btn" @click="store.closeQuestEditor">
          <X :size="20"/>
        </button>
      </div>

      <div class="modal-body">
        <div class="form-group completion-status-editor">
          <div class="status-label">Status:</div>
          <span v-if="localQuestData.completed" class="status-completed">Completed</span>
          <span v-else-if="isCurrentQuestCompletable" class="status-pending">Ready to Complete</span>
          <span v-else class="status-blocked">Blocked</span>
        </div>

        <div class="form-group">
          <label for="questTitle">Title</label>
          <input id="questTitle" type="text" class="input-field" v-model="localQuestData.title"/>
        </div>

        <div class="form-group">
          <label for="questDescription">Description</label>
          <textarea id="questDescription" rows="5" class="textarea-field" v-model="localQuestData.description"></textarea>
        </div>

        <div class="form-group">
          <label for="questColor">Color</label>
          <div class="color-selector-group">
            <div class="color-swatches">
              <button v-for="color in predefinedColors"
                :key="color" class="color-swatch" 
                :class="{ selected: localQuestData.color === color}"
                :style="{ backgroundColor: color }"
                @click="localQuestData!.color = color"
              ></button>
            </div>
            <input id="questColor" type="color" v-model="localQuestData.color"/>
          </div>
        </div>

        <div class="form-group">
          <label>Objectives</label>
          <div v-if="localQuestData.objectives && localQuestData.objectives.length > 0" class="objective-items">
            <div v-for="item in localQuestData.objectives" :key="item.id" class="objective-item">
              <input type="checkbox" v-model="item.completed" :id="`item-${item.id}-checkbox`"/>
              <input type="text" v-model="item.text" class="input-field objective-item-text" placeholder="Objective description" :id="`item-${item.id}-text`"/>
              <button @click="handleRemoveObjective(item.id)" class="btn-icon-only btn-danger-icon" title="Remove Objective">
                <TrashIcon :size="16"/>
              </button>
            </div>
          </div>
          <div class="add-objective-item">
            <input type="text" v-model="newObjectiveText" class="input-field" placeholder="New objective text" 
              @keyup.enter="handleAddObjective" :id="`${localQuestData.id}-new-objective-text`"/>
            <button @click="handleAddObjective" class="btn btn-secondary btn-add-item" title="Add Objective">
              <PlusCircle :size="18"/> Add
            </button>
          </div>
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
  .editor-modal-content {
    max-width: 700px;
  }

  .form-group {
    margin-bottom: 15px;
  }

  .form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: 500;
  }

  .completion-status-editor {
    margin-top: 5px;
    padding-bottom: 5px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .completion-status-editor .status-label {
    font-weight: 500;
    margin-right: 8px;
    flex-shrink: 0;
  }
  .status-completed {
    color: var(--success-color);
  }
  .status-pending {
    color: var(--warning-color);
  }
  .status-blocked {
    color: var(--danger-color);
  }

  .color-selector-group {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 5px;
  }

  .color-selector-group input[type="color"] {
    appearance: none;
    -moz-appearance: none;
    -webkit-appearance: none;
    background: none;
    border: 0;
    cursor: pointer;
    padding: 0;
    height: 30px;
    width: 34px;
  }

  .color-swatches {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
  }

  .color-swatch {
    width: 25px;
    height: 25px;
    box-sizing: border-box;
    border-radius: 50%;
    cursor: pointer;
    border: 2px solid transparent;
    transition: border-color 0.2s ease transform 0.1s ease-out;
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  }
  .color-swatch:hover {
    transform: scale(1.1);
  }
  .color-swatch.selected {
    border-color: #333;
    box-shadow: 0 0 0 2px var(--primary-color);
  }
  html.dark .color-swatch.selected {
    border-color: #fff;
    box-shadow: 0 0 0 2px var(--info-color);
  }

  .objective-items {
    margin-top: 5px;
    margin-bottom: 10px;
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid var(--border-color);
    padding: 10px;
    border-radius: 4px;
  }

  .objective-item {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
    gap: 8px;
  }

  .objective-item input[type="checkbox"] {
    margin-right: 8px;
    width: 18px;
    height: 18px;
    cursor: pointer;
  }

  .objective-item-text {
    flex-grow: 1;
    font-size: 0.9em;
    padding: 6px 10px;
  }

  .add-objective-item {
    display: flex;
    gap: 10px;
    margin-top: 10px;
  }

  .add-objective-item .input-field {
    flex-grow: 1;
  }

  .btn-add-item {
    padding: 8px 12px;
    font-size: 0.9em;
    white-space: nowrap;
  }

  .btn-icon-only {
    background: none;
    border: none;
    padding: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--secondary-color);
  }
  .btn-icon-only:hover {
    color: var(--text-color);
  }
  .btn-danger-icon:hover {
    color: var(--danger-color);
  }
  html.dark .btn-icon-only {
    color: var(--secondary-color);
  }
  html.dark .btn-icon-only:hover {
    color: var(--text-color);
  }
  html.dark .btn-danger-icon:hover {
    color: var(--danger-color);
  }

</style>
