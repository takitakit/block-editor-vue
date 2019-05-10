<template>
  <g :class="{'BEV-hover': hover, 'BEV-active': active}">
      <polygon id="Triangle" fill="#707070" transform="translate(5.000000, 5.500000) scale(1, -1) translate(-5.000000, -5.500000) " points="5 3 9 8 1 8"></polygon>
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
polygon {
  fill: $lbl-text-color;
}
</style>