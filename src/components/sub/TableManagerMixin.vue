<script>
import Util from '@/scripts/Util.js'
import DOM from '@/scripts/DOM.js'
export default {
  methods: {
    // 行・列のサイズ取得
    lengthOf (dir) {
      if (dir === 'row') return this.item.rows.length
      else if (dir === 'col') return this.item.rows.length ? this.item.rows[0].cells.length : 0
    },
    // セル列を取得
    // index: 取得位置
    // dir: row / col
    getCells(index, dir) {
      if (dir === 'row') {
        if (index >= this.item.rows.length || index < 0) return null
        return this.item.rows[index].cells
      } else if (dir === 'col') {
        const cells = []
        this.item.rows.forEach(row => {
          if (index >= row.length || index < 0) cells.push(undefined)
          else cells.push(row.cells[index])
        })
        return cells
      } else if (typeof index === 'object' && typeof index.start !== 'undefined' && typeof index.end !== 'undefined') {
        // 範囲指定
        const range = index
        const cells = []
        for (let i=range.start.colIndex; i<=range.end.colIndex; i++) {
          for (let j=range.start.rowIndex; j<=range.end.rowIndex; j++) {
            const cell = this.cellAt(j, i)
            cells.push(cell)
          }
        }
        return cells
      }
      return null
    },
    // 指定された範囲の外周に位置するセルを取得する
    // start_index: 起点となるセルの位置
    // end_index: 終点となるセルの位置
    calculateRange (range) {
      // 起点＝左上 終点＝右下になるように並び替え
      const _range = {start:{}, end:{}}
      _range.start.rowIndex = Math.min(range.start.rowIndex, range.end.rowIndex)
      _range.start.colIndex = Math.min(range.start.colIndex, range.end.colIndex)
      _range.end.rowIndex = Math.max(range.start.rowIndex, range.end.rowIndex)
      _range.end.colIndex = Math.max(range.start.colIndex, range.end.colIndex)

      const cells = []
      // 左上→右上
      for (let i=_range.start.colIndex; i<=_range.end.colIndex; i++) {
        cells.push(this.cellAt(_range.start.rowIndex, i))
      }
      // 右上→右下
      for (let i=_range.start.rowIndex+1; i<=_range.end.rowIndex; i++) {
        cells.push(this.cellAt(i, _range.end.colIndex))
      }
      // 右下→左下
      for (let i=_range.end.colIndex-1; i>=_range.start.colIndex; i--) {
        cells.push(this.cellAt(_range.end.rowIndex, i))
      }
      // 左下→左上
      for (let i=_range.end.rowIndex-1; i>=_range.start.rowIndex+1; i--) {
        cells.push(this.cellAt(i, _range.start.colIndex))
      }
      const _orig_range = Util.deepCopy(_range);
      // セルの外周を走査し、結合セルによる選択範囲の拡張の余地があるか調べる
      cells.forEach(cell => {
        if (cell.dummy || cell.rowspan || cell.colspan) {
          // ダミーセルか、結合セルの実体セル

          if (cell.dummy) { // ダミーセル
            cell = cell.ref // 実体セルを取得する
          }
          const index = this.indexOf(cell)
          if (index.rowIndex < _range.start.rowIndex) _range.start.rowIndex = index.rowIndex
          if (index.colIndex < _range.start.colIndex) _range.start.colIndex = index.colIndex

          if (_range.end.rowIndex < index.rowIndex + cell.rowspan-1) _range.end.rowIndex = index.rowIndex + cell.rowspan-1
          if (_range.end.colIndex < index.colIndex + cell.colspan-1) _range.end.colIndex = index.colIndex + cell.colspan-1
        }
      })
      if (_orig_range.start.rowIndex !== _range.start.rowIndex ||
          _orig_range.start.colIndex !== _range.start.colIndex ||
          _orig_range.end.rowIndex !== _range.end.rowIndex ||
          _orig_range.end.colIndex !== _range.end.colIndex) {
          // 選択範囲の拡張あり
          // 拡張された選択範囲を再度走査
          return this.calculateRange(_range)
      }
      return _range
    },
    // 選択範囲に結合セルが含まれるかどうか
    includesMergedCell (range) {
      if (!range || !range.start || !range.end) return false
      const cells = this.getCells(range)
      let found = false
      if (cells) {
        cells.some(cell => {
          if (!cell.dummy && (cell.rowspan>1 || cell.colspan>1)) {
            found = true
            return true
          }
        })
      }
      return found
    },
    // 選択範囲で選択されたセル数（ダミーセルはカウントしない）
    selectedSingleCell (range) {
      if (!range || !range.start || !range.end) return false
      const cells = this.getCells(range)
      let count = 0
      if (cells) {
        cells.forEach(cell => {
          if (!cell.dummy) count++
        })
      }
      return count===1
    },

    // セル列の追加
    // cells: 追加するセル列
    // index: 追加位置
    // dir: row / col
    addCells (cells, index, dir) {
      const _merge_actual_cells = []
      const spanfield = dir === 'row' ? 'rowspan' : 'colspan'
      const pivot_dir = dir === 'row' ? 'col' : 'row'

      if (!cells) { // セルが指定されなければ、空のセルを作って挿入する
        cells = [...Array(this.lengthOf(pivot_dir))].map(ar => { return {id:Util.generateID(), content: null} })
      }

      if (index > this.lengthOf(dir)) return false // 現在の行・列の範囲を超える場合は終了
      const _next_cells = this.getCells(index, dir)
      const _prev_cells = this.getCells(index-1, dir)
      for (let i = 0; i < this.lengthOf(pivot_dir); i++) {
        const _next_cell = _next_cells ? _next_cells[i] : null  // 挿入位置の次のセル
        const _ins_cell = cells[i]                              // 挿入するセル
        const _prev_cell = _prev_cells ? _prev_cells[i] : null  // 挿入位置の前のセル
        
        if (_next_cell && _prev_cell) {
          if (_prev_cell === _next_cell.ref || (_next_cell.dummy && _prev_cell.ref === _next_cell.ref)) {
            // 結合セルの中に挿入する場合は、ダミーセルとする
            _ins_cell.dummy = true
            _ins_cell.ref = _next_cell.ref
            _ins_cell.content = null
            _ins_cell.rowspan = null
            _ins_cell.colspan = null
            _ins_cell.header = null
            if (_merge_actual_cells.indexOf(_next_cell.ref) === -1) {
              // 一度だけ、結合セルの実体セルのrowspan/colspanをインクリメントする
              _next_cell.ref[spanfield]++
              _merge_actual_cells.push(_next_cell.ref)
            }
          } else if (_prev_cell.header === _next_cell.header) {
            // 挿入するセルの前後がヘッダセルの場合は継承する
            _ins_cell.header = _next_cell.header
          }
        }
        if (dir === 'col') {
          // 列方向の追加の場合
          this.item.rows[i].cells.splice(index, 0, _ins_cell)
        }
      }
      if (dir === 'row') {
        // 行方向の追加の場合
        this.item.rows.splice(index, 0, { cells: cells })
      }
      return true
    },
    // セル列の削除
    // index: 削除位置
    // dir: row / col
    deleteCells(index, dir) {
      const _merge_actual_cells = []
      const spanfield = dir === 'row' ? 'rowspan' : 'colspan'
      const pivot_spanfield = dir === 'row' ? 'colspan' : 'rowspan'

      if (index >= this.lengthOf(dir)) return false // 現在の行・列の範囲を超える場合はスキップ
      const cells = this.getCells(index, dir)
      for (let i=0; i<cells.length; i++) {
        const cell = cells[i]
        if (cell.dummy && _merge_actual_cells.indexOf(cell.ref) === -1) {
          // ダミーセルを削除する場合、一回だけ参照する実体セルのrowspan/colspanをデクリメントする
          cell.ref[spanfield]--
          _merge_actual_cells.push(cell.ref)
        } else if (!cell.dummy && cell[spanfield] > 1) {
          // 結合セル内の実体セルを削除する場合、次のセルに配置されているダミーセルを
          // 実体セルとして扱う
          const _next_dummy_cell = this.nextCell(cell, dir)
          _next_dummy_cell.dummy = false
          _next_dummy_cell[spanfield] = cell[spanfield] - 1
          _next_dummy_cell[pivot_spanfield] = cell[pivot_spanfield]
          _next_dummy_cell.header = cell.header
          _next_dummy_cell.ref = null
          _merge_actual_cells.push(cell)

          // 結合セルのダミーセルに設定されている参照セルを書き換える
          const _merge_cells = this.getMergedCells(_next_dummy_cell)
          if (_merge_cells) {
            _merge_cells.forEach(_cell => {
              if (_cell === _next_dummy_cell) return
              _cell.ref = _next_dummy_cell
            })
          }
        }
        if (dir === 'col') {
          this.item.rows[i].cells.splice(index, 1)
        }
      }
      if (dir === 'row') {
        this.item.rows.splice(index, 1)
      }
      return true
    },
    // セルデータの上書き
    overwriteData (attrs, index, dir) {
      const cells = this.getCells(index, dir)
      if (!cells) return false
      cells.forEach(cell => {
        for (let key in attrs) {
          this.$set(cell, key, attrs[key])
        }
      })
    },
    // セルのマージ
    mergeCells (range) {
      const cells = this.getCells(range)
      if (!cells) return false
      let actual_cell
      cells.forEach(cell => {
        if (!actual_cell) { // 最初のセルを結合セルの実体セルとする
          this.$set(cell, 'dummy', false)
          this.$set(cell, 'rowspan', range.end.rowIndex - range.start.rowIndex + 1)
          this.$set(cell, 'colspan',  range.end.colIndex - range.start.colIndex + 1)
          actual_cell = cell
        } else {
          this.$set(cell, 'dummy', true)
          this.$set(cell, 'ref', actual_cell)
          this.$delete(cell, 'header')
          this.$delete(cell, 'content')
          this.$delete(cell, 'rowspan')
          this.$delete(cell, 'colspan')
        }
      })
    },
    // セルの分割
    divideCells (range) {
      const cells = this.getCells(range)
      if (!cells) return false
      let actual_cell
      cells.forEach(cell => {
        if (!actual_cell) {
          this.$set(cell, 'dummy', false)
          this.$delete(cell, 'rowspan')
          this.$delete(cell, 'colspan')
          this.$delete(cell, 'ref')
          actual_cell = cell
        } else {
          this.$set(cell, 'dummy', false)
          this.$delete(cell, 'ref')
          this.$delete(cell, 'rowspan')
          this.$delete(cell, 'colspan')
          this.$set(cell, 'header', actual_cell.header)
        }
      })
    },
    // セルの移動
    moveCells (from_index, to_index, dir) {
      if (from_index < 0 || from_index >= this.lengthOf(dir)) return false
      if (to_index < 0 || to_index > this.lengthOf(dir)) return false

      const cells = this.getCells(from_index, dir)
      this.deleteCells(from_index, dir)
      if (to_index > from_index) to_index--
      const spanfield = dir==='col' ? 'colspan' : 'rowspan'
      cells.forEach(cell => {
        if (typeof cell[spanfield] !== 'undefined') {
          this.$delete(cell, spanfield)
        }
      })
      this.addCells(cells, to_index, dir)
    },
    // 指定位置のセルを取得
    cellAt(row_index, col_index) {
      if (row_index >= this.item.rows.length) return null
      const row = this.item.rows[row_index]
      if (col_index >= row.cells.length) return null
      return row.cells[col_index]
    },
    // 指定セルの位置を取得する
    indexOf(cell) {
      for (let i = 0; i < this.item.rows.length; i++) {
        const row = this.item.rows[i]
        let index
        if ((index = row.cells.indexOf(cell)) !== -1) {
          return { rowIndex: i, colIndex: index }
        }
      }
      return null
    },
    getCellByCell (cell) {
      let index
      for(let i=0; i<this.rowNum; i++) {
        const cells = this.getCells(i, 'row')
        if ((index = cells.indexOf(cell)) !== -1) {
          return cells[index]
        } 
      }
    },
    // 指定位置のDOM要素を取得する
    elementAt (obj) {
      let cell
      if (typeof obj.rowIndex !== 'undefined' && typeof obj.colIndex !== 'undefined') { // 座標による指定
        cell = this.cellAt(obj.rowIndex, obj.colIndex)
      } else { // セルオブジェクトによる指定
        cell = obj
      }

      if (cell.dummy) {
        // ダミーセルの場合は、
        // 実体セルの場所を取得対象とする
        cell = cell.ref
      }
      const index = this.indexOf(cell)
      
      let row_dom_index = index.rowIndex
      let col_dom_index = -1
      for (let i=0; i<=index.colIndex; i++) {
        const c = this.item.rows[index.rowIndex].cells[i]
        if (!c.dummy) col_dom_index++
      }
      const tr = DOM.eq(row_dom_index, 'tbody tr', this.$el)
      return DOM.eq(col_dom_index, 'td', tr)
    },
    // 結合セルの配列を取得
    getMergedCells(cell) {
      if (cell.dummy) {
        // ダミーセルの場合
        cell = cell.ref
      }
      const rowspan = cell.rowspan ? cell.rowspan : 1
      const colspan = cell.colspan ? cell.colspan : 1
      if (rowspan === 1 && colspan === 1) return null
      const index = this.indexOf(cell)
      if (!index) return null

      const cells = []
      for (let i = index.rowIndex; i < index.rowIndex + rowspan; i++) {
        for (let j = index.colIndex; j < index.colIndex + colspan; j++) {
          cells.push(this.cellAt(i, j))
        }
      }
      return cells
    },
    // 一つ前のセルを取得する
    // cell: 基準となるセル
    // dir: row / col
    // options: 設定
    //    .changeRane: 最後尾まで行ったときに次の行／列に移動するかどうか
    //    .flg_actual_cell: 実体セルのみを検索
    prevCell(cell, dir, options) {
      if (typeof options === 'undefined') options = {}
      const index = this.indexOf(cell)
      let prev_cell
      if (dir === 'row') {
        if (index.rowIndex <= 0) {
          if (options.changeRane) {
            let prev_col_index = index.colIndex - 1
            let prev_row_index = this.rowNum - 1
            if (prev_col_index < 0) prev_col_index = this.colNum - 1
            prev_cell = this.item.rows[prev_row_index].cells[prev_col_index]
          }
        } else {
          prev_cell = this.item.rows[index.rowIndex-1].cells[index.colIndex]
        }
      } else if (dir === 'col') {
        if (index.colIndex <= 0) {
          if (options.changeRane) {
            let prev_row_index = index.rowIndex - 1
            let prev_col_index = this.colNum - 1
            if (prev_row_index < 0) prev_row_index = this.rowNum - 1
            prev_cell = this.item.rows[prev_row_index].cells[prev_col_index]
          }
        } else {
          prev_cell = this.item.rows[index.rowIndex].cells[index.colIndex-1]
        }
      }
      if (options.actualCell && prev_cell.dummy) prev_cell = this.prevCell(prev_cell, dir, options) 
      return prev_cell ? prev_cell : null
    },
    // 一つ次のセルを取得する
    // cell: 基準となるセル
    // dir: row / col
    // options: 設定
    //    .changeRane: 最後尾まで行ったときに次の行／列に移動するかどうか
    //    .flg_actual_cell: 実体セルのみを検索
    nextCell(cell, dir, options) {
      if (typeof options === 'undefined') options = {}
      const index = this.indexOf(cell)
      let next_cell
      if (dir === 'row') {
        if (index.rowIndex >= this.rowNum-1) {
          if (options.changeRane) {
            let next_col_index = index.colIndex + 1
            let next_row_index = 0
            if (next_col_index >= this.colNum) next_col_index = 0 
            next_cell = this.item.rows[next_row_index].cells[next_col_index]
          }
        } else {
          next_cell = this.item.rows[index.rowIndex+1].cells[index.colIndex]
        }
      } else if (dir === 'col') {
        if (index.colIndex >= this.colNum-1) {
          if (options.changeRane) {
            let next_row_index = index.rowIndex + 1
            let next_col_index = 0
            if (next_row_index >= this.rowNum) next_row_index = 0
            next_cell = this.item.rows[next_row_index].cells[next_col_index]
          }
        } else {
          next_cell = this.item.rows[index.rowIndex].cells[index.colIndex+1]
        }
      }
      if (options.actualCell && next_cell.dummy) next_cell = this.nextCell(next_cell, dir, options) 
      return next_cell ? next_cell : null
    }
  }
}
</script>