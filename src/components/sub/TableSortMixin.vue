<script>
// カラムのリサイズ処理
import Util from '@/scripts/Util.js'
import DOM from '@/scripts/DOM.js'
export default {
  data () {
    return {
      dragData: null,
      canDrop: false,
    }
  },
  methods: {
    // 行・列のドラッグスタート
    onRowColDragStart (index, type, ev) {
      this.selectedRange = null     // 選択範囲解除
      this.editingCell = null       // セル入力モード終了

      this.dragData = {}

      // ドラッグ時の表示制御のためのダミー画像
      const dummy = document.createElement('div')
      dummy.style.position = 'absolute'
      dummy.style.opacity = '0'
      dummy.style.width = '1px'
      dummy.style.height = '1px'
      dummy.style.pointerEvents = 'none'
      this.$el.appendChild(dummy)
      this.dragData.dummyElm = dummy

      ev.dataTransfer.effectAllowed = 'move'
      ev.dataTransfer.setData('text', '')
      ev.dataTransfer.setDragImage(dummy,0,0)

      // ドラッグ元、先の位置を設定
      this.dragData.move = {from: index, to:index}
      this.dragData.type = type
      this.dragData.domInfo = []
      this.canDrop = this._canDrop(index, index, type)
      const num = type === 'col' ? this.colNum : this.rowNum
      for (let i=0; i<num; i++) {
        // 見出しセルのDOM
        let dom, position, size
        if (type === 'col') { // 列
          dom = this.$refs.table.querySelector('thead th:nth-child('+(i+2)+')')
          position = DOM.position(dom, document).x + window.pageXOffset // DOMのx絶対座標
          size = dom.offsetWidth
        } else if (type === 'row') { // 行
          dom = this.$refs.table.querySelector('tbody tr:nth-child('+(i+1)+') th')
          position = DOM.position(dom, document).y + window.pageYOffset // DOMのy絶対座標
          size = dom.offsetHeight
        }
        this.dragData.domInfo[i] = {
          dom: dom,
          position: position,
          size: size,
        }
      }

      // 挿入位置表示の配置
      const line = this.$refs.insertLine
      let style = {}
      style[type==='col'?'top':'left'] = DOM.position(this.$refs.table, this.$el)[type==='col'?'y':'x'] + 'px'
      style[type==='col'?'width':'height'] = '3px'
      style[type==='col'?'height':'width'] = (type==='col' ? this.$refs.table.offsetHeight : this.$refs.table.offsetWidth) + 'px'
      Object.assign(line.style, style)

      const ghost = this.$refs.insertGhost
      style = {}
      style[type==='col'?'top':'left'] = 
        DOM.position(this.$refs.table, this.$el)[type==='col' ? 'y':'x'] + 'px'
      style[type==='col'?'height':'width'] = 
        (type==='col' ? this.$refs.table.offsetHeight : this.$refs.table.offsetWidth) + 'px'
      Object.assign(ghost.style, style)
      // console.log(style)

      // ドキュメント全体で、ドラッグオーバーとドロップイベントをキャッチする
      document.addEventListener('dragover', this.onDocumentDragOver)
      document.addEventListener('drop', this.onDocumentDrop)
    },
    // 行・列のドラッグ終了
    onRowColDragEnd () {
      this.dragData = null
      // ドラッグ関係イベントの削除
      document.removeEventListener('dragover', this.onDocumentDragOver)
      document.removeEventListener('drop', this.onDocumentDrop)
    },
    // ドラッグオーバー（要素全体）
    onDocumentDragOver (ev) {
      ev.dataTransfer.dropEffect = 'move'
      ev.preventDefault()

      // 列のどの位置にドラッグされているか示す
      let to_index = null
      let line_pos = null
      const type = this.dragData.type
      const num = type === 'col' ? this.colNum : this.rowNum
      const mouse_pos = type === 'col' ? ev.pageX : ev.pageY
      const win_offset = type === 'col' ? window.pageXOffset : window.pageYOffset
      const item_pos = DOM.position(this.$el, document)[type==='col'?'x':'y']
      const dom_info = this.dragData.domInfo

      for (let i=0; i<num; i++) {
        const dom = dom_info[i]
        if (i==0 && mouse_pos <= dom.position + dom.size/2) {
          to_index = 0
          line_pos = dom.position
        } else if (i==num-1 && dom.position + dom.size/2 < mouse_pos){
          to_index = this.colNum
          line_pos = dom.position + dom.size
        } else if (dom.position <= mouse_pos &&  mouse_pos < dom.position + dom.size/2) {
          to_index = i
          line_pos = dom.position
        } else if (dom.position + dom.size/2 <= mouse_pos && mouse_pos < dom.position + dom.size) {
          to_index = i+1
          line_pos = dom.position + dom.size
        }
        if (to_index !== null) break
      }
      if (this.dragData.move.to !== to_index) {
        // 挿入先の位置が変わった場合はドロップ可能か再計算する
        this.canDrop = this._canDrop(this.dragData.move.from, to_index, this.dragData.type)
      }
      this.dragData.move.to = to_index

      // 挿入位置の表示
      let style = {}
      line_pos -= win_offset + DOM.position(this.$el, document)[type==='col'?'x':'y'] + 1
      style[type==='col'?'left':'top'] = line_pos + 'px'
      Object.assign(this.$refs.insertLine.style, style)
        
      // 移動対象のイメージ表示
      const from_idx = this.dragData.move.from
      style = {}
      let move_pos
      if (mouse_pos < dom_info[0].position) {
        move_pos = dom_info[0].position - dom_info[from_idx].size/2
      } else if (dom_info[num-1].position + dom_info[num-1].size < mouse_pos) {
        move_pos = dom_info[num-1].position + dom_info[num-1].size - dom_info[from_idx].size/2
      } else {
        move_pos = mouse_pos - (dom_info[from_idx].size/2)
      }
      move_pos -= win_offset + item_pos
      style[type==='col'?'left':'top'] = move_pos + 'px'
      style[type==='col'?'width':'height'] = dom_info[from_idx].size + 'px'
      Object.assign(this.$refs.insertGhost.style, style)
    },
    // ドロップ（要素全体）
    onDocumentDrop (ev) {
      ev.preventDefault()

      // 移動先＝移動元の場合は何もしない
      if (this.dragData.move.from === this.dragData.move.to ||
          (this.dragData.move.to-1 === this.dragData.move.from) ) return false

      // console.log([this.draggingCol.from, this.draggingCol.to])
      if (!this._canDrop(this.dragData.move.from, this.dragData.move.to, this.dragData.type)) {
        alert(this.$t('Table.' + (this.dragData.type==='col' ? 'cannotMoveCol':'cannotMoveRow')))
        return false
      }
      // 移動処理
      this.moveCells(this.dragData.move.from, this.dragData.move.to, this.dragData.type)
      this.addTableHistory('rows') // Undo Historyに追加
    },
    // 指定の位置にドロップ可能かどうか
    _canDrop (from_index, to_index, type) {
      const num = type==='col' ? this.colNum : this.rowNum
      const from_cells = this.getCells(from_index, type)
      const spanfield = type==='col' ? 'colspan' : 'rowspan'
      let can_drop = true
      from_cells.some(cell => {
        if ((cell[spanfield] && cell[spanfield] > 1) ||
            (cell.dummy && cell.ref[spanfield] && cell.ref[spanfield] > 1)) {
          // 移動元のセルに結合セルが含まれる
          can_drop = false
          return true
        }
      })
      if (!can_drop) return false

      // 移動先が末端の行・列は結合セルが含まれることがないためOK
      if (to_index === 0 || to_index === num) return true

      const to_cells = this.getCells(to_index, type)
      to_cells.some(cell => {
        if ((cell.ref && cell.ref[spanfield] && cell.ref[spanfield]>1) ||
            (!cell.dummy && cell[spanfield] && cell[spanfield]>1)) {
          const span = cell.ref ? cell.ref[spanfield] : cell[spanfield]
          const index = this.indexOf(cell.ref ? cell.ref : cell)[type==='col'?'colIndex':'rowIndex']
          // console.log('span', span, 'cell index', index, 'to_index', to_index)
          if (index < to_index && to_index < index+span) {
            can_drop = false
            return true
          }
        }
      })
      if (!can_drop) return false

      return true
    },
  }
}
</script>