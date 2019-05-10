<template>
  <g :class="{disabled: disabled}" transform="translate(1.000000, 0.000000)" stroke="#6E757C">
      <path d="M6.63438404,2.29784622 L6.69312775,13.0296661" id="Line" stroke-linecap="square" transform="translate(6.663756, 7.663756) rotate(-45.000000) translate(-6.663756, -7.663756) "></path>
      <path d="M0.994333506,8.45589096 L0.994370959,10.9886006 C0.994370959,12.1268171 2.01701,13.0712756 3.30206327,13.0712756 C4.58711653,13.0712756 5.60975557,12.1268171 5.60975557,10.9886006 C5.60975557,9.64082502 5.60975557,8.52974972 5.60975649,8.45589096" id="Rectangle" transform="translate(3.302045, 10.763583) rotate(45.000000) translate(-3.302045, -10.763583) "></path>
      <path d="M7.56853162,1.87432918 L7.56853162,4.43302376 C7.56853162,5.58291811 8.59117066,6.53706649 9.87622393,6.53706649 C11.1612772,6.53706649 12.1839163,5.58291811 12.1839163,4.43302376 C12.1839163,2.83413893 12.1839163,2.24273116 12.1839163,1.87432918" id="Rectangle" transform="translate(9.876224, 4.205698) rotate(-135.000000) translate(-9.876224, -4.205698) "></path>
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