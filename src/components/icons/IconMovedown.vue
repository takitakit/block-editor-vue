<template>
  <g 
    class="BEV-icon-wrap"
    :class="{'BEV-hover': hover, 'BEV-active': active, 'BEV-disabled': disabled}">
    <path d=" M 3.71 6.29 L 3 5.59 L 1.59 7 L 2.29 7.71 L 9 14.41 L 15.71 7.71 L 16.41 7 L 15 5.59 L 14.29 6.29 L 9 11.59 L 3.71 6.29 Z " fill="rgb(110,117,124)"/>
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