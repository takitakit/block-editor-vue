<template>
  <div ref="ve" class="BEV-visual-text">
    <transition name="fade">
      <div @click.stop v-show="flgMenu" 
        ref="toolbar" class="BEV-toolbar">
        <div 
          :class="{'BEV-v-reverse': toolbarVReverse}"
          class="BEV-toolbar-inner">
          <div v-show="flgMenu==='toolbar'" 
            :class="{'BEV-wrap': editorWidth < toolbarWidth}"
            class="BEV-item-wrap">
            <div
              @click.prevent="flgMenu='link';focusUrlInput();" 
              :class="{active: linkUrl}" v-if="enabledLink" class="BEV-item">
              <IconBase width="15" height="15"><IconLink :active="linkUrl" /></IconBase>{{$t('common.link')}}
            </div>
            <div 
              @click.prevent="unlink"
              v-if="enabledLink" v-show="linkUrl" class="BEV-item">
              <IconBase width="15" height="15"><IconUnlink /></IconBase>{{$t('VisualText.unlink')}}
            </div>
            <div
              @click.prevent="applyStyle(type)"
              :class="{active: appliedStyles.indexOf(type)!==-1}"
              v-for="(label, type) in styleButtons"
              :key="type"
              class="BEV-item"
            >
              <IconBase v-if="type==='bold'" width="15" height="15"><IconBold :active="appliedStyles.indexOf(type)!==-1" /></IconBase>
              {{label}}
            </div>
            <div @click.prevent="removeStyle" class="BEV-remove-style BEV-item">
              <IconBase width="15" height="15"><IconEraser /></IconBase>{{$t('VisualText.remove')}}
            </div>
          </div>

          <transition name="fade">
            <div v-show="flgMenu==='link'" class="link-wrap">
              <div class="BEV-row">
                <TextInput 
                  :placeholder="$t('common.url')"
                  @enter="applyLink"
                  @escape="closeToolbar();"
                  @clear="linkUrl=''"
                  ref="urlInput"
                  v-model="linkUrl"
                />
              </div>
              <div class="BEV-row BEV-switch">
                <SwitchInput v-model="linkBlank" :label="$t('common.openInNewWindow')" />
              </div>
              <div class="BEV-row">
                <button @click="linkUrl='';closeToolbar()" type="button" class="BEV-cancel">{{$t('common.cancel')}}</button>
                <button 
                  :disabled="!linkUrl"
                  @click="applyLink" type="button" class="BEV-apply">{{$t('common.apply')}}</button>
              </div>
            </div>
          </transition>
          <div ref="toolbarTriangle" class="BEV-triangle"></div>
        </div>
      </div>
    </transition>
  </div>
</template>
<script>
import ComponentBase from '@/components/sub/ComponentBase.vue'
import Quill from "quill/dist/quill.core.js"
import DOM from "@/scripts/DOM.js"
import Util from "@/scripts/Util.js"
import TextInput from "@/components/sub/TextInput.vue"
import SwitchInput from '@/components/sub/SwitchInput.vue'

import IconBase from '@/components/sub/IconBase.vue'
import IconLink from '@/components/icons/IconLink.vue'
import IconUnlink from '@/components/icons/IconUnlink.vue'
import IconBold from '@/components/icons/IconBold.vue'
import IconEraser from '@/components/icons/IconEraser.vue'

const IME_EXCEPT_KEYS = ['F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12','Insert','Home','Delete','End','PageUp','PageDown','ArrowUp','ArrowRight','ArrowDown','ArrowLeft','ShiftLeft','ShiftRight','MetaLeft','Tab','ControlLeft','Backspace','ControlRight','AltRight','AltLeft','Lang1','Lang2'];
let KEYCHECK_TIMER

