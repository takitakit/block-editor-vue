<script>
import ComponentBase from '@/components/sub/ComponentBase.vue'
import ItemHeader from '@/components/sub/ItemHeader.vue'
import ActionMenu from '@/components/sub/ActionMenu.vue'
import ClassInput from '@/components/sub/ClassInput.vue'
import DOM from '@/scripts/DOM.js'
import Util from '@/scripts/Util.js'

// アイテムメニュー非表示のためのタイマー
let ITEM_MENU_TIMER = null

export default {
  extends: ComponentBase,
  props: ['item', 'parentWidth'],
  data () {
    return {
      popupMenuName: false,         // ポップアップメニュー表示フラグ
      oldItem: null,              // UNDOのための古い値の保持

      // 履歴の対象となるitems以下のキー名
      // 指定されたデータはwatchの監視対象となり
      // 変更時に自動的に履歴に追加される
      historyTargetKeys: [],
      itemMenuTarget: null,       // ポップアップメニュー表示の基準DOM要素
      flgHistory: true,           // 履歴の自動追加処理(triggerChange)の制御フラグ（falseの時は追加しない）
    }
  },
  components: {
    ItemHeader,
    ActionMenu,
    ClassInput,
  },
  computed: {
    // エディター全体がアクティブかどうか
    isActiveEditor () {
      return window.BLOCK_EDITOR_STORE.state.activeEditor === this.$store.state.rootElement;
    },
    // ホバー中かどうか判定
    isHover () {
      if (!this.$store.state.hoverItem) return false
      if (this.$store.state.hoverItem === this.item) return true

      let res = false
      if (this.item.name === 'Column') {
        // 判定の対象Columnの場合 子アイテムも判定を行い、
        // 子アイテムがホバー中であれば、その親要素であるColumnもホバー状態とする
        this.item.columns.some(column => {
          if (column.items.indexOf(this.$store.state.hoverItem) !== -1) {
            // 子アイテムの中にアクティブなアイテムがあった
            res = true
            return true
          }
        })
      }
      return res
    },
    // アクティブかどうか判定
    isActive () {
      if (!this.isActiveEditor || !this.$store.state.activeItem) return false
      if (this.$store.state.activeItem === this.item) return true

      let res = false
      if (this.item.name === 'Column') {
        // 判定の対象Columnの場合 子アイテムも判定を行い、
        // 子アイテムがアクティブであれば、その親要素であるColumnもアクティブとする
        this.item.columns.some(column => {
          if (column.items.indexOf(this.$store.state.activeItem) !== -1) {
            // 子アイテムの中にアクティブなアイテムがあった
            res = true
            return true
          }
        })
      }
      return res
    },
    // 最初のアイテムかどうか
    isFirstItem () {
      return !this.parentItems || this.parentItems.indexOf(this.item) === 0
    },
    // 最後のアイテムかどうか
    isLastItem () {
      return !this.parentItems || this.parentItems.indexOf(this.item) === this.parentItems.length-1
    },
    // 自アイテムが包含される親アイテムのリストを返す
    // item=Columnの場合は、Columnのカラムのアイテムリストを、
    // それ以外はトップレベルの全アイテムリストを返す
    parentItems () {
      if (this.$store.state.items.indexOf(this.item) !== -1) return this.$store.state.items

      let ret_items = null
      this.$store.state.items.some(_item => {
        if (_item.name !== 'Column') return
        _item.columns.some(_column => {
          if (_column.items.indexOf(this.item) !== -1) {
            // Columnの子アイテム内に発見
            ret_items = _column.items
            return true
          }
        })
      })
      return ret_items
    },
    // itemのclassName、type(Heading)などの項目を編集可能かどうか
    isItemAttrEditable () {
      return !this.item.preDefined
    }
  },
  watch: {
    isActive (newVal, oldVal) {
      if (!newVal && oldVal) {
        // アクティブ→アクティブ解除の場合は
        // CSS入力ポップアップを非表示にする
        this.hideClassInput()
        this.onDeactiveItem() // イベントとして呼び出し
      }
    },
    // 最初の要素かどうかのフラグの変更検知
    isFirstItem (newVal) {
      this._readjustActionMenu() // アクションメニューの再調整
    },
    // 最後の要素かどうかのフラグの変更検知
    isLastItem (newVal) {
      this._readjustActionMenu() // アクションメニューの再調整
    },
    parentItems (newVal, oldVal) {
      this._readjustActionMenu() // アクションメニューの再調整
    },
    // クラス名の変更
    'item.className': function () {
      this.triggerChange('className')
    },
  },
  created () {
    // マウス操作の捕捉
    // document.addEventListener('click', this.onDocumentClick);
    // キー入力の捕捉
    document.addEventListener('keydown', this.onDocumentKeyInput);

    if (!this.isItemAttrEditable) {
      this.$delete(this.actions, 'setClassName')
    }
  },
  mounted () {
    // 自要素以下の全ての要素のクリック、フォーカスイベント監視
    // const elms = Array.from(this.$el.querySelectorAll('a, input, textarea, select, button, div, [tabindex]'))
    // for (let elm of elms) {
    //   ['focus', 'click'].forEach(name => {
    //     elm.addEventListener(name, ev => {
    //       // フォーカス or クリックがあたったら、
    //       // 自要素をアクティブにする
    //       ev.stopPropagation()
    //       this.activateItem()
    //     })
    //   })
    // }
    this.oldItem = Util.deepCopy(this.item)

    // item直下のデータ監視設定
    this.historyTargetKeys.forEach(key => {
      this.$watch(`item.${key}`, ()=>{
        this.triggerChange(key) // 変更をトリガー
      }, {deep:true})
    })

    // 設定に応じてアクションメニューの構成を変える
    if (this.actions) {
      if (!this.getConfig('allowCssClass') && this.actions['setClassName']) {
        // CSSクラスの設定が有効でなければメニューから削除
        this.$delete(this.actions, 'setClassName')
      }
    }
    this._readjustActionMenu() // アクションメニューの再調整
  },
  beforeDestroy () {
    // document.removeEventListener('click', this.onDocumentClick);
    document.removeEventListener('keydown', this.onDocumentKeyInput);
  },
  methods: {
    // 変更をトリガー
    triggerChange (key) {
      // console.log('flgHistory', this.flgHistory, this.item.name, key)
      if (!this.flgHistory) return false  // 制御フラグがOFFの場合は履歴を追加しない
      this.addHistory({
        type: 'change',
        target: this.item,
        key: key,
        data: this.oldItem[key]
      })
      // 古い値をコピー(UNDO/REDOの変更の際も実行される)
      this.oldItem = Util.deepCopy(this.item)
    },

    // アクティブ状態にする
    activateItem () {
      // エディタ全体をアクティブにする
      window.BLOCK_EDITOR_STORE.commit('activeEditor', this.$store.state.rootElement)

      // 自分をアクティブにする
      if (this.item.name !== 'Column') {
        // アクティブにしようとしているアイテムがColumnの場合は例外
        // Columnの場合は、それ自身がアクティブにはならず、
        // 子アイテムのみがアクティブになる
        this.$store.commit('activeItem', this.item)
      }
    },
    // ドキュメント全体のクリック捕捉
    // (アクティブ状態の制御のため)
    onDocumentClick (ev) {
      // ev.stopPropagation();
      // if (!this.$el.contains(ev.target) && this.isActive) {
      //   // 自要素外のマウスダウンで、現在アクティブの場合は
      //   // アクティブ解除
      //   this.$store.commit('activeItem', null);
      // }
    },
    onDocumentKeyInput (ev) {
      if (!this.isActive) return false;
      this.onKeyInput(ev);
    },

    // アイテムの上移動
    moveupItem () {
      this.$emit('item-action', 'moveup')
    },
    // アイテムの下移動
    movedownItem () {
      this.$emit('item-action', 'movedown')
    },

    // 共通メニューアクションの受信
    doItemCommonAction (action) {
      if (['replicate', 'delete', 'moveup', 'movedown'].indexOf(action) !== -1) {
        // 共通アクションの場合、親コンポーネントにemitする
        // その他のアクションは自コンポーネント内で処理する想定
        this.$emit('item-action', action)
      }

      if (action === 'setClassName') {
        // 入力メニューを表示する
        this.showClassInput()
      }

      // メニューを隠す
      this.hideItemMenu()
      // 自アイテムにフォーカスが移ったとしてアクティブにする
      this.activateItem()
    },

    // アイテムメニュー表示
    showItemMenu (ev) {
      this.itemMenuTarget = ev.target  // メニュー表示の基準となるボタンを記録しておく

      // メニューボタンの位置を計算し、ポップアップメニューを表示する
      this.popupMenuName = 'item_menu'

      if (!this.isTouchDevice) {
        // タッチデバイスではないPCなどのみ
        // メニュー位置の調整

        this.$nextTick(()=>{
          this.arrangePopup(this.$refs.actionMenu.$el, this.itemMenuTarget, {x:0, y:5})
        })
      }
    },
    // アイテムメニューを時間差で非表示にする
    // cancel: 非表示のタイマーをキャンセルする（表示を継続する）
    _hideItemMenuDelay (cancel) {
      //   console.log(ITEM_MENU_TIMER, cancel)
      if (ITEM_MENU_TIMER) {
        clearTimeout(ITEM_MENU_TIMER)
        ITEM_MENU_TIMER = null
      }
      if (!cancel) {
        ITEM_MENU_TIMER = setTimeout(()=>{
          this.hideItemMenu()
          ITEM_MENU_TIMER = null
        },100)
      }
    },

    // アイテムメニュー非表示
    hideItemMenu () {
      // ポップアップメニューの非表示
      if (this.popupMenuName === 'item_menu') {
        this.popupMenuName = false
      }
    },

    // CSS入力エリア表示
    showClassInput (ev) {
      if (ev) {
        this.itemMenuTarget = ev.target
      }

      // メニューボタンの位置を計算し、ポップアップメニューを表示する
      this.popupMenuName = 'class'

      if (!this.isTouchDevice) {
        // タッチデバイスではないPCなどのみ
        // メニュー位置の調整
        this.$nextTick(()=>{
          this.arrangePopup(this.$refs.classInput.$el, this.itemMenuTarget, {x:0, y:5})
          this.$refs.classInput.focus()   // フォーカスを当てる
          // メニューの外をクリックされたときの検知用イベント
          document.addEventListener('click', this.hideClassInput)
        })
      }
    },
    // アイテムメニュー非表示
    hideClassInput () {
      // ポップアップメニューの非表示
      if (this.popupMenuName === 'class') {
        this.popupMenuName = false
      }
      // イベントの後片付け
      document.removeEventListener('click', this.hideClassInput)
    },

    // フォーカスを当てる
    focus () {},

    // エディタのリサイズ時イベント
    onResize (width) {
      // タッチデバイスでなければ、
      // ポップアップ系のメニューを非表示にする
      if (!this.isTouchDevice) {
        this.hideItemMenu()
        this.hideClassInput()
      }
    },
    onKeyInput (ev) {}, 
    // エディタのフォーカス解除
    onDeactiveItem () {},

    // アイテムメニューのトランジション時（表示OFF)
    _itemMenuTransitionLeave (el) {
      // 続けてCSS Classを入力する場合は、
      // 左に流れるアニメーションをつける
      if (this.popupMenuName!==false && this.popupMenuName!=='item_menu') {
        el.classList.add('popup-leave-move')
      }
    },
    // アイテムメニューのトランジション完了時
    _itemMenuTransitionAfterLeave (el) {
      // アニメーションクラスの後片付け
      el.classList.remove('popup-leave-move')
    },

    // アクションメニューの再調整
    _readjustActionMenu () {
      if (typeof this.actions.moveup !== 'undefined') {
        // 上に移動のメニューの状態制御
        if (this.isFirstItem) this.$set(this.actions.moveup, 'disabled', true)
        else this.$set(this.actions.moveup, 'disabled', false)
      }
      if (typeof this.actions.movedown !== 'undefined') {
        // 上に移動のメニューの状態制御
        if (this.isLastItem) this.$set(this.actions.movedown, 'disabled', true)
        else this.$set(this.actions.movedown, 'disabled', false)
      }
    }
  },
}
</script>

<style lang="scss" scoped>
@import '@/styles/valiables.scss';
@import '@/styles/components.scss';

</style>