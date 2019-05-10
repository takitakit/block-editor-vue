<template>
  <g 
    :class="{'BEV-hover': hover, 'BEV-active': active}">
    <circle vector-effect="non-scaling-stroke" cx="3" cy="3" r="1" fill="rgb(110,117,124)"/><circle vector-effect="non-scaling-stroke" cx="3" cy="6" r="1" fill="rgb(110,117,124)"/><circle vector-effect="non-scaling-stroke" cx="3" cy="9" r="1" fill="rgb(110,117,124)"/><circle vector-effect="non-scaling-stroke" cx="6" cy="3" r="1" fill="rgb(110,117,124)"/><circle vector-effect="non-scaling-stroke" cx="6" cy="6" r="1" fill="rgb(110,117,124)"/><circle vector-effect="non-scaling-stroke" cx="6" cy="9" r="1" fill="rgb(110,117,124)"/><circle vector-effect="non-scaling-stroke" cx="9" cy="3" r="1" fill="rgb(110,117,124)"/><circle vector-effect="non-scaling-stroke" cx="9" cy="6" r="1" fill="rgb(110,117,124)"/><circle vector-effect="non-scaling-stroke" cx="9" cy="9" r="1" fill="rgb(110,117,124)"/>
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
circle {
  fill: #fff;
}

</style>