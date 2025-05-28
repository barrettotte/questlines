import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { type Connection, type Node, Position, type Edge } from '@vue-flow/core';

import { apiService } from '../services/api';
import type { Questline, Quest, Dependency, QuestlineInfo } from '../types';

export const useQuestStore = defineStore('quest', () => {
  // state
  const currQuestline = ref<Questline>({
    id: null,
    name: 'New Questline',
    quests: [],
    dependencies: [],
  });
  const allQuestlines = ref<QuestlineInfo[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const selectedQuestForEdit = ref<Quest | null>(null);
  const showQuestEditor = ref(false);
  const showLoadModal = ref(false);

  // computed values
  const nodes = computed<Node[]>(() =>
    currQuestline.value.quests.map((q: Quest): Node<Quest> => ({
      id: q.id,
      type: 'custom',
      label: q.title,
      position: q.position,
      data: q,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    }))
  );

  const edges = computed<Edge[]>(() =>
    currQuestline.value.dependencies.map((dep: Dependency, idx: number): Edge => ({
      id: `edge-${dep.from}-${dep.to}-${idx}`,
      source: dep.from,
      target: dep.to,
      animated: true,
      style: {
        stroke: '#3b82f6',
        strokeWidth: 2
      }
    }))
  );

  // handlers
  function handleError(e: unknown, msg: string) {
    console.error(msg, e);
    const errMsg = e instanceof Error ? e.message : String(e);
    error.value = `${msg}: ${errMsg}`;
    setTimeout(() => (error.value = null), 5000);
  }

  async function fetchAllQuestlines() {
    isLoading.value = true;
    error.value = null;

    try {
      allQuestlines.value = (await apiService.getQuestlines()) || [];
    } catch (e) {
      handleError(e, 'Failed to load questlines');
      allQuestlines.value = [];
    } finally {
      isLoading.value = false;
    }
  }

  async function loadQuestline(id: string | null) {
    if (!id) {
      currQuestline.value = {
        id: crypto.randomUUID(),
        name: 'Untitled',
        quests: [],
        dependencies: [],
      };
    } else {
      isLoading.value = true;
      error.value = null;

      try {
        currQuestline.value = await apiService.getQuestline(id);
      } catch (e) {
        handleError(e, `Failed to load questline ${id}`);
      } finally {
        isLoading.value = false;
      }
    }

    selectedQuestForEdit.value = null;
    showQuestEditor.value = false;
  }

  async function saveCurrentQuestline() {
    if (!currQuestline.value.name.trim()) {
      error.value = 'Questline name cannot be empty';
      setTimeout(() => error.value = null, 3000);
      return;
    }
    isLoading.value = true;
    error.value = null;

    try {
      let saved: Questline;
      const isExisting = (allQuestlines.value as Questline[]).some((q: Questline) => q.id === currQuestline.value.id);

      if (currQuestline.value.id && isExisting) {
        saved = await apiService.updateQuestline(currQuestline.value.id, currQuestline.value);
      } else {
        // don't send client side ID if new
        const toSend = { ...currQuestline.value };
        if (!isExisting) {
          toSend.id = null; // make backend set ID
        }
        saved = await apiService.createQuestline(toSend);
      }
      currQuestline.value = saved;
      await fetchAllQuestlines();
    } catch (e) {
      handleError(e, 'Failed to save questline');
    } finally {
      isLoading.value = false;
    }
  }

  async function deleteCurrentQuestline() {
    const id = currQuestline.value.id;
    if (!id || !(allQuestlines.value as Questline[]).some((q: Questline) => q.id === id)) {
      error.value = 'Please save before deleting, or select a saved questline';
      setTimeout(() => error.value = null, 3000);
      return;
    }
    if (!confirm('Are you sure?')) {
      return;
    }
    isLoading.value = true;
    error.value = null;

    try {
      await apiService.deleteQuestline(id);
      await fetchAllQuestlines();
      await loadQuestline(null); // load empty
    } catch (e) {
      handleError(e, 'Failed to delete questline');
    } finally {
      isLoading.value = false;
    }
  }

  function addQuestNode() {
    const newQuestId = crypto.randomUUID();
    const newQuest: Quest = {
      id: newQuestId,
      title: 'New Quest',
      description: '',
      position: {
        x: Math.random() * 400 + 50,
        y: Math.random() * 300 + 50,
      },
      color: '#cccccc',
    };
    currQuestline.value.quests.push(newQuest);
  }

  function updateQuestPosition(nodeId: string, newPos: { x: number, y: number }) {
    const quest = currQuestline.value.quests.find((q: Quest) => q.id === nodeId);
    if (quest) {
      quest.position = newPos;
    }
  }

  function addQuestDependency(conn: Connection) {
    if (!conn.source || !conn.target) {
      return;
    }

    // check for bad links
    const exists = currQuestline.value.dependencies.some((dep: Dependency) => {
      dep.from === conn.source && dep.to === conn.target
    });
    if (exists || conn.source === conn.target) {
      error.value = 'Cannot create duplicate or self-referencing link.';
      setTimeout(() => error.value = null, 3000);
      return;
    }

    const newDep: Dependency = {
      from: conn.source,
      to: conn.target,
    };
    currQuestline.value.dependencies.push(newDep);
  }

  function removeQuestNode(questId: string) {
    if (!confirm("Are you sure?")) {
      return;
    }
    currQuestline.value.quests = currQuestline.value.quests.filter((q: Quest) => q.id !== questId);
    currQuestline.value.dependencies = currQuestline.value.dependencies.filter((dep: Dependency) => {
      dep.from !== questId && dep.to !== questId;
    });

    if (selectedQuestForEdit.value?.id === questId) {
      closeQuestEditor();
    }
  }

  function removeQuestDependency(edgeId: string) {
    currQuestline.value.dependencies = currQuestline.value.dependencies.filter((dep: Dependency, idx: number) => {
      `edge-${dep.from}-${dep.to}-${idx}` !== edgeId;
    });
  }

  function openQuestForEdit(quest: Quest) {
    selectedQuestForEdit.value = { ...quest };
    showQuestEditor.value = true;
  }

  function closeQuestEditor() {
    showQuestEditor.value = false;
    selectedQuestForEdit.value = null;
  }

  function updateQuestDetails(updated: Quest) {
    const idx = currQuestline.value.quests.findIndex((q: Quest) => q.id === updated.id);
    if (idx !== -1) {
      currQuestline.value.quests[idx] = { ...updated };
    }
    closeQuestEditor();
  }

  function toggleLoadModal(show: boolean) {
    showLoadModal.value = show;
    if (show) {
      fetchAllQuestlines();
    }
  }

  function triggerExport(fmt: 'json' | 'yaml') {
    if (!currQuestline.value.id || !(allQuestlines.value as Questline[]).some((q: Questline) => q.id === currQuestline.value.id)) {
      error.value = 'Please save questline before exporting';
      setTimeout(() => error.value = null, 3000);
      return;
    }
    apiService.exportQuestline(currQuestline.value.id, fmt);
  }

  return {
    // properties
    currQuestline, allQuestlines, isLoading, error, nodes, edges,
    selectedQuestForEdit, showQuestEditor, showLoadModal,
    // functions
    fetchAllQuestlines, loadQuestline, saveCurrentQuestline, deleteCurrentQuestline,
    addQuestNode, updateQuestPosition, addQuestDependency, removeQuestNode,
    removeQuestDependency, openQuestForEdit, closeQuestEditor, updateQuestDetails,
    toggleLoadModal, triggerExport,
  };
});
