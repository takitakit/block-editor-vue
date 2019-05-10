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
        class="BEV-menu-title">{{$t('Table.cellMenu')}}
      </div>
      <div class="BEV-items">
        <div class="BEV-item" :class="{'BEV-disabled': selectedSingleCell}" @click="$emit('action', 'mergeRange')">{{$t("Table.mergeCell")}}</div>
        <div class="BEV-item" :class="{'BEV-disabled': !includesMergedCell}" @click="$emit('action', 'divideRange')">{{$t("Table.divideCell")}}</div>
        <div class="BEV-item" @click="$emit('action', 'headerizeRange')">{{$t("Table.headerizeCell")}}</div>
        <div class="BEV-item" @click="$emit('action', 'deheaderizeRange')">{{$t("Table.deheaderizeCell")}}</div>
        <div class="BEV-item BEV-danger" @click="$emit('action', 'clearRange')">{{$t("Table.clearCell")}}</div>
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
  // components: {IconBase, IconCheck},
  computed: {},
  props: ['includesMergedCell', 'selectedSingleCell'],
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