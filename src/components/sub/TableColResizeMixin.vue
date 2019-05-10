<script>
// カラムのリサイズ処理
import Util from '@/scripts/Util.js'
import DOM from '@/scripts/DOM.js'

const MIN_COL_WIDTH = 50 // 列の最小ピクセル数
export default {
  data () {
    return {
      resizeData: null
    }
  },
  methods: {
    // リサイズ中の仮の列幅
    colTempWidth (col_index) {
      if (this.resizeData && this.resizeData.cols) {
        return this.resizeData.cols[col_index].style.width
      }
      return null
    },
    // リサイズ時ドラッグ開始
    onColResizeDragStart (col_index, ev) {
      this.selectedRange = null     // 選択範囲解除
      this.editingCell = null       // セル入力モード終了

      this.resizeData = {}

      // ドラッグ時の表示制御のためのダミー画像
      const dummy = document.createElement('div')
      dummy.style.position = 'absolute'
      dummy.style.opacity = '0'
      dummy.style.width = '1px'
      dummy.style.height = '1px'
      dummy.style.pointerEvents = 'none'
      this.$el.appendChild(dummy)
      this.resizeData.dummyElm = dummy

      // リサイズハンドルの位置を表すライン
      const line = this.$refs.colLine

      ev.dataTransfer.effectAllowed = 'move'
      ev.dataTransfer.setData('text', '')
      ev.dataTransfer.setDragImage(dummy,0,0)

      const cols = []
      // セルエリアのサイズを計算
      const whole_width = this.$refs.tableBody.offsetWidth 
                          - this.$refs.table.querySelector('thead th:first-child').offsetWidth

      let movable_width = 0
      for (let i=0; i<this.colNum; i++) {
        let th = this.$refs.table.querySelector('thead th:nth-child('+(i+2)+')')
        let col = this.$refs.table.querySelector('col:nth-child('+(i+2)+')')

        // リサイズのために、列幅を明示的にpxで指定しておく
        col.style.width = `${th.offsetWidth}px`
        cols[i] = col
        if (col_index==i) {
            // リサイズ対象のセル
            // ドラッグ可能な範囲の最小x座標値
            this.resizeData.minX = DOM.position(th, document).x + window.pageXOffset
            this.resizeData.currentCol = col
            movable_width += th.offsetWidth
        } else if (col_index+1==i) {
            // リサイズ対象の右のセル
            // ドラッグ可能な範囲の最大x座標値
            this.resizeData.maxX = DOM.position(th, document).x + th.offsetWidth + window.pageXOffset
            this.resizeData.nextCol = col
            movable_width += th.offsetWidth
        }
      }

      this.resizeData.colIndex = col_index
      this.resizeData.cols = cols
      this.resizeData.wholeWidth = whole_width
      this.resizeData.movableWidth = movable_width

      // ドキュメント全体で、ドラッグオーバーとドロップイベントをキャッチする
      document.addEventListener('dragover', this.onColResizeDragOver)
    },
    // リサイズ時ドラッグ終了
    onColResizeDragEnd (col_index, ev) {
      for (let i=0; i<this.colNum; i++) {
        // 列の幅をpx → % に変換して保存する
        let col = this.resizeData.cols[i]
        let w = Math.round(
                    parseInt(col.style.width) / this.resizeData.wholeWidth * 10000
                ) / 10000 * 100
        this.$set(this.item.colgroup[i], 'width', w)
      }

      this.resizeData.dummyElm.remove() // ドラッグ用のダミーイメージ削除
      this.resizeData = null
      document.removeEventListener('dragover', this.onColResizeDragOver)

      // Undo Historyに追加
      // rows / colgroupともにwatchで検知したいが、
      // colgroupをwatch対象にすると、列を追加した場合に
      // rows、colgroupが同時に変更検知されてしまい、
      // 二つの履歴として登録されてしまう。
      // それを防ぐため、colgroupの変更はwatch対象とはせず、
      // 列幅の変更時に手動でUndo Historyの登録を行うようにした
      this.addTableHistory('colgroup')
    },
    // リサイズ時ドラッグオーバー
    onColResizeDragOver (ev) {
      // リサイズハンドルの位置が
      // 移動可能な範囲を超過する場合は範囲内にとどめる
      const min_w = MIN_COL_WIDTH
      let x = ev.pageX
      if (x < this.resizeData.minX + min_w) {
        x = this.resizeData.minX + min_w
      } else if (x > this.resizeData.maxX - min_w) {
        x = this.resizeData.maxX - min_w
      }
      
      const curr_w = x - this.resizeData.minX; // 変更後の列幅
      const next_w = this.resizeData.movableWidth - curr_w; // 右隣の列の列幅

      this.resizeData.currentCol.style.width = curr_w + 'px'
      this.resizeData.nextCol.style.width = next_w + 'px'

      const root_pos = DOM.position(this.$el, document)
      this.$refs.colLine.style.left = (x - root_pos.x - 2 - window.pageXOffset) + 'px'

      ev.dataTransfer.dropEffect = 'move'
      ev.preventDefault()
    },
  }
}
</script>