const Parchment = Quill.import("parchment")
const Inline = Quill.import("blots/inline")
const Link = Quill.import("formats/link")
const Delta = Quill.import('delta')
const Clipboard = Quill.import('modules/clipboard')
// スタイル付ペーストデータからスタイルを除去する
class PlainClipboard extends Clipboard {
  onPaste (e) {
    e.preventDefault()
    const range = this.quill.getSelection()
    const text = e.clipboardData.getData('text/plain')
    const delta = new Delta()
                        .retain(range.index)
                        .delete(range.length)
                        .insert(text)
    const index = text.length + range.index
    const length = 0
    this.quill.updateContents(delta, 'silent')
    this.quill.setSelection(index, length, 'silent')
    this.quill.scrollIntoView()
  }
}
Quill.register('modules/clipboard', PlainClipboard, true)

// リンク用Blot
class LinkBlot extends Inline {
  static create(value) {
    let node = super.create()
    let target_blank = false
    if (value.match(/\[blank\]$/)) {
      value = value.replace(/\[blank\]$/, "")
      target_blank = true
    }

    node.setAttribute("href", value)
    if (target_blank) {
      node.setAttribute("target", "_blank")
      node.setAttribute("rel", "noopener")
    }
    return node
  }
  format (name, value) {
    if (name !== this.statics.blotName || !value) {
      super.format(name, value)
    } else {
      let target_blank = false
      if (value.match(/\[blank\]$/)) {
        value = value.replace(/\[blank\]$/, "")
        target_blank = true
      }

      this.domNode.setAttribute("href", value)
      if (target_blank) {
        this.domNode.setAttribute("target", "_blank")
        this.domNode.setAttribute("rel", "noopener")
      } else {
        this.domNode.removeAttribute("target")
        this.domNode.removeAttribute("rel")
      }
    }
  }
  static formats(node) {
    return {
      href: node.getAttribute("href"),
      target: node.getAttribute("target"),
    }
  }
}
LinkBlot.blotName = "link"
LinkBlot.tagName = "a"
Quill.register(LinkBlot)

let CustomClass = new Parchment.Attributor.Class("custom", "ve", {
  scope: Parchment.Scope.INLINE
})
Quill.register(CustomClass)

