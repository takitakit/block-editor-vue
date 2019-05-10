<template>
  <g 
    :class="{'BEV-hover': hover, 'BEV-active': active}">
    <path d=" M 11 15 L 7 15 L 6 15 L 1 15 L 1 2 L 1 2 L 6 2 L 6 2 L 6 2 L 7 2 L 11 2 L 11 2 L 12 2 L 17 2 L 17 15 L 12 15 L 11 15 Z  M 11 3 L 7 3 L 7 3 L 7 14 L 11 14 L 11 3 Z  M 12 3 L 16 3 L 16 14 L 12 14 L 12 3 Z  M 6 3 L 2 3 L 2 3 L 2 14 L 6 14 L 6 3 L 6 3 Z " fill-rule="evenodd" fill="rgb(110,117,124)"/>
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