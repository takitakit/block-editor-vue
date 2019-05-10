<template>
  <div 
    tabindex="0"
    @click.stop="$emit('background-click', $event)"
    @mouseenter="!$store.state.draggingItem ? hover=true : false"
    @mouseleave="hover=false"
    @focus="active=true"
    @blur="active=false"
    @dragenter="$store.state.draggingItem ? dragged=true : false"
    @dragleave="dragged=false"
    @dragover.prevent="$store.state.draggingItem ? $event.dataTransfer.dropEffect='move' : false"
    @drop.stop="onItemDrop()"
    :class="{'BEV-hover': hover, 'BEV-dragged': dragged, 'BEV-waiting-drag': $store.state.draggingItem}"
    class="BEV-separator">

    <div 
      @click.stop="isTouchDevice ? $emit('button-mouseenter', $event) : false"
      @mouseenter.stop="!isTouchDevice ? $emit('button-mouseenter', $event) : false"
      @mouseleave.stop="!isTouchDevice ? $emit('button-mouseleave', $event) : false"
      class="BEV-button">
      <IconBase 
        width="26" height="26">
        <IconPlus 
          :hover="hover" :active="active" />
      </IconBase>
    </div>
  </div>
</template>

<script>
import ComponentBase from '@/components/sub/ComponentBase.vue'

import IconBase from '@/components/sub/IconBase.vue'
import IconPlus from '@/components/icons/IconPlus.vue'

export default {
  extends: ComponentBase,
  components: {
    IconBase,
    IconPlus,
  },
  computed: {
  },
  data () {
    return {
      hover: false,
      active: false,
      dragged: false,
    }
  },
  methods: {
    // アイテムのドロップイベント
    onItemDrop () {
      this.dragged = false
      if (this.$store.state.draggingItem) {
        // 現在のエディタ内部でのドラッグイベントの場合
        // 親コンポーネントにイベント伝達
        this.$emit('item-drop')
      }
    },
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/valiables.scss';

.BEV-separator {
  transition: background .3s;
  position: relative;
  width: 100%;
  margin: 0 0;
  background-color: #fff;
  box-sizing: border-box;
  border-radius: 3px;
  height: 1.5em;
  cursor: pointer;
  outline: none;

  &.BEV-hover, &:focus, &.BEV-dragged {
    background-color: #E8F1FF!important;
  }
  // ドラッグ待ち状態
  &.BEV-waiting-drag {
    background-color: lighten(#E8F1FF, 3%);
    visibility: visible;

    .BEV-button {
      pointer-events: none;
    }
  }

  .BEV-button {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 26px;
    height: 26px;
  }
}
</style>