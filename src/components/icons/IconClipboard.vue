<template>
  <g :class="{disabled: disabled}" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
    <rect id="Rectangle" stroke="#307DF6" x="2.5" y="2.5" width="11" height="13" rx="1"></rect>
    <path d="M7.68821175,0.5 L6.54382447,1.33961079 L6.54382447,2.5 L5.47126429,2.5 L5.524312,3.50563779 L10.4762008,3.50563779 L10.4762008,2.50281889 L9.44132601,2.50281889 L9.44132601,1.33505474 L8.3372104,0.5 L7.68821175,0.5 Z" id="Path" stroke="#307DF6"></path>
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
.disabled {
  rect, path {
    stroke: $lblbtn-prm-disabled-text-color;
  }
}

</style>