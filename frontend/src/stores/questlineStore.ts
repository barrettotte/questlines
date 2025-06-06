import { ref, computed, nextTick, watch } from 'vue';
import { defineStore } from 'pinia';
import { type Connection, type Node, type Edge, MarkerType } from '@vue-flow/core';
import { v4 as uuidv4 } from 'uuid';

import { questlineApiService } from '../services/questline';
import type { Questline, Quest, Dependency, QuestlineInfo, Position as QuestPosition } from '../types';

export const useQuestlineStore = defineStore('questline', () => {

  // constants
  const ERROR_MSG_WAIT_MS = 3000;
  const SUCCESS_MSG_WAIT_MS = 5000;
  const IS_DARK_MODE_KEY = "isDarkMode";
  const LAST_ACTIVE_QUESTLINE_ID_KEY = "lastActiveQuestlineId";
  
  // state
  const allQuestlineInfos = ref<QuestlineInfo[]>([]);
  const selectedQuestForEdit = ref<Quest | null>(null);
  const hasUnsavedChanges = ref(false);

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

  const getPrerequisiteQuestIds = (quest: Quest): string[] => {
    return currQuestline.value.dependencies.filter(d => d.to === quest.id).map(d => d.from);
  };

  const areAllObjectivesCompleted = (quest: Quest): boolean => {
    if (!quest.objectives || quest.objectives.length === 0) {
      return true; // no objectives
    }
    return quest.objectives.every(o => o.completed);
  };

  const areAllPrerequisitesCompleted = (quest: Quest): boolean => {
    const prereqIds = getPrerequisiteQuestIds(quest);
    if (prereqIds.length === 0) {
      return true; // no prerequisites
    }
    return prereqIds.every(prereqId => {
      const prereqQuest = currQuestline.value.quests.find(q => q.id === prereqId);
      return prereqQuest?.completed === true;
    });
  };

  const canCompleteQuest = (questId: string): boolean => {
    const quest = currQuestline.value.quests.find(q => q.id === questId);
    if (!quest) {
      return false;
    }
    return areAllObjectivesCompleted(quest) && areAllPrerequisitesCompleted(quest);
  };

  // cascade marking quests an uncomplete when an upstream quest is marked as uncomplete
  // or when upstream quests or dependencies are deleted
  function cascadeUncomplete(questIdUncompleted: string) {
    if (!currQuestline.value) {
      return;
    }
    const quests = currQuestline.value.quests;
    const dependencies = currQuestline.value.dependencies;

    dependencies.forEach(dep => {
      if (dep.from === questIdUncompleted) {
        const downstreamQuest = quests.find(q => q.id === dep.to);

        if (downstreamQuest && downstreamQuest.completed) {
          downstreamQuest.completed = false;
          cascadeUncomplete(downstreamQuest.id); // recurse
        }
      }
    });
  }

  function markDirty() {
    if (!hasUnsavedChanges.value) {
      hasUnsavedChanges.value = true;
    }
  }

  function markClean() {
    if (hasUnsavedChanges.value) {
      hasUnsavedChanges.value = false;
    }
  }

  watch(currQuestline, (newVal, oldVal) => {
    if (oldVal && oldVal.id && newVal && newVal.id && oldVal.id === newVal.id) {
      markDirty();
    }
  }, { deep: true });

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
      const isDownstreamFromNode = currHoveredNode && (dep.from === currHoveredNode || dep.to === currHoveredEdge);
      const strokeWidth = (isDirectlyHovered || isDownstreamFromNode) ? 2.5 : 1.5;

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

  function handleError(e: unknown, msg: string, duration: number = SUCCESS_MSG_WAIT_MS) {
    console.error(msg, e);
    const errMsg = e instanceof Error ? e.message : String(e);
    errorMsg.value = `${msg}: ${errMsg}`;
    successMsg.value = null;
    setTimeout(() => (errorMsg.value = null), duration);
  }

  function handleSuccess(msg: string, duration: number = ERROR_MSG_WAIT_MS) {
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

  async function fetchAllQuestlineInfos() {
    isLoading.value = true;
    resetMessages();
    try {
      allQuestlineInfos.value = (await questlineApiService.getQuestlines()) || [];
    } catch (e) {
      handleError(e, 'Failed to load questlines');
      allQuestlineInfos.value = [];
    } finally {
      isLoading.value = false;
    }
  }

  async function loadQuestline(id: string | null) {
    isLoading.value = true;
    errorMsg.value = null;

    const blankQuestline = {
      id: uuidv4(),
      name: 'Untitled',
      quests: [],
      dependencies: [],
    };
    try {
      if (!id) {
        currQuestline.value = blankQuestline;
        localStorage.removeItem(LAST_ACTIVE_QUESTLINE_ID_KEY);
        markDirty();
      } else {
        const data = await questlineApiService.getQuestline(id);
        currQuestline.value = data;
        localStorage.setItem(LAST_ACTIVE_QUESTLINE_ID_KEY, id);
        markClean();
      }
    } catch (e) {
      handleError(e, `Failed to load questline ${id}`);
      localStorage.removeItem(LAST_ACTIVE_QUESTLINE_ID_KEY);

      // fallback to empty questline
      if (currQuestline.value.id === id || id !== null) {
        currQuestline.value = blankQuestline;
        markDirty();
      }
    } finally {
      isLoading.value = false;
    }
  }

  function setQuestlineFromLoadedData(loaded: Questline): boolean {
    currQuestline.value = {
      ...loaded,
      id: loaded.id || uuidv4(),
      quests: loaded.quests || [],
      dependencies: loaded.dependencies || [],
    };
    localStorage.removeItem(LAST_ACTIVE_QUESTLINE_ID_KEY);
    markDirty();
    handleSuccess(`Questline loaded from file`);
    return true;
  }

  async function saveCurrentQuestline() {
    if (!currQuestline.value.name.trim()) {
      errorMsg.value = 'Questline name cannot be empty';
      setTimeout(() => errorMsg.value = null, ERROR_MSG_WAIT_MS);
      return;
    }
    isLoading.value = true;
    resetMessages();

    try {
      let saved: Questline;
      const isExisting = (allQuestlineInfos.value as QuestlineInfo[]).some((q: QuestlineInfo) => q.id === currQuestline.value.id);

      if (currQuestline.value.id && isExisting) {
        saved = await questlineApiService.updateQuestline(currQuestline.value.id, currQuestline.value);
      } else {
        // don't send client side ID if new
        const toSend = { ...currQuestline.value };
        if (!isExisting) {
          toSend.id = null; // make backend set ID
        }
        saved = await questlineApiService.createQuestline(toSend);
      }
      currQuestline.value = saved;

      if (saved.id) {
        localStorage.setItem(LAST_ACTIVE_QUESTLINE_ID_KEY, saved.id);
      }
      await fetchAllQuestlineInfos();
      markClean();
      handleSuccess('Questline saved.');

    } catch (e) {
      handleError(e, 'Failed to save questline');
    } finally {
      isLoading.value = false;
    }
  }

  async function deleteCurrentQuestline() {
    const id = currQuestline.value.id;
    if (!id || !(allQuestlineInfos.value as QuestlineInfo[]).some((q: QuestlineInfo) => q.id === id)) {
      errorMsg.value = 'Please save before deleting, or select a saved questline';
      successMsg.value = null;
      setTimeout(() => errorMsg.value = null, ERROR_MSG_WAIT_MS);
      return;
    }
    if (!confirm('Are you sure?')) {
      return;
    }
    isLoading.value = true;
    resetMessages();

    try {
      await questlineApiService.deleteQuestline(id);
      const cachedId = localStorage.getItem(LAST_ACTIVE_QUESTLINE_ID_KEY);

      if (cachedId === id) {
        localStorage.removeItem(LAST_ACTIVE_QUESTLINE_ID_KEY);
      }
      await fetchAllQuestlineInfos();
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
      completed: false,
    };
    currQuestline.value.quests.push(newQuest);
    markDirty();
  }

  function updateQuestPosition(nodeId: string, newPos: { x: number, y: number }) {
    const quest = currQuestline.value.quests.find((q: Quest) => q.id === nodeId);
    if (quest) {
      quest.position = newPos;
      markDirty();
    }
  }

  function setQuestCompleted(questId: string, newStatus: boolean) {
    const quest = currQuestline.value.quests.find((q: Quest) => q.id === questId);
    if (!quest) {
      return;
    }
    const oldStatus = quest.completed;

    if (newStatus) {
      if (canCompleteQuest(questId)) {
        quest.completed = true;
      } else {
        console.warn(`Quest ${questId} cannot be marked complete: prerequisites or objectives not completed`);
      }
    } else {
      if (quest.completed) {
        quest.completed = false;
        cascadeUncomplete(questId);
      } else {
        quest.completed = false; // incomplete
      }
    }

    if (quest.completed !== oldStatus) {
      markDirty();
    }
  }

  function addQuestDependency(conn: Connection) {
    if (!conn.source || !conn.target) {
      return;
    }

    // check for bad links
    const exists = currQuestline.value.dependencies.some((dep: Dependency) => {
      return dep.from === conn.source && dep.to === conn.target
    });
    if (exists || conn.source === conn.target) {
      errorMsg.value = 'Cannot create duplicate or self-referencing link.';
      setTimeout(() => errorMsg.value = null, ERROR_MSG_WAIT_MS);
      return;
    }

    const newDep: Dependency = { from: conn.source, to: conn.target };
    currQuestline.value.dependencies.push(newDep);
    markDirty();
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
        sortIndex: quest.objectives.length,
      });
      markDirty();
    }
  }

  function removeObjective(questId: string, objectiveId: string) {
    const quest = currQuestline.value.quests.find(q => q.id === questId);
    if (quest && quest.objectives) {
      const initialLength = quest.objectives.length;
      quest.objectives = quest.objectives.filter(o => o.id !== objectiveId);

      if (quest.objectives.length !== initialLength) {
        markDirty();
      }
    }
  }

  function removeQuestNodes(nodeIds: string[]) {
    if (nodeIds.length === 0) {
      return;
    }
    const initialQuestCount = currQuestline.value.quests.length;
    const initialDepCount = currQuestline.value.dependencies.length;
    const questsBeforeDelete = [...currQuestline.value.quests];
    const depsBeforeDelete = [...currQuestline.value.dependencies];
    const downstreamQuests = new Set<string>();

    // find completed quests that directly depend on any node being deleted
    nodeIds.forEach(nodeId => {
      depsBeforeDelete.forEach(dep => {
        if (dep.from === nodeId) {
          const downstreamQuest = questsBeforeDelete.find(q => q.id === dep.to);
          // if downstream quest was completed it needs to be updated after delete
          if (downstreamQuest && downstreamQuest.completed) {
            downstreamQuests.add(downstreamQuest.id);
          }
        }
      });
    });

    // delete quests and find their direct dependencies
    currQuestline.value.quests = currQuestline.value.quests.filter(q => !nodeIds.includes(q.id));
    currQuestline.value.dependencies = currQuestline.value.dependencies.filter(d => !nodeIds.includes(d.from) && !nodeIds.includes(d.to));

    if (currQuestline.value.quests.length !== initialQuestCount || currQuestline.value.dependencies.length !== initialDepCount) {
      markDirty();
    }

    // downstream quests that were completed need to be marked incomplete
    downstreamQuests.forEach(downstreamQuestId => {
      const quest = currQuestline.value.quests.find(q => q.id === downstreamQuestId);
      if (quest) {
        quest.completed = false;
        cascadeUncomplete(quest.id);
      }
    });
  }

  function removeQuestDependencies(edgeIds: string[]) {
    if (edgeIds.length === 0) {
      return;
    }
    const initialDepCount = currQuestline.value.dependencies.length;
    const quests = currQuestline.value.quests;
    const depsToCascade = new Set<string>();

    // filter out deps and collect quests of removed dependencies that were connected to a completed quest
    const remainingDeps: Dependency[] = [];
    currQuestline.value.dependencies.forEach((dep, idx) => {
      const currDepId = getEdgeId(dep, idx);
      
      if (edgeIds.includes(currDepId)) {
        const quest = quests.find(q => q.id === dep.to);

        // if quest was completed, its not anymore and missing a dependency
        if (quest && quest.completed) {
          depsToCascade.add(dep.to);
        }
      } else {
        remainingDeps.push(dep);
      }
    });
    currQuestline.value.dependencies = remainingDeps;

    if (currQuestline.value.dependencies.length !== initialDepCount) {
      markDirty();
    }

    // update downstream quests connected to deleted dependencies to uncomplete
    depsToCascade.forEach(questId => {
      const quest = quests.find(q => q.id === questId);
      if (quest && quest.completed) {
        quest.completed = false;
        cascadeUncomplete(quest.id);
      }
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

    if (idx === -1) {
      errorMsg.value = `Quest ${updated.id} could not be found for update.`;
      setTimeout(() => errorMsg.value = null, ERROR_MSG_WAIT_MS);
      closeQuestEditor();
      return;
    }
    const original = currQuestline.value.quests[idx];
    const wasOriginallyCompleted = original.completed;

    // apply updates from editor
    currQuestline.value.quests[idx] = {
      ...original,
      title: updated.title,
      description: updated.description,
      color: updated.color,
      objectives: updated.objectives ? JSON.parse(JSON.stringify(updated.objectives)) : [], // deep copy
      completed: wasOriginallyCompleted,
    };
    const afterUpdate = currQuestline.value.quests[idx];
    const nowCompleted = canCompleteQuest(afterUpdate.id);

    markDirty();

    // quest was complete, but editor changes made it incomplete
    if (wasOriginallyCompleted && !nowCompleted) {
      afterUpdate.completed = false;
      cascadeUncomplete(afterUpdate.id);
    }
    closeQuestEditor();
  }

  function updateQuestlineName(name: string) {
    if (currQuestline.value && currQuestline.value.name !== name) {
      currQuestline.value.name = name;
      markDirty();
    }
  }

  function openLoadModal() {
    showLoadModal.value = true;
    fetchAllQuestlineInfos();
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
    if (!currQuestline.value.id || !(allQuestlineInfos.value as QuestlineInfo[]).some((q: QuestlineInfo) => q.id === currQuestline.value.id)) {
      errorMsg.value = 'Please save questline before exporting';
      setTimeout(() => errorMsg.value = null, ERROR_MSG_WAIT_MS);
      return;
    }
    questlineApiService.exportQuestline(currQuestline.value.id, fmt);
  }

  function applyDarkMode(active: boolean) {
    isDarkMode.value = active;
    localStorage.setItem(IS_DARK_MODE_KEY, String(active));

    if (active) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  function toggleDarkMode() {
    applyDarkMode(!isDarkMode.value);
  }
  applyDarkMode(localStorage.getItem(IS_DARK_MODE_KEY) === 'true');

  function setHoveredNodeId(id: string | null) {
    hoveredNodeId.value = id;
  }

  function setHoveredEdgeId(id: string | null) {
    hoveredEdgeId.value = id;
  }

  return {
    // constants
    LAST_ACTIVE_QUESTLINE_ID_KEY,
    // properties
    currQuestline, allQuestlineInfos, 
    isLoading, errorMsg, successMsg, 
    nodes, edges, selectedQuestForEdit,
    showQuestEditor, showLoadModal, showHelpModal, isDarkMode, 
    hoveredNodeId, hoveredEdgeId,
    hasUnsavedChanges,
    // functions
    handleSuccess, handleError,
    fetchAllQuestlineInfos, loadQuestline, saveCurrentQuestline, deleteCurrentQuestline,
    addQuestNode, updateQuestPosition, addQuestDependency, updateQuestlineName,
    removeQuestNodes, removeQuestDependencies,
    addObjective, removeObjective,
    openQuestForEdit, openLoadModal, openHelpModal, isAnyModalOpen,
    closeQuestEditor, closeLoadModal, closeHelpModal, closeAllModals,
    updateQuestDetails, setQuestCompleted, canCompleteQuest,
    triggerExport, toggleDarkMode, setQuestlineFromLoadedData,
    setHoveredNodeId, setHoveredEdgeId,
  };
});
