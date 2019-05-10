<template>
  <g :class="{disabled: disabled}" transform="translate(8.000000, 7.500000) scale(-1, 1) translate(-8.000000, -7.500000) translate(2.000000, 0.000000)">
      <path d="M6,15 C9.3137085,15 12,12.3137085 12,9 C12,5.6862915 9.3137085,3 6,3 C4.83674419,3 3.75080594,3.33103582 2.8312514,3.90404132 C1.62557804,4.65533713 0.705937009,5.82260607 0.273084616,7.20509186 C0.0956384927,7.77183643 -4.4408921e-16,8.37474943 -4.4408921e-16,9 C-4.4408921e-16,9.0648353 0.0010283656,9.12943041 0.00306967549,9.19376991" id="Oval" stroke="#307DF6" stroke-linecap="round" fill-rule="nonzero" transform="translate(6.000000, 9.000000) rotate(90.000000) translate(-6.000000, -9.000000) "></path>
      <polygon id="Triangle" fill="#307DF6" transform="translate(4.000000, 3.000000) rotate(-90.000000) translate(-4.000000, -3.000000) " points="4 0.5 6.5 5.5 1.5 5.5"></polygon>
  </g>
</template>

<script>
export default {
  props: ['hover', 'active', 'disabled'],
}
</script>

<style lang="scss" scoped>
@import '@/styles/valiables.scss';

* {
  transition: opacity .15s;
}
path {
  fill: none;
}
.disabled {
  path {
    stroke: $lblbtn-prm-disabled-text-color;
  }
  polygon {
    fill: $lblbtn-prm-disabled-text-color;
  }
}
</style>