<template>
  <div 
    :class="{'BEV-hover': isHover, 'BEV-active': isActive, 'BEV-dragging': $store.state.draggingItem===item}"
    class="BEV-item BEV-list">
    <!-- アイテムヘッダ -->
    <ItemHeader 
      @menu-mouseenter="popupMenuName===false ? showItemMenu($event) : false"
      @menu-mouseleave="_hideItemMenuDelay()"
      @label-click="activateItem(); isItemAttrEditable ? showTypeEdit($event) : false;"
      @label-dragstart="$emit('item-dragstart', $event)"
      @label-dragend="$emit('item-dragend', $event)"
      @sub-label-click="getConfig('allowCssClass') ? showClassInput($event) : false"
      @moveup-click="doItemCommonAction('moveup')"
      @movedown-click="doItemCommonAction('movedown')"
      :parentWidth="editorWidth"
      :active="isActive"
      :hover="isHover"
      :item="item"
      :label="itemHeaderLabel"
      :allowCssClass="getConfig('allowCssClass') && isItemAttrEditable"
      :classes="getConfig('cssClasses')"
    />
    <div class="BEV-content">
      <transition-group name="BEV-list-anim" tag="div" style="position:relative">
      <div
        class="BEV-list-item"
        :class="{'BEV-placeholder': row.placeholder, 'BEV-dragging-row': draggingRow===row}"
        @dragenter="draggingRow ? _onRowDragEnter(row, $event) : false"
        :key="row.id"
        :data-id="row.id"
        ref="rows"
        v-for="(row, index) in calcRows">
        <div 
          @dragstart="moveRowIndex=index;_onRowDragStart(row, $event)"
          @dragend="_onRowDragEnd(row, $event)"
          draggable="true"
          :style="{width: item.type==='ordered' ? (getConfig('baseFontSize') * listNumDigit) + 5 +'px' : 'auto'}"
          class="BEV-mark">
            <span v-if="item.type==='ordered'">{{index+1}}.</span>
            <span v-else>・</span>
        </div>
        <component
          @focus="activateItem()"
          @enter="addRow(row)"
          @delete="deleteRow(row)"
          @down="focusNext(row)"
          @up="focusPrev(row)"
          @input="row.placeholder ? fixRow() : onRowContentChange(row)"
          :is="getConfig('allowStyledText') ? 'VisualText': 'PlainText'" 
          :cssClasses="getConfig('styledTextClasses')"
          :noLineBreak="true"
          v-model="row.content"
          :data-id="row.id"
          ref="editors"
          class="BEV-editor"
        />
      </div>
      </transition-group>
    </div>
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
      <ListTypeEdit 
        @cancel="hideTypeEdit()"
        @input="hideTypeEdit()"
        v-show="popupMenuName==='type'"
        ref="typeEdit"
        v-model="item.type"
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
  </div>
</template>

<script>
import ItemMixin from '@/components/sub/ItemMixin.vue'
import Util from '@/scripts/Util.js'
import DragItemUtil from '@/scripts/DragItemUtil.js'

import VisualText from '@/components/sub/VisualText.vue'
import PlainText from '@/components/sub/PlainText.vue'
import ListTypeEdit from '@/components/sub/ListTypeEdit.vue'