export default {
  extends: ComponentBase,
  props: ['value', 'cssClasses', 'noLineBreak'],
  components: {
    TextInput, SwitchInput,
    IconBase, IconLink, IconUnlink, IconBold, IconEraser
  },
  data: function() {
    return {
      flgUpdate: false, // エディタによる変更検知を制御するためのフラグ
      domContainer: null, // エディタのDOM
      quill: null, // quillインスタンス
      toolbarVReverse: false, // ツールバーの上下反転フラグ
      enabledLink: false, // リンクの有効化
      flgMenu: null,        // 表示するメニュー名
      linkUrl: null, // 入力中のURL(v-model)
      linkBlank: false, // target="_blank"(v-model)
      selBounds: null, // 選択中の範囲矩形
      currRange: null,      // 選択中の範囲
      appliedStyles: [], // 選択範囲内で適用されているスタイルの配列
      toolbarWidth: 0,    // 起動時のツールバーの幅

      styleButtons: null, // スタイル選択用ボタン
      styleDropdowns: null, // スタイル選択用プルダウン
      inited: false, // 初期化処理の完了フラグ
      imeInput: false, // IMEモード
    }
  },
  watch: {
    // 入力値の変更検知
    value (newVal, oldVal) {
      if (this.flgUpdate) return // エディタ内部での変更は無視する

      this.flgUpdate = true // 再びwatch.value() が呼ばれないようにフラグをセット

      // エディタ外部からの設定の場合
      // エディタの入力値に反映
      this.domContainer.innerHTML = this.arrangeHtml(newVal)
      // console.log(this.domContainer.innerHTML)

      this.$nextTick(() => {
        this.flgUpdate = false
      })
    },
    flgMenu (newVal, oldVal) {
      if (!newVal) return false
      this.relocateToolbar(this.selBounds)
    },
    imeInput (newVal) {
      // console.log('IME', newVal)
    }
  },
  mounted () {
    // quillの初期化
    this.initQuill()
    setTimeout(() => {
      this.inited = true // 初期化完了フラグON

      // ツールバーの幅を計算しておく
      const _disp = this.$refs.toolbar.style.display
      this.$refs.toolbar.style.display = 'block'
      this.$refs.toolbar.style.opacity = 0
      setTimeout(()=>{
        this.toolbarWidth =  this.$refs.toolbar.offsetWidth
        this.$refs.toolbar.style.display = _disp
        this.$refs.toolbar.style.opacity = 1
      }, 0)
    }, 0)    
  },
  beforeDestroy () {
    // 後片付けもれを防ぐ
    document.removeEventListener("mousedown", this.onDocumentMouseDown)
  },
  methods: {
    // quillの初期化
    initQuill () {
      if (this.quill) return

      // ユーザ定義のクラスを取得
      this.styleButtons = {}
      this.cssClasses.forEach(cls => {
        let label
        if (cls === 'bold') { label = this.$t('VisualText.bold') } 
        else if (cls === 'link') { label = this.$t('VisualText.link') } 
        else if (typeof cls === 'string') { label = cls }

        if (label) {
          if (cls === "link") {
            // リンクが有効
            this.enabledLink = true
          } else {
            this.styleButtons[cls] = label
          }
        } else if (typeof cls === 'object') {
          for (var k in cls) {
            this.styleButtons[k] = cls[k]
          }
        }  
      })
  
      const toolbar = this.$refs.toolbar
      const vue = this
      this.quill = new Quill(this.$refs.ve, {
        modules: {
          history: { maxStack: 0 },
          keyboard: {
            bindings: {
              tab: {
                key: 9,
                handler(range, context) {
                  return true
                }
              },
              // エンター
              enter: {
                key: 13,
                handler (range, context) {
                  if (vue.noLineBreak) {
                    // 改行なしの設定
                    // 入力を無効にしてイベントを発火する
                    vue.$emit('enter')
                    return false
                  }
                  return true
                }
              },
              // バックスペース
              backspace: {
                key: 8,
                handler (range, context) {
                  if (vue.quill.getLength()===1) {
                    vue.$emit('delete')
                  }
                  return true
                }
              },
              // 下キー
              down: {
                key: 40,
                handler (range, context) {
                  range.length = 1
                  const lines = vue.quill.getLines(range)
                  if (lines && lines.length)  {
                    const line = lines[0]
                    if (line.next === null) {
                      // 一番最後の行で下キーが押された
                      vue.$emit('down')
                    }
                  }
                  return true
                }
              },
              // 上キー
              up: {
                key: 38,
                handler (range, context) {
                  range.length = 1
                  const lines = vue.quill.getLines(range)
                  if (lines && lines.length)  {
                    const line = lines[0]
                    if (line.prev === null) {
                      // 一番上の行で上キーが押された
                      vue.$emit('up')
                    }
                  }
                  return true
                }
              }
            },
          }
        }
      })
      // this.quill.clipboard.addMatcher (Node.ELEMENT_NODE, function (node, delta) {
      //   console.log('hoge',node)
      //   // var plaintext = $ (node).text ();
      //   // return new Delta().insert (plaintext);
      // });
      // this.quill.clipboard.addMatcher(Node.TEXT_NODE, function(node, delta) {
      //   conso.e.log('moge',node)
      // })

      // ツールバーの登録
      this.quill.addContainer(toolbar)
      this.domContainer = this.quill.container.querySelector(".ql-editor")      
      this.domContainer.innerHTML = this.arrangeHtml(this.value)

      this.domContainer.addEventListener('keypress', this._onKeyEevent)
      this.domContainer.addEventListener('keydown', this._onKeyEevent)
      this.domContainer.addEventListener('keyup', this._onKeyEevent)
      this.domContainer.addEventListener('blur', this._onKeyEevent)
      this.domContainer.addEventListener('mousedown', this._onKeyEevent)

      this.domContainer.addEventListener('focus', ev=>{
        this.$emit('focus', ev)
      })

      // エディターのイベント
      this.quill.on(Quill.events.EDITOR_CHANGE, (ev, range) => {
        if (ev === Quill.events.TEXT_CHANGE) {
          if (!this.flgUpdate) {
            this.onInput()
          }
        } else if (ev === Quill.events.SELECTION_CHANGE) {
          // 選択範囲変更時
          if (range === null) return

          this.currRange = range
          this.appliedStyles = []
          if (range.length === 0) {
            // 選択範囲がなければツールバーを閉じる
            this.closeToolbar()
          } else if (!this.imeInput) {
            // 選択範囲があり、かつIMEモードでなければツールバーを表示する
            document.removeEventListener("mousedown", this.onDocumentMouseDown)

            // 選択範囲のコンテンツ取得
            let d = this.quill.getContents(range.index, range.length)
            let link = null
            let link_blank = false
            d.ops.some(arr => {
              if (arr.attributes) {
                if (arr.attributes.link) {
                  // リンクを含む
                  link = arr.attributes.link.href
                  link_blank = arr.attributes.link.target==='_blank' ? true : false
                  this.appliedStyles.push('link')
                }
                if (arr.attributes.custom) {
                  // カスタム
                  this.appliedStyles.push(arr.attributes.custom)
                }
              }
            })
            this.linkUrl = link
            this.linkBlank = link_blank

            this.flgMenu = 'toolbar'
            // 選択範囲の矩形情報取得
            this.selBounds = this.quill.getBounds(range)
            // ツールバーの再配置
            this.relocateToolbar(this.selBounds)

            // ツールバーの外のクリック検知のためのイベント設定
            // テキスト選択時のマウスアップイベントに反応して
            // 即イベントがコールされるのを防ぐために時間差で設定する
            setTimeout(() => {
              document.addEventListener("mousedown", this.onDocumentMouseDown)
            }, 0)
          }
        }
      })
    },
    // ツールバーを閉じる
    closeToolbar () {
      this.flgMenu = false
      this.selBounds = null
      document.removeEventListener("mousedown", this.onDocumentMouseDown)
    },
    // エディタの入力イベント
    onInput () {
      if (this.inited) {
        // 初期化済み
        this.flgUpdate = true // watch.value()の制御のため、フラグを設定

        // イベント発火
        this.$emit("input", this.domContainer.innerHTML)

        this.$nextTick(() => {
          this.flgUpdate = false
        })
      }
    },
    // ツールバーの外のクリック検知
    onDocumentMouseDown (ev) {
      if (!this.$refs.toolbar.contains(ev.target)) {
        // ツールバー外部の要素のクリック
        this.closeToolbar()
      }
    },
    // リンクの適用
    applyLink (close) {
      if (typeof close === "undefined" || close) close = true
      else close = false

      let url = this.linkUrl
      if (this.linkBlank) url += "[blank]"

      this.quill.format("link", url)
      this.flgMenu = null

      if (close) {
        this.closeToolbar()
      }
    },
    // リンクの解除
    unlink (close) {
      if (typeof close === "undefined" || close) close = true
      else close = false

      this.quill.format("link", null)
      this.flgMenu = null
      if (close) {
        this.closeToolbar()
      }
    },
    // スタイルの適用
    applyStyle (style) {
      if (this.appliedStyles.indexOf(style) === -1) {
        // 指定のスタイルが当たっていない
        this.quill.format("custom", style)
      } else {
        // 指定のスタイルが当たっている
        // いったんスタイルを全解除し、
        // 指定のスタイル以外のスタイルを復旧する
        // ※指定のスタイルのみ解除するAPIが見当たらないため
        this.removeStyle(false)
        this.appliedStyles.forEach(s => {
          if (s !== style) {
            // 復旧対象のスタイル
            if (s === "link") {
              // リンクの場合
              this.applyLink(false)
            } else {
              // それ以外のスタイル
              this.quill.format("custom", s)
            }
          }
        })
      }
      this.closeToolbar()
    },
    // スタイルの除去
    removeStyle (close) {
      if (typeof close === "undefined" || close) close = true
      else close = false

      // let range = this.quill.getSelection()
      const range = this.currRange
      if (!range || range.length===0) return false

      this.quill.removeFormat(range.index, range.length)

      if (close) {
        this.closeToolbar()
      }
    },
    // ツールバーの再配置
    relocateToolbar (rect) {
      if (!rect) return

      let toolbar = this.$refs.toolbar
      if (this.toolbarWidth > this.editorWidth) {
        // ツールバーの幅よりもエディタ幅が小さい場合は
        // ツールバー要素の折り返しを許可する
        // 幅はエディタ幅に合わせる
        toolbar.style.width =  `${this.editorWidth}px`
      } else {
        toolbar.style.width = 'auto'
      }
      // toolbar.style.minWidth = `${this.editorWidth * 0.8}px`

      // 各種フラグを切り替えて描画を行う際
      // 画面に表示されるまでに時間差があるため
      // nextTickでワンテンポ遅らせる
      // 選択範囲の下方向に配置して、CSSで上下反転させる
      this.$nextTick(() => {
        let left = rect.left + rect.width / 2 - toolbar.offsetWidth / 2
        let top = rect.bottom - rect.height - toolbar.offsetHeight - 14

        let calc_pos = DOM.position(this.$el, document)
        calc_pos.x += left
        calc_pos.y += top

        if (this.$store.state.isTouchDevice || calc_pos.y < 0) {
          // タッチデバイスか、画面上部で見切れる場合は
          // 下方向に表示する
          top = rect.top + rect.height + 14
          this.toolbarVReverse = true
        } else {
          this.toolbarVReverse = false
        }

        if (calc_pos.x < 0) {
          // 画面左端で見切れる
          let over = Math.abs(calc_pos.x)
          left += over
          this.$refs.toolbarTriangle.style.left = `calc(50% - ${over}px)`
        } else if (
          calc_pos.x + toolbar.offsetWidth >
          document.documentElement.clientWidth
        ) {
          // 画面右端で見切れる
          let over =
            calc_pos.x +
            toolbar.offsetWidth -
            document.documentElement.clientWidth
          left -= over
          this.$refs.toolbarTriangle.style.left = `calc(50% + ${over}px)`
        } else {
          this.$refs.toolbarTriangle.style.left = null
        }

        toolbar.style.transform = `translate(${left}px, ${top}px)`
      })
    },
    focus () {
      this.quill.focus()
    },
    // 画面リサイズ時イベント
    onResize () {
      // ツールバーを閉じる
      this.closeToolbar()
      // this.relocateToolbar(this.selBounds)
    },
    // URL入力フィールドにフォーカス
    focusUrlInput () {
      this.$nextTick(()=>{
        this.$refs.urlInput.focus()
      })
    },
    // 外部入力のテキストをエディタに合わせたHTMLに変換する
    // (<br>は<p>タグに)
    arrangeHtml (html) {
      if (!html) return '<p><br></p>'

      let _html
      _html = Util.arrangeEditableHtml(html)
      _html = '<p>'+_html.replace(/<br(\s+[^>]+)?(\s*\/)?>/g, '</p><p>')+'</p>'
      return _html
    },
    // 一部ブラウザで
    // IMEの漢字変換に伴い文字選択のイベントが発生するため、
    // スタイルテキストのツールバー表示を制御するために
    // IMEのON/OFF判定を行う
    _onKeyEevent (ev) {
      if ((ev.type === 'keydown' && ev.code === 'Escape') ||
        ev.type === 'blur' || ev.type === 'mousedown') {
        // エスケープが押されたとき、
        // 入力エリアがフォーカスを外れたとき、
        // もしくはマウス操作がされた場合
        // IMEモードはOFFと判定
        if (KEYCHECK_TIMER) clearTimeout(KEYCHECK_TIMER)
        this.imeInput = false
        return
      }
      // IME判定に不要なキー
      if (IME_EXCEPT_KEYS.indexOf(ev.code) !== -1) return

      // console.log(ev.type, ev.keyCode, ev.key, ev.code)
      if (ev.type === 'keydown') { // keydownイベント
        if (KEYCHECK_TIMER) clearTimeout(KEYCHECK_TIMER)
        // keypressを監視するタイマーをセット
        KEYCHECK_TIMER = setTimeout(()=>{
          // keypressが発生しなかった場合
          // IMEモードだと判定できる
          this.imeInput = true
          KEYCHECK_TIMER = null
        },5)
      } else if (ev.type === 'keypress') { // keypress
        if (KEYCHECK_TIMER) clearTimeout(KEYCHECK_TIMER)
        this.imeInput = false
      }
    },
  }
}
</script>
<style lang="scss" scoped>
@import '@/styles/valiables.scss';
@import '@/styles/animation.scss';

