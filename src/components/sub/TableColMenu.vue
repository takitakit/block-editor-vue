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
        class="BEV-menu-title">{{$t('Table.colMenu')}}
      </div>
      <div class="BEV-items">
        <div class="BEV-item" @click="$emit('action','addColLeft')" :class="{'BEV-disabled': isMaxCol}"> {{$t("Table.addColLeft")}}</div>
        <div class="BEV-item" @click="$emit('action', 'addColRight')" :class="{'BEV-disabled': isMaxCol}"> {{$t("Table.addColRight")}}</div>
        <div class="BEV-item" @click="$emit('action', 'headerizeCol')"> {{$t("Table.headerizeCol")}}</div>
        <div class="BEV-item" @click="$emit('action', 'deheaderizeCol')"> {{$t("Table.deheaderizeCol")}}</div>
        <div class="BEV-item BEV-danger" @click="$emit('action', 'clearCol')"> {{$t("Table.clearCol")}}</div>
        <div class="BEV-item BEV-danger" @click="$emit('action', 'deleteCol')" :class="{'BEV-disabled': isMinCol}"> {{$t("Table.delCol")}}</div>
      </div>
    </div>
  </div>
</template>

<script>
import ComponentBase from '@/components/sub/ComponentBase.vue'
// import IconBase from '@/components/sub/IconBase.vue'
// import IconCheck from '@/components/icons/IconCheck.vue'

export default {
  extends: ComponentBase,
  props: ['isMaxCol', 'isMinCol'],
  // components: {IconBase, IconCheck},
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