const SORT_EXEC_INTERVAL = 50    // ソート処理を行ってから、次にソート処理を行うまでの最低時間
let PREV_SORT_EXEC
export default {
  mixins: [ItemMixin],
  components: {VisualText, PlainText, ListTypeEdit},
  data () {
    return {
      // ポップアップメニューの項目定義
      actions: {
        changeListType: {text: this.$t('List.changeType')},
        setClassName: {text: this.$t('common.setCssClass'), icon: 'IconCssClass'},
        moveup: {text: this.$t('common.moveUpItem'), icon: 'IconMoveup'},
        movedown: {text: this.$t('common.moveDownItem'), icon: 'IconMovedown'},
        replicate: {text: this.$t('common.replicateItem'), icon: 'IconReplicate'},
        delete: {text: this.$t('common.deleteItem'), type: 'danger', icon: 'IconDelete'},
      },
      draggingRow: null,               // ドラッグ中のリストデータ
      moveRowIndex: -1,                // ドラッグ対象の行のインデックス番号（開始時）
      historyTargetKeys: ['type'],
      oldRowContents: {},               // 行の入力データの変更前データ（アンドゥ用）
      dragItemUtil: null,
    }
  },
  computed: {
    // アイテムヘッダの名前
    itemHeaderLabel () {
      if (this.item.preDefined && this.item.preDefined.dispName) return this.item.preDefined.dispName
      else if (this.item.type === 'ordered') return this.$t('List.orderedList')
      else if (this.item.type === 'unordered') return this.$t('List.unorderedList')
      return ''
    },
    calcRows () {
      if (this.item.rows.length===0) {
        // 行がない場合
        // 入力用の行を1行だけ用意して返す
        return [
          {
            id: Util.generateID(),
            content: '',
            placeholder: true,
          }
        ]
      } else {
        return this.item.rows
      }
    },
    // 入力用の行データ
    placeholdedRow () {
      let ret
      this.calcRows.some(row=>{
        if (row.placeholder) {
          ret = row
          return true
        }
      })
      return ret
    },
    // リスト数の桁数
    listNumDigit () {
      const len = this.item.rows.length
      return String(len).length
    }
  },
  created () {
    if (this.getConfig('types').length===1 || !this.isItemAttrEditable) {
      // 種類が一つしか定義されていない場合
      // もしくは定義セットが指定されている場合は
      // 操作メニューからは削除
      this.$delete(this.actions, 'changeListType')
    }
  },
  mounted () {
    // 表示開始時の、行データを記録しておく
    // (アンドゥ処理用)
    this.item.rows.forEach(row=>{
      this.oldRowContents[row.id] = row.content
    })
  },
  methods: {
    doItemAction (action) {
       if (action === 'changeListType') {
        // リスト種類の変更
        this.showTypeEdit()
      }
    },
    // 行の追加
    // base_row: 基準となる行（指定の行の次の位置に挿入される）
    addRow (base_row) {
      if (this.item.rows.length >= this.getConfig('maxRows')) {
        alert(this.$t('List.reachedMaxRow', {n:this.getConfig('maxRows')}));
        return false
      }

      if (this.placeholdedRow) {
        // 入力用のデータ行があれば、通常の行データに変換
        this.fixRow()
      }

      const index = this.item.rows.indexOf(base_row)
      const to_index = index===-1 ? 0 : index+1

      const row = {
        id: Util.generateID(),
        content: '',
      }
      const undo_delta = this.applyDelta({
        type: 'insert',
        target: this.item.rows,
        key: to_index,
        data: row
      })
      // 履歴に追加
      this.addHistory(undo_delta)

      // 追加した行にフォーカスを合わせる
      this.$nextTick(()=>{
        this.focusNext(base_row)
      })
    },
    // 行の削除
    deleteRow (row) {
      const index = this.item.rows.indexOf(row)
      if (index === -1) return false

      // アンドゥー用データの削除
      if (typeof this.oldRowContents[row.id] !== 'undefined') {
        this.$delete(this.oldRowContents, row.id)
      }

      const undo_delta = this.applyDelta({
        type: 'delete',
        target: this.item.rows,
        key: index
      })
      // 履歴に追加
      this.addHistory(undo_delta)

      // 削除した前の行にフォーカスを合わせる
      if (index <= 0) return true
      const prev_row = this.item.rows[index-1]
      const prev_row_comp = this.findEditorComponentById(prev_row.id)
      if (prev_row_comp) {
        prev_row_comp.focus()
      }
    },
    // 次の行にフォーカスを移す
    focusNext (row) {
      const index = this.item.rows.indexOf(row)
      if (index === -1) return false
      if (index >= this.item.rows.length-1) return false

      const next_row = this.item.rows[index+1]
      const next_row_comp = this.findEditorComponentById(next_row.id)
      if (next_row_comp) {
        next_row_comp.focus()
      }
    },
    // 前の行にフォーカスを移す
    focusPrev (row) {
      const index = this.item.rows.indexOf(row)
      if (index <= 0) return false

      const prev_row = this.item.rows[index-1]
      const prev_row_comp = this.findEditorComponentById(prev_row.id)
      if (prev_row_comp) {
        prev_row_comp.focus()
      }
    },
    // 入力用の行を通常の行に確定する
    fixRow () {
      if (!this.placeholdedRow) return false

      const new_row = Util.deepCopy(this.placeholdedRow)
      // new_row.id = Util.generateID()
      new_row.placeholder = false
      const undo_delta = this.applyDelta({
        type: 'insert',
        target: this.item.rows,
        key: 0,
        data: new_row
      })
      // 履歴に追加
      this.addHistory(undo_delta)
    },
    // IDから行コンポーネントを探す
    findEditorComponentById (id) {
      let row
      this.$refs.editors.some(_row => {
        if (_row.$attrs['data-id'] === id) {
          row = _row
          return true
        }
      })  
      return row
    },
    // リスト種類メニュー表示
    showTypeEdit (ev) {
      if (this.getConfig('types').length<=1) return false // 種類定義が一つ以下の場合はメニューを表示しない

      if (ev) {
        this.itemMenuTarget = ev.target
      }

      // メニューボタンの位置を計算し、ポップアップメニューを表示する
      this.popupMenuName = 'type'

      if (!this.isTouchDevice) {
        // タッチデバイスではないPCなどのみ
        // メニュー位置の調整
       
        this.$nextTick(()=>{
          this.arrangePopup(this.$refs.typeEdit.$el, this.itemMenuTarget, {x:0, y:5})
          // メニューの外をクリックされたときの検知用イベント
          document.addEventListener('click', this.hideTypeEdit)
        })
      }
    },
    // レベル編集メニュー非表示
    hideTypeEdit () {
      // ポップアップメニューの非表示
      if (this.popupMenuName === 'type') {
        this.popupMenuName = false
      }
      // イベントの後片付け
      document.removeEventListener('click', this.hideTypeEdit)
    },
    // フォーカスを当てる
    focus () {
      this.$refs.editors[0].focus()
    },
    // 行データの変更イベント
    onRowContentChange (row) {
      const old_content = typeof this.oldRowContents[row.id] !== 'undefined' ? this.oldRowContents[row.id] : ''

      this.addHistory({
        type: 'change',
        target: row,
        key: 'content',
        data: old_content
      })
      // 古い値をコピー(UNDO/REDOの変更の際も実行される)
      this.$set(this.oldRowContents, row.id, Util.deepCopy(row.content))
    },
    // リストのドラッグスタート
    _onRowDragStart (row, ev) {
      if (row.placeholder) return false // 入力用行データの場合はソート不許可

      this.draggingRow = row

      ev.dataTransfer.effectAllowed = 'move'
      ev.dataTransfer.setData('text', '')

      // ドラッグ対象のDOM要素取得
      let src_elm
      this.$refs.rows.some(elm => {
        if (elm.getAttribute('data-id') === row.id) {
          src_elm = elm
          return true
        }
      })

      // ドラッグ&ドロップユーティリティ
      this.dragItemUtil = new DragItemUtil({
        targetElement: src_elm,
        parentElement: this.$el,
        draggingClass: 'BEV-dragging-clone',
        dragStartEvent: ev,
      })
      // console.log(this.dragItemUtil)
    },
    // リストのドラッグ終了
    _onRowDragEnd (row, ev) {
      if (row.placeholder) return false // 入力用行データの場合はソート不許可

      // 並び替えを履歴に追加
      const from_index = this.moveRowIndex
      let to_index = this.item.rows.indexOf(row)

      this.draggingRow = null
      this.moveRowIndex = -1
      this.dragItemUtil.destroy()
      this.dragItemUtil = null
      
      if (from_index === to_index) return false

      this.addHistory({
        type: 'move',
        target: this.item.rows,
        fromIndex: to_index,
        toIndex: from_index,
      })
      // console.log('from', from_index, 'to', to_index);
    },
    _onRowDragEnter (row, ev) {
      if (row.placeholder) return false // 入力用行データの場合はソート不許可
      
      const tm = (new Date()).getTime()
      if (PREV_SORT_EXEC) {
        // 前回のソートから一定時間以下の場合はスキップ
        if (tm - PREV_SORT_EXEC <= SORT_EXEC_INTERVAL) return false
      }
      // console.log(tm - PREV_SORT_EXEC)

      const to_index = this.item.rows.indexOf(row)
      const from_index = this.item.rows.indexOf(this.draggingRow)

      this.item.rows.splice(from_index, 1)
      this.item.rows.splice(to_index, 0, this.draggingRow)

      PREV_SORT_EXEC = tm
    },
  }
}

