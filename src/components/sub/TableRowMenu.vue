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
        class="BEV-menu-title">{{$t('Table.rowMenu')}}
      </div>
      <div class="BEV-items">
        <div class="BEV-item" @click="$emit('action', 'addRowAbove')" :class="{'BEV-disabled': isMaxRow}"> {{$t("Table.addRowAbove")}}</div>
        <div class="BEV-item" @click="$emit('action', 'addRowBelow')" :class="{'BEV-disabled': isMaxRow}"> {{$t("Table.addRowBelow")}}</div>
        <div class="BEV-item" @click="$emit('action', 'headerizeRow')"> {{$t("Table.headerizeRow")}}</div>
        <div class="BEV-item" @click="$emit('action', 'deheaderizeRow')"> {{$t("Table.deheaderizeRow")}}</div>
        <div class="BEV-item BEV-danger" @click="$emit('action', 'clearRow')"> {{$t("Table.clearRow")}}</div>
        <div class="BEV-item BEV-danger" @click="$emit('action', 'deleteRow')" :class="{'BEV-disabled': isMinRow}"> {{$t("Table.delRow")}}</div>
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
  props: ['isMaxRow', 'isMinRow'],
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