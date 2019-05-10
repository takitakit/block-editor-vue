<template>
  <g 
    :class="{'BEV-hover': hover, 'BEV-active': active}">
    <path d=" M 5 2 L 16 2 L 16 13 L 5 13 L 5 2 Z  M 6 3 L 15 3 L 15 12 L 6 12 L 6 3 Z " fill-rule="evenodd" fill="rgb(110,117,124)"/><path d=" M 11 14 L 11 16 L 2 16 L 2 7 L 4 7 L 4 6 L 1 6 L 1 17 L 12 17 L 12 14 L 13 14 L 11 14 Z " fill="rgb(110,117,124)"/><line x1="12" y1="14" x2="13" y2="14"/>
  </g>
</template>

<script>
export default {
  props: ['hover', 'active'],
}
</script>

<style lang="scss" scoped>
@import '@/styles/valiables.scss';

* {
  transition: opacity .15s;
}

</style>