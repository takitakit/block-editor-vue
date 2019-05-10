<template>
  <g 
    :class="{'BEV-hover': hover, 'BEV-active': active}">
    <path d=" M 8.5 7.2 L 4.694 10.716 C 4.307 11.074 3.678 11.074 3.29 10.716 L 3.29 10.716 C 2.903 10.358 2.903 9.777 3.29 9.42 L 7.781 5.271 C 7.935 5.129 8.127 5.043 8.327 5.014 C 8.64 4.964 8.977 5.048 9.219 5.271 L 13.71 9.42 C 14.097 9.777 14.097 10.358 13.71 10.716 L 13.71 10.716 C 13.322 11.074 12.693 11.074 12.306 10.716 L 8.5 7.2 Z " fill-rule="evenodd" fill="rgb(110,117,124)"/>
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