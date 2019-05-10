<template>
  <div 
    @click.capture="activateItem()"
    :class="{'BEV-hover': isHover, 'BEV-active': isActive, 'BEV-dragging': $store.state.draggingItem===item}"
    class="BEV-item BEV-paragraph">

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
      :allowCssClass="getConfig('allowCssClass') && isItemAttrEditable"
      :classes="getConfig('cssClasses')"
    />
    <!-- 画像編集エリア -->
    <ImageEdit
      v-if="getConfig('allowImages') && editingImage"
      v-model="item.images"
      @input="editingImage=null"
      @cancel="editingImage=null"
      @focus="activateItem()"
      :settings="{
        maxImages: getConfig('maxImages'),
        maxFileSize: getConfig('maxImageSize'),
        extensions: getConfig('imageExtensions'),
      }"
      class="BEV-item-wrap"
    />
    <template v-else>
      <div 
        class="BEV-item-wrap">
        <div 
          v-if="item.images.length"
          :class="{
            'BEV-left': item.imageAlign==='left',
            'BEV-center': item.imageAlign==='center',
            'BEV-right': item.imageAlign==='right',
          }"
          class="BEV-image-wrap">
          <ImageList 
            :images="item.images"
            @mouseenter.native="_setFlgImageAlign(true)"
            @mouseleave.native="_setFlgImageAlign(false)"
            @error="onImageLoad($event,false)"
            @success="onImageLoad($event,true)"
            @click.native="editingImage=true"
            class="BEV-image"
          />
          <transition name="fade">
            <div 
              v-if="item.images.length>0 && isItemAttrEditable"
              v-show="flgImageAlign"
              @mouseenter="_setFlgImageAlign(true)"
              class="BEV-align-wrap">
              <div
                v-tooltip="$t('Paragraph.leftAlign')"
                @click.stop="item.imageAlign='left'" 
                class="BEV-align-item"
                :class="{'BEV-active': item.imageAlign==='left'}">
                <IconBase 
                  width="15" height="15">
                  <IconAlignLeft :active="item.imageAlign==='left'" />
                </IconBase>
              </div>
              <div
                v-tooltip="$t('Paragraph.centerAlign')"
                @click.stop="item.imageAlign='center'" 
                class="BEV-align-item"
                :class="{'BEV-active': item.imageAlign==='center'}">
                <IconBase 
                  width="15" height="15">
                  <IconAlignCenter :active="item.imageAlign==='center'" />
                </IconBase>
              </div>
              <div
                v-tooltip="$t('Paragraph.rightAlign')"
                @click.stop="item.imageAlign='right'" 
                class="BEV-align-item"
                :class="{'BEV-active': item.imageAlign==='right'}">
                <IconBase 
                  width="15" height="15">
                  <IconAlignRight :active="item.imageAlign==='right'" />
                </IconBase>
              </div>
            </div>
          </transition>
        </div>
        <component
          @focus="activateItem()"
          :is="getConfig('allowStyledText') ? 'VisualText': 'PlainText'" 
          :cssClasses="getConfig('styledTextClasses')"
          ref="editor"
          v-model="item.content"
          class="BEV-editor"
        />
      </div>
    </template>
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
import VisualText from '@/components/sub/VisualText.vue'
import PlainText from '@/components/sub/PlainText.vue'
import ImageEdit from '@/components/sub/ImageEdit.vue'
import ImageList from '@/components/sub/ImageList.vue'
import IconBase from '@/components/sub/IconBase.vue'
import IconAlignLeft from '@/components/icons/IconAlignLeft.vue'
import IconAlignRight from '@/components/icons/IconAlignRight.vue'
import IconAlignCenter from '@/components/icons/IconAlignCenter.vue'

let IMAGE_ALIGN_TIMER

