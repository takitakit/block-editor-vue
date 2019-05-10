<template>
  <g 
    :class="{'BEV-hover': hover, 'BEV-active': active}">
    <rect x="7" y="3" width="9" height="1" transform="matrix(1,0,0,1,0,0)" fill="rgb(110,117,124)"/><rect x="7" y="6" width="9" height="1" transform="matrix(1,0,0,1,0,0)" fill="rgb(110,117,124)"/><rect x="2" y="9" width="14" height="1" transform="matrix(1,0,0,1,0,0)" fill="rgb(110,117,124)"/><rect x="2" y="12" width="14" height="1" transform="matrix(1,0,0,1,0,0)" fill="rgb(110,117,124)"/><rect x="2" y="15" width="14" height="1" transform="matrix(1,0,0,1,0,0)" fill="rgb(110,117,124)"/>
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
line {
  stroke: $btn-scd-text-color;
}

</style>