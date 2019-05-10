<template>
  <div 
    @click.capture="activateItem()"
    :class="{'BEV-hover': isHover, 'BEV-active': isActive, 'BEV-dragging': $store.state.draggingItem===item}"
    class="BEV-item BEV-table">

    <!-- アイテムヘッダ -->
    <ItemHeader 
      @menu-mouseenter="popupMenuName===false ? showItemMenu($event) : false"
      @menu-mouseleave="_hideItemMenuDelay()"
      @label-click="activateItem()"
      @label-dragstart="$emit('item-dragstart', $event)"
      @label-dragend="$emit('item-dragend', $event)"
      @sub-label-click="getConfig('allowCssClass') ? showClassInput($event) : false"
      @moveup-click="doItemCommonAction('moveup')"
      @movedown-click="doItemCommonAction('movedown')"
      :parentWidth="parentWidth ? parentWidth : editorWidth"
      :active="isActive"
      :hover="isHover"
      :item="item"
      :hideConfig="!inited"
      :allowCssClass="getConfig('allowCssClass') && isItemAttrEditable"
      :classes="getConfig('cssClasses')"
    />

    <!-- テーブルの行列数が決まっていない場合 -->
    <div 
      v-if="!inited"
      class="BEV-grid-size"
    >
      <div class="BEV-grid-size-input">
        <label>{{$t("Table.numberOfColumns")}}</label>
        <input 
          @focus="activateItem()"
          :max="getConfig('maxCol')"
          :min="getConfig('minCol')"
          ref="colNum"
          v-model="colNumInput" type="number"><span class="BEV-cross">x</span>
        <label>{{$t("Table.numberOfRows")}}</label>
        <input 
          @focus="activateItem()"
          :max="getConfig('maxRow')"
          :min="getConfig('minRow')"
          v-model="rowNumInput" type="number">
      </div>
      <div 
        v-if="gridSizeValidateMessages"
        class="BEV-errors">
        <transition-group name="fade" tag="div">
        <div 
          class="BEV-error"
          :key="msg"
          v-for="msg in gridSizeValidateMessages">
          {{msg}}
        </div>
        </transition-group>
      </div>
      <div class="BEV-buttons">
        <button 
          @click="$emit('item-action', 'delete')"
          class="BEV-delete"
          type="button">{{$t('common.delete')}}</button>
        <button 
          :disabled="gridSizeValidateMessages.length ? true : false"
          @click="applyGridSize()"
          class="BEV-save"
          type="button">{{$t('common.apply')}}</button>
      </div>
    </div>

    <!-- テーブルの行列数が決まっている場合 -->
    <template v-else>
      <div class="BEV-table-wrap">
        <table 
          :style="{minWidth: (colNum * 100)+'px'}"
          ref="table">
          <colgroup>
            <col />
            <col
              :style="{width: colTempWidth(idx) ? colTempWidth(idx) : colWidth(idx)}"
              v-for="(colgroup, idx) in item.colgroup"
              :key="idx" />
          </colgroup>
          <thead>
            <tr>
              <th></th>
              <th 
                v-for="(colgroup, idx) in item.colgroup"
                :key="idx"
              >
                <div class="BEV-colhead">
                  <div 
                    :class="{'BEV-dragging': dragData && dragData.type==='col' && dragData.from===idx}"
                    @dragstart="onRowColDragStart(idx, 'col', $event)"
                    @dragend="onRowColDragEnd()"
                    draggable="true"
                    class="BEV-move-handle">
                  </div>
                  <button class="BEV-colbutton"
                    @focus="activateItem()"
                    @click.stop="selectCol(idx, $event)"
                    type="button"
                  >
                    <IconBase 
                      width="10" height="10">
                      <IconTableMenu />
                    </IconBase>
                  </button>
                </div>
                <div
                  @dragstart="onColResizeDragStart(idx, $event)"
                  @dragend="onColResizeDragEnd(idx, $event)"
                  :class="{'BEV-show': resizeData && resizeData.colIndex==idx}"
                  draggable="true" 
                  v-if="idx<colNum-1"
                  class="BEV-resize-handler">
                </div>
              </th>
            </tr>
          </thead>
          <tbody ref="tableBody">
            <tr 
              v-for="(row, index) in item.rows" 
              :row="row"
              :key="row.id">
              <th>
                <div class="BEV-rowhead">
                  <div 
                    :class="{'BEV-dragging': dragData && dragData.type==='row' && dragData.from===index}"
                    @dragstart="onRowColDragStart(index, 'row', $event)"
                    @dragend="onRowColDragEnd()"
                    draggable="true"
                    class="BEV-move-handle">
                  </div>
                  <button class="BEV-rowbutton"
                    @focus="activateItem()"
                    @click.stop="selectRow(index, $event)"
                    type="button"
                  >
                    <IconBase 
                      width="10" height="10">
                      <IconTableMenu />
                    </IconBase>
                  </button>
                </div>
              </th>
              <Cell
                v-for="cell in actualCell(row)"
                :cell="cell"
                :key="cell.id"
                @click.native.stop
                @cell-click="onCellClick"
                @cell-mousedown="onCellMouseDown"
                @cell-mouseup="onCellMouseUp"
                @cell-mouseenter="onCellMouseEnter"
                @cell-context-menu="onCellContextMenu"
              />
            </tr>
          </tbody>
        </table>
        <!-- 選択範囲のエリア -->
        <div
          ref="selectedRange"
          v-show="isActive && rangeCellElements" 
          class="BEV-range">
        </div>
      </div>
      <div class="BEV-table-border"></div>

      <!-- 入力エリア -->
      <div
        class="BEV-input-area"
        ref="inputArea"
        @click.stop="$refs.editor.focus()"
        v-if="editingCell">
        <component
          @focus="activateItem()"
          :is="getConfig('allowStyledText') ? 'VisualText': 'PlainText'" 
          :cssClasses="getConfig('styledTextClasses')"
          v-model="editingContent"
          ref="editor"
          class="BEV-editor"
        />
      </div>
      
      <!-- セルメニュー -->
      <transition name="popup">
        <TableCellMenu
          :includesMergedCell="includesMergedCell(calculatedRange)"
          :selectedSingleCell="selectedSingleCell(calculatedRange)"
          @cancel="hideCellMenu()"
          @action="doCellAction($event)"
          v-show="flgMenu==='cell'"
          ref="cellMenu" />
      </transition>
      <!-- 列メニュー -->
      <transition name="popup">
        <TableColMenu
          :isMinCol="isMinCol"
          :isMaxCol="isMaxCol"
          @cancel="hideRowColMenu()"
          @action="doColAction($event)"
          v-show="flgMenu==='col'"
          ref="colMenu" />
      </transition>
      <!-- 行メニュー -->
      <transition name="popup">
        <TableRowMenu
          :isMinRow="isMinRow"
          :isMaxRow="isMaxRow"
          @cancel="hideRowColMenu()"
          @action="doRowAction($event)"
          v-show="flgMenu==='row'"
          ref="rowMenu" />
      </transition>

      <!-- テーブルサイズ変更 -->
      <transition 
        name="popup-move">
        <TableSizeEdit 
          :maxCol="getConfig('maxCol')"
          :minCol="getConfig('minCol')"
          :maxRow="getConfig('maxRow')"
          :minRow="getConfig('minRow')"
          :row="rowNum"
          :col="colNum"
          @cancel="hideSizeEdit()"
          @apply="rowNumInput=$event.row; colNumInput=$event.col; applyGridSize(); hideSizeEdit()"
          ref="sizeEdit"
          v-if="popupMenuName==='size'"
        />
      </transition>

      <transition 
        @leave="_itemMenuTransitionLeave"
        @after-leave="_itemMenuTransitionAfterLeave"
        name="popup">
        <ActionMenu 
          @item-click="doItemCommonAction($event); doItemAction($event)"
          @mouseenter="!isTouchDevice ? _hideItemMenuDelay(true) : false"
          @mouseleave="!isTouchDevice ? hideItemMenu() : false"
          @cancel-click="isTouchDevice ? hideItemMenu() : false"
          v-show="popupMenuName==='item_menu'"
          ref="actionMenu"
          :actions="actions"
        />
      </transition>

      <transition 
        name="popup-move">
        <ClassInput 
          @cancel="hideClassInput()"
          @input="hideClassInput()"
          v-show="popupMenuName==='class'"
          :classes="getConfig('cssClasses')"
          ref="classInput"
          v-model="item.className"
        />
      </transition>

      <!-- リサイズハンドルの位置を表すライン -->
      <transition name="fade">
      <div 
        v-show="resizeData"
        class="BEV-resize-line" ref="colLine"></div>
      </transition>

      <!-- 行・列の挿入位置を表すライン -->
      <transition name="fade">
        <div v-show="dragData" 
          class="BEV-insert-line" 
          :class="{'BEV-disabled': !canDrop}" 
          ref="insertLine"></div>
      </transition>
      <transition name="fade">
        <div v-show="dragData" class="BEV-insert-ghost" ref="insertGhost"></div>
      </transition>

      <!-- <button @click="selectRange({row: 1})">select row</button>
      <button @click="selectRange({col: 1})">select col</button>
      <button @click="selectRange({start:{rowIndex:1,colIndex:1}, end:{rowIndex:4,colIndex:1}})">select range</button> -->
    </template>
  </div>
