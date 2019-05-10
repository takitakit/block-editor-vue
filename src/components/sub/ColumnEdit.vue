<template>
  <div
    @click="isTouchDevice ? $emit('cancel') : false"
    :class="{'BEV-sp': isTouchDevice}"
    class="BEV-menu-wrap"
  >
    <div 
      @click.stop
      class="BEV-menu BEV-dialog">
      <div
        v-if="isTouchDevice" 
        class="BEV-menu-title">{{$t('Column.changeColumnNum')}}
      </div>
      <div class="BEV-input">
        <RangeInput 
          v-model="input"
          :min="min" 
          :max="max" 
          :step="1" 
          :showScale="true" />
      </div>
      <div class="BEV-buttons">
        <button 
            @click="input=value;$emit('cancel')"
            class="BEV-cancel"
            type="button">{{$t('common.cancel')}}</button>
        <button 
            @click="$emit('input',input)"
            class="BEV-save"
            type="button">{{$t('common.apply')}}</button>
      </div>
    </div>
  </div>
</template>

<script>
import ComponentBase from '@/components/sub/ComponentBase.vue'
import RangeInput from '@/components/sub/RangeInput.vue'

export default {
  extends: ComponentBase,
  components: {
    RangeInput,
  },
  props: ['value', 'min', 'max'],
  computed: {},
  data () {
    return {
      input: null,
    }
  },
  mounted () {
    this.input = this.value
  },
  methods: {
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/valiables.scss';

.BEV-menu-wrap {
  @extend %popup-menu-wrap;
  .BEV-menu {
    width: 12em;
  }
}
</style>