<template>
  <g 
    :class="{'BEV-hover': hover, 'BEV-active': active}"
    stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" stroke-linecap="square">
    <path d="M1.5,10.5 L13.5,10.5" id="Line" stroke="#565B61" stroke-linecap="square"></path>
    <path d="M1.5,13.5 L13.5,13.5" id="Line" stroke="#565B61" stroke-linecap="square"></path>
    <rect id="Rectangle" fill="#565B61" x="4" y="1" width="7" height="7"></rect>
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
path {
  stroke: $lbl-text-color;
}
rect {
  fill: $lbl-text-color;
}
g.BEV-active {
  path {
    stroke: #fff;
  }
  rect {
    fill: #fff;
  }
}
</style>