</template>

<script>
import Util, {Rect} from '@/scripts/Util.js'
import DOM from '@/scripts/DOM.js'
import TableCellComponent from './sub/TableCell.vue'
import TableManagerMixin from './sub/TableManagerMixin.vue'
import TableColResizeMixin from './sub/TableColResizeMixin.vue'
import TableSortMixin from './sub/TableSortMixin.vue'
import TableCellMenu from './sub/TableCellMenu.vue'
import TableColMenu from './sub/TableColMenu.vue'
import TableRowMenu from './sub/TableRowMenu.vue'
import TableSizeEdit from './sub/TableSizeEdit.vue'
import VisualText from '@/components/sub/VisualText.vue'
import PlainText from '@/components/sub/PlainText.vue'
import ItemMixin from '@/components/sub/ItemMixin.vue'
import IconBase from '@/components/sub/IconBase.vue'
import IconTableMenu from '@/components/icons/IconTableMenu.vue'

export default {
  data () {
    return {
      // ポップアップメニューの項目定義
      actions: {
        changeColRow: {text: this.$t('Table.changeColRow')},
        resetColWidth: {text: this.$t('Table.resetColWidth')},
        setClassName: {text: this.$t('common.setCssClass'), icon: 'IconCssClass'},
        moveup: {text: this.$t('common.moveUpItem'), icon: 'IconMoveup'},
        movedown: {text: this.$t('common.moveDownItem'), icon: 'IconMovedown'},
        replicate: {text: this.$t('common.replicateItem'), icon: 'IconReplicate'},
        delete: {text: this.$t('common.deleteItem'), type: 'danger', icon: 'IconDelete'},
      },
      historyTargetKeys: [],      // rows/colgroupの両方を同時にUndo Historyに追加したいため、ItemMixinの処理とは別に処理を行う
      menuTarget: null,           // 行・列・セルメニューの表示位置の基準となる要素
      
      colNumInput: 0,             // 列数の入力中
      rowNumInput: 0,             // 行数の入力値
    
      // canDrop: true,              // ドロップ可能状態を示すフラグ
      editingCell: null,            // 編集中のセル
      editingContent: null,         // 編集中のセル
      flgMenu: false,               // セルメニュー表示フラグ

      selectedRange: null,              // 選択範囲
      isSelecting: false,               // セルの選択操作中
      calculatedRange: null,            // 計算済みの選択範囲
      rangeCellElements: null,          // 選択範囲を表すDOM Element

      gridSizeValidateMessages: [],

      performanceTime: null,
    }
  },
  mixins: [
    ItemMixin, TableManagerMixin, TableColResizeMixin, TableSortMixin
  ],
  components: {
      Cell: TableCellComponent,
      VisualText: VisualText,
      PlainText: PlainText,
      TableCellMenu: TableCellMenu,
      TableColMenu: TableColMenu,
      TableRowMenu: TableRowMenu,
      IconBase, IconTableMenu,
      TableSizeEdit: TableSizeEdit,
  },
  created () {
    this.syncInput()
  },
  mounted () {
    // 空のテーブルの場合は
    // 行列数の入力値のデフォルトとして
    // それぞれの最低値を設定しておく
    this.rowNumInput = this.getConfig('defaultRowNum')
    this.colNumInput = this.getConfig('defaultColNum')
  },
  computed: {
    // 列数のカウント
    colNum () { return this.item.rows.length ? this.item.rows[this.item.rows.length-1].cells.length : 0 },
    // 行数のカウント
    rowNum () { return this.item.rows.length },
    // 列数の最大に達しているかどうか
    isMaxCol () { return this.colNum >= this.getConfig('maxCol') },
    // 列数が最小になっているかどうか
    isMinCol () { return this.colNum <= this.getConfig('minCol') },
    // 行数の最大に達しているかどうか
    isMaxRow () { return this.rowNum >= this.getConfig('maxRow') },
    // 行数が最小になっているか
    isMinRow () { return this.rowNum <= this.getConfig('minRow') },
    // 行・列の初期設定が完了している
    inited () { return this.item.rows && this.item.rows.length },
  },
  watch: {
    // 選択範囲の変化
    selectedRange: {
      handler (newVal, oldVal) {
        if (!this.selectedRange) {
          // 選択されていなければ終了
          this.calculatedRange = null
          this.rangeCellElements = null
          this.hideCellMenu()
          this.hideRowColMenu()
          return
        }
        if (typeof this.selectedRange.row !== 'undefined') { // 行選択
          this.rangeCellElements = {row: this.selectedRange.row}
        } else if (typeof this.selectedRange.col !== 'undefined') { // 列選択
          this.rangeCellElements = {col: this.selectedRange.col}
        } else {
          // 結合セルを考慮した選択範囲を計算
          this.calculatedRange = this.calculateRange(this.selectedRange)
          // console.log('orig:', this.selectedRange.start.rowIndex, this.selectedRange.start.colIndex, this.selectedRange.end.rowIndex, this.selectedRange.end.colIndex)
          // console.log('calc:', this.calculatedRange.start.rowIndex, this.calculatedRange.start.colIndex, this.calculatedRange.end.rowIndex, this.calculatedRange.end.colIndex)

          // 選択範囲のDOM要素を取得する
          this.rangeCellElements = {start: this.elementAt(this.calculatedRange.start), end: this.elementAt(this.calculatedRange.end)}
          // console.log(this.rangeCellElements)
        }
        this.relocateRangeElement() // 選択範囲表示を再配置
      },
      deep: true
    },
    // 行の変更
    // セル入力
    // 'editingCell.content' (newVal, oldVal) {
    //   if (typeof newVal === 'undefined' || typeof oldVal === 'undefined') return // 入力開始、終了時はスキップ
    //   const index = this.indexOf(this.editingCell)
    //   this.addHistory({
    //     type: 'change',
    //     target: this.item.rows[index.rowIndex].cells[index.colIndex],
    //     key: 'content',
    //     data: oldVal
    //   })
    //   // 古い値をコピー(UNDO/REDOの変更の際も実行される)
    //   this.oldItem = Util.deepCopy(this.item)
    // }, 
    colNumInput () {
      this.validateGridSize()
    },
    rowNumInput () {
      this.validateGridSize()
    }
  },
  methods: {
    // Undo Historyへの追加
    addTableHistory (keys) {
      // if (!this.flgHistory) return false  // 制御フラグがOFFの場合は履歴を追加しない
      if (typeof keys === 'string') keys = [keys]
      const hist = []
      keys.forEach(key => {
        hist.push({
          type: 'change',
          target: this.item,
          key: key,
          data: this.oldItem[key]
        })
      })
      this.addHistory(hist.length===1 ? hist[0] : hist)
      // 古い値をコピー(UNDO/REDOの変更の際も実行される)
      this.oldItem = Util.deepCopy(this.item)
    },
    _startBenchmark () {
      this.performanceTime = {start: performance.now()}
      console.log('benchmark start')
    },
    _endBenchmark () {
      this.performanceTime.end = performance.now()
      console.log('benchmark end', (this.performanceTime.end - this.performanceTime.start).toFixed(3) + 'msec')
    },

    // 選択を行う
    // range: 選択範囲を表すデータ
    // {start: 選択の起点となるセル, end: 選択の終了時のセル}
    // endのみ指定することで、起点のセルを保持しつつ、選択範囲の変更を行う
    selectRange (range) {
      // this._startBenchmark()
      if (typeof range.row !== 'undefined') { // 行選択
        this.selectedRange = {row: range.row}
      } else if (typeof range.col !== 'undefined') { // 列選択
        this.selectedRange = {col: range.col}
      } else {
        if (typeof range.start !== 'undefined') { // 起点のセルが指定
          if (typeof range.start.rowIndex !== 'undefined' && typeof range.start.colIndex !== 'undefined') { // 座標による指定
            // this.selectedRange = {start: range.start, end: range.start}
            this.$set(this, 'selectedRange', {start: range.start, end: range.start})
            // console.log(this.selectedRange)
          } else { // セルオブジェクトによる指定
            const index = this.indexOf(range.start)
            this.selectedRange = {start: index, end: index}
          }
        }
        if (range.end) { // 終点のセルが指定
          if (!this.selectedRange || !this.selectedRange.start) return false // 起点のセルが指定されていなければ終了
          if (typeof range.end.rowIndex !== 'undefined' && typeof range.end.colIndex !== 'undefined') { // 座標による指定
            this.selectedRange.end = range.end
          } else { // セルオブジェクトによる指定
            const index = this.indexOf(range.end)
            this.selectedRange.end = index
          }
        }
      }
    },

    // 選択範囲のDOM Elementを再配置
    relocateRangeElement () {
      if (!this.rangeCellElements) return false

      const range_elm = this.$refs.selectedRange
      const table = this.$refs.table
      const head_sample = table.querySelector('thead tr:first-child th')
      const head_sample_styles = getComputedStyle(head_sample)
      const bt = parseInt(head_sample_styles['border-top-width'])
      const bl = parseInt(head_sample_styles['border-left-width'])

      let head, head_pos
      if (typeof this.rangeCellElements.row !== 'undefined') { // 行選択
        const elm = table.querySelectorAll(`tbody tr`)[this.rangeCellElements.row]
        head = elm.querySelector('th')
        head_pos = DOM.position(head, table)

        range_elm.style.left = (head_pos.x + head.offsetWidth + (bl ? 0 : -1)) + 'px'
        range_elm.style.top = (head_pos.y + (bt ? 0 : -1)) + 'px'
        range_elm.style.width = (table.offsetWidth - head.offsetWidth) + 'px'
        range_elm.style.height = head.offsetHeight + (bt ? 1 : 2) + 'px'
      } else if (typeof this.rangeCellElements.col !== 'undefined') { // 列選択
        head = table.querySelectorAll('thead th')[this.rangeCellElements.col+1]
        head_pos = DOM.position(head, table)
        range_elm.style.left = (head_pos.x + (bl ? 0 : -1)) + 'px'
        range_elm.style.top = (head_pos.y + head.offsetHeight + (bt ? 0 : -1)) + 'px'
        range_elm.style.width = (head.offsetWidth + 1) + 'px'
        range_elm.style.height = (table.offsetHeight - head.offsetHeight) + 'px'
      } else {
        const pos1 = DOM.position(this.rangeCellElements.start, table)
        const pos2 = DOM.position(this.rangeCellElements.end, table)

        // 選択範囲の位置調整
        range_elm.style.left = (pos1.x + (bl ? 0 : -1))  + 'px'
        range_elm.style.top = (pos1.y + (bt ? 0 : -1))  + 'px'
        range_elm.style.width = (pos2.x + this.rangeCellElements.end.offsetWidth - pos1.x + 1) + 'px'
        range_elm.style.height = (pos2.y + this.rangeCellElements.end.offsetHeight - pos1.y + (bt ? 1 : 2)) + 'px'

        // this._endBenchmark()
      }
    },
    // リサイズ時
    onResize () {
      // 選択範囲を解除
      this.selectedRange = null
      this.relocateInputArea()
    },
    // アイテムのアクティブ解除
    onDeactiveItem () {
      this.selectedRange = null   // 選択範囲の解除
      this.endEditingCell(true)   // セル編集モード終了(入力を確定)
    },
    // フォーカスを当てる
    focus () {
      if (!this.inited) {
        this.$refs.colNum.focus()
      }
    },

    validateGridSize () {
      const msg = []

      if (!this.rowNumInput) { 
        // 行数が入力されていない
        msg.push(this.$t('Table.rowEmptyError'))
      }
      if (!this.colNumInput) { 
        // 列数が入力されていない
        msg.push(this.$t('Table.colEmptyError'))
      }
      if (msg.length) {
        this.$set(this, 'gridSizeValidateMessages', msg)
        return false
      }

      if (this.rowNumInput < this.getConfig('minRow') || 
          this.rowNumInput > this.getConfig('maxRow')) {
        msg.push(this.$t('Table.rowRangeError', {min: this.getConfig('minRow'), max: this.getConfig('maxRow')}))
      }
      if (this.colNumInput < this.getConfig('minCol') || 
          this.colNumInput > this.getConfig('maxCol')) {
        msg.push(this.$t('Table.colRangeError', {min: this.getConfig('minCol'), max: this.getConfig('maxCol')}))
      }
      if (msg.length) {
        this.$set(this, 'gridSizeValidateMessages', msg)
        return false
      }

      this.$set(this, 'gridSizeValidateMessages', [])
      return true
    },
    // 列幅(%)の取得（未設定の場合はnullを返す）
    colWidth (col_idx) {
      return this.item.colgroup[col_idx].width ? this.item.colgroup[col_idx].width + '%' : null
    },
    // セル上でのマウスダウン
    onCellMouseDown (cell, ev) {
      this.activateItem()
      this.endEditingCell(true) // セル入力を完了させて反映

      // 範囲選択の開始
      this.hideCellMenu()         // セルメニューをいったん非表示
      this.selectRange({start: cell})
      this.isSelecting = true
      document.addEventListener('mouseup', this.onDocumentMouseUp) // セル外でのマウスアップイベント捕捉のため
    },
    // セル上でマウスダウンして、セル外でマウスアップを検知するためのイベント
    onDocumentMouseUp (ev) {
      this.onCellMouseUp(null, ev)
    },
    // セル上でのマウスエンター
    onCellMouseEnter (cell, ev) {
      if (!this.isSelecting) return false
      this.selectRange({end: cell})
    },
    // 入力時の領域外クリック
    onEditingDocumentClick () {
      this.endEditingCell(true) // セル入力を完了させて反映
      document.removeEventListener('click', this.onEditingDocumentClick)
    },
    // セル上でのマウスアップ
    onCellMouseUp (cell, ev) {
      this.isSelecting = false
      document.removeEventListener('mouseup', this.onDocumentMouseUp)

      if (this.editingCell) return false // 入力中はスキップ
      this.showCellMenu(ev) // セルメニューを表示
    },
    // セル上でのクリック
    onCellClick (cell, ev) {
      this.selectedRange = null
      this.isSelecting = false
      document.removeEventListener('mouseup', this.onDocumentMouseUp)

      // セルの入力エリアを表示
      this.startEditingCell(cell)
      this.$nextTick(()=>{
        const editor = this.$refs.editor
        editor.focus()
        this.relocateInputArea()
      })
    },
    // 入力エリアの再配置
    relocateInputArea () {
      if (!this.editingCell) return false

      const input = this.$refs.inputArea
      const dom = this.elementAt(this.editingCell)
      const pos = DOM.position(dom, this.$el)
      // console.log(dom, input, pos)
      input.style.top = pos.y + 'px'
      input.style.left = pos.x + 'px'
      input.style.width = dom.offsetWidth + 'px'
      input.style.minHeight = dom.offsetHeight + 'px'
    },
    // セル上でのコンテキストメニュー表示
    onCellContextMenu (cell, ev) {
      this.selectRange({start: cell})
      this.showCellMenu(ev)
    },
    // セルメニューの表示
    showCellMenu (ev) {
      this.flgMenu = 'cell'
      this.endEditingCell(true) // セル入力を完了させて反映
      if (!this.isTouchDevice) {
        // タッチデバイスではないPCなどのみ
        // メニュー位置の調整
        this.$nextTick(()=>{
          this.arrangePopup(this.$refs.cellMenu.$el, new Rect(ev.pageX, ev.pageY, 1, 1), {x:0, y:10})
          // メニューの外をクリックされたときの検知用イベント
          setTimeout(()=>{
            document.addEventListener('click', this.hideCellMenu)
          }, 0)
        })
      }
    },
    // セルメニューの非表示
    hideCellMenu () {
      if (this.flgMenu === 'cell') this.flgMenu = null    // セルメニューを非表示
      this.selectedRange = null   // 選択範囲を解除
      document.removeEventListener('click', this.hideCellMenu)  // セル外でのクリックイベント監視の終了
    },
    // 列の選択処理
    selectCol (index, ev) {
      this.selectRange({col: index})
      this.showRowColMenu('col', index, ev)
    },
    // 行の選択処理
    selectRow (index, ev) {
      this.selectRange({row: index})
      this.showRowColMenu('row', index, ev)
    },
    // 行・列メニューの表示
    showRowColMenu (type, index, ev) {
      this.flgMenu = type
      this.endEditingCell(true) // セル入力を完了させて反映
      if (!this.isTouchDevice) {
        // タッチデバイスではないPCなどのみ
        // メニュー位置の調整
        this.$nextTick(()=>{
          this.arrangePopup(this.$refs[type==='col'?'colMenu':'rowMenu'].$el, ev.target, {x:0, y:10})
          // メニューの外をクリックされたときの検知用イベント
          setTimeout(()=>{
            document.addEventListener('click', this.hideRowColMenu)
          }, 0)
        })
      }
    },
    // 行・列メニューの非表示
    hideRowColMenu () {
      if (this.flgMenu === 'col' || this.flgMenu === 'row') this.flgMenu = null    // セルメニューを非表示
      this.selectedRange = null   // 選択範囲を解除
      document.removeEventListener('click', this.hideRowColMenu)  // セル外でのクリックイベント監視の終了
    },
    // コンポーネント固有のアクションの実行
    doItemAction (action) {
      if (action==='resetColWidth') { // 列幅のリセット
        this.resetColWidth()
      } else if (action === 'changeColRow') { // 行・列数の変更
        this.showSizeEdit()
      }
    },
    // 列操作
    doColAction (action) {
      if (!this.selectedRange || typeof this.selectedRange.col === 'undefined') return false
      const index = this.selectedRange.col
      if (action === 'addColLeft' || action === 'addColRight') { // 左右への列挿入
        if (this.isMaxCol) return false // 最大列数に達していれば終了
        const to_index = action === 'addColLeft' ? index : index+1
        this.addCol(to_index)
      } else if (action === 'headerizeCol' || action === 'deheaderizeCol') { // ヘッダ化
        this.overwriteData({header: action === 'headerizeCol' ? true : false}, index, 'col')
      } else if (action === 'clearCol') { // 入力のクリア
        this.overwriteData({content: null}, index, 'col')
      } else if (action === 'deleteCol') { // 列の削除
        if (this.isMinCol) return false // 最小列数の場合は終了
        this.deleteCol(index)
      }
      if (action === 'addColLeft' || action === 'addColRight' || action === 'deleteCol') {
        this.addTableHistory(['rows', 'colgroup']) // Undo Historyに追加
      } else {
        this.addTableHistory('rows') // Undo Historyに追加
      }
    },
    // 行操作
    doRowAction (action) {
      if (!this.selectedRange || typeof this.selectedRange.row === 'undefined') return false
      const index = this.selectedRange.row
      if (action === 'addRowAbove' || action === 'addRowBelow') { // 上下への列挿入
        if (this.isMaxRow) return false // 最大行数に達していれば終了
        const to_index = action === 'addRowAbove' ? index : index+1
        this.addRow(to_index)
      } else if (action === 'headerizeRow' || action === 'deheaderizeRow') { // ヘッダ化
        this.overwriteData({header: action === 'headerizeRow' ? true : false}, index, 'row')
      } else if (action === 'clearRow') { // 入力のクリア
        this.overwriteData({content: null}, index, 'row')
      } else if (action === 'deleteRow') { // 行の削除
        if (this.isMinRow) return false // 最小行数の場合は終了
        this.deleteRow(index)
      }
      this.addTableHistory('rows') // Undo Historyに追加
    },
    // セル操作
    doCellAction (action) {
      if (!this.calculatedRange) return false
      if (action === 'mergeRange') { // セルの結合
        this.mergeCells(this.calculatedRange)
      } else if (action === 'divideRange') { // セルの分割
        this.divideCells(this.calculatedRange)
      } else if (action === 'headerizeRange' || action === 'deheaderizeRange') { // ヘッダ化
        this.overwriteData({header: action === 'headerizeRange' ? true : false}, this.calculatedRange)
      } else if (action === 'clearRange') { // クリア
        this.overwriteData({content: null}, this.calculatedRange)
      }
      this.addTableHistory('rows') // Undo Historyに追加
    },

    // 自要素にフォーカスされた
    onFocus () {
      // console.log('focus')
    },
    // 自要素からフォーカスが外れた 
    onBlur () {
      // ユーザ操作リセット
    },
    // キー入力を各種処理に変換
    onKeyInput (ev) {
      // console.log(ev)
      if (ev.which === 13) { // enter
        if (((ev.ctrlKey && !ev.metaKey) || (!ev.ctrlKey && ev.metaKey))) {
          // コントロール+Enterで
          // 入力を確定させる
          this.endEditingCell(true) // セル入力を完了させて反映
        }
      } else if (ev.which === 27) { // escape
        this.editingCell = null
        this.endEditingCell(false) // セル入力を完了（キャンセル）
      } else if (ev.which === 9) { // tab
        if (this.editingCell) {
          // 入力中のセルあり
          // 確定して次のセルへ移動する
          let cell
          if (ev.shiftKey) {
              // Shift + Tab
              cell = this.prevCell(this.editingCell, 'col', {changeRane: true, actualCell: true})
          } else {
              // Tab only
              cell = this.nextCell(this.editingCell, 'col', {changeRane: true, actualCell: true})
          }
          this.onCellClick(cell)

          ev.preventDefault()
          ev.stopPropagation()
        }
      }
    },
    
    // 行・列の入力キャンセル
    cancelRowColInput () {
      if (this.popupMenuName==='colrow') {
        // 入力フラグがONの場合はフラグをOFFにする
        this.popupMenuName = false
      } else if (this.rowNum===0) {
        // テーブルの初回作成時の場合は項目自体を削除する
        this.$emit('action', {action:'delete'})
      }
    },
    // 行中の実体セルを返す
    actualCell (row) {
      return row.cells.filter(cell=>{
        return !cell.dummy
      })
    },
    // セルコンテンツの編集開始
    startEditingCell (cell) {
      this.editingContent = cell.content
      this.editingCell = cell
      if (this.$refs.editor) this.$refs.editor.closeToolbar()
      document.addEventListener('click', this.onEditingDocumentClick)
    },
    // セルコンテンツの編集終了
    endEditingCell (refrect) {
      document.removeEventListener('click', this.onEditingDocumentClick)
      if (!this.editingCell) return false
      if (refrect) {
        // 入力内容をセルに反映
        const changed = this.editingCell.content !== this.editingContent
        this.editingCell.content = this.editingContent
        // アンドゥ履歴に追加
        if (changed) {
          this.addTableHistory('rows')
        }
      }
      this.editingCell = null
    },
    // グリッドサイズの適用
    applyGridSize (ev) { 
      if(this.rowNum > this.rowNumInput || this.colNum > this.colNumInput){
        // 現在の列・行数よりも少ない値が入力された
        if(!confirm(this.$t('Table.decreaseConfirm'))){
          // 入力を元に戻す
          return false
        }
      }

      // 拡大、縮小処理
      const row_diff = Math.abs(this.rowNumInput - this.rowNum)
      const col_diff = Math.abs(this.colNumInput - this.colNum)

      if (this.rowNumInput > this.rowNum) [...Array(row_diff)].map(this.addRow)
      else [...Array(row_diff)].map(this.deleteRow)

      if (this.colNumInput > this.colNum) [...Array(col_diff)].map(this.addCol)
      else [...Array(col_diff)].map(this.deleteCol)

      this.popupMenuName = false; // 入力表示フラグをOFF
    },
    // 行・列サイズメニュー表示
    showSizeEdit (ev) {
      if (ev) {
        this.itemMenuTarget = ev.target
      }
      // メニューボタンの位置を計算し、ポップアップメニューを表示する
      this.popupMenuName = 'size'

      if (!this.isTouchDevice) {
        // タッチデバイスではないPCなどのみ
        // メニュー位置の調整
       
        this.$nextTick(()=>{
          this.arrangePopup(this.$refs.sizeEdit.$el, this.itemMenuTarget, {x:0, y:5})
          // メニューの外をクリックされたときの検知用イベント
          document.addEventListener('click', this.hideSizeEdit)
        })
      }
    },
    // 行・列サイズメニュー非表示
    hideSizeEdit () {
      // ポップアップメニューの非表示
      if (this.popupMenuName === 'size') {
        this.popupMenuName = false
      }
      // イベントの後片付け
      document.removeEventListener('click', this.hideSizeEdit)
    },
    // 実際の行・列数と入力フィールドの値を同期する
    syncInput (mode){
      if (mode=='row') {this.rowNumInput = this.rowNum;}
      else if (mode=='col') {this.colNumInput = this.colNum;}
      else {this.colNumInput = this.colNum; this.rowNumInput = this.rowNum;}
    },
    // 行の追加
    addRow (row_index) {
      if (this.isMaxRow) { // 最大行数に達している場合は何もしない
        alert(this.$t('Table.reachedMaxRow'))
        return false; 
      }
      if (typeof row_index==='undefined' || row_index===null) row_index = this.rowNum; // 行番号が指定されなければ最終列に追加
      this.addCells(null, row_index, 'row')
    },
    // 列の追加
    addCol (col_index) {
      if (this.isMaxCol) { // 最大列数に達している場合は何もしない
        alert(this.$t('Table.reachedMaxCol'))
        return false; 
      }
      if (typeof col_index==='undefined' || col_index===null) col_index = this.colNum; // 列番号が指定されなければ最終列に追加
      this.addCells(null, col_index, 'col')
      
      // colgroupの追加
      let width = null
      if (this.item.colgroup.length && this.item.colgroup[0].width) {
        // 列幅指定あり
        // 追加する列幅=全体を追加後の列数の数で割った割合
        width = 100 / this.colNum
        let rate = (100 - width) / 100
        // 新しい列が割り込んだ分、ほかの列幅を調整する
        this.item.colgroup.forEach(col=>{
          col.width = col.width * rate
        })
      }
      this.item.colgroup.splice(col_index, 0, {width: width})
    },
    // 行の削除 
    deleteRow (row_index) {
      if (this.isMinRow) {
        alert(this.$t('Table.reachedMinRow'))
        return false
      }
      if (typeof row_index==='undefined' || row_index==null) row_index = this.rowNum-1; // 行番号が指定されなければ最終行を削除
      this.deleteCells(row_index, 'row')
      this.syncInput('row')
    },
    // 列の削除
    deleteCol (col_index) {
      if (this.isMinCol) {
        alert(this.$t('Table.reachedMinCol'))
        return false
      }
      if (typeof col_index==='undefined' || col_index==null) col_index = this.colNum-1; // 列番号が指定されなければ最終列を削除
      this.deleteCells(col_index, 'col')

      this.item.colgroup.splice(col_index, 1)
      if (this.item.colgroup[0]) {
        // 列幅の指定あり
        let sum_width = 0
        this.item.colgroup.forEach(col=>{
          sum_width += parseInt(col.width)
        })
        // 列を削除した分、幅の合計が100％になるように調整
        let rate = 100 / sum_width
        this.item.colgroup.forEach(col=>{
          col.width = col.width * rate
        })
      }
    },
    // 列幅のリセット
    resetColWidth () {
      this.item.colgroup.forEach(col=>{
        col.width = null
      })
      this.addTableHistory('colgroup') // Undo Historyに追加
    },
  }
}