// アイテムデータの解析等を行うクラス
import ItemBase from '@/scripts/ItemBase.js'
export class Item extends ItemBase {
  constructor (options) {
    super(options)
    this.name = 'List'
  }
  // 渡されたHTMLElementが、このコンポーネントで処理可能か判断する 
  matches (element) {
    const tag = element.tagName.toUpperCase()
    if ((tag === 'UL' && this.getConfig('types').indexOf('unordered') >= 0) ||
        (tag === 'OL' && this.getConfig('types').indexOf('ordered') >= 0)) {
      return true
    }
    return false
  }
   // 渡されたHTMLElementから、コンポーネントで扱えるデータに変換する
  getItem (element) {
    // クラス名の抽出(複数の場合は最初の一つだけ)
    let css_class = null;
    Array.from(element.classList).some(cls=>{
        css_class = cls
        return true
    })

    const node = element.querySelectorAll('li')
    const rows = []
    Array.from(node).forEach(n => {
      rows.push({
        id: Util.generateID(),
        content: n.innerHTML
      })
    })

    const item = {
      id: Util.generateID(),
      type: element.tagName.toUpperCase() === 'UL' ? 'unordered' : 'ordered',
      name: this.name,
      className: this.getConfig('allowCssClass') ? css_class : null,
      rows: rows,
    }
    const def = this.getPreDefinedSets(item)
    if (def) { // 定義セットに一致するものが見つかった
      item.preDefined = def
    }
    return item
  }
  // HTMLを返す
  getHtml (item, base_ind) {
    super.getHtml(item, base_ind)

    if (!item.rows || item.rows.length===0) return null

    const nl = this.getConfig('outputNewLine')
    // クラス名の取得
    let cls_name = ''
    if (this.getConfig('allowCssClass') && item.className) cls_name = ` class="${item.className}"`

    const tag_name = item.type === 'unordered' ? 'ul' : 'ol'
    let tag = this._indent(0) + `<${tag_name}${cls_name}>${nl}`
    item.rows.forEach(row => {
      const content = Util.arrangeEditableHtml(row.content)
      tag += this._indent(1) + `<li>${content}</li>${nl}`
    })
    tag += this._indent(0) + `</${tag_name}>`
    return tag
  }
  // アイテムデータを検証し、不正なデータは置き換える
  normalizeItem (item) {
    if (!item && typeof item !== 'object') return this.getEmptyItem()
    if (typeof item.id !== 'string') item.id = Util.generateID()
    if (this.getConfig('types').indexOf(item.type)===-1) item.type = this.getConfig('defaultType')
    if (item.rows instanceof Array) {
      item.rows.splice(this.getConfig('maxRows'))
      item.rows.forEach(d => {
        if (typeof d.id !== 'string') d.id = Util.generateID()
        if (typeof d.content !== 'string') d.content = ''
      })
    } else {
      item.rows = []
    }
    if (typeof item.className !== 'string') item.className = null
  }
  // 空のアイテムデータを返す
  getEmptyItem () {
    return {
      id: Util.generateID(),
      type: this.getConfig('defaultType'),
      name: this.name,
      className: null,
      rows: [],
    }
  }
}
/*
データ構造
item: {
  className: (クラス名),
  type: (ordered | unordered)
  name: 'List',
  rows: [
    {content: (HTML)}
    ...
  ]
}

アウトプットされるHTMLの例
<ul class="test">
  <li>リスト</li>
  <li>リスト</li>
</ul>
*/
</script>

