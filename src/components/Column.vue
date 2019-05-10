<template>
  <div 
    :class="{'BEV-hover': isHover, 'BEV-active': isActive, 'BEV-sp': layoutMode==='sp', 'BEV-dragging': $store.state.draggingItem===item}"
    class="BEV-item">

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
      :parentWidth="editorWidth"
      :active="isActive"
      :hover="isHover"
      :item="item"
      :allowCssClass="getConfig('allowCssClass') && isItemAttrEditable"
      :classes="getConfig('cssClasses')"
    />
    
    <div class="BEV-columns">
      <div 
        v-for="(column, col_index) in item.columns"
        :key="'column-'+item.id+'-'+col_index"
        ref="column"
        class="BEV-column">

        <div 
          v-tooltip="$t('Column.columnNumber') + (col_index+1)"
          class="BEV-column-number">{{col_index+1}}
        </div>

        <transition name="column-no-items">
          <div v-if="column.items.length" :key="'column-'+item.id+'-'+col_index+'-exists'">
            <div class="BEV-separator-wrap">
              <transition name="fade">
                <Separator 
                  v-show="isActive || $store.state.draggingItem"
                  @background-click="showAddMenu($event, 0, col_index, 'sep-click')"
                  @mouseleave.native="hideAddMenuDelay()"
                  @button-mouseenter="showAddMenu($event, 0, col_index, 'sep-mouseenter')"
                  @button-mouseleave="hideAddMenuDelay()"
                  @item-drop="_waitDragEndAndMoveItem($store.state.draggingItem, col_index, 0)"
                  class="BEV-separator" />
              </transition>
            </div>
            <transition-group name="BEV-item" tag="div" style="position:relative">
            <div 
              :key="'col-trans-'+colItem.id"
              class="BEV-item-anim"
              v-for="(colItem, index) in column.items"
              >
              <div class="BEV-component-wrap">
                <component 
                  @item-action="doChildAction($event, colItem, column.items)"
                  @item-dragstart="$store.commit('draggingItem',colItem);_itemDragstart(colItem, column, $event)"
                  @item-dragend="_itemDragend($event);$store.commit('draggingItem',null)"
                  @mouseenter.native="$store.commit('hoverItem', colItem)"
                  @mouseleave.native="$store.commit('hoverItem', null)"
                  ref="colItems"
                  :key="colItem.id"
                  :parentWidth="columnWidth"
                  :item="colItem"
                  :is="colItem.name" 
                />
              </div>
              <div class="BEV-separator-wrap">
                <transition name="fade">
                  <Separator 
                    v-show="isActive || $store.state.draggingItem"
                    @background-click="showAddMenu($event, index+1, col_index, 'sep-click')"
                    @mouseleave.native="hideAddMenuDelay()"
                    @button-mouseenter="showAddMenu($event, index+1, col_index, 'sep-mouseenter')"
                    @button-mouseleave="hideAddMenuDelay()"
                    @item-drop="_waitDragEndAndMoveItem($store.state.draggingItem, col_index, index+1)"
                    class="BEV-separator" 
                  />
                </transition>
              </div>
            </div>
            </transition-group>
          </div>
          <!-- カラムにアイテムがない場合 -->
          <div v-else
            :key="'column-'+item.id+'-'+col_index+'-noexists'"
            @click="showAddMenu($event, 0, col_index, 'surface-click')"
            @mouseleave="hideAddMenuDelay()"
            @dragenter="$store.state.draggingItem ? draggedOnColumn=true : false"
            @dragleave="draggedOnColumn=false"
            @dragover.prevent="$store.state.draggingItem ? $event.dataTransfer.dropEffect='move' : false"
            @drop.stop="_waitDragEndAndMoveItem($store.state.draggingItem, col_index, 0);draggedOnColumn=false"
            :class="{'BEV-dragged': draggedOnColumn, 'BEV-waiting-drag': $store.state.draggingItem}"
            class="BEV-no-items"
            tabindex="0"
          >
            <transition name="fade">
              <IconBase 
                @mouseenter.native="!isTouchDevice ? showAddMenu($event, 0, col_index, 'surface-mouseenter') : false"
                @mouseleave.native="!isTouchDevice ? hideAddMenuDelay() : false"
                @click.native="!isTouchDevice ? $event.stopPropagation() : false"
                v-show="isActive || $store.state.draggingItem"
                width="34" height="34">
                <IconPlusBig />
              </IconBase>
            </transition>
          </div>
        </transition>
      </div>
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
      <ClassInput 
        @cancel="hideClassInput()"
        @input="hideClassInput()"
        v-show="popupMenuName==='class'"
        :classes="getConfig('cssClasses')"
        ref="classInput"
        v-model="item.className"
      />
    </transition>

    <transition 
      name="popup-move">
      <ColumnEdit 
        @cancel="hideColumnEdit()"
        @input="changeColumnNumber($event); hideColumnEdit()"
        :value="item.columns.length"
        :min="getConfig('minColumn')"
        :max="getConfig('maxColumn')"
        v-show="popupMenuName==='column_edit'"
        ref="columnEdit"
      />
    </transition>

    <transition name="popup">
      <AddMenu 
        @item-click="addItem($event); hideAddMenu()"
        @mouseenter="!isTouchDevice ? hideAddMenuDelay(true) : false"
        @mouseleave="!isTouchDevice ? hideAddMenu() : false"
        @cancel-click="isTouchDevice ? hideAddMenu() : false"
        v-show="flgAddMenu"
        ref="addMenu"
        :items="addNames"
      />
    </transition>
  </div>
