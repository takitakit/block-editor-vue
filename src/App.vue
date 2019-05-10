<template>
  <div 
    :style="{fontSize: getConfig('baseFontSize')+'px'}"
    :class="{'BEV-sp': layoutMode==='sp'}"
    class="BEV-block-editor">

    <div class="BEV-root-buttons">
      <button v-if="getConfig('allowHistories')" @click="undo()" :disabled="!canUndo" type="button">
        <IconBase width="16" height="16"><IconUndo :disabled="!canUndo" /></IconBase>
        {{$t('common.undo')}}
      </button>
      <button v-if="getConfig('allowHistories')" @click="redo()" :disabled="!canRedo" type="button">
        <IconBase width="16" height="16"><IconRedo :disabled="!canRedo" /></IconBase>
        {{$t('common.redo')}}
      </button>
      <button @click="copyHtml()" :disabled="items.length===0" type="button">
        <IconBase width="16" height="16"><IconClipboard :disabled="items.length===0" /></IconBase>
        {{$t('common.copyHtml')}}
      </button>
    </div>

    <transition name="fade" mode="out-in">
    <!-- アイテムが1件以上ある場合 -->
    <div v-if="items.length" key="some_items">
      <Separator 
        @background-click="showAddMenu($event.target, 0, {x: $event.offsetX, y:5})"
        @mouseleave.native="hideAddMenuDelay()"
        @button-mouseenter="showAddMenu($event.target, 0)"
        @button-mouseleave="hideAddMenuDelay()"
        @item-drop="_waitDragEndAndMoveItem($store.state.draggingItem, 0)" />
      <transition-group name="BEV-item" tag="div" style="position:relative"> 
        <div 
          v-for="(item, index) in items"
          class="BEV-item-anim"
          :key="'trans-'+item.id">
          <div class="BEV-component-wrap">
            <component 
              @item-action="doAction($event, item)"
              @item-dragstart="$store.commit('draggingItem',item); _itemDragstart(item, $event)"
              @item-drop="moveItemToColumn"
              @item-dragend="_itemDragend($event); $store.commit('draggingItem',null);"
              @mouseenter.native="$store.commit('hoverItem', item)"
              @mouseleave.native="$store.commit('hoverItem', null)"
              ref="items"
              :key="item.id"
              :item="item"
              :is="item.name" />
          </div>
          <Separator 
            @background-click="showAddMenu($event.target, index+1, {x: $event.offsetX, y:5})"
            @mouseleave.native="hideAddMenuDelay()"
            @button-mouseenter="showAddMenu($event.target, index+1)"
            @button-mouseleave="hideAddMenuDelay()"
            @item-drop="_waitDragEndAndMoveItem($store.state.draggingItem, index+1)" />
        </div>
      </transition-group>
    </div>
    <!-- アイテムが1件もないとき -->
    <div v-else key="no-items">
      <div
        @click.stop="showAddMenu({x: $event.pageX, y: $event.pageY}, 0)"
        class="BEV-no-items"
      >
        <div class="BEV-no-items-msg">{{$t('common.clickToAddItem')}}</div>
      </div>
    </div>
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

    <transition name="fade">
      <div 
        v-if="getConfig('allowFileBrowser')"
        v-show="$store.state.flgFileBrowser"
        ref="fileBrowser"
        class="BEV-file-browser">
        <iframe 
          :style="fileBrowserStyle"
          :src="getConfig('FileBrowser.url')"></iframe>
      </div>
    </transition>
    <slot name="sendData"></slot>
  </div>
</template>

<script>
import ComponentBase from '@/components/sub/ComponentBase.vue'
import Separator from '@/components/sub/Separator.vue'
import AddMenu from '@/components/sub/AddMenu.vue'

import Util, {Rect} from '@/scripts/Util.js'
import DragItemUtil from '@/scripts/DragItemUtil.js'
import Checkbox from '@/components/sub/Checkbox.vue'
import RangeInput from '@/components/sub/RangeInput.vue'
import SwitchInput from '@/components/sub/SwitchInput.vue'

