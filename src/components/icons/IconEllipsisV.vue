<template>
  <g 
    class="BEV-icon-wrap"
    :class="{'BEV-hover': hover, 'BEV-active': active}">
    <circle vector-effect="non-scaling-stroke" cx="8.5" cy="3.5" r="1.5" fill="rgb(83,83,83)"/><circle vector-effect="non-scaling-stroke" cx="8.5" cy="8.5" r="1.5" fill="rgb(83,83,83)"/><circle vector-effect="non-scaling-stroke" cx="8.5" cy="13.5" r="1.5" fill="rgb(83,83,83)"/> 
  </g>
</template>

<script>
export default {
  props: ['hover', 'active'],
}
</script>

<style lang="scss" scoped>
@import '@/styles/valiables.scss';

circle {
  transition: opacity .15s;
  fill: $btn-scd-text-color;
}

.BEV-icon-wrap.BEV-active {
  circle {
    fill: $btn-prm-text-color;
  }
}

</style>