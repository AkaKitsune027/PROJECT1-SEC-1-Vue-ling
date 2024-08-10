<script setup>
  import { ref } from 'vue';
  const itemRefs = ref([])
</script>
 
<template>
<div class="grid grid-cols-4" >
  <div class="col-start-2 col-span-2 text-center space-y-10">
  <span class="text-5xl">Mouse Kingdom</span>
  <div class="grid grid-cols-6 gap-1 w-fit">
    <div class=" bg-slate-700 w-32 max-w-40 h-28 max-h-36 shadow-lg shadow-cyan-200/20 border" v-for="item in 36" ref="itemRefs">
      {{ item }}
  </div>
  </div>
</div>
</div>
</template>
 
<style scoped>

</style>