<style lang="scss" scoped>
@import '@/styles/valiables.scss';
@import '@/styles/components.scss';
@import '@/styles/animation.scss';

.BEV-list-item {
  display: flex;
  align-items: flex-start;

  .BEV-mark {
    width: 1em;
    color: $item-text-color;
    user-select: none;
    cursor: grab;
  }
}
.BEV-list-item.BEV-placeholder {
  .BEV-mark {
    color: lighten($item-text-color, 15%);
  }
}

.BEV-editor {
  color: $item-text-color;
}

.BEV-content {
  background-color: #FFFFFF;
  border: $item-border;
  border-radius: $item-wrap-border-radius;

  padding: 10px;
  outline: none;
  transition: border .2s, color .2s;
  width: 100%;
  box-sizing: border-box;
  resize: none;
}
.BEV-list-item {
  /deep/.ql-editor {
    font-size: 1em;
    line-height: 1.5em;
  }
}

.BEV-list.BEV-hover .BEV-content {
  border: $item-hover-border;
  color: $item-hover-text-color;
}

.BEV-list.BEV-active .BEV-content,
.BEV-list .BEV-content:focus {
  border: $item-active-border;
  color: $item-active-text-color;
}

// ドラッグ中のイメージ
.BEV-list {
  .BEV-dragging-clone {
    opacity: 1;
    transition: transform .2s;
    border: 1px solid #ddd;
    border-radius: 3px;
    overflow: hidden;
    background-color: #fff;
  }
}
// ドラッグ中のスタイル
.BEV-dragging-row {
  position: relative;
  &::after {
    content: ' ';
    position: absolute;
    background-color: #E6E8E9;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    border-radius: 3px;
    z-index: 999;
    pointer-events: none;
  }
}

// アニメーション
.BEV-list-item{
  transition: all .2s;
}
.BEV-list-anim-enter, .BEV-list-anim-leave-to {
  opacity: 0;
}
.BEV-list-anim-leave-active {
  position: absolute;
}
</style>