<template>
  <g 
    class="BEV-icon-wrap"
    :class="{'BEV-hover': hover, 'BEV-active': active, 'BEV-disabled': disabled}">
    <path d=" M 3.71 11.71 L 3 12.41 L 1.59 11 L 2.29 10.29 L 9 3.59 L 15.71 10.29 L 16.41 11 L 15 12.41 L 14.29 11.71 L 9 6.41 L 3.71 11.71 Z " fill="rgb(110,117,124)"/>
  </g>
</template>

<script>
export default {
  props: ['hover', 'active', 'disabled'],
}
</script>

<style lang="scss" scoped>
@import '@/styles/valiables.scss';

* {
  transition: opacity .15s;
}
.BEV-icon-wrap.BEV-disabled {
  path {
    fill: $menu-disabled-text-color;
  }
}

</style>