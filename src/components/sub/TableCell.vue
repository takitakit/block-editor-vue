<template>
  <td 
    @mousedown.prevent.stop="onMouseDown"
    @mouseup.prevent.stop="onMouseUp"
    @mouseenter.prevent.stop="$emit('cell-mouseenter', cell, $event)"
    @contextmenu.prevent.stop="$emit('cell-context-menu', cell, $event)"
    v-html="_content"
    class="BEV-table-cell"
    :class="{'BEV-header':cell.header}"
    :rowspan="cell.rowspan"
    :colspan="cell.colspan"
  ></td>
</template>

<script>
export default {
  props: ['cell'],
  data () {
    return {
      mouseDownEvent: null
    }; 
  },
  computed: {
    _content () {
      return this.cell.content ? this.cell.content : '<br>'
    }
  },
  methods: {
    // マウスダウン
    onMouseDown (ev) {
      if (ev.button!==0) return false // 左クリック以外はキャンセル
      this.mouseDownEvent = ev

      this.$emit('cell-mousedown', this.cell, ev)
    },
    // マウスアップ
    onMouseUp (ev) {
      if (ev.button!==0) return false; // 左クリック以外はキャンセル

      let click = false
      if (this.mouseDownEvent) {
        if (Math.abs(this.mouseDownEvent.pageX - ev.pageX) < 10 &&
          Math.abs(this.mouseDownEvent.pageY - ev.pageY) < 10) {
          // マウスダウンとアップの位置が
          // 一定以上離れていない場合はクリックと見なす
          this.$emit('cell-click', this.cell, ev)
          click = true
        }
        this.mouseDownEvent = null
      }

      if (!click) {
        this.$emit('cell-mouseup', this.cell, ev)
      }
    },
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/valiables.scss';
.BEV-table-cell {
  color: $item-text-color;
  border: 1px solid #BCBCBC;
  padding: .2em .4em;
  line-height: 1.5em;
  word-break: break-all;
  background-color: #FFF;
  z-index: -1;

  /deep/ p {
    margin: 0;
  }

  &.BEV-header {
    background-color: #E4EDF9;
    // color: #fff;
    font-weight: bold;
  }
}

</style>