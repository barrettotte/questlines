<script setup lang="ts">

  import { VueFlow, useVueFlow } from '@vue-flow/core'
  import type { Connection, NodeDragEvent } from '@vue-flow/core';
  import { Background, BackgroundVariant } from '@vue-flow/background'
  import { Controls } from '@vue-flow/controls'
  import { MiniMap } from '@vue-flow/minimap'

  import { storeToRefs } from 'pinia'
  import { watch, nextTick } from 'vue'

  import { useQuestStore } from '../stores/questStore'
  import CustomNode from './CustomNode.vue'

  const store = useQuestStore();
  const { nodes, edges } = storeToRefs(store);
  const { onNodeDragStop, onConnect, onEdgesChange, onNodesChange, fitView } = useVueFlow()

  onNodeDragStop((event: NodeDragEvent) => {
    store.updateQuestPosition(event.node.id, event.node.position);
  });

  onConnect((conn: Connection) => {
    store.addQuestDependency(conn);
  });

  // delete via delete key
  onEdgesChange((changes) => {
    changes.forEach(change => {
      if (change.type === 'remove') {
        store.removeQuestDependency(change.id);
      }
    });
  });
  onNodesChange((changes) => {
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
    fitView();
  }, { deep: true, immediate: true });

</script>

<template>
  <div class="quest-board-wrapper">
    <VueFlow
      :nodes="nodes"
      :edges="edges"
      :node-types="nodeTypes"
      class="basicflow"
      :fit-view-on-init="true"
      delete-key-code="Delete"
      :box-selection-key-code="'Shift'"
      :multi-selection-key-code="'Shift'"
    >
      <Background :variant="BackgroundVariant.Dots" :gap="24" :size="1" color="#ccc"/>
      <Controls position="top-right"/>
      <MiniMap pannable zoomable/>
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
    background-color: #e9e9e9;
  }
</style>
