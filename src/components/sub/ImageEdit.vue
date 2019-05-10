<template>
  <div 
    class="BEV-image-edit-wrap">
    <transition-group name="BEV-image-edit-item" tag="div" class="BEV-image-edit-inner">
      <div 
        v-for="image in tmpImages" 
        :key="image.id"
        @dragstart="_onImageDragStart(image, $event)"
        @dragend="_onImageDragEnd(image, $event)"
        @dragenter="_onImageDragEnter(image, $event)"
        draggable="true"
        class="BEV-item">
        <div 
          @mouseenter.capture="_setHoverImage(image)"
          @mouseout.capture="_setHoverImage(null)"
          :data-id="image.id"
          ref="image"
          class="BEV-image">
          <transition name="fade">
            <BrokenImage 
              class="BEV-broken-image"
              v-if="image.error"/>
          </transition>
          <img 
            v-show="!image.error"
            @load="$set(image, 'error', false)"
            @error="$set(image, 'error', true)"
            :src="image.src" />
          <div 
            @mouseout="_setHoverImage(image)"
            v-show="shouldShowOverlay(image)"
            class="BEV-image-buttons">
            <button 
              :class="{inactive: shouldInactivateUrlButton(image)}"
              @click.stop="showUrlMenu(image, $event)" 
              type="button"
              >{{$t('ImageEdit.inputUrl')}}</button>
            <button
              v-if="getConfig('allowFileBrowser')"
              @click.stop="showFileBrowser(image, $event)"
              :class="{inactive: shouldInactivateUploaderButton(image)}"
              type="button"
              >{{$t('ImageEdit.openFileBrowser')}}</button>
          </div>
          <transition name="fade">
           <div 
            v-show="shouldShowOverlay(image)"
            class="BEV-overlay"></div>
          </transition>
        </div>
        <TextInput 
          class="BEV-input"
          v-model="image.caption"
          @focus="$emit('focus')"
          @clear="image.caption=null"
          :placeholder="$t('ImageEdit.captionPlaceholder')" />
        <IconBase 
          @click.native.stop="deleteImage(image)"
          class="BEV-close"
          width="21" height="21">
          <IconClose />
        </IconBase>
      </div>
      
      <div 
        key="new"
        v-show="settings.maxImages > tmpImages.length"
        @mouseenter.capture="_setHoverImage('new')"
        @mouseout.capture="_setHoverImage(null);"
        class="BEV-image BEV-new">
        <IconBase 
          class="BEV-add"
          width="34" height="34">
          <IconPlusBig />
        </IconBase>

        <transition name="fade">
          <div 
            @mouseout="_setHoverImage('new')"
            v-show="shouldShowOverlay('new')"
            class="BEV-image-buttons">
            <button 
              :class="{inactive: shouldInactivateUrlButton('new')}"
              @click.stop="showUrlMenu('new', $event)"
              type="button"
            >{{$t('ImageEdit.inputUrl')}}</button>
            <button
              v-if="getConfig('allowFileBrowser')"
              @click.stop="showFileBrowser('new', $event)"
              :class="{inactive: shouldInactivateUploaderButton('new')}"
              type="button"
              >{{$t('ImageEdit.openFileBrowser')}}</button>
          </div>  
        </transition>
        <transition name="fade">
          <div
            v-show="shouldShowOverlay('new')"
            class="BEV-overlay">
          </div>
        </transition>
      </div>
    </transition-group>
    <div class="BEV-buttons">
      <button 
        @click="cancelInput()"
        @focus="$emit('focus')"
        class="BEV-cancel"
        type="button"
      >{{$t('common.cancel')}}</button>
      <button 
        @click="saveInput()"
        @focus="$emit('focus')"
        class="BEV-save"
        type="button"
      >{{$t('common.apply')}}</button>
    </div>

    <transition 
      name="popup-move">
      <div 
        @click.stop
        v-show="popupMenuName==='url'"
        ref="urlEdit"
        :class="{'BEV-sp': isTouchDevice}"
        class="BEV-menu-wrap">
        <div class="BEV-menu BEV-dialog">
          <div
            v-if="isTouchDevice" 
            class="BEV-menu-title">{{$t('ImageEdit.inputUrl')}}</div>
          <TextInput 
            @enter="applyUrl()"
            @escape="cancelUrl()"
            v-model="tmpUrl" 
            ref="UrlInput" 
            :placeholder="$t('ImageEdit.urlPlaceholder')" />
          <div class="BEV-buttons">
            <button 
              @click="cancelUrl()"
              class="BEV-cancel"
              type="button"
            >{{$t('common.cancel')}}</button>
            <button 
              @click="applyUrl()"
              :disabled="!tmpUrl ? true : false"
              class="BEV-save"
              type="button"
            >{{$t('common.apply')}}</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>
