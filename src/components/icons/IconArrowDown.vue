<template>
  <g 
    :class="{'BEV-hover': hover, 'BEV-active': active}">
    <path d=" M 8.5 9.784 L 4.694 6.268 C 4.307 5.911 3.678 5.911 3.29 6.268 L 3.29 6.268 C 2.903 6.626 2.903 7.207 3.29 7.565 L 7.781 11.713 C 7.935 11.855 8.127 11.941 8.327 11.97 C 8.64 12.02 8.977 11.937 9.219 11.713 L 13.71 7.565 C 14.097 7.207 14.097 6.626 13.71 6.268 L 13.71 6.268 C 13.322 5.911 12.693 5.911 12.306 6.268 L 8.5 9.784 Z " fill-rule="evenodd" fill="rgb(110,117,124)"/>
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
rect {
  fill: $lbl-text-color;
}
</style>