</template>

<script>
import ItemMixin from '@/components/sub/ItemMixin.vue'
import Separator from '@/components/sub/Separator.vue'
import Util, {Rect} from '@/scripts/Util.js'
import DOM from '@/scripts/DOM.js'
import DragItemUtil from '@/scripts/DragItemUtil.js'
import AddMenu from '@/components/sub/AddMenu.vue'
import ColumnEdit from '@/components/sub/ColumnEdit.vue'

import IconBase from '@/components/sub/IconBase.vue'
import IconPlusBig from '@/components/icons/IconPlusBig.vue'

let ADD_MENU_TIMER        // 追加メニュー表示制御用タイマー
let ADD_SEP_INDEX         // アイテム追加時の挿入位置番号(0-)
let ADD_COL_INDEX         // アイテム追加時の対象カラム番号(0-)

export default {
  mixins: [ItemMixin],
  components: {
    AddMenu, IconBase, IconPlusBig, Separator, ColumnEdit
  },
  created () {
    // アイテム追加メニューの構築
    const add_menu_items = []
    this.getConfig('itemOrder').forEach(key => {
      if (key === 'Column') return // カラムは追加不可

      let _item = {}
      if (this.getConfig('enabledItemNamesInColumn') === null ||
          this.getConfig('enabledItemNamesInColumn').indexOf(key) !== -1) {
        // サポートされているアイテム

        // 定義されている表示名を取得
        const conf = this.getConfig(key)
        if (conf.presets && conf.presets.length) { // 定義済み項目の定義
          conf.presets.forEach(def => {
            _item = {
              id: Util.generateID(),
              key: key,
              text: def.dispName,
              preset: def,
              icon: `Icon${key}`
            }
            add_menu_items.push(_item)
          })
        } else { // 通常要素
          _item.key = key
          if (conf && conf['dispName']) {
            _item.text = conf['dispName']
          } else {
            // 定義がなければ、翻訳データから取得
            _item.text = this.$t(`common.${key}`)
          }        
          _item.icon = `Icon${key}`
          _item.id = Util.generateID()
          add_menu_items.push(_item)
        }
      }
      this.addNames = add_menu_items
    })
  },
  mounted () {
    if (!this.getConfig('allowChangeNumColumn')) {
      // カラム数の変更禁止
      this.$delete(this.actions, 'changeColumnNum')
    }
  },
  data () {
    return {
      draggedOnColumn: false,
      // ポップアップメニューの項目定義
      actions: {
        changeColumnNum: {text: this.$t('Column.changeColumnNum')},
        setClassName: {text: this.$t('common.setCssClass'), icon: 'IconCssClass'},
        moveup: {text: this.$t('common.moveUpItem'), icon: 'IconMoveup', active: this.isActive},
        movedown: {text: this.$t('common.moveDownItem'), icon: 'IconMovedown'},
        replicate: {text: this.$t('common.replicateItem'), icon: 'IconReplicate'},
        delete: {text: this.$t('common.deleteItem'), type: 'danger', icon: 'IconDelete'},
      },
      addNames: [],               // 追加メニューの項目定義
      flgAddMenu: false,          // 追加メニューの表示制御フラグ
      columnWidth: 0,              // カラム幅

      dragItemUtil: null,         // ドラッグ処理のためのユーティリティクラスのインスタンス
    }
  },
  watch: {
    // エディタの幅変更検知
    editorWidth (val) {
      // 横のカラム幅を計算する
      this._calcColumnWidth()
    },
    // カラム数の変更
    'item.columns' () {
      // 横のカラム数をカウントする
      this.$nextTick(()=>{
        this._calcColumnWidth()
      })
    },
    isActive (newVal, oldVal) {
      if (!newVal && oldVal) {
        // アクティブ→アクティブ解除の場合は
        // カラム数入力ポップアップを非表示にする
        this.hideColumnEdit()
      }
    },
  },
  methods: {
    // 子アクションの実行 
    // action: アクション名
    // colItem: 対象のアイテムデータ
    // items: 対象となるアイテムの親データ
    doChildAction (action, colItem, items) {
      if (action === 'moveup') { this.moveupItem(colItem, items) }
      else if (action === 'movedown') { this.movedownItem(colItem, items) }
      else if (action === 'replicate') { this.replicateItem(colItem, items) }
      else if (action === 'delete') { this.deleteItem(colItem, items) }
    },
    // アイテムの上移動
    moveupItem (colItem, items) {
      // console.log('moveup child item:', colItem)
      const index = items.indexOf(colItem)
      if (index === -1 || index === 0) return false

      const undo_delta = this.applyDelta({
        type: 'move',
        target: items,
        fromIndex: index,
        toIndex: index-1
      })
      // 履歴に追加
      this.addHistory(undo_delta)
    },
    // アイテムの下移動
    movedownItem (colItem, items) {
      // console.log('movedown item:', colItem)
      const index = items.indexOf(colItem)
      if (index === -1 || index === items.length-1) return false

      const undo_delta = this.applyDelta({
        type: 'move',
        target: items,
        fromIndex: index,
        toIndex: index+1
      })
      // 履歴に追加
      this.addHistory(undo_delta)
    },
    // アイテムの移動
    // 自カラム内で完結しる移動のみ処理を行い
    // それ以外は親に処理を委譲する
    moveItem (item, toColumnIndex, toIndex) {
      // console.log('move item to column @Column:', item, 'toColumnIndex:', toColumnIndex, 'to:', toIndex)

      // 移動元を自分の子要素の中から探す
      let found = false
      this.item.columns.some((column, column_index) => {
        const index = column.items.indexOf(item)
        if (index !== -1) {
          // 同一アイテム内での移動
          found = true

          const delta = []
          if (column_index === toColumnIndex) {
            // 同一カラム内での移動
            if (index < toIndex) {
              toIndex--
            }
            if (index === toIndex) {
              // 移動元=移動先の場合は終了
              return true
            }
            delta.push({
              type: 'move',
              target: column.items,
              fromIndex: index,
              toIndex: toIndex
            })
          } else {
            // 同一カラム内での移動でない
            delta.push({
              type: 'delete',
              target: column.items,
              key: index
            })
            delta.push({
              type: 'insert',
              target: this.item.columns[toColumnIndex].items,
              key: toIndex,
              data: item
            })
          }
          const undo_delta = this.applyDelta(delta)
          // 履歴に追加
          this.addHistory(undo_delta)

          return true
        }
      })

      // 同一カラム内からの移動でない場合
      if (!found) {
        // 親要素に伝える
        this.$emit('item-drop', item, this.item, toColumnIndex, toIndex);
      }

      // 子アイテムをアクティブにする
      this.activateChildItem(item)
    },
    // アイテムの複製
    replicateItem (colItem, items) {
      // console.log('replicate child item:', colItem)
      const index = items.indexOf(colItem)
      if (index === -1) return false

      const clone = Util.deepCopy(colItem)
      clone.id = Util.generateID()
      const undo_delta = this.applyDelta({
        type: 'insert',
        target: items,
        key: index+1,
        data: clone
      })
      // 履歴に追加
      this.addHistory(undo_delta)
    },
    // アイテムの削除
    deleteItem (colItem, items) {
      // console.log('delete child item:', colItem)
      const index = items.indexOf(colItem)
      if (index === -1) return false

      const undo_delta = this.applyDelta({
        type: 'delete',
        target: items,
        key: index
      })
      // 履歴に追加
      this.addHistory(undo_delta)
    },
    // アイテムの追加
    addItem(item_def) {
      const name = item_def.key
      const toIndex = ADD_SEP_INDEX
      const toColIndex = ADD_COL_INDEX
      // console.log('add child item:', name, 'to:', toIndex, toColIndex)

      // サポートされていないアイテム
      if (this.getConfig('enabledItemNames') !== null && 
          this.getConfig('enabledItemNames').indexOf(name) === -1) return false

      const ins = this.$store.state.itemInstances[name]
      if (typeof ins === 'undefined') return false

      const item = ins.getEmptyItem()
      if (item_def.preset) {
        // 定義済みデータがあれば適用する
        item.preset = item_def.preset
        for (let key in item_def.preset) {
          if (key === 'dispName') continue
          item[key] = item_def.preset[key]
        }
      }      
      const undo_delta = this.applyDelta({
        type: 'insert',
        target: this.item.columns[toColIndex].items,
        key: toIndex,
        data: item
      })
      // 履歴に追加
      this.addHistory(undo_delta)

      // 追加した子アイテムをアクティブにする
      this.activateChildItem(item)
    },
    // 子アイテムをアクティブ状態にする
    activateChildItem (item) {
      // エディタ全体をアクティブにする
      window.BLOCK_EDITOR_STORE.commit('activeEditor', this.$store.state.rootElement)
      // 子アイテムをアクティブにする
      this.$store.commit('activeItem', item)
    },
    // コンポーネント固有のアクションの実行
    doItemAction (action) {
      // console.log('child item action:', action)

      if (action === 'changeColumnNum') {
        // カラムの変更
        this.showColumnEdit()
      }
    },
    // カラム数の変更
    changeColumnNumber (toNum) {
      // console.log(toNum, this.item.columns.length)
      let undo_delta
      if (toNum < this.item.columns.length) {
        // 現在よりもカラム数が小さい
        if (!confirm(this.$t('Column.confirmMakeColumnSmaller'))) {
          // 削除確認
          return false
        }
        const del_len = this.item.columns.length - toNum
        undo_delta = this.applyDelta({
          type: 'delete',
          target: this.item.columns,
          key: this.item.columns.length - del_len,
          length: this.item.columns.length - toNum,
        })
      } else if (toNum > this.item.columns.length) {
        // 現在よりもカラム数が大きい
        const add_len = toNum - this.item.columns.length
        const data = []
        for (let i=0; i<add_len; i++) data.push({items:[]})

        undo_delta = this.applyDelta({
          type: 'insert',
          target: this.item.columns,
          key: this.item.columns.length,
          length: add_len,
          data: data,
        })
      } else {
        // カラム数の変更なし
        return false
      }
      this.addHistory(undo_delta)
    },

    // 追加メニューの表示
    // sep_index: 追加する場所
    // col_index: 追加するカラム位置
    // trigger: トリガー名
    showAddMenu (ev, sep_index, col_index, trigger) {
      this.flgAddMenu = true
      ADD_SEP_INDEX = sep_index
      ADD_COL_INDEX = col_index

      if (!this.isTouchDevice) {
        // タッチデバイスではないPCなどのみ
        // メニュー位置の調整
        const offset = {x:0, y:5}
        let base
        if (trigger === 'sep-mouseenter') {
          // セパレータ上でのマウスエンター(+ボタンの位置)
          base = ev.target
        } else if (trigger === 'sep-click') {
          // セパレータ上でのクリック(エリア内の任意のX座標)
          base = ev.target
          offset.x = ev.offsetX
        } else if (trigger === 'surface-mouseenter') {
          // noitems状態でのマウスエンター(+ボタンの位置)
          base = ev.target
        } else if (trigger === 'surface-click') {
          // noitems状態でのクリック（エリア内の任意の位置）
          base = new Rect(ev.pageX, ev.pageY, 1, 1)
        }
        // タイミングをnextTickにするのは
        // メニューの幅を計算に使用するため
        this.$nextTick(()=>{
          this.arrangePopup(this.$refs.addMenu.$el, base, offset, true)
        })
      }
    },
    hideAddMenu () {
      this.flgAddMenu = false
    },
    hideAddMenuDelay (cancel) {
      if (ADD_MENU_TIMER) {
        clearTimeout(ADD_MENU_TIMER)
        ADD_MENU_TIMER = null
      }

      if (!cancel) {
        ADD_MENU_TIMER = setTimeout(()=>{
          this.hideAddMenu()
          ADD_MENU_TIMER = null
        },100)
      }
      
    },

    // カラム編集メニュー表示
    showColumnEdit (ev) {

      // メニューボタンの位置を計算し、ポップアップメニューを表示する
      this.popupMenuName = 'column_edit'

      if (!this.isTouchDevice) {
        // タッチデバイスではないPCなどのみ
        // メニュー位置の調整
       
        this.$nextTick(()=>{
          this.arrangePopup(this.$refs.columnEdit.$el, this.itemMenuTarget, {x:0, y:5})
          // メニューの外をクリックされたときの検知用イベント
          document.addEventListener('click', this.hideColumnEdit)
        })
      }
    },
    // カラム編集メニュー非表示
    hideColumnEdit () {
      // ポップアップメニューの非表示
      if (this.popupMenuName === 'column_edit') {
        this.popupMenuName = false
      }
      // イベントの後片付け
      document.removeEventListener('click', this.hideColumnEdit)
    },

    // アイテムのドラッグ開始検知
    _itemDragstart (colItem, column, ev) {
      ev.dataTransfer.setData('text/plain', '');

      // ドラッグされたアイテムの、Column内でのDOMのindexを取得する
      let src_elm
      this.$refs.colItems.some((ref,idx) => {
        if (ref.item === colItem) {
          src_elm = ref.$el
          return true
        }
      })
      if (!src_elm) return false

      // ドラッグ&ドロップユーティリティ
      this.dragItemUtil = new DragItemUtil({
        targetElement: src_elm,
        parentElement: this.$el,
        draggingClass: 'BEV-dragging-column-clone',
        dragStartEvent: ev
      })
    },
    // アイテムのドラッグ終了検知
    _itemDragend (ev) {
      // console.log('drag end @Column')
      this.dragItemUtil.destroy()
      this.dragItemUtil = null
    },
    // ドラッグエンド処理が終了するのを待つ
    // ※イベントはdrop -> dragend の順序で発生するため
    // カラム内部、外部からそれぞれ、外部、内部への移動処理を行うと
    // dragend処理が発生しなくなってしまうのを防ぐ
    _waitDragEndAndMoveItem (item, toColumnIndex, toIndex) {
      const timer = setInterval(()=>{
        // DragEnd処理が完了するまで待機
        if (!this.$store.state.draggingItem) {
          clearInterval(timer)
          // アイテムの移動
          this.moveItem(item, toColumnIndex, toIndex)
        }
      },10)
    },
    // 横のカラム幅を計算する
    _calcColumnWidth () {
      let width
      this.$refs.column.some(col => {
        width = col.clientWidth 
                - parseFloat(window.getComputedStyle(col)['padding-left'].replace(/px$/,''))
                - parseFloat(window.getComputedStyle(col)['padding-right'].replace(/px$/,''))
        return true
      })
      this.columnWidth = width
    }
    
  }
}

