<template>
  <div class="BEV-input">
    <input 
      :value="value"
      @focus="$emit('focus')"
      @input="$emit('input', $event.target.value)"
      @keydown.enter.stop.prevent="$emit('enter')"
      @keydown.esc.stop="$emit('escape')"
      :placeholder="placeholder"
      ref="input"
      type="text" />
    <IconBase 
      @click.native.stop="$emit('clear')"
      class="BEV-close"
      width="20" height="20">
      <IconInputClear />
    </IconBase>
  </div>
</template>

<script>
import IconBase from '@/components/sub/IconBase.vue'
import IconInputClear from '@/components/icons/IconInputClear.vue'

export default {
  props: ['value', 'placeholder'],
  data () {
    return {
      tmp_value: null
    }
  },
  components: {
    IconBase, IconInputClear,
  },
  methods: {
    focus () {
      this.$refs.input.focus()
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/valiables.scss';

.BEV-input {
  position: relative;
  width: 100%;
  box-sizing: border-box;
  input {
    @extend %input;
    font-size: .9em;
    padding-right: 30px;
    width: 100%;
    box-sizing: border-box;
  }
}
.BEV-close {
  position: absolute;
  top: 50%;
  right: 5px;
  transform: translate(0, -50%);
  cursor: pointer;
}
</style>