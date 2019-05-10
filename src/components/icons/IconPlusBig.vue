<template>
  <g tabindex="0" class="BEV-icon-wrap" :class="{'BEV-active':active}" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
    <g id="plus" fill="#6E757C" fill-opacity="0.3" fill-rule="nonzero">
      <circle class="border" id="Oval" cx="17" cy="17" r="17"></circle>
      <circle id="Oval" cx="17" cy="17" r="14"></circle>
    </g>
    <path d="M18,16 L26,16 L26,18 L18,18 L18,26 L16,26 L16,18 L8,18 L8,16 L16,16 L16,8 L18,8 L18,16 Z" id="Combined-Shape" fill="#FFFFFF"></path>
  </g>
</template>

<script>
export default {
  props: ['hover', 'active'],
}
</script>

<style lang="scss" scoped>
@import '@/styles/valiables.scss';
.BEV-icon-wrap {
  outline: none;
}
* {
  transition: opacity .15s;
}
.border {
  opacity: 0;
}
.BEV-icon-wrap:focus .border {
  opacity: 1;
}
</style>