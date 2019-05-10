<template>
  <div 
    @mouseenter="!isTouchDevice ? $emit('mouseenter') : false"
    @mouseleave="!isTouchDevice ? $emit('mouseleave') : false"
    @click="isTouchDevice ? $emit('cancel') : false"
    :class="{'BEV-sp': isTouchDevice}"
    class="BEV-menu-wrap">
    <div class="BEV-menu BEV-list">
      <div
        v-if="isTouchDevice" 
        class="BEV-menu-title">{{$t('List.changeType')}}
      </div>
      <div class="BEV-items">
        <div 
          v-for="type in getConfig('List.types')" 
          :key="type"
          @click.stop="$emit('input', type)"
          :class="{'BEV-active': type===value}"
          class="BEV-item"
        >
          <IconBase 
            v-if="type===value"
            width="15" height="15">
            <IconCheck />
          </IconBase>
          <span>{{$t('List.'+type+'List')}}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ComponentBase from '@/components/sub/ComponentBase.vue'
import IconBase from '@/components/sub/IconBase.vue'
import IconCheck from '@/components/icons/IconCheck.vue'

export default {
  extends: ComponentBase,
  components: {IconBase, IconCheck},
  props: ['value'],
  computed: {},
  data () {
    return {
    }
  },
}
</script>

<style lang="scss" scoped>
@import '@/styles/valiables.scss';

.BEV-menu-wrap {
  @extend %popup-menu-wrap;
  .BEV-menu {
    .BEV-item {
      span {
        padding-left: 19px;
      }
    }
    .BEV-item.BEV-active {
      span {
        padding-left: 2px;
      }
    }
  }
}
</style>