<script>
import ComponentBase from '@/components/sub/ComponentBase.vue'
import Util from '@/scripts/Util.js'
import DOM from '@/scripts/DOM.js'
import DragItemUtil from '@/scripts/DragItemUtil.js'
import TextInput from '@/components/sub/TextInput.vue'
import IconBase from '@/components/sub/IconBase.vue'
import IconPlusBig from '@/components/icons/IconPlusBig.vue'
import IconClose from '@/components/icons/IconClose.vue'
import BrokenImage from '@/components/sub/BrokenImage.vue'

let HOVER_IMAGE_TIMER   // 画像ホバー時のUI挙動を制御するためのタイマー
const SORT_EXEC_INTERVAL = 50    // ソート処理を行ってから、次にソート処理を行うまでの最低時間
let PREV_SORT_EXEC
export default {
  extends: ComponentBase,
  props: ['value', 'options', 'settings'],
  components: {
    TextInput, IconBase, IconPlusBig, IconClose, BrokenImage,
  },
  mounted () {
    this.init()
  },
  watch: {
    value () {
      this.init()
    }
  },
  data () {
    return {
      tmpImages: [],
      draggingImage: null,      // ドラッグ中の画像
      tmpUrl: null,           // 入力中の画像URL
      urlMenuTarget: null,     // URL入力ポップアップ表示のための基準要素

      hoverImage: null,         // ホバー中の画像
      editingImage: null,       // 編集中の画像
      popupMenuName: null,      // ポップアップの種類

      dragItemUtil: null,       // ドラッグ処理のためのユーティリティクラスのインスタンス
    }
  },
  methods: {
    // 画像のオーバーレイメニューを表示すべきかどうか
    shouldShowOverlay (image) {
      return !this.draggingImage && (this.hoverImage === image || this.editingImage === image)
    },
    // URL入力ボタンが非アクティブであるべきかどうか
    shouldInactivateUrlButton (image) {
      return this.editingImage === image && 
             this.popupMenuName !== null && 
             this.popupMenuName !== 'url' 
    },
    // アップローダボタンが非アクティブであるべきかどうか
    shouldInactivateUploaderButton (image) {
      return this.editingImage === image && 
             this.popupMenuName !== null && 
             this.popupMenuName !== 'uploader' 
    },
    init () {
      // クローンして編集用の仮データをつくる
      this.tmpImages = Util.deepCopy(this.value)
      if (this.tmpImages) {
        this.tmpImages.forEach(img=>{
          img.id = Util.generateID()
        })
      }
    },
    // 画像の削除
    deleteImage (image) {
      const index = this.tmpImages.indexOf(image)
      if (index === -1) return false
      this.tmpImages.splice(index, 1)
    },
    // URLの適用
    applyUrl () {
      if (this.editingImage === 'new') {
        // 新規追加
        const image = {
          id: Util.generateID(),
          src: this.tmpUrl,
          caption: null,
        }
        this.tmpImages.push(image)
      } else {
        this.editingImage.src = this.tmpUrl
      }
      this.hideUrlMenu()
      this.tmpUrl = null
      this.editingImage = null
      this.hoverImage = null
    },
    // URL入力のキャンセル
    cancelUrl () {
      this.hideUrlMenu()
      this.tmpUrl = null
      this.editingImage = null
    },
    // 全入力のキャンセル
    cancelInput () {
      if (!confirm(this.$t('ImageEdit.cancelInputAlert'))) {
        return false
      }
      this.$emit('cancel')
      this.tmpImages = []
    },
    // 全入力の保存
    saveInput () {
      this.$emit('input', Util.deepCopy(this.tmpImages))
      this.tmpImages = []
    },
    // リサイズ時処理
    onResize () {
      this.hideUrlMenu()
    },
    // 画像のドラッグスタート
    _onImageDragStart (image, ev) {
      this.draggingImage = image
      this._setHoverImage(null)

      ev.dataTransfer.effectAllowed = 'move'
      ev.dataTransfer.setData('text', '')

      // ドラッグ対象のDOM要素取得
      let src_elm
      this.$refs.image.some(img_elm => {
        if (img_elm.getAttribute('data-id') === image.id) {
          src_elm = img_elm
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
    },
    // 画像のドラッグ終了
    _onImageDragEnd (image, ev) {
      this.draggingImage = null
      this.dragItemUtil.destroy()
      this.dragItemUtil = null
    },
    _onImageDragEnter (image, ev) {
      const tm = (new Date()).getTime()
      if (PREV_SORT_EXEC) {
        // 前回のソートから一定時間以下の場合はスキップ
        if (tm - PREV_SORT_EXEC < SORT_EXEC_INTERVAL) return false
      }
      // console.log(tm - PREV_SORT_EXEC)

      const to_index = this.tmpImages.indexOf(image)
      const from_index = this.tmpImages.indexOf(this.draggingImage)

      this.tmpImages.splice(from_index, 1)
      this.tmpImages.splice(to_index, 0, this.draggingImage)

      PREV_SORT_EXEC = tm
    },
    // ホバー時の画像設定
    _setHoverImage (image) {
      if (HOVER_IMAGE_TIMER) {
        clearTimeout(HOVER_IMAGE_TIMER)
        HOVER_IMAGE_TIMER = null
      }
      if (image) {
        this.hoverImage = image
      } else {
        HOVER_IMAGE_TIMER = setTimeout(()=>{
          this.hoverImage = null
        },0)
      }
    },
    // URL入力メニューの表示
    showUrlMenu (image, ev) {
      this.editingImage = image
      if (ev) {
        this.urlMenuTarget = ev.target
      }

      // 編集対象の画像のURLを入力エリアに反映
      this.tmpUrl = image.src ? image.src : null

      // メニューボタンの位置を計算し、ポップアップメニューを表示する
      this.popupMenuName = 'url'

      if (!this.isTouchDevice) {
        // タッチデバイスではないPCなどのみ
        // メニュー位置の調整
        this.$nextTick(()=>{
          this.arrangePopup(this.$refs.urlEdit, this.urlMenuTarget, {x:0, y:5})
          // this.$refs.classInput.focus()   // フォーカスを当てる
          // メニューの外をクリックされたときの検知用イベント
          document.addEventListener('click', this.hideUrlMenu)
        })
      }

      this.$nextTick(()=>{
        // テキストフィールドのフォーカスを当てる
        this.$refs.UrlInput.focus()
      })
    },
    // URL入力メニューの非表示
    hideUrlMenu () {
      if (this.popupMenuName === 'url') {
        this.popupMenuName = null
        this._setHoverImage(this.editingImage)
        this.editingImage = null
      }
      document.removeEventListener('click', this.hideUrlMenu)
    },
    // ファイルブラウザの表示
    showFileBrowser (image) {
      this.editingImage = image // 編集中のオブジェクトを記録
      this.showFileBrowserWindow(this.fileBrowserCallback)
    },
    // ファイルブラウザからのコールバック
    fileBrowserCallback (url) {
      this.tmpUrl = url
      this.applyUrl()
    },

    // 画像のアップロード
    uploadImage (files) {
      if (files.length + this.tmpImages.length > this.settings.maxImage) {
        alert(`添付出来る画像の最大数は${this.settings.maxImage}です。`)
        return false
      }
      const max_img_byte = Util.sizeToByte(this.settings.maxFileSize)
      const errors = []
      const reg_img = new RegExp('(' + this.settings.extensions.join('|') + ')$', 'i')
      const upload_imgs = [];
      Array.from(files).forEach (file => {
        if (!file.name.match(reg_img)) {
          errors.push(`[${file.name}]: 画像以外の添付は許可されていません`)
          return
        }
        if (file.size > max_img_byte) {
          errors.push(`[${file.name}]: 画像のファイルサイズが上限(${this.settings.maxImageSize})を超えています`)
          return;
        }
        upload_imgs.push(file)
      })
      if (errors.length) {
        alert(errors.join("\n"))
        return
      }

      upload_imgs.forEach(image => {
        const reader = new FileReader()
        reader.onload = (image => {
          return e => {
            this.tmpImages.splice(this.tmpImages.length, 0, {
              src: e.target.result,
              caption: null,
            })
          }
        })(image)
        reader.readAsDataURL(image)
      });
    },
    // アップローダー選択モード
    enterUploaderMode (image) {
      // すでにアップローダが表示されていればスキップ
      if (this.$store.state.showUploader) return false

      if (image) this.uploadingImage = image
      else this.uploadingImage = 'new'

      // アップローダを表示
      this.$store.commit('showUploader', true)
      // アップローダの表示ディレクトリを設定
      this.$store.commit('uploadDirPath', this.settings.uploadDir ? this.settings.uploadDir : '')

      // ファイル選択コールバックを設定
      this.$store.commit('uploadCallback', (url)=>{
        let image
        if (this.uploadingImage==='new') {
          // 画像新規追加
          image = {
            src: url,
            caption: null,
          }
          this.images.push(image)
        } else {
          this.uploadingImage.src = url
        }
        this.uploadingImage = null
      })
    },
    isEnabledUploader () {
      return this.settings.uploader ? true : false
    }
  }
}
</script>
<style lang="scss" scoped>
@import '@/styles/valiables.scss';
@import '@/styles/animation.scss';

.BEV-image-edit-inner {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); // styleObjectで設定
  grid-auto-rows: auto;
  grid-gap: 10px;

  .BEV-item {
    position: relative;
    transition: all .1s;

    .BEV-image {
      position: relative;
      width: 100%;
      padding: 0;
      margin: 0;
      border-radius: 3px;
      overflow: hidden;
      cursor: -webkit-grab;
      cursor: grab;

      img, .BEV-broken-image {
        position: relative;
        width: 100%;
        min-height: 150px;
      }

    }

    .BEV-input {
      margin: 5px 0 0 0;
    }

    .BEV-close {
      position: absolute;
      top: 7px;
      right: 7px;
      cursor: pointer;
    }
  }
  .BEV-new {
    background-color: #F4F4F5;
    position: relative;
    min-height: 200px;
    border-radius: 3px;
    overflow: hidden;

    .BEV-add {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
  }

  .BEV-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,.34);
    pointer-events: none;
    z-index: 1;
  }
  .BEV-image-buttons {
    position: absolute;
    width: 80%;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    z-index: 2;
    button {
      @extend %primary-button;
      margin: 5px 5px 0 0;
    }
    button:last-child {
      margin: 5px 0 0 0;
    }
    button.inactive {
      opacity: .7;
    }
  }
}

.BEV-menu-wrap {
  @extend %popup-menu-wrap;
  .BEV-menu {
    width: 17em;
  }
}

.BEV-image-edit-wrap {
  // ボタン類
  & > .BEV-buttons {
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
  }
}

// アニメーション
.BEV-image-edit-wrap {
  .BEV-item {
    transition: all .2s;
  }
  .BEV-image-edit-item-enter, .BEV-image-edit-item-leave-to {
    opacity: 0;
  }
  .BEV-image-edit-item-leave-active {
    position: absolute;
  }
}

// ドラッグ中のイメージ
.BEV-image-edit-wrap {
  .BEV-dragging-clone {
    transform-origin: center center;
    opacity: 1!important;  
    transition: transform .2s;
    transform: scale(.5);
    border: 1px solid #fff;
    border-radius: 6px;
    overflow: hidden;

    img, .BEV-broken-image {
      width: 100%;
      height: 100%;
    }

    .BEV-image-buttons,
    .BEV-overlay {
      display: none;
    }
  }
}
</style>