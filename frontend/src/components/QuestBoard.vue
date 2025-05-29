<script setup lang="ts">

  import { VueFlow, useVueFlow } from '@vue-flow/core'
  import type { Connection, EdgeChange, NodeChange, NodeDragEvent } from '@vue-flow/core';
  import { Background } from '@vue-flow/background'
  import { Controls } from '@vue-flow/controls'
  import { MiniMap } from '@vue-flow/minimap'

  import { storeToRefs } from 'pinia'
  import { watch, nextTick } from 'vue'

  import { useQuestStore } from '../stores/questStore'
  import CustomNode from './CustomNode.vue'

  const store = useQuestStore();
  const { nodes, edges, darkMode } = storeToRefs(store);
  const { onNodeDragStop, onConnect, onEdgesChange, onNodesChange } = useVueFlow()

  onNodeDragStop((event: NodeDragEvent) => {
    store.updateQuestPosition(event.node.id, event.node.position);
  });

  onConnect((conn: Connection) => {
    store.addQuestDependency(conn);
  });

  // delete edge via delete key
  onEdgesChange((changes: EdgeChange[]) => {
    changes.forEach(change => {
      if (change.type === 'remove') {
        store.removeQuestDependency(change.id);
      }
    });
  });

  // delete node via delete key
  onNodesChange((changes: NodeChange[]) => {
    changes.forEach(change => {
      if (change.type === 'remove') {
        // TODO:
        // store.removeQuestNode(change.id);
        console.warn('Node deletion via delete key disabled')
      }
    });
  });

  const nodeTypes = {
    custom: CustomNode,
  };

  watch(nodes, async() => {
    await nextTick(); // wait for DOM update
  }, { deep: true, immediate: true });

  const { project, dimensions, viewport } = useVueFlow();

  function addNewQuestAtViewportCenter() {
    let newQuestPosition = { x: 100, y: 100 }; // fallback

    if (dimensions.value.width > 0 && dimensions.value.height > 0) {
      const paneCenterX = dimensions.value.width / 2;
      const paneCenterY = dimensions.value.height / 2;
      const flowCenter = project({ x: paneCenterX, y: paneCenterY });
      newQuestPosition = { x: flowCenter.x, y: flowCenter.y };
    } else {
      newQuestPosition = {
        x: -viewport.value.x + 100,
        y: -viewport.value.y + 100,
      };
      console.warn("VueFlow dimensions not found, using fallback position");
    }
    store.addQuestNode(newQuestPosition);
  }

  defineExpose({
    addNewQuestAtViewportCenter
  });

</script>

<template>
  <div class="quest-board-wrapper">
    <VueFlow
      :nodes="nodes"
      :edges="edges"
      :node-types="nodeTypes"
      :class="{ 'dark': darkMode, 'quest-board-canvas': true }"
      :fit-view-on-init="true"
      delete-key-code="Delete"
      :box-selection-key-code="'Shift'"
      :multi-selection-key-code="'Shift'"
    >
      <Background :variant="'lines'" :gap="20" :size="2" :color="darkMode ? '#474747' : '#d9d9d9'"/>

      <MiniMap pannable zoomable class="custom-minimap" 
        :node-stroke-color="darkMode ? '#a0aec0' : '#6b7280'"
        :node-color="darkMode ? '#4a5568' : '#fff'"
        :node-border-radius="2"
      />

      <Controls position="top-right"/>

    </VueFlow>
  </div>
</template>

<style>
  .quest-board-wrapper {
    width: 100%;
    height: 100%;
  }

  .quest-board-canvas {
    width: 100%;
    height: 100%;
    background-color: var(--bg-color);
    transition: background-color 0.2s ease;
  }
</style>
