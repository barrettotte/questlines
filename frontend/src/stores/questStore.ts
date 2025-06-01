import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { type Connection, type Node, type Edge, MarkerType } from '@vue-flow/core';
import { v4 as uuidv4 } from 'uuid';

import { apiService } from '../services/api';
import type { Questline, Quest, Dependency, QuestlineInfo, Position as QuestPosition, Objective } from '../types';

export const useQuestStore = defineStore('quest', () => {

  // constants
  const errorMsgWaitMs = 3000;
  const successMsgWaitMs = 5000;
  
  // state
  const allQuestlines = ref<QuestlineInfo[]>([]);
  const selectedQuestForEdit = ref<Quest | null>(null);

  const hoveredNodeId = ref<string | null>(null);
  const hoveredEdgeId = ref<string | null>(null);
  
  const isLoading = ref(false);
  const isDarkMode = ref(false);
  const showQuestEditor = ref(false);
  const showLoadModal = ref(false);
  const showHelpModal = ref(false);

  const errorMsg = ref<string | null>(null);
  const successMsg = ref<string | null>(null);

  const currQuestline = ref<Questline>({
    id: null,
    name: 'New Questline',
    quests: [],
    dependencies: [],
  });
  
  // computed values
  const nodes = computed<Node[]>(() =>
    currQuestline.value.quests.map((q: Quest): Node<Quest> => ({
      id: q.id,
      type: 'custom',
      label: q.title,
      position: q.position,
      data: q,
    }))
  );

  const edges = computed<Edge[]>(() => {
    const baseStrokeColor = isDarkMode.value ? '#a0aec0' : '#6b7280';
    const currHoveredNode = hoveredNodeId.value;
    const currHoveredEdge = hoveredEdgeId.value;

    return currQuestline.value.dependencies.map((dep: Dependency, idx: number): Edge => {
      const isDirectlyHovered = currHoveredEdge === getEdgeId(dep, idx);
      const isConnectedToHoveredNode = currHoveredNode && (dep.from === currHoveredNode || dep.to === currHoveredEdge);
      const shouldUseHightlight = isDirectlyHovered || isConnectedToHoveredNode;
      const strokeWidth = shouldUseHightlight ? 2.5 : 1.5;

      return {
        id: getEdgeId(dep, idx),
        source: dep.from,
        target: dep.to,
        type: 'custom',
        animated: true,
        style: {
          stroke: baseStrokeColor,
          strokeWidth: strokeWidth,
          transition: 'stroke 0.05s ease-out, stroke-width 0.05s ease-out',
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: baseStrokeColor,
        },
      };
    });
  });

  // handlers
  function handleError(e: unknown, msg: string, duration: number = successMsgWaitMs) {
    console.error(msg, e);
    const errMsg = e instanceof Error ? e.message : String(e);
    errorMsg.value = `${msg}: ${errMsg}`;
    successMsg.value = null;
    setTimeout(() => (errorMsg.value = null), duration);
  }

  function handleSuccess(msg: string, duration: number = errorMsgWaitMs) {
    successMsg.value = msg;
    errorMsg.value = null;
    setTimeout(() => (successMsg.value = null), duration);
  }

  function resetMessages() {
    errorMsg.value = null;
    successMsg.value = null;
  }

  function getEdgeId(dep: Dependency, idx: number): string {
    return `edge-${dep.from}-${dep.to}-${idx}`
  }

  async function fetchAllQuestlines() {
    isLoading.value = true;
    resetMessages();

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
        id: uuidv4(),
        name: 'Untitled',
        quests: [],
        dependencies: [],
      };
    } else {
      isLoading.value = true;
      errorMsg.value = null;

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
      errorMsg.value = 'Questline name cannot be empty';
      setTimeout(() => errorMsg.value = null, errorMsgWaitMs);
      return;
    }
    isLoading.value = true;
    resetMessages();

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
      handleSuccess('Questline saved.');
    } catch (e) {
      handleError(e, 'Failed to save questline');
    } finally {
      isLoading.value = false;
    }
  }

  async function deleteCurrentQuestline() {
    const id = currQuestline.value.id;
    if (!id || !(allQuestlines.value as Questline[]).some((q: Questline) => q.id === id)) {
      errorMsg.value = 'Please save before deleting, or select a saved questline';
      successMsg.value = null;
      setTimeout(() => errorMsg.value = null, errorMsgWaitMs);
      return;
    }
    if (!confirm('Are you sure?')) {
      return;
    }
    isLoading.value = true;
    resetMessages();

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

  function addQuestNode(pos?: { x: number, y: number }) {
    const defaultPos: QuestPosition = { x: 100, y: 100 };
    const finalPos: QuestPosition = pos || defaultPos;
    const newQuestId = uuidv4();
    const newQuest: Quest = {
      id: newQuestId,
      title: 'New Quest',
      description: '',
      position: finalPos,
      color: '#cccccc',
      objectives: [],
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
      errorMsg.value = 'Cannot create duplicate or self-referencing link.';
      setTimeout(() => errorMsg.value = null, errorMsgWaitMs);
      return;
    }

    const newDep: Dependency = {
      from: conn.source,
      to: conn.target,
    };
    currQuestline.value.dependencies.push(newDep);
  }

  function addObjective(questId: string, text?: string) {
    const quest = currQuestline.value.quests.find(q => q.id === questId);
    if (quest) {
      if (!quest.objectives) {
        quest.objectives = [];
      }
      quest.objectives.push({
        id: uuidv4(),
        text: text || 'New objective',
        completed: false,
      });
    }
  }

  function removeObjective(questId: string, objectiveId: string) {
    const quest = currQuestline.value.quests.find(q => q.id === questId);
    if (quest && quest.objectives) {
      quest.objectives = quest.objectives.filter(o => o.id !== objectiveId);
    }
  }

  function updateObjective(questId: string, updated: Objective) {
    const quest = currQuestline.value.quests.find(q => q.id === questId);

    if (quest && quest.objectives) {
      const existingObjective = quest.objectives.find(o => o.id === updated.id);

      if (existingObjective) {
        if (updated.text !== undefined && updated.text !== null) {
          existingObjective.text = updated.text;
        }
        if (updated.completed !== undefined && updated.completed !== null) {
          existingObjective.completed = updated.completed;
        }
      }
    }
  }

  function removeQuestNodes(nodeIds: string[]) {
    if (nodeIds.length === 0) {
      return;
    }
    currQuestline.value.quests = currQuestline.value.quests.filter(
      quest => !nodeIds.includes(quest.id)
    );
    currQuestline.value.dependencies = currQuestline.value.dependencies.filter(
      dep => !nodeIds.includes(dep.from) && !nodeIds.includes(dep.to)
    );

    if (selectedQuestForEdit.value && nodeIds.includes(selectedQuestForEdit.value.id)) {
      closeQuestEditor();
    }
  }

  function removeQuestDependencies(edgeIds: string[]) {
    if (edgeIds.length === 0) {
      return;
    }
    currQuestline.value.dependencies = currQuestline.value.dependencies.filter((dep: Dependency, index: number) => {
      return !edgeIds.includes(getEdgeId(dep, index));
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

  function openLoadModal() {
    showLoadModal.value = true;
    fetchAllQuestlines();
  }

  function closeLoadModal() {
    showLoadModal.value = false;
  }

  function openHelpModal() {
    showHelpModal.value = true;
  }

  function closeHelpModal() {
    showHelpModal.value = false;
  }

  function isAnyModalOpen(): boolean {
    return showQuestEditor.value || showLoadModal.value || showHelpModal.value;
  }

  function closeAllModals() {
    closeQuestEditor();
    closeLoadModal();
    closeHelpModal();
  }

  function triggerExport(fmt: string) {
    if (!currQuestline.value.id || !(allQuestlines.value as Questline[]).some((q: Questline) => q.id === currQuestline.value.id)) {
      errorMsg.value = 'Please save questline before exporting';
      setTimeout(() => errorMsg.value = null, errorMsgWaitMs);
      return;
    }
    apiService.exportQuestline(currQuestline.value.id, fmt);
  }

  function applyDarkMode(active: boolean) {
    isDarkMode.value = active;
    localStorage.setItem('isDarkMode', String(active));

    if (active) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  function toggleDarkMode() {
    applyDarkMode(!isDarkMode.value);
  }
  applyDarkMode(localStorage.getItem('isDarkMode') === 'true');

  function setHoveredNodeId(id: string | null) {
    hoveredNodeId.value = id;
  }

  function setHoveredEdgeId(id: string | null) {
    hoveredEdgeId.value = id;
  }

  return {
    // properties
    currQuestline, allQuestlines, 
    isLoading, errorMsg, successMsg, 
    nodes, edges, selectedQuestForEdit, 
    showQuestEditor, showLoadModal, showHelpModal, isDarkMode, 
    hoveredNodeId, hoveredEdgeId,
    // functions
    fetchAllQuestlines, loadQuestline, saveCurrentQuestline, deleteCurrentQuestline,
    addQuestNode, updateQuestPosition, addQuestDependency, 
    removeQuestNodes, removeQuestDependencies,
    addObjective, removeObjective, updateObjective,
    openQuestForEdit, openLoadModal, openHelpModal, isAnyModalOpen,
    closeQuestEditor, closeLoadModal, closeHelpModal, closeAllModals,
    updateQuestDetails, triggerExport, toggleDarkMode, 
    setHoveredNodeId, setHoveredEdgeId,
  };
});
