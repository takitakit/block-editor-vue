<template>
  <g 
    :class="{'BEV-hover': hover, 'BEV-active': active}">
    <path d=" M 9 6 L 9 10 L 15 10 L 15 6 L 15 6 L 9 6 Z  M 8 6 L 8 6 L 8 10 L 2 10 L 2 6 L 8 6 Z  M 15 15 L 9 15 L 9 11 L 15 11 L 15 15 L 15 15 Z  M 8 15 L 2 15 L 2 11 L 8 11 L 8 15 L 8 15 L 8 15 Z  M 16 6 L 16 4 L 16 3 L 15.5 3 L 15.5 3 L 15.5 3 L 15 3 L 9 3 L 8 3 L 2 3 L 1.5 3 L 1 3 L 1 4 L 1 10 L 1 11 L 1 15 L 1 15.5 L 1 16 L 2 16 L 8 16 L 9 16 L 15 16 L 16 16 L 16 15.5 L 16 15 L 16 11 L 16 10 L 16 6 L 16 6 Z " fill-rule="evenodd" fill="rgb(110,117,124)"/>
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