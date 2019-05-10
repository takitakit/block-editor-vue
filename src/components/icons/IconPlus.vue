<template>
  <g 
    class="BEV-icon-wrap"
    :class="{'BEV-hover': hover, 'BEV-active': active}">
    <circle class="shadow" vector-effect="non-scaling-stroke" cx="13" cy="13" r="13" fill="rgb(48,125,246)" fill-opacity="0.4"/>
    <circle class="circle" vector-effect="non-scaling-stroke" cx="13" cy="13" r="9.5" fill="rgb(255,255,255)" stroke-width="1" stroke="rgb(110,117,124)" stroke-linejoin="miter" stroke-linecap="square" stroke-miterlimit="3"/>
    <path class="plus" d=" M 14 12 L 14 8 L 12 8 L 12 12 L 8 12 L 8 14 L 12 14 L 12 18 L 14 18 L 14 14 L 18 14 L 18 12 L 14 12 Z " fill-rule="evenodd" fill="rgb(110,117,124)"/>  
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
.circle {
  stroke: $btn-scd-text-color;
  fill: rgb(255,255,255);
}
.plus {
  fill: $btn-scd-text-color;
}
.shadow {
  opacity: 0;
}

.BEV-icon-wrap.BEV-hover {
  .circle {
    stroke: $btn-prm-text-color;
    fill: rgb(255,255,255);
  }
  .plus {
    fill: $btn-prm-text-color;
  }
}

.BEV-icon-wrap.BEV-active {
  .circle {
    stroke: $btn-prm-text-color;
    fill: rgb(255,255,255);
  }
  .plus {
    fill: $btn-prm-text-color;
  }
  .shadow {
    opacity: 1;
  }
}

</style>