export default {
  mixins: [ItemMixin],
  components: {
    VisualText, PlainText, ImageEdit, ImageList,
    IconBase, IconAlignLeft, IconAlignCenter, IconAlignRight,
  },
  watch: {
    isActive (newVal, oldVal) {
      if (!newVal && oldVal) {
        // アクティブ→アクティブ解除の場合は
        // 画像編集モードは終了
        this.editingImage = false
      }
    },
    // 画像寄せが変更されたらいったんUI表示をリセット
    'item.imageAlign' () {
      this._setFlgImageAlign(false)
    }
  },
  data () {
    return {
      // ポップアップメニューの項目定義
      actions: {
        addImages: {text: this.$t('Paragraph.editImages')},
        setClassName: {text: this.$t('common.setCssClass'), icon: 'IconCssClass'},
        moveup: {text: this.$t('common.moveUpItem'), icon: 'IconMoveup'},
        movedown: {text: this.$t('common.moveDownItem'), icon: 'IconMovedown'},
        replicate: {text: this.$t('common.replicateItem'), icon: 'IconReplicate'},
        delete: {text: this.$t('common.deleteItem'), type: 'danger', icon: 'IconDelete'},
      },
      historyTargetKeys: ['content', 'images', 'imageAlign'],
      editingImage: false,      // 画像編集フラグ
      flgImageAlign: false,     // 画像寄せフラグ
    }
  },
  created () {
    if (typeof this.item.images === 'undefined') {
      this.item.images = []
    }
    if (!this.getConfig('allowImages')) { // 画像の添付禁止
      this.$delete(this.actions, 'addImages')
    }
  },
  methods: {
    // 画像の読み込みのエラー時イベント
    onImageLoad (image, success) {
      this.flgHistory = false // エラーフラグの付加時、履歴に追加されるのを防ぐ
      if (success) { // 読み込み成功
        if (typeof image.error !== 'undefined') {
          this.$delete(image, 'error')
        }
      } else { // 読み込みエラー
        this.$set(image, 'error', true)
      }
      this.$nextTick(()=>{
        this.flgHistory = true
      })
    },
    // コンポーネント固有のアクションの実行
    doItemAction (action) {
      if (action==='addImages') {
        this.editingImage = true
      }
    },
    // フォーカスを当てる
    focus () {
      this.$refs.editor.focus()
    },
    _setFlgImageAlign (val) {
      if (IMAGE_ALIGN_TIMER) {
        clearTimeout(IMAGE_ALIGN_TIMER)
      }
      if (val) {
        this.flgImageAlign = true
      } else {
        IMAGE_ALIGN_TIMER = setTimeout(()=>{
          this.flgImageAlign = false
        },0)
      }
    }
  }
}

// アイテムデータの解析等を行うクラス
import ItemBase from '@/scripts/ItemBase.js'
export class Item extends ItemBase {
  constructor (options) {
    super(options)
    this.name = 'Paragraph'
  }

  // 渡されたHTMLElementが、このコンポーネントで処理可能か判断する
  matches (element) {
    return DOM.matches(element, `${this.getConfig('tagName')}.${this.getConfig('tagClassName')}`)
  }
  // 渡されたHTMLElementから、コンポーネントで扱えるデータに変換する
  getItem (element) {
    // クラス名の抽出(複数の場合は最初の一つだけ)
    let css_class = null
    let img_align = this.getConfig('defaultImageAlign')
    Array.from(element.classList).some(cls=>{
      if (cls===this.getConfig('tagClassName')) return
  
      let m
      if ((m=cls.match(/^align-(.+?)$/))!==null) {
        // 画像の並びクラス
        if (['left', 'right', 'center'].indexOf(m[1]) !== -1) {
            img_align = m[1]
        }
        return
      }
      css_class = cls
      return true
    });

    const images = []
    let dom_imgs = element.querySelectorAll('div.images > .image')
    Array.from(dom_imgs).forEach(dom_img=>{
      const img = dom_img.querySelector('img')
      const src = img ? img.getAttribute('src') : null
      let cap = dom_img.querySelector('.caption')
      cap = cap ? cap.innerText : null

      images.push({
        src: src,
        caption: cap,
      })
    })
    const max_images = this.getConfig('maxImages')
    if (images.length > max_images) {
      // 最大画像数を超過している
      images.splice(max_images)
    }

    const dom_text = element.querySelector('.text')
    let content = ''
    if (dom_text) {
      content = dom_text.innerHTML
    }

    const item = {
      id: Util.generateID(),
      name: this.name,
      className: this.getConfig('allowCssClass') ? css_class : null,
      images: this.getConfig('allowImages') ? images : [],
      imageAlign: img_align,
      content: content,
    }
    const def = this.getPreset(item)
    if (def) { // 定義セットに一致するものが見つかった
      item.preset = def
    }
    return item
  }

