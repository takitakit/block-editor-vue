<template>
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    :width="width" 
    :height="height" 
    role="presentation"
  >
    <slot />
  </svg>
</template>

<script>
export default {
  props: {
    width: {
      type: [Number, String],
      default: 18
    },
    height: {
      type: [Number, String],
      default: 18
    },
  }
}
</script>

<style lang="scss" scoped>
svg {
  // display: inline-block;
  // vertical-align: baseline;
  // margin-bottom: -2px; /* yes, I'm that particular about formatting */
}
</style>