import IconBase from '@/components/sub/IconBase.vue'
import IconUndo from '@/components/icons/IconUndo.vue'
import IconRedo from '@/components/icons/IconRedo.vue'
import IconClipboard from '@/components/icons/IconClipboard.vue'

// PCレイアウトの最小幅
const PC_MIN_WIDTH = 465

let ADD_MENU_TIMER        // 追加メニュー表示制御用タイマー

let ADD_SEP_INDEX         // アイテム追加時の挿入位置番号(0-)

export default {
  name: 'block-editor-vue',
  extends: ComponentBase,
  props: ['html', 'items'],
  data () {
    return {
      test: true,
      numbers: [1,2,3,4,5,6],
      nextNum: 10,

      flgAddMenu: false,            // アイテム追加メニュー表示フラグ 
      addNames: [],
      rangeTest: 0,
      switchValue: true,

      dragItemUtil: null,           // ドラッグ処理のためのユーティリティクラスのインスタンス
    }
  },
  components: {
    AddMenu, Separator, IconBase, IconUndo, IconRedo, IconClipboard, Checkbox, RangeInput, SwitchInput
  },
  created () {
    // IDがセットされていないデータを検証
    if (this.items && this.items.length) {
      this.items.map(item => item.id=Util.generateID())
    }

    // HTMLデータを内部データに変換する
    let dom = document.createElement('div')
    dom.innerHTML = this.html
    dom = dom.querySelector(`.${this.getConfig('rootClass')}`)

    const elms = dom && dom.children.length ? dom.children : []
    const item_ins = this.$store.state.itemInstances
    for (const element of Array.from(elms)) {
      // 直下の全要素について、解析を行う
      let item
      for (const k in item_ins) {
        const ins = item_ins[k]
        if (ins.matches(element)) {
          // 要素を処理可能
          item = ins.getItem(element)
          break
        }
      }
      // いずれの種類にもマッチしない場合
      if (!item &&
        this.getConfig('setAsHtmlIfNotMatched') &&
        (this.getConfig('enabledItemNames') === null ||
        this.getConfig('enabledItemNames').indexOf('Html') !== -1)) {
        // Htmlコンポーネントが有効な場合
        // Htmlのデータとして扱う
        const ins = item_ins['Html']

        item = ins.getEmptyItem()
        const div = document.createElement('div');
        div.appendChild(element)
        item.content = div.innerHTML
      }
      if (item) {
        this.items.push(item)
      }
    }

    // アイテム追加メニューの構築
    const add_menu_items = []
    this.getConfig('itemOrder').forEach(key => {
      let _item = {}
      if (this.getConfig('enabledItemNames') === null ||
          this.getConfig('enabledItemNames').indexOf(key) !== -1) {
        // サポートされているアイテム

        // 定義されている表示名を取得
        const conf = this.getConfig(key)
        if (conf.presets && conf.presets.length) {
          // 定義済み項目の定義
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
        } else {
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
    })
    this.addNames = add_menu_items
  },
  mounted () {
    // リサイズイベント捕捉
    window.addEventListener('resize', this._onResize)
    this._onResize()

    const html = this.getHtml()
    if (this.$root.$refs.sendData) {
      // データ送信用のinputが設置されている
      // 初期HTMLをvalueに反映
      this.$root.$refs.sendData.value = html
    }
    const on_load = this.getConfig('onLoad')
    if (on_load) {
      on_load.call(
        this, html
      );
    }

    // ファイルブラウザのDOMを取得
    this.$store.commit('fileBrowserRef', this.$refs.fileBrowser)
  },
  computed: {
    // undo可能かどうか
    canUndo () {
      return this.$store.state.histories.length && this.$store.state.historyIndex >= 0
    },
    // redo可能かどうか
    canRedo () {
      return this.$store.state.histories.length && this.$store.state.historyIndex < this.$store.state.histories.length-1
    },
    // ファイルブラウザのスタイル
    fileBrowserStyle () {
      return {
        width: typeof this.getConfig('FileBrowser.width') === 'number' 
                  ? this.getConfig('FileBrowser.width')+'px'
                  : this.getConfig('FileBrowser.width'),
        height: typeof this.getConfig('FileBrowser.height') === 'number' 
                  ? this.getConfig('FileBrowser.height')+'px'
                  : this.getConfig('FileBrowser.height'),
      }
    }
  },
  methods: {
    randomIndex: function () {
      return Math.floor(Math.random() * this.numbers.length)
    },
    add: function () {
      this.numbers.splice(this.randomIndex(), 0, this.nextNum++)
    },
    remove: function () {
      this.numbers.splice(this.randomIndex(), 1)
    },

    // アクションの実行 
    doAction (action, item) {
      if (action === 'moveup') { this.moveupItem(item) }
      else if (action === 'movedown') { this.movedownItem(item) }
      else if (action === 'replicate') { this.replicateItem(item) }
      else if (action === 'delete') { this.deleteItem(item) }
    },

    // アイテムの上移動
    moveupItem (item) {
      // console.log('moveup item:', item)
      const index = this.items.indexOf(item)
      if (index === -1 || index === 0) return false

      const undo_delta = this.applyDelta({
        type: 'move',
        target: this.items,
        fromIndex: index,
        toIndex: index-1
      })

      // 履歴に追加
      this.addHistory(undo_delta)
    },
    // アイテムの下移動
    movedownItem (item) {
      // console.log('movedown item:', item)
      const index = this.items.indexOf(item)
      if (index === -1 || index === this.items.length-1) return false

      const undo_delta = this.applyDelta({
        type: 'move',
        target: this.items,
        fromIndex: index,
        toIndex: index+1
      })

      // 履歴に追加
      this.addHistory(undo_delta)
    },
    // アイテムの移動
    // toIndex: セパレータのindex番号
    moveItem (item, toIndex) {
      let index = this.items.indexOf(item)
      let undo_delta
      if (index !== -1) {
        // ルート直下（1階層目）のアイテムの移動    
        if (index < toIndex) {
          toIndex--
        }
        if (index === toIndex) {
          return
        }
        // console.log('move item('+index+'):', item, 'to:', toIndex)

        undo_delta = this.applyDelta({
          type: 'move',
          target: this.items,
          fromIndex: index,
          toIndex: toIndex,
        })

      } else {
        // カラムのアイテムを調べる
        // カラム内からルート直下への移動のケース
        const delta = []
        
        this.items.some((_item, item_index) => {
          if (_item.name !== 'Column') return

          _item.columns.some((col,col_index) => {
            const index = col.items.indexOf(item)
            if (index !== -1) {
              // カラム内にアイテムを検出
              // console.log('move item:', item, 'column:', col, 'to:', toIndex)

              delta.push({
                type: 'delete',
                target: col.items,
                key: index
              })
              return true
            }
          })
        })

        delta.push({
          type: 'insert',
          target: this.items,
          key: toIndex,
          data: item
        })
        
        undo_delta = this.applyDelta(delta)
      }

      // 履歴に追加
      this.addHistory(undo_delta)

      // アイテムをアクティブにする
      this.activateItem(item)
    },
    // コラム要素内への移動
    // パターン1: ルート直下のアイテムをカラム内に移動
    // パターン2: カラム内のアイテムを他カラム内に移動
    // item: 移動対象のアイテム
    // toColumnItem: 移動先のコラムアイテム
    // toColumnIndex: 移動先のコラム位置(0-)
    // toIndex: 移動先のコラム内の挿入位置(0-)
    moveItemToColumn (item, toColumnItem, toColumnIndex, toIndex) {
      // console.log('move item to column @App:', item, toColumnIndex, toIndex)

      if (item.name === 'Column') {
        // カラムの入れ子は不可
        alert(this.$t('common.columnNestAlert'))
        return false
      } else if (this.getConfig('enabledItemNamesInColumn') !== null && 
                this.getConfig('enabledItemNamesInColumn').indexOf(item.name) === -1) {
        // カラム内で許可されていないアイテム
        alert (this.$t('common.notAllowedItemInColumn'))
        return false
      }

      // 移動元のアイテムを探す
      // まずはルート直下から
      const delta = []
      let index = this.items.indexOf(item)
      if (index !== -1) {
        // ルート直下のアイテム内に発見
        
        // 履歴に追加
        delta.push({
          type: 'delete',
          target: this.items,
          key: index
        })
      
      } else {
        // 他カラムの中から探す
        this.items.some((_item, index) => {
          if (item === _item || _item.name!=='Column') return // カラムでない場合、移動元=移動先の場合は無視
          _item.columns.some((column, col_index) => {
            const idx_at_col = column.items.indexOf(item)
            if (idx_at_col !== -1) {
              // 他カラムアイテム内に発見

              delta.push({
                type: 'delete',
                target: column.items,
                key: idx_at_col
              })
              return true
            }
          })
        })
      }

      // 移動先のカラム内に追加
      delta.push({
        type: 'insert',
        target: toColumnItem.columns[toColumnIndex].items,
        key: toIndex,
        data: item
      })
      
      const undo_delta = this.applyDelta(delta)

      // 履歴に追加
      this.addHistory(undo_delta)
    },
    // アイテムの複製
    replicateItem (item) {
      // console.log('replicate item:', item)
      const index = this.items.indexOf(item)
      if (index === -1) return false

      const clone = Util.deepCopy(item)
      // console.log(item, clone, item.columns[0].items[0]===clone.columns[0].items[0])
      clone.id = Util.generateID()
      if (clone.name === 'Column') {
        // カラムの場合は
        // 再帰的に全てのアイテムについて
        // IDを振り直す
        clone.columns.forEach(col => {
          col.items.forEach(_item => {
            _item.id = Util.generateID()
          })
        })
      }

      const undo_delta = this.applyDelta({
        type: 'insert',
        target: this.items,
        key: index+1,
        data: clone
      })

      // 履歴に追加
      this.addHistory(undo_delta)
    },
    // アイテムの削除
    deleteItem (item) {
      // console.log('delete item:', item)
      const index = this.items.indexOf(item)
      if (index === -1) return false
      
      const undo_delta = this.applyDelta({
        type: 'delete',
        target: this.items,
        key: index
      })

      // 履歴に追加
      this.addHistory(undo_delta)
    },
    // アイテムの追加
    addItem(item_def) {
      const name = item_def.key
      const toIndex = ADD_SEP_INDEX

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
        target: this.items,
        key: toIndex,
        data: item
      })
      // 履歴に追加
      this.addHistory(undo_delta)

      // 追加したアイテムをアクティブにする
      this.activateItem(item)

      // コンポーネントの作成を待って、フォーカスする
      this.$nextTick(()=>{
        const active_component = this.getActiveComponent()
        if (active_component) active_component.focus()
      })
    },
    // HTMLのコピー
    copyHtml () {
      const html = this.getHtml()
      if (Util.copyToClipboard(html)) {
          alert(this.$t('common.copyHtmlAlert.success'))
      } else {
          alert(this.$t('common.copyHtmlAlert.fail'))
      }
    },

    // ブロック追加メニューの表示
    // index: 追加する場所
    // bg_click: セパレータの背景がクリックされたかどうか
    showAddMenu (target, index, offset) {
      this.flgAddMenu = true
      ADD_SEP_INDEX = index

      if (!this.isTouchDevice) {
        // タッチデバイスではないPCなどのみ
        // メニュー位置の調整

        if (typeof offset === 'undefined') {
          offset = {
            x: 0,
            y: 5,
          }
        }
        if (typeof target.x !== 'undefined') { // 座標による指定
          target = new Rect(target.x, target.y, 1, 1)
        }

        this.$nextTick(()=>{
          this.arrangePopup(this.$refs.addMenu.$el, target, offset, true)
        })
        document.addEventListener('click', this.hideAddMenu)
      }
    },
    // ブロック追加メニューの非表示(即時)
    hideAddMenu () {
      this.flgAddMenu = false
      document.removeEventListener('click', this.hideAddMenu)
    },
    // ブロック追加メニューの非表示(遅延)
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
    // アンドゥ
    undo () {
      if (!this.canUndo) return false
      
      const history = this.$store.state.histories[this.$store.state.historyIndex] // 履歴から情報を取り出し
      // アンドゥ時のアイテム変更イベントをスキップするためのフラグをON
      this.$store.commit('flgHistory', true)

      // 差分を適用してUNDOを実行
      const redo_delta = this.applyDelta(history.delta)
      history.delta = redo_delta

      // 履歴の位置をひとつ戻す
      this.$store.commit('decrementHistoryIndex')

      // 更新コールバック呼び出し
      this.onUpdate()

      this.$nextTick(()=>{
        this.$store.commit('flgHistory', false)
      })
    },
    // リドゥ
    redo () {
      if (!this.canRedo) return false

      const history = this.$store.state.histories[this.$store.state.historyIndex+1] // 履歴から情報を取り出し
      // リドゥ時のアイテム変更イベントをスキップするためのフラグをON
      this.$store.commit('flgHistory', true)

      // 差分を適用してREDOを実行
      const undo_delta = this.applyDelta(history.delta)
      history.delta = undo_delta

      // 履歴の位置をひとつ進める
      this.$store.commit('incrementHistoryIndex')

      // 更新コールバック呼び出し
      this.onUpdate()

      this.$nextTick(()=>{
        this.$store.commit('flgHistory', false)
      })
    },

    // ウィンドウリサイズ時イベント
    _onResize (ev) {
      // エディタの幅により、レイアウトモードを変更する
      if (this.$el.offsetWidth < PC_MIN_WIDTH) {
        this.$store.commit('layoutMode', 'sp')
      } else {
        this.$store.commit('layoutMode', 'pc')
      }

      // エディタの幅（ボーダー、パディングを除く）を計算する
      const editor_w = this.$el.clientWidth 
                  - parseFloat(window.getComputedStyle(this.$el)['padding-left'].replace(/px$/,''))
                  - parseFloat(window.getComputedStyle(this.$el)['padding-right'].replace(/px$/,''))
      this.$store.commit('editorWidth', editor_w)

      // 追加メニューを表示している場合はいったん非表示に
      this.hideAddMenu()
    },

    // アイテムのドラッグ開始検知
    _itemDragstart (item, ev) {
      const index = this.items.indexOf(item)
      if (index === -1) return

      ev.dataTransfer.setData('text/plain', '');

      // refsのコンポーネントの配列から対応するDOM要素を選択する
      let src_elm
      this.$refs.items.some(ref => {
        if (ref.item === item) {
          src_elm = ref.$el
          return true
        }
      })

      // ドラッグ&ドロップユーティリティ
      this.dragItemUtil = new DragItemUtil({
        targetElement: src_elm,
        parentElement: this.$el,
        draggingClass: 'BEV-dragging-item-clone',
        dragStartEvent: ev
      })
    },
    // アイテムのドラッグ終了検知
    _itemDragend (ev) {
      // console.log('drag end @App')
      this.dragItemUtil.destroy()
      this.dragItemUtil = null
    },
    // ドラッグエンド処理が終了するのを待つ
    // ※イベントはdrop -> dragend の順序で発生するため
    // カラム内部、外部からそれぞれ、外部、内部への移動処理を行うと
    // dragend処理が発生しなくなってしまうのを防ぐ
    _waitDragEndAndMoveItem (item, toIndex) {
      const timer = setInterval(()=>{
        // DragEnd処理が完了するまで待機
        if (!this.$store.state.draggingItem) {
          clearInterval(timer)
          this.moveItem(item, toIndex)
        }
      },10)
    },
    // コラムアイテムを取得する
    // indexes: コラム位置を表すインデックス番号の配列
    // [ルート要素上でのindex, コラム内でのindex, コラム内要素上でのindex]
    // 戻り値：[ルート直下の該当アイテム, カラムアイテム内の子アイテムリスト, 該当アイテム]
    _getColumnItem (indexes) {
      if (!indexes) return null

      const ret = 
        typeof this.items[indexes.rootItemIndex] !== 'undefined'
          ? typeof this.items[indexes.rootItemIndex].columns[indexes.columnIndex] !== 'undefined'
            ? typeof this.items[indexes.rootItemIndex].columns[indexes.columnIndex].items[indexes.columnItemIndex] !== 'undefined'
              ? {
                  rootItem: this.items[indexes.rootItemIndex], 
                  column: this.items[indexes.rootItemIndex].columns[indexes.columnIndex], 
                  item: this.items[indexes.rootItemIndex].columns[indexes.columnIndex].items[indexes.columnItemIndex]
                }
              : null
            : null
          : null
      return ret
    },
    // 現在アクティブなコンポーネントを取得する
    getActiveComponent () {
      let active_component = null
      if (this.$refs.items) {
        this.$refs.items.some(component => {
          if (component.item === this.$store.state.activeItem) {
            active_component = component
            return true
          }
        })
      }
      return active_component
    }
  },
}
</script>