  // アイテムデータをHTMLに変換する
  getHtml (item, base_ind) {
    super.getHtml(item, base_ind);

    const content = Util.arrangeEditableHtml(item.content)
    if (!content) return null

    const nl = this.getConfig('outputNewLine')
    // クラス名の取得
    let cls_name = ''
    if (this.getConfig('allowCssClass') && item.className) cls_name = ` ${item.className}`;

    let tag = this._indent(0) + `<${this.getConfig('tagName')} class="${this.getConfig('tagClassName')} align-${item.imageAlign}${cls_name}">${nl}`
    if (this.getConfig('allowImages') && item.images && item.images.length) {
        tag += this._indent(1) + `<div class="images">${nl}`
        item.images.forEach(image => {
          if (!image.src) return
          tag += this._indent(2) + `<div class="image">${nl}`
          tag += this._indent(3) + `<img src="${image.src}">${nl}`
          if (image.caption) {
              tag += this._indent(3) + `<div class="caption">${image.caption}</div>${nl}`
          }
          tag += this._indent(2) + `</div>${nl}`
        });
        tag += this._indent(1) + `</div>${nl}`
    }
    tag += this._indent(1) + `<div class="text">${nl}`
    tag += this._indent(2) + `${content}${nl}`
    tag += this._indent(1) + `</div>${nl}`
    tag += this._indent(0) + `</${this.getConfig('tagName')}>`
    return tag
  }
  // アイテムデータを検証し、不正なデータは置き換える
  normalizeItem (item) {
    if (!item && typeof item !== 'object') return this.getEmptyItem()
    if (typeof item.id !== 'string') item.id = Util.generateID()
    if (['left','center','right'].indexOf(item.imageAlign)===-1) item.imageAlign = this.getConfig('defaultImageAlign')
    if (item.images instanceof Array) {
      item.images.forEach(d => {
        if (typeof d.src !== 'string') d.src = null
        if (typeof d.caption !== 'string') d.caption = null
      })
    } else {
      item.images = []
    }
    if (typeof item.className !== 'string') item.className = null
    if (typeof item.content !== 'string') item.content = ''
  }
  // 空のアイテムデータを返す
  getEmptyItem () {
    return {
      id: Util.generateID(),
      name: this.name,
      imageAlign: this.getConfig('defaultImageAlign'),
      className: null,
      images: [],
      content: '',
    }
  }
}
/* 
データ構造
item: {
  name: 'Paragraph',
  className: (クラス名),
  imageAlign: (画像の回り込み指定 left/right/center)
  images: [
      {src: 'xxxx.jpg', caption: 'キャプション'},
      {src: 'yyyy.jpg', caption: 'キャプション'},
      ...
  ],
  content: (HTML or Text)
}

アウトプットされるHTMLの例
<div class="paragraph-wrap align-left">
  <div class="images">
    <div class="image">
      <img src="xxxx.jpg">
      <div class="caption">キャプション</div>
    </div>
    <div class="image">
      <img src="yyyy.jpg">
      <div class="caption">キャプション</div>
    </div>
  </div>
  <div class="text">
    テキストが入ります。テキストが入ります。テキストが入ります。
    テキストが入ります。テキストが入ります。
  </div>
</div>
*/
</script>

<style lang="scss" scoped>
@import '@/styles/valiables.scss';
@import '@/styles/components.scss';
@import '@/styles/animation.scss';

// 一番大外の要素
.BEV-item-wrap {
  background-color: #FFFFFF;
  border: $item-border;
  border-radius: $item-wrap-border-radius;
  padding: 10px;
   &:after {
    content:" ";
    display:block;
    clear:both;
  }
}
// ホバー時
.BEV-paragraph.BEV-hover {
  .BEV-item-wrap {
    border: $item-hover-border;
    color: $item-hover-text-color;
  }
}
// アクティブ時
.BEV-paragraph.BEV-active {
  .BEV-item-wrap {
    border: $item-active-border;
    color: $item-active-text-color;
  }
}

.BEV-image-wrap {
  position: relative;
  z-index: 1;
  .BEV-align-wrap {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index:1;
    display: flex;
    justify-content: center;

    border-radius: 3px;
    background-color: #fff;
    border: 1px solid #B5B5B5;

    .BEV-align-item {
      display: flex;
      align-items: center;

      padding: 4px 5px;
      cursor: pointer;
      &:hover {
        background-color: #EAF2FE;
      }
      &.BEV-active {
        background-color: #5796F8;
        color: #fff;
      }
    }
  }
  .BEV-image {
    z-index:0;
    cursor: pointer;
  }
}

// 左寄せ
.BEV-image-wrap.BEV-left {
  max-width: 40%;
  margin: 0 .5em .5em 0;
  float: left;
}
// 右寄せ
.BEV-image-wrap.BEV-right {
  max-width: 40%;
  margin: 0 0 .5em .5em;
  float: right;
}
// 中央寄せ
.BEV-image-wrap.BEV-center {
  max-width: 40%;
  margin-bottom: .5em;
  margin-left: auto;
  margin-right: auto;
  margin-top: 0;
}

// エディタ
.BEV-editor {
  color: $item-text-color;
  border: 0;  
  outline: none;
  transition: border .2s, color .2s;
}

/deep/.ql-editor {
  font-size: 1em;
  line-height: 1.5em;
}
</style>