<template>
  <div 
    :class="{'BEV-hover': isHover, 'BEV-active': isActive, 'BEV-dragging': $store.state.draggingItem===item}"
    class="BEV-item BEV-heading">
    <div :class="'BEV-heading-'+item.level">
    <!-- アイテムヘッダ -->
    <ItemHeader 
      @menu-mouseenter="popupMenuName===false ? showItemMenu($event) : false"
      @menu-mouseleave="_hideItemMenuDelay()"
      @label-click="activateItem(); isItemAttrEditable ? showLevelEdit($event) : false;"
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
    <component
      @focus="activateItem()"
      :is="getConfig('allowStyledText') ? 'VisualText': 'PlainText'" 
      :cssClasses="getConfig('styledTextClasses')"
      v-model="item.content"
      ref="editor"
      class="BEV-editor"
    />
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
      <HeadingLevelEdit 
        @cancel="hideLevelEdit()"
        @input="hideLevelEdit()"
        v-show="popupMenuName==='level'"
        :levels="headingLevelOptions"
        ref="levelEdit"
        v-model="item.level"
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
  </div>
</template>

<script>
import ItemMixin from '@/components/sub/ItemMixin.vue'
import Util from '@/scripts/Util.js'
import DOM from '@/scripts/DOM.js'
import VisualText from '@/components/sub/VisualText.vue'
import PlainText from '@/components/sub/PlainText.vue'
import HeadingLevelEdit from '@/components/sub/HeadingLevelEdit.vue'

export default {
  mixins: [ItemMixin],
  components: {
    HeadingLevelEdit, VisualText, PlainText,
  },
  data () {
    return {
      // ポップアップメニューの項目定義
      actions: {
        changeHeaderLevel: {text: this.$t('Heading.changeLevel')},
        setClassName: {text: this.$t('common.setCssClass'), icon: 'IconCssClass'},
        moveup: {text: this.$t('common.moveUpItem'), icon: 'IconMoveup'},
        movedown: {text: this.$t('common.moveDownItem'), icon: 'IconMovedown'},
        replicate: {text: this.$t('common.replicateItem'), icon: 'IconReplicate'},
        delete: {text: this.$t('common.deleteItem'), type: 'danger', icon: 'IconDelete'},
      },
      historyTargetKeys: ['content', 'level']
    }
  },
  computed: {
    // アイテムヘッダに表示する名前
    itemHeaderLabel () {
      if (this.item.preset && this.item.preset.dispName) return this.item.preset.dispName

      const names = this.getConfig('levelNames')
      if (!names || typeof names[this.item.level] === 'undefined') {
        // 名前の定義なし
        // レベルをそのまま表示に使用
        return this.$t(`common.${this.item.name}`) + ' ['+this.item.level.toUpperCase()+']'
      } else {
        return names[this.item.level]
      }
    },
     // 見出しレベルのリスト（ポップアップメニュー用）
    headingLevelOptions () {
      const options = {}
      const names = this.getConfig('levelNames')
      this.getConfig('levels').forEach(level=>{
        if (names && typeof names[level] !== 'undefined') {
          options[level] = names[level]
        } else {
          options[level] = level.toUpperCase()
        }
      })
      return options
    },
  },
  created () {
    if (this.getConfig('levels').length===1 || !this.isItemAttrEditable) {
      // レベルが一つしか定義されていない場合
      // アイテムの属性変更が許可されていない場合
      // 操作メニューからは削除
      this.$delete(this.actions, 'changeHeaderLevel')
    }
  },
  methods: {
    doItemAction (action) {
      if (action === 'changeHeaderLevel') {
        // 見出しレベルの変更
        this.showLevelEdit()
      }
    },
    // レベル編集メニュー表示
    showLevelEdit (ev) {
      if (this.getConfig('levels').length<=1) return false // レベル定義が一つ以下の場合はメニューを表示しない

      if (ev) {
        this.itemMenuTarget = ev.target
      }

      // メニューボタンの位置を計算し、ポップアップメニューを表示する
      this.popupMenuName = 'level'

      if (!this.isTouchDevice) {
        // タッチデバイスではないPCなどのみ
        // メニュー位置の調整
       
        this.$nextTick(()=>{
          this.arrangePopup(this.$refs.levelEdit.$el, this.itemMenuTarget, {x:0, y:5})
          // メニューの外をクリックされたときの検知用イベント
          document.addEventListener('click', this.hideLevelEdit)
        })
      }
    },
    // レベル編集メニュー非表示
    hideLevelEdit () {
      // ポップアップメニューの非表示
      if (this.popupMenuName === 'level') {
        this.popupMenuName = false
      }
      // イベントの後片付け
      document.removeEventListener('click', this.hideLevelEdit)
    },
    // フォーカスを当てる
    focus () {
      this.$refs.editor.focus()
    }
  }
}