// アイテムデータの解析等を行うクラス
import ItemBase from '@/scripts/ItemBase.js'
export class Item extends ItemBase {
  constructor (options, item_ins) {
    super(options)
    this.name = 'Column'
    this.itemInstances = item_ins
  }
  // 渡されたHTMLElementが、このコンポーネントで処理可能か判断する 
  matches (element) {
    return DOM.matches(element, `${this.getConfig('tagName')}.${this.getConfig('tagClassName')}`)
  }
  // 渡されたHTMLElementから、コンポーネントで扱えるデータに変換する
  getItem (element) {
    let col_elms = Array.from(element.querySelectorAll(`${this.getConfig('columnTagName')}.${this.getConfig('columnTagClassName')}`))
    col_elms.splice(this.getConfig('maxColumn'))  // 最大を超えるカラムは削除

    // クラス名の抽出(複数の場合は最初の一つだけ)
    let css_class = null
    Array.from(element.classList).some(cls=>{
        if (cls===this.getConfig('tagClassName')) return
        css_class = cls
        return true
    })

    // カラム配下の要素を抽出する
    const columns = []
    col_elms.forEach(elm=>{
      const column = {
        items: [],
      }
      Array.from(elm.childNodes).forEach(child => {
        let item
        for (const name in this.itemInstances) {
          if (name === 'Column') continue
          const ins = this.itemInstances[name]
          if (ins.matches(child)) {
            // 要素を処理可能
            item = ins.getItem(child)
            break
          }
        }
        if (!item &&
          this.getConfig('setAsHtmlIfNotMatched') &&
          (this.getConfig('enabledItemNames') === null ||
          this.getConfig('enabledItemNames').indexOf('Html') !== -1)) {
          // いずれの要素にもマッチしない場合
          // Htmlコンポーネントが有効な場合
          // Htmlのデータとして扱う
          const ins = this.itemInstances['Html']

          item = ins.getEmptyItem()
          const div = document.createElement('div');
          div.appendChild(child)
          item.content = div.innerHTML
        }
        if (item) {
          column.items.push(item)
        }
      })
      columns.push(column)
    })
    // カラム数が最小に満たない場合は空要素で満たす
    if (columns.length < this.getConfig('minColumn')) {
      let diff = this.getConfig('minColumn') - columns.length
      const data = []
      for (let i=0; i<diff; i++) data.push({items: []})
      columns.splice(columns.length, 0, ...data)
    }

    const item = {
      id: Util.generateID(),
      name: this.name,
      className: this.getConfig('allowCssClass') ? css_class : null,
      columns: columns,
    }
    const def = this.getPreset(item)
    if (def) { // 定義セットに一致するものが見つかった
      item.preset = def
    }
    return item
  }

