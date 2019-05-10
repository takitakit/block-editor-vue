<template>
  <g 
    class="BEV-icon-wrap"
    :class="{'BEV-hover': hover, 'BEV-active': active}">
    <path d="M 2.697 1 L 13.303 1 C 14.239 1 15 1.761 15 2.697 L 15 7.303 C 15 8.239 14.239 9 13.303 9 L 2.697 9 C 1.761 9 1 8.239 1 7.303 L 1 2.697 C 1 1.761 1.761 1 2.697 1 Z" style="stroke:none;stroke-miterlimit:10;"/><circle vector-effect="non-scaling-stroke" cx="4" cy="5" r="1" fill="rgb(255,255,255)"/><circle vector-effect="non-scaling-stroke" cx="8" cy="5" r="1" fill="rgb(255,255,255)"/><circle vector-effect="non-scaling-stroke" cx="12" cy="5" r="1" fill="rgb(255,255,255)"/>
  </g>
</template>

<script>
export default {
  props: ['hover', 'active'],
}
</script>

<style lang="scss" scoped>
@import '@/styles/valiables.scss';

path {
  transition: opacity .15s;
  fill: lighten($btn-scd-text-color, 18%);
}
circle {
  fill: #fff;
}

.BEV-icon-wrap.BEV-active {
  path {
    fill: lighten($btn-prm-text-color, 15%);
  }
}

</style>