// アイテムデータの解析等を行うクラス
import ItemBase from '@/scripts/ItemBase.js'
export class Item extends ItemBase {
  constructor (options) {
    super(options)
    this.name = 'Heading'
  }
  // 渡されたHTMLElementが、このコンポーネントで処理可能か判断する 
  matches (element) {
    const levels = this.getConfig('levels')
    let matches = false
    levels.some(level => {
      if (DOM.matches(element, level)) {
        matches = true
        return true
      }
    })
    return matches
  }
   // 渡されたHTMLElementから、コンポーネントで扱えるデータに変換する
  getItem (element) {
    // クラス名の抽出(複数の場合は最初の一つだけ)
    let css_class = null;
    Array.from(element.classList).some(cls=>{
        css_class = cls
        return true
    })
    const item = {
      id: Util.generateID(),
      level: element.tagName.toLowerCase(),
      name: this.name,
      className: this.getConfig('allowCssClass') ? css_class : null,
      content: element.innerHTML,
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

    const content = Util.arrangeEditableHtml(item.content)
    if (!content) return null

    const nl = this.getConfig('outputNewLine')
    // クラス名の取得
    let cls_name = ''
    if (this.getConfig('allowCssClass') && item.className) cls_name = ` class="${item.className}"`

    let tag = this._indent(0) + `<${item.level}${cls_name}>${nl}`
    tag += this._indent(1) + `${content}${nl}`
    tag += this._indent(0) + `</${item.level}>`
    return tag
  }
  // アイテムデータを検証し、不正なデータは置き換える
  normalizeItem (item) {
    if (!item && typeof item !== 'object') return this.getEmptyItem()
    if (typeof item.id !== 'string') item.id = Util.generateID()
    if (this.getConfig('levels').indexOf(item.level)===-1) item.level = this.getConfig('defaultLevel')
    if (typeof item.className !== 'string') item.className = null
    if (typeof item.content !== 'string') item.content = ''
  }
  // 空のアイテムデータを返す
  getEmptyItem () {
    return {
      id: Util.generateID(),
      name: this.name,
      level: this.getConfig('defaultLevel'),
      className: null,
      content: '',
    }
  }
}
/*
データ構造
item: {
  className: (クラス名),
  name: 'Heading',
  level: 'h2',
  content: (HTML)
}

アウトプットされるHTMLの例
<h2>
 任意のHTML
</h2>
*/
</script>

<style lang="scss" scoped>
@import '@/styles/valiables.scss';
@import '@/styles/components.scss';
@import '@/styles/animation.scss';

.BEV-heading {
  background-color: #FFFFFF;
  border: $item-border;
  padding: 10px;
  border-radius: $item-wrap-border-radius;
}

// ホバー時
.BEV-heading.BEV-hover {
  border: $item-hover-border;
  color: $item-hover-text-color;
}
// アクティブ時
.BEV-heading.BEV-active {
  border: $item-active-border;
  color: $item-active-text-color;
}
.BEV-heading.BEV-dragging {
  border: 0;
}

// エディタ
.BEV-editor {
  color: $item-text-color;
  border: 0;
  outline: none;
  transition: border .2s, color .2s;
}
.BEV-heading-h1 {
  /deep/.ql-editor {
    font-size: 2.2em;
    line-height: 1.2em;
  }
}
.BEV-heading-h2 {
  /deep/.ql-editor {
    font-size: 1.8em;
    line-height: 1.2em;
  }
}
.BEV-heading-h3 {
  /deep/.ql-editor {
    font-size: 1.6em;
    line-height: 1.2em;
  }
}
.BEV-heading-h4 {
  /deep/.ql-editor {
    font-size: 1.4em;
    line-height: 1.2em;
  }
}
.BEV-heading-h5 {
  /deep/.ql-editor {
    font-size: 1.3em;
    line-height: 1.2em;
  }
}
.BEV-heading-h6 {
  /deep/.ql-editor {
    font-size: 1.1em;
    line-height: 1.2em;
  }
}
</style>