/deep/.ql-editor {
  outline: none;
  line-height: 1.5em;

  a[href] {
    position: relative;
  }
  a[href]:hover:before {
    position: absolute;
    content: ' ';
    top: 0;
    left: 50%;
    transform: translate(-50%, calc(-100% - 2px));
    width: 0;
    height: 0;
    border-style: solid;
    border-width: 5px 3px 0 3px;
    border-color: rgba(0,0,0,.7) transparent transparent transparent;

    opacity: 0;

    animation-name: link-tips-anim;
    animation-duration: .15s;
    animation-delay: .4s;
    animation-fill-mode: forwards;
  }
  a[href]:hover:after {
    content: attr(href);
    display: block;
    border: 0;
    position: absolute;
    top: 0;
    left: 50%;
    transform: translate(-50%, calc(-100% - 7px));
    padding: 4px 5px;
    color: #fff;
    background: rgba(0,0,0, .7);
    font-size: .8em;
    line-height: 1.2em;
    border-radius: 3px;
    opacity: 0;
    z-index: 1;

    animation-name: link-tips-anim;
    animation-duration: .15s;
    animation-delay: .4s;
    animation-fill-mode: forwards;
  }
}
@keyframes link-tips-anim {
  from { opacity: 0;}
  to { opacity: 1;}
}

