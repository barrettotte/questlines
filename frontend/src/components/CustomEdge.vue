<script setup lang="ts">
  import { computed } from 'vue';
  import { BaseEdge, getBezierPath, type EdgeProps } from '@vue-flow/core'

  interface CustomEdgeProps extends EdgeProps {};

  const props = defineProps<CustomEdgeProps>();

  // calculate path for edge
  const pathDetails = computed(() => getBezierPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition,
  }));
  const path = computed(() => pathDetails.value[0]);

</script>

<template>
  <BaseEdge :id="id" :path="path" :style="props.style" :marker-end="markerEnd"/>
</template>

<style scoped>
  /* */
</style>
