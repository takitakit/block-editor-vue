<template>
  <g 
    :class="{'BEV-hover': hover, 'BEV-active': active}">
    <path d=" M 1 2 L 17 2 L 17 16 L 1 16 L 1 2 Z  M 2 3 L 16 3 L 16 15 L 2 15 L 2 3 Z " fill-rule="evenodd" fill="rgb(110,117,124)"/><rect x="3" y="4" width="12" height="3" transform="matrix(1,0,0,1,0,0)" fill="rgb(110,117,124)"/>
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