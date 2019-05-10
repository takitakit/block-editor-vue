<template>
  <g 
    :class="{'BEV-hover': hover, 'BEV-active': active}">
    <rect x="4.04" y="8.345" width="9.717" height="1.5" transform="matrix(0.574,-0.819,0.819,0.574,-3.656,11.162)" fill="rgb(110,117,124)"/><path d=" M 5.02 14.41 L 5.32 14.81 L 4.51 15.4 L 4.22 14.99 L 0 9.2 L 4.22 3.41 L 4.51 3 L 5.32 3.59 L 5.02 3.99 L 1.24 9.2 L 5.02 14.41 Z " fill="rgb(110,117,124)"/><path d=" M 12.8 3.99 L 12.5 3.59 L 13.31 3 L 13.6 3.41 L 17.82 9.2 L 13.6 14.99 L 13.31 15.4 L 12.5 14.81 L 12.8 14.41 L 16.58 9.2 L 12.8 3.99 Z " fill="rgb(110,117,124)"/>
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