<template>
  <div 
    @mouseenter="!isTouchDevice ? $emit('mouseenter') : false"
    @mouseleave="!isTouchDevice ? $emit('mouseleave') : false"
    @click="isTouchDevice ? $emit('cancel-click') : false"
    :class="{'BEV-sp': isTouchDevice}"
    class="BEV-menu-wrap">
    <div class="BEV-menu BEV-list">
      <div
        v-if="isTouchDevice" 
        class="BEV-menu-title">{{$t('common.actionForBlock')}}
      </div>
      <div class="BEV-items">
        <div 
          v-for="(prop, name) in actions" 
          :key="name"
          @click.stop="$emit('item-click', name)"
          :class="{'BEV-danger': prop.type==='danger', 'BEV-disabled': prop.disabled===true}"
          class="BEV-item"
        >
          <IconBase 
            v-if="prop.icon"
            width="18" height="18">
            <component 
              :disabled="prop.disabled"
              :danger="prop.type==='danger' ? true : false"
              :is="prop.icon" />
          </IconBase>
          <span>{{prop.text}}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ComponentBase from '@/components/sub/ComponentBase.vue'

import IconBase from '@/components/sub/IconBase.vue'
import IconMoveup from '@/components/icons/IconMoveup.vue'
import IconMovedown from '@/components/icons/IconMovedown.vue'
import IconCssClass from '@/components/icons/IconCssClass.vue'
import IconReplicate from '@/components/icons/IconReplicate.vue'
import IconDelete from '@/components/icons/IconDelete.vue'

export default {
  extends: ComponentBase,
  components: {
    IconBase, IconMoveup, IconMovedown, IconCssClass, IconReplicate, IconDelete
  },
  props: ['actions'],
  data () {
    return {
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/valiables.scss';

.BEV-menu-wrap {
  @extend %popup-menu-wrap;
}
</style>