/deep/.ql-clipboard {
  display: none;
}

.BEV-visual-text {
  position: relative;
  width: 100% ;
  box-sizing: border-box;
  top: 0;
  left: 0;

  p {
    margin: 0;
  }
}

.BEV-toolbar {
  @extend %popup-menu;
  position: absolute;
  top: 0;
  left: 0;
  // max-width: 80%;
  z-index: 1000;

  .BEV-item-wrap {
    width: 100%;
    position: relative;
    padding: 5px;
    margin: 0 0 -5px 0;

    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    justify-content: flex-start;
    box-sizing: border-box;

    // 折り返し許可
    &.BEV-wrap {
      flex-wrap: wrap;
    }
  }

  .BEV-item {
    font-size: .8em;
    border-radius: 2px!important;
    margin: 0 5px 5px 0;

    display: flex;
    align-items: center;
  }
  .BEV-item:last-child {
    margin-right: 0;
  }

  .BEV-triangle {
    position: absolute;
    width: 0;
    height: 0;
    border-style: solid;
    border-width: 10px 8px 0 8px;
    border-color: #d9d9d9 transparent transparent transparent;

    bottom: 0;
    left: 50%;
    transform: translate(-50%, 100%);

    &::before {
      position: absolute;
      width: 0;
      height: 0;
      border-style: solid;
      border-width: 9px 7px 0 7px;
      border-color: #ffffff transparent transparent transparent;

      top: -2px;
      left: 50%;
      transform: translate(-50%, -100%);
      content: " ";
    }
  }

  .link-wrap {
    padding: 7px;
    .BEV-row {
      margin-bottom: 0.2rem;
      &:last-child {
        margin-bottom: 0;
      }
    }
    .BEV-switch {
      margin: 7px 0;
    }

    .BEV-input {
      width: 17em;
      max-width: 100%;
    }
    button {
      margin: 0 7px 0 0;
      font-size: .8em;
    }
    button.BEV-apply {
      @extend %primary-button;
    }
    button.BEV-cancel {
      @extend %danger-button;
    }

  }
}
.BEV-toolbar-inner.BEV-v-reverse {
  .BEV-triangle {
    transform: translate(-50%,-100%) scale(1,-1);
    top: 0;
    left: 50%;
  }
}
</style>
