<template>
  <div 
    :class="{'BEV-hover': isHover, 'BEV-active': isActive, 'BEV-dragging': $store.state.draggingItem===item}"
    class="BEV-item BEV-html">
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
    <textarea 
        @focus="activateItem()"
        class="BEV-content"
        ref="inputArea"
        v-model="item.content" />
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
  </div>
</template>

<script>
import ItemMixin from '@/components/sub/ItemMixin.vue'
import Util from '@/scripts/Util.js'
import DOM from '@/scripts/DOM.js'

export default {
  mixins: [ItemMixin],
  watch: {
    // データ変更検知
    "item.content" () {
      this._adjustHeight()
    }
  },
  mounted () {
    this._adjustHeight()
  },
  data () {
    return {
      // ポップアップメニューの項目定義
      actions: {
        setClassName: {text: this.$t('common.setCssClass'), icon: 'IconCssClass'},
        moveup: {text: this.$t('common.moveUpItem'), icon: 'IconMoveup'},
        movedown: {text: this.$t('common.moveDownItem'), icon: 'IconMovedown'},
        replicate: {text: this.$t('common.replicateItem'), icon: 'IconReplicate'},
        delete: {text: this.$t('common.deleteItem'), type: 'danger', icon: 'IconDelete'},
      },
      historyTargetKeys: ['content']
    }
  },
  methods: {
    doItemAction (action) {
    },
    focus () {
      this.$refs.inputArea.focus()
    },
    // 入力エリアのサイズ調整
    _adjustHeight () {
      const input = this.$refs.inputArea
      const styles = window.getComputedStyle(input)

      if (input.scrollHeight > input.offsetHeight) {   
        input.style.height = input.scrollHeight + 2 + 'px'
      }else{
        let height, line_height;
        while (true) {
          height = Number(input.style.height.split("px")[0])
          line_height = Number(styles['line-height'].split('px')[0])
          if (!height || !line_height) break;
          // console.log(height, line_height);
          input.style.height = height - line_height + "px"
          if (input.scrollHeight > input.offsetHeight) {
              input.style.height = input.scrollHeight + 2 + "px"
              break
          }
        }
      }
    }
  }
}

// アイテムデータの解析等を行うクラス
import ItemBase from '@/scripts/ItemBase.js'
export class Item extends ItemBase {
  constructor (options) {
    super(options)
    this.name = 'Html'
  }
  // 渡されたHTMLElementが、このコンポーネントで処理可能か判断する 
  matches (element) {
    return DOM.matches(element, `${this.getConfig('tagName')}.${this.getConfig('tagClassName')}`)
  }
   // 渡されたHTMLElementから、コンポーネントで扱えるデータに変換する
  getItem (element) {
    // クラス名の抽出(複数の場合は最初の一つだけ)
    let css_class = null;
    Array.from(element.classList).some(cls=>{
        if (cls===this.getConfig('tagClassName')) return
        css_class = cls
        return true
    })
    const item = {
      id: Util.generateID(),
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

    const content = item.content
    if (!content) return null

    const nl = this.getConfig('outputNewLine')
    // クラス名の取得
    let cls_name = ''
    if (this.getConfig('allowCssClass') && item.className) cls_name = ' ' + item.className

    let tag = this._indent(0) + `<${this.getConfig('tagName')} class="${this.getConfig('tagClassName')}${cls_name}">${nl}`
    tag += this._indent(1) + `${content}${nl}`
    tag += this._indent(0) + `</${this.getConfig('tagName')}>`
    return tag
  }
  // アイテムデータを検証し、不正なデータは置き換える
  normalizeItem (item) {
    if (!item && typeof item !== 'object') return this.getEmptyItem()
    if (typeof item.id !== 'string') item.id = Util.generateID()
    if (typeof item.className !== 'string') item.className = null
    if (typeof item.content !== 'string') item.content = ''
  }
  // 空のアイテムデータを返す
  getEmptyItem () {
    return {
      id: Util.generateID(),
      name: this.name,
      className: null,
      content: '',
    }
  }
}
/*
データ構造
item: {
  className: (クラス名),
  name: 'Html',
  content: (HTML)
}

アウトプットされるHTMLの例
<div class="html-wrap">
  <iframe width="560" height="315" src="https://www.youtube.com/embed/cJCtiJydw9U" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen>
  </iframe>
  <div class="demo">
    任意のHTML
  </div>
</div>
*/
</script>

<style lang="scss" scoped>
@import '@/styles/valiables.scss';
@import '@/styles/components.scss';
@import '@/styles/animation.scss';

.BEV-html {

}

.BEV-content {
  background-color: #FFFFFF;
  border: $item-border;
  color: $item-text-color;
  font-size: 1em;
  line-height: 1.5em;
  padding: 10px;
  outline: none;
  transition: border .2s, color .2s;
  width: 100%;
  box-sizing: border-box;
  resize: none;
}
.BEV-html.BEV-hover .BEV-content {
  border: $item-hover-border;
  color: $item-hover-text-color;
}

.BEV-html.BEV-active .BEV-content,
.BEV-html .BEV-content:focus {
  border: $item-active-border;
  color: $item-active-text-color;
}
textarea {
  border-radius: $item-wrap-border-radius;
}
</style>

