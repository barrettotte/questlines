<script setup lang="ts">

  import { VueFlow, useVueFlow } from '@vue-flow/core';
  import type { Connection, NodeDragEvent } from '@vue-flow/core';
  import { Background } from '@vue-flow/background';
  import { Controls } from '@vue-flow/controls';
  import { MiniMap } from '@vue-flow/minimap';

  import { storeToRefs } from 'pinia';

  import { useQuestStore } from '../stores/questStore';
  import CustomEdge from './CustomEdge.vue';
  import CustomNode from './CustomNode.vue';

  const store = useQuestStore();
  const { nodes: storeNodes, edges: storeEdges, isDarkMode } = storeToRefs(store);
  const {
    dimensions, viewport, getSelectedNodes, getSelectedEdges,
    onNodeDragStop, onConnect, project, setNodes,
  } = useVueFlow();

  const edgeTypes = { custom: CustomEdge, };
  const nodeTypes = { custom: CustomNode, };

  defineExpose({ addNewQuestAtViewportCenter });


  onConnect((conn: Connection) => {
    store.addQuestDependency(conn);
  });

  onNodeDragStop((event: NodeDragEvent) => {
    store.updateQuestPosition(event.node.id, event.node.position);
    
    // make sure node doesn't get accidentally selected
    setNodes((nodes) =>
      nodes.map((n) =>
        n.id === event.node.id ? { ...n, selected: false } : n
      )
    );
  });

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Delete') {
      const selectedNodes = getSelectedNodes.value;
      const selectedEdges = getSelectedEdges.value;

      if (selectedNodes.length > 0 || selectedEdges.length > 0) {
        if (confirm(`Delete ${selectedNodes.length} node(s) and ${selectedEdges.length} edge(s)?`)) {
          if (selectedNodes.length > 0) {
            store.removeQuestNodes(selectedNodes.map(n => n.id));
          }
          if (selectedEdges.length > 0) {
            store.removeQuestDependencies(selectedEdges.map(e => e.id));
          }
        }
      }
    }
  };

  function addNewQuestAtViewportCenter() {
    let newQuestPosition = { x: 100, y: 100 }; // fallback

    if (dimensions.value.width > 0 && dimensions.value.height > 0) {
      const paneCenterX = dimensions.value.width / 2;
      const paneCenterY = dimensions.value.height / 2;
      const flowCenter = project({x: paneCenterX, y: paneCenterY });
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
</script>

<template>
  <div class="quest-board-wrapper" @keydown="handleKeyDown" tabindex="0">
    <VueFlow
      :nodes="storeNodes"
      :edges="storeEdges"
      :node-types="nodeTypes"
      :edge-types="edgeTypes"
      :class="{ 'dark': isDarkMode, 'quest-board-canvas': true }"
      :fit-view-on-init="true"
      :delete-key-code="null"
      :box-selection-key-code="'Shift'"
      :multi-selection-key-code="'Shift'"
      @node-mouse-enter="store.setHoveredNodeId($event.node.id)"
      @node-mouse-leave="store.setHoveredNodeId(null)"
      @edge-mouse-enter="store.setHoveredEdgeId($event.edge.id)"
      @edge-mouse-leave="store.setHoveredEdgeId(null)"
    >
      <Background :variant="'lines'" :gap="20" :size="2" :color="isDarkMode ? '#474747' : '#d9d9d9'"/>

      <MiniMap pannable zoomable class="custom-minimap" 
        :node-stroke-color="isDarkMode ? '#a0aec0' : '#6b7280'"
        :node-color="isDarkMode ? '#4a5568' : '#fff'"
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
    outline: none;
  }

  .quest-board-canvas {
    width: 100%;
    height: 100%;
    background-color: var(--bg-color);
    transition: background-color 0.2s ease;
  }
</style>