<style lang="scss" scoped>
@import '@/styles/valiables.scss';
@import '@/styles/reset.scss';
@import '@/styles/animation.scss';

// ブロックエディタ本体
.BEV-block-editor {
  position: relative;
  width: 100%;
  min-width: 320px;
  box-sizing: border-box;
  padding: 10px;
  background-color: #fff;
  font-family: 游ゴシック体, 'Yu Gothic', YuGothic, 'ヒラギノ角ゴシック Pro', 'Hiragino Kaku Gothic Pro', メイリオ, Meiryo, Osaka, 'ＭＳ Ｐゴシック', 'MS PGothic', sans-serif;
}

// スマホレイアウト
.BEV-sp.BEV-block-editor {
  padding: 7px;
}

// 各コンポーネントのラッパー要素
.BEV-component-wrap {
  width: 100%;
  box-sizing: border-box;
  background-color: #fff;
  padding: 5px 0;
  margin: 0;
}

// ブロックエディタ本体
.BEV-block-editor.sp {
  padding: 7px;
}
</style>

<style lang="scss">
@import '@/styles/valiables.scss';
@import '@/styles/v-tooltip.scss';

// アイテムドラッグイメージ用スタイル
.BEV-dragging-item-clone {
  transform-origin: top left;
  transition: transform .2s;
  transform: scale(.7);
  opacity: .7!important;

  // シャドウイメージでは上下移動ボタンを非表示
  .BEV-move-up, 
  .BEV-move-down,
  .BEV-popup-menu,
  .BEV-config {
    display: none!important;
  }
}

// ドラッグ中のスタイル
.BEV-dragging {
  opacity: 0.1;
  .item-header {
    // ドラッグ中はアイテムヘッダ要素を非表示
    opacity: 0;
  }

  &::after {
    content: ' ';
    position: absolute;
    background-color: #E6E8E9;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    border-radius: 0;
    z-index: 999;
  }
}

// undo等のボタンbotan
.BEV-root-buttons {
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;

  button {
    @extend %primary-label-button;
    margin: 0 8px 5px 0; 
    display: flex;
    align-items: center;
    font-size: .8em;
   
    svg {
      margin: 0 3px 0 0;
    }
  }
}

.BEV-file-browser {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0,0,0,.5);
  z-index: 1000;

  iframe {
    position: relative;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    margin: 0;
    padding: 0;
    border: 0;
  }
}

.BEV-no-items {
  background-color: #F4F4F5;
  position: relative;
  min-height: 100px;
  border-radius: 3px;
  overflow: hidden;
  cursor: pointer;
  transition: background-color .2s;

  &:hover {
    background-color: lighten(#F4F4F5, 2%);
  }

  .BEV-no-items-msg {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: $txtbtn-text-color;
    pointer-events: none;
  }
  
}
</style>