import ItemBase from '@/scripts/ItemBase.js'

// 構造データ解析用クラス
export class Item extends ItemBase {
  constructor (options) {
    super(options)
    this.name = 'Table'
  }
  // 渡されたHTMLElementが、このコンポーネントで処理可能か判断する 
  matches (element) {
    return DOM.matches(element, 'table')
  }
  // 渡されたHTMLElementから、コンポーネントで扱えるデータに変換する
  getItem (element) {
    let cls = element.getAttribute('class')
    let rows = []
    // console.log(cls)
    let trs = Array.from(element.querySelectorAll('tr'))
    trs.forEach(tr => {
      let tds = Array.from(tr.querySelectorAll('th,td'))
      let row = {}
      row.id = Util.generateID()
      row.cells = []
      tds.forEach(td => {
        row.cells.push({
          id: Util.generateID(),
          content: td.innerHTML,
          header: td.tagName.toUpperCase()=='TH' ? true : false,
          rowspan: td.getAttribute('rowspan') ? parseInt(td.getAttribute('rowspan')) : null,
          colspan: td.getAttribute('colspan') ? parseInt(td.getAttribute('colspan')) : null,
        })
      })
      rows.push(row)
    })

    let item = {
      id: Util.generateID(),
      name: this.name,
      className: this.getConfig('allowCssClass') ? cls : null,
      rows: rows,
    }

    let cell_func = (row_idx, col_idx, rowspan, colspan, orig_cell) => {
      // 結合セルの補完処理
      for (var i=0; i<rowspan; i++) {
        let row = item.rows[row_idx+i]
        for (var j=0; j<colspan; j++) {
          if (i==0 && j==0) {
            // 起点となるセルはスキップ
            continue
          }
          let c = {
            id: Util.generateID(),
            dummy: true,
            content: 'd('+(row_idx+i)+','+(col_idx+j)+')',
            original: orig_cell,
          }
          row.cells.splice(col_idx+j, 0, c)
        }
      }
    }
    
    // 結合セルの補完
    for (var row_idx=0; row_idx<item.rows.length; row_idx++) {
      var row = item.rows[row_idx]
      for (var col_idx=0; col_idx<row.cells.length; col_idx++) {
        var cell = row.cells[col_idx]
        var colspan = cell.colspan ? cell.colspan : 1
        var rowspan = cell.rowspan ? cell.rowspan : 1
        // console.log('('+row_idx+','+col_idx+') rowspan='+rowspan+' colspan='+colspan)
        if (colspan > 1 || rowspan > 1) { 
          // セル結合あり
          cell_func(row_idx, col_idx, rowspan, colspan, cell)
          col_idx += colspan-1
        }
      }
    }

    // 列幅指定のためのcolgroup取得
    let cols = []
    let colnum = rows[0].cells.length
    let colgroup_col = Array.from(element.querySelectorAll('colgroup col'))
    if (colgroup_col.length && colgroup_col.length===colnum) {
      // colgroupの数と、列の数が一致している場合
      colgroup_col.some(col => {
        let w
        if ((w = col.style.width.match(/([\d.]+)%$/)) === null) {
          // widthの指定が%でない場合
          cols = []
          return true
        }
        cols.push({width: w[1]})
        // cols.push({width: col.style.width})
      })
    }
    if (cols.length===0) {
      cols = [...Array(colnum)].map(ar => {return {width: null}})
    }
    item.colgroup = cols

    const def = this.getPreDefinedSets(item)
    if (def) { // 定義セットに一致するものが見つかった
      item.preDefined = def
    }
    return item
  }
  // HTMLを返す
  getHtml (item, base_ind) {
    super.getHtml(item, base_ind)

    let html = ''
    let colgroup_html = ''
    let thead_html = ''
    let tbody_html = ''
    const nl = this.getConfig('outputNewLine')

    if (!item.rows || item.rows.length===0) return null

    const row_num = item.rows.length
    const col_num = item.rows[0].cells.length

    // 指定された行がすべてthタグかどうか
    const is_all_th = (row_index) => {
      return item.rows[row_index].cells.filter(cell => cell.header || (cell.ref && cell.ref.header)).length == col_num
    }
    // 行方向の結合セルを再帰的にたどったときの最大行番号
    const get_merged_row_max_index = (start_row_index) => {
      const row = item.rows[start_row_index]
      const col_num = row.cells.length
      let rowspan = 1
      let ret_row_index = start_row_index
      for (let i=0; i<col_num; i++) {
        const cell = row.cells[i]
        if (cell.rowspan && cell.rowspan > 1 && cell.rowspan > rowspan) {
          rowspan = cell.rowspan
        }
      }
      ret_row_index = ret_row_index + rowspan - 1

      for (let i=start_row_index+1; i<start_row_index+rowspan; i++) {
        for (let j=0; j<col_num; j++) {
          const cell = item.rows[i].cells[j]
          if (cell.rowspan && cell.rowspan > 1) {
              const _index = get_merged_row_max_index(i)
              if (_index > ret_row_index) ret_row_index = _index
          }
        }
      }
      return ret_row_index
    }

    // theadの領域をあらかじめ計算しておく
    let thead_row_index = -1
    for (let i=0; i<row_num; i++) {
      const _index = get_merged_row_max_index(i)
      if (_index === i) {
        if (is_all_th(i)) { // すべてTHタグ
          thead_row_index = _index
        }
      } else {
        let all_th = true
        for (let j=i+1; j<_index+1; j++) {
          if (!is_all_th(j)) {
            all_th = false
          }
        }
        i = _index+1
        if (all_th) {
          thead_row_index = _index
        }
      }
    }

    colgroup_html = this._indent(1) + '<colgroup>' + nl
    for (let i=0; i<item.rows.length; i++) {
      let row = item.rows[i]

      let row_html = this._indent(2) + '<tr>' + nl
      for (let j=0; j<row.cells.length; j++) {
        // TD/THタグの生成

        if (i==0) {
            // colの設定
            let col_width = item.colgroup[j].width ? ' style="width:'+ parseFloat(item.colgroup[j].width).toFixed(2) + '%"' : ''
            colgroup_html += this._indent(2) + '<col'+col_width+'></col>' + nl
        }

        let cell = row.cells[j]
        if (!cell.dummy) {
          // 実体セル
          let tag_name='', rowspan='', colspan='', scope=''
          if (cell.header) {
            tag_name = 'th'
          } else {
            tag_name = 'td'
          }

          if (cell.rowspan && cell.rowspan>1) rowspan = ' rowspan="'+cell.rowspan+'"'
          if (cell.colspan && cell.colspan>1) colspan = ' colspan="'+cell.colspan+'"'

          let content = Util.arrangeEditableHtml(cell.content); // HTMLの整形
          row_html += this._indent(3) + '<' + tag_name + rowspan + colspan + scope + '>' + content + '</' + tag_name + '>' + nl
        }
      }
      row_html += this._indent(2) + '</tr>' + nl
      if (i <= thead_row_index) {
        // 行内の列がすべて見出し、かつTHEADが閉じられていない場合はTHEADにタグを追加
        thead_html += row_html
      } else {
        // 行内の列に見出しでないものが含まれる場合はTHEADを閉じる
        tbody_html += row_html
      }
    }
    colgroup_html += this._indent(1) + '</colgroup>' + nl

    if (thead_html) thead_html = this._indent(1) + '<thead>' + nl + thead_html + this._indent(1) + '</thead>' + nl
    if (tbody_html) tbody_html = this._indent(1) + '<tbody>' + nl + tbody_html + this._indent(1) + '</tbody>' + nl

    let cls_name = ''
    if (this.getConfig('allowCssClass') && item.className) cls_name = ' class="'+item.className+'"'
    html = this._indent(0) + '<table'+cls_name+'>' + nl + 
      colgroup_html +
      thead_html +
      tbody_html +
    this._indent(0) + '</table>'

    return html
  }
  // アイテムデータを検証し、不正なデータは置き換える
  normalizeItem (item) {
    if (!item && typeof item !== 'object') return this.getEmptyItem()
    if (typeof item.id !== 'string') item.id = Util.generateID()
    let col_num = 0
    if (item.rows instanceof Array) {
      item.rows.splice(this.getConfig('maxRow'))
      item.rows.forEach(row => {
        if (!(row.cells instanceof Array)) {
          row.cells = []
          return
        }
        row.cells.splice(this.getConfig('maxCol'))
        col_num = 0
        row.cells.forEach(cell => {
          col_num++
          if (typeof cell.id !== 'string') cell.id = Util.generateID()
          if (typeof cell.content !== 'string') cell.content = ''
          if (typeof cell.header !== 'boolean') cell.header = false
          if (typeof cell.dummy !== 'boolean') cell.dummy = false
          if (typeof cell.rowspan !== 'number') cell.rowspan = null
          if (typeof cell.colspan !== 'number') cell.colspan = null
        })
      })
    } else {
      item.rows = []
    }
    if (item.colgroup instanceof Array) {
      item.colgroup.splice(col_num)
      item.colgroup.forEach(g => {
        if (typeof g.width !== 'number') g.width = null
      })
    } else {
      item.colgroup = [...Array(col_num)].map(ar => {return {width: null}})
    }
    if (typeof item.className !== 'string') item.className = null
  }
  // 空のデータを返す
  getEmptyItem () {
    return {
      id: Util.generateID(),
      name: this.name,
      className: null,
      colgroup: [],
      rows: [],
    }
  }
}
/*
データ構造
{
    item: {
        className: (クラス名),
        name: 'Table',
        colgroup: [
            {
                width: (列幅%)
            },
            ...
        ],
        rows: [
            {
                cells: [
                    {
                        colspan: (colspan数.結合なしなら定義なし、もしくは1),
                        rowspan: (rowspan数.結合なしなら定義なし、もしくは1),
                        header: (見出しフラグ.THセル=true TDセル=false),
                        content: (セルの内容),
                        dummy: (結合セル表現のためのダミー=true),
                    },
                    ...
                ]
            },
            ...
        ]
    }
}

アウトプットされるHTMLの例
<table class="table-class">
    <colgroup>
        <col style="width:20%" />
        <col style="width:30%" />
        <col style="width:50%" />
    </colgroup>
    <thead>
      <tr>
        <th scope="col">横に並ぶ見出し</th>
        <th scope="col">横に並ぶ見出し</th>
        <th scope="col">横に並ぶ見出し</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>セル</td>
        <td>セル</td>
        <td>セル</td>
      </tr>
    </tbody>
  </table>
  <table>
    <colgroup>
        <col />
        <col />
        <col />
    </colgroup>
    <tbody>
      <tr>
        <th scope="row">縦にならぶ見出し</td>
        <td>セル</td>
        <td>セル</td>
      </tr>
      <tr>
        <th scope="row">縦にならぶ見出し</td>
        <td>セル</td>
        <td>セル</td>
      </tr>
    </tbody>
</table>
*/
</script>

