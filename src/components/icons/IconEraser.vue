<template>
  <g :class="{disabled: disabled}" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
      <g id="Group" transform="translate(7.084201, 8.034923) rotate(-135.000000) translate(-7.084201, -8.034923) translate(3.084201, 2.034923)" stroke="#707070">
          <rect id="Rectangle" x="1.04364894" y="0.747423799" width="6" height="9" rx="1"></rect>
          <rect id="Rectangle" fill="#707070" x="1.04364894" y="3.7474238" width="6" height="7" rx="1"></rect>
      </g>
      <path d="M5.5,13.5 L12.5525451,13.5" id="Line" stroke="#979797" stroke-linecap="square"></path>
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

.active {
  path {
    stroke: $menu-prm-active-text-color;
  }
}

.disabled {
  path {
    stroke: $lblbtn-prm-disabled-text-color;
  }
}
</style>