  // HTMLを返す
  getHtml (item, base_ind) {
    super.getHtml(item, base_ind)
    
    const nl = this.getConfig('outputNewLine')
    if (!item.columns || item.columns.length===0) return null

    // クラス名の取得
    let cls_name = ''
    if (this.getConfig('allowCssClass') && item.className) cls_name = ' ' + item.className

    let tag = this._indent(0) + `<${this.getConfig('tagName')} class="${this.getConfig('tagClassName')}${cls_name}">${nl}`
    item.columns.forEach(column=>{
      tag += this._indent(1) + `<${this.getConfig('columnTagName')} class="${this.getConfig('columnTagClassName')}">${nl}`
      column.items.forEach(item=>{
        // 内包するアイテムのHTMLを取得する
        const instance = this.itemInstances[item.name]
        if (typeof instance==='undefined') return
        let _html = instance.getHtml(item, base_ind+2)
        if (_html) {
            tag += `${_html}${nl}`
        }
      })
      tag += this._indent(1) + `</${this.getConfig('columnTagName')}>${nl}`
    })
    tag += this._indent(0) + `</${this.getConfig('tagName')}>`
    return tag
  }
  // アイテムデータを検証し、不正なデータは置き換える
  normalizeItem (item) {
    const enabled_items = this.getConfig('enabledItemNamesInColumn')
    if (!item && typeof item !== 'object') return this.getEmptyItem()
    if (typeof item.id !== 'string') item.id = Util.generateID()
    
    if (item.columns instanceof Array) {
      item.columns.splice(this.getConfig('maxColumn'))
      item.columns.forEach(column => {
        const _col_items = []
        if (column.items instanceof Array) {
          column.items.forEach(d => {
            // サポートされていないアイテムは除外する
            if (enabled_items !== null && 
              enabled_items.indexOf(d.name)===-1) return

            const ins = this.itemInstances[d.name]
            if (ins) {
              ins.normalizeItem(d)
            }
            _col_items.push(d)
          })
        }
        column.items = _col_items
      })
    } else {
      item.columns = []
    }
    if (typeof item.className !== 'string') item.className = null
  }
  // 空のアイテムデータを返す
  getEmptyItem () {
    const item = {
      id: Util.generateID(),
      name: this.name,
      className: null,
      columns: []
    }
    const data = []
    for (let i=0; i<this.getConfig('defaultNumColumn'); i++) data.push({items: []})
    item.columns.splice(0, 0, ...data)
    return item
  }
}
/*
データ構造
item: {
  name: 'Column',
  className: (クラス名),
  columns: [
    {
      items: [
        {name: 'Paragraph' ...}
        {name: 'Heading' ...}
        ...
      ]
    },
    {
      items: [
        ...
      ]
    }
  ]
}

アウトプットされるHTMLの例
<div class="column-wrap">
  <div class="column-item">
    ...任意のアイテム...
  </div>
  <div class="column-item">
    ...任意のアイテム...
  </div>
  <div class="column-item">
    ...任意のアイテム...
  </div>
</div>
*/
</script>