<style lang="scss" scoped>
@import '@/styles/valiables.scss';
@import '@/styles/components.scss';
@import '@/styles/animation.scss';

$header-height: 25px; // テーブルヘッダの高さ
.BEV-table {
  position: relative;

  // 行・列ボタン
  .BEV-colbutton,
  .BEV-rowbutton {
    @extend %secondary-button;
    width: 16px;
    height: 16px;
    position: relative;
    font-size: 0;
    svg {
      pointer-events: none; // SVGによるマウスイベント横取りを防ぐ
      font-size: 0;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
  }

  // ポップアップメニュー
  .BEV-menu-wrap {
    @extend %popup-menu-wrap;
  }

  .BEV-colhead,
  .BEV-rowhead {
    display: flex;
    justify-content: flex-start;
    position: relative;
    height: 100%;
    width: 100%;

    .BEV-move-handle {
      position: relative;
      height: 100%;
      cursor: grab;
      &.dragging {
        @include prefix(cursor, grabbing!important);
      }
    }
  }
  .BEV-colhead {
    align-items: center;
    .BEV-move-handle {
      width: calc(100% - 24px);
    }
  }
  .BEV-rowhead {
    height: 0; // heightを指定しないとなぜか高さが0になる
    min-height: 1.7em;
    align-items: stretch;
    .BEV-move-handle {
      width: calc(100% - 21px);
    }
    button {
      margin-top: 5px;
    }
  }

  // 入力エリア
  .BEV-input-area {
    position: absolute;
    box-sizing: border-box;
    border: 1px solid #4A8BEE;
    background-color: #fff;
    outline: none;
    padding: .2em .3em;
    box-shadow: 0 0 0 0.2rem rgba(0,123,255,.25);
    z-index: 1000;
    
    /deep/.ql-editor {
      color: darken($input-text-color, 20%);
    }
  }
  // 幅調整のためのハンドル
  .BEV-resize-handler {
    transition: opacity .16s;
    position: absolute;
    top: 0;
    right: -3.5px;
    background-color: #518FE8;
    width: 7px;
    height: 100%;
    z-index: 1000;
    cursor: ew-resize;
    opacity: 0;

    &.BEV-show {
      opacity: 1;
    }
    &:hover {
      opacity: 1;
    }
  }
  // リサイズハンドルの位置を表すライン
  .BEV-resize-line {
    position: absolute;
    width: 4px;
    height: calc(100% - #{$header-height} - 2px);
    top: calc(#{$header-height} + 2px);
    left: 0;
    background-color: rgba(0,0,0,.3);
  }
  // 挿入位置を表すライン
  .BEV-insert-line {
    position: absolute;
    box-sizing: border-box;
    background-color: rgba(0,0,0,.3);
    pointer-events: none;
    z-index: 1000;
  
    &.BEV-disabled {
      background-color: rgba(255,0,0, .6);
    }
  }
  // 挿入位置を表すイメージ
  .BEV-insert-ghost {
    position: absolute;
    background-color: rgba(0,0,0,.2);
    z-index: 1001;
    transition-property: background-color;
    transition-duration:.1s;
    transition-timing-function:ease-in-out;
    pointer-events: none;
  }

  // 選択範囲のスタイル
  .BEV-range {
    position: absolute;
    box-sizing: border-box;
    box-shadow:0px 0px 0px 1px #4a8bee inset;
    // border: 1px solid #4A8BEE;
    outline: none;
    background-color: rgba(74, 139, 238, .15);
    z-index: 1000;
    pointer-events: none;
  }
  .BEV-buttons {
    display: flex;
    margin: 10px 0 0 0;
    button {
      font-size: .8em;
    }
    button.BEV-cancel {
      @extend %danger-button;
      margin: 0 7px 0 0;
    }
    button.BEV-save {
      @extend %primary-button;
    }
    button.BEV-delete {
      margin: 0 5px 0 0;
      @extend %danger-button;
    }
  }

  .BEV-grid-size {
    background-color: #FFFFFF;
    border: $item-border;
    border-radius: $item-wrap-border-radius;
    padding: 10px;

    .BEV-grid-size-input {
      display: flex;
      align-items: center;
      justify-content: flex-start;

      label {
        @extend %label;
      }
      input {
        @extend %input;
        font-size: .8em;
        width: 4em;
      }
      .BEV-cross {
        @extend %label;
      }
    }
  }

  .BEV-table-wrap {
    border: 0;
    margin: 0px;
    border-radius: $item-wrap-border-radius;
    overflow: hidden;
    position: relative;
    overflow-x: auto;

    table {
      table-layout: fixed;
      border: 0;
      background-color: #E9ECEF;
      border-collapse: collapse;
      // width: calc(100% - 1.5rem - .55rem);
      width: calc(100% + 0px);
      user-select: none;
      -webkit-user-select: none;
    }

    colgroup {
      col:first-child {
        width: 42px;
      }
    }
    thead {
      th {
        position: relative;
        height: $header-height;
        // background-color: rgba(233, 236, 239, 1.0);
        border: 1px solid #bbb;
        padding: 0;

        &:first-child {
          width: 42px;
        }
        &:last-child {
          border-right: 0!important;
        }
      }
    }
    tbody {
      th {
        position: relative;
        border: 1px solid #bbb;
        padding: 0;
        vertical-align: top;

        & > div {
          min-height: 1.7em;
        }
      }
      td {
        &:last-child {
          border-right: 0!important;
        }
      }
      // クリック防止
      /deep/ th a, /deep/ td a {
        pointer-events: none;
      }
    }
  }

  .BEV-table-border {
    position: absolute;
    top: 0;
    left: 0;
    width: calc(100% - 0px);
    height: calc(100% - 0px);
    // border: $item-border;
    box-shadow:0px 0px 0px 1px #B3B7BC inset;
    margin: 0px;
    border-radius: $item-wrap-border-radius;
    pointer-events: none;
  }

  .BEV-errors {
    margin: 5px 0 0 0;
    .BEV-error {
      font-size: .8em;
      color: $lbl-dgr-text-color;
    }
  }
}

.BEV-table.BEV-hover {
  .BEV-table-border {
    box-shadow:0px 0px 0px 1px #AFCDFB inset;
  }
} 
.BEV-table.BEV-active {
  .BEV-table-border {
    box-shadow:0px 0px 0px 1px #7EAEF9 inset;
  }
} 
</style>
