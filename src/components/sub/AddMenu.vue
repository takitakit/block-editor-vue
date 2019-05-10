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
        class="BEV-menu-title">{{$t('common.addBlock')}}
      </div>
      <div class="BEV-items">
        <div 
          v-for="item in items" :key="item.id"
          @click.stop="$emit('item-click', item)"
          :class="{danger: item.type==='danger'}"
          class="BEV-item"
        >
          <IconBase 
            v-if="item.icon"
            width="18" height="18">
            <component :is="item.icon" />
          </IconBase>
          {{item.text}}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ComponentBase from '@/components/sub/ComponentBase.vue'
import IconBase from '@/components/sub/IconBase.vue'
import IconParagraph from '@/components/icons/IconParagraph.vue'
import IconTable from '@/components/icons/IconTable.vue'
import IconList from '@/components/icons/IconList.vue'
import IconColumn from '@/components/icons/IconColumn.vue'
import IconImage from '@/components/icons/IconImage.vue'
import IconHeading from '@/components/icons/IconHeading.vue'
import IconHtml from '@/components/icons/IconHtml.vue'

export default {
  extends: ComponentBase,
  components: {
    IconBase, IconParagraph, IconTable, IconList, IconColumn, IconImage, IconHeading, IconHtml
  },
  props: ['items'],
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