<style lang="scss" scoped>
@import '@/styles/valiables.scss';
@import '@/styles/components.scss';
@import '@/styles/animation.scss';

.BEV-columns {
  position: relative;
  border: $item-border;
  padding: 10px;
  display: grid;
  display: -ms-grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); // styleObjectで設定
  grid-auto-rows: auto;
  grid-gap: 10px;
  width: 100%;
  padding: 10px;
  box-sizing: border-box;
  border-radius: $item-wrap-border-radius;

  .BEV-column {
    position: relative;
    padding: 10px;
    background-color: #fff;
    border: 1px solid lighten(#B3B7BC, 15%);
    border-radius: $item-wrap-border-radius;
    // box-shadow: 0 0 0 1px lighten(#B3B7BC, 15%);

    .BEV-column-number {
      position: absolute;
      top: 0;
      right: 0;
      font-size: .8em;
      line-height: .8em;
      width: .8em;
      height: .8em;
      text-align: center;
      padding: 3px;
      border-bottom-left-radius: 4px;
      background-color: $subttl-scd-bg-color;
      color: #fff;
      z-index: 1;
      user-select: none;
      box-sizing: content-box;
    }

    // アイテムがないときの要素
    .BEV-no-items {
      outline: none;
      background-color: #F4F4F5;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
      position: relative;
      box-sizing: border-box;
      padding: 0;
      margin: 0;
      cursor: pointer;
      min-height: 100px;

      svg {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      }
    }
    .BEV-no-items:hover {
      background-color: darken(#F4F4F5, 1%);
    }
    .BEV-no-items.BEV-waiting-drag {
      background-color: lighten(#E8F1FF, 3%);
    }
    .BEV-no-items.BEV-dragged {
      background-color: #E8F1FF!important;
    }
  }
}

.BEV-hover .BEV-columns {
  border: $item-hover-border;
  color: $item-hover-text-color;
}
.BEV-active .BEV-columns {
  border: $item-active-border;
  color: $item-active-text-color;
}

// スマホレイアウト
.BEV-sp .BEV-columns {
  padding: 6px;

  .BEV-column {
    padding: 6px;
  }
}

.BEV-component-wrap {
  margin: 0px;
  padding: 5px 0;
}

.BEV-separator-wrap {
  height: 1.5em;
}

// アイテムドラッグイメージ用スタイル
.BEV-dragging-column-clone {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  opacity: .7;
  transform: scale(.7);
  pointer-events: none;
  box-sizing: border-box;
  transition: transform .2s, opacity .2s;
  transform-origin: top left;
  z-index: 1000;

  // シャドウイメージでは上下移動ボタンを非表示
  /deep/ .BEV-move-up, 
  /deep/ .BEV-move-down,
  /deep/ .BEV-popup-menu,
  /deep/ .BEV-config {
    display: none!important;
  }
}
</style>