<template>
  <g 
    :class="{'BEV-hover': hover, 'BEV-active': active}">
    <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <circle id="Oval" fill-opacity="0.5" fill="#000000" cx="10.5" cy="10.5" r="10.5"></circle>
        <rect fill="#FFFFFF" transform="translate(10.500000, 10.500000) rotate(-45.000000) translate(-10.500000, -10.500000) " x="10" y="4" width="1" height="13"></rect>
        <rect fill="#FFFFFF" transform="translate(10.500000, 10.500000) rotate(-315.000000) translate(-10.500000, -10.500000) " x="10" y="4" width="1" height="13"></rect>
    </g>
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
  transition: fill-opacity .15s;
}
g:hover {
  circle {
    fill-opacity: .6;
  }
}
</style>