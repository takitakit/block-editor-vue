<template>
  <g 
    :class="{'BEV-hover': hover, 'BEV-active': active}">
    <circle vector-effect="non-scaling-stroke" cx="10" cy="10" r="9.5" fill="rgb(110,117,124)" fill-opacity="0.5" stroke-width="1" stroke="rgb(255,255,255)" stroke-linejoin="miter" stroke-linecap="square" stroke-miterlimit="3"/>
    <path d=" M 11.414 10 L 14.243 7.172 L 12.828 5.757 L 10 8.586 L 7.172 5.757 L 5.757 7.172 L 8.586 10 L 5.757 12.828 L 7.172 14.243 L 10 11.414 L 12.828 14.243 L 14.243 12.828 L 11.414 10 Z " fill-rule="evenodd" fill="rgb(255,255,255)"/>
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
  transition: opacity .15s, fill .15s, stroke .15s;
}
circle {
  stroke: #fff;
  fill: #CED1D4;
}
path {
  fill: #fff;
}

g:hover {
  circle {
    fill: #B3B7BC;
  }
}

</style>