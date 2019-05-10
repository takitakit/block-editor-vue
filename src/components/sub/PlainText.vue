<template>
  <div ref="ve" class="BEV-plain-text"></div>
</template>
<script>
import ComponentBase from '@/components/sub/ComponentBase.vue'
import Quill from "quill/dist/quill.min.js"
import DOM from "@/scripts/DOM.js"
import Util from "@/scripts/Util.js"

const Clipboard = Quill.import('modules/clipboard')
const Delta = Quill.import('delta')
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

export default {
  extends: ComponentBase,
  props: ['value', 'noLineBreak'],
  data: function() {
    return {
      flgUpdate: false,         // エディタによる変更検知を制御するためのフラグ
      domContainer: null,       // エディタのDOM
      quill: null,              // quillインスタンス
      inited: false,            // 初期化処理の完了フラグ
    }
  },
  watch: {
    // 入力値の変更検知
    value (newVal, oldVal) {
      // console.log('setcontent', newVal, oldVal, this.flgUpdate)
      if (this.flgUpdate) return // エディタ内部での変更は無視する

      this.flgUpdate = true // 再びwatch.value() が呼ばれないようにフラグをセット

      // エディタ外部からの設定の場合
      // エディタの入力値に反映
      if (!newVal.match(/^<p>(.+?)<\/p>/)) {
        // Pタグで囲まれていなければ囲む
        newVal = "<p>" + newVal + "</p>"
      }
      this.domContainer.innerHTML = newVal

      this.$nextTick(() => {
        this.flgUpdate = false
      })
    },
  },
  mounted () {
    // quillの初期化
    this.initQuill()
    setTimeout(() => {
      this.inited = true // 初期化完了フラグON
    }, 0)
  },
  methods: {
    // quillの初期化
    initQuill () {
      if (this.quill) return

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
     
      this.domContainer = this.quill.container.querySelector(".ql-editor")
      // 空文字が指定されている場合は、空のpブロックを生成
      this.domContainer.innerHTML = this.arrangeHtml(this.value)

      this.domContainer.addEventListener('focus', ev=>{
        this.$emit('focus', ev)
      })
    
      // エディターのイベント
      this.quill.on(Quill.events.EDITOR_CHANGE, (ev, range) => {
        if (ev === Quill.events.TEXT_CHANGE) {
          if (!this.flgUpdate) {
            this.onInput()
          }
        }
      })
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
    focus () {
      this.quill.focus()
    },
    // 外部入力のテキストをエディタに合わせたHTMLに変換する
    // (<br>は<p>タグに)
    arrangeHtml (html) {
      if (!html) return '<p><br></p>'

      let _html
      _html = Util.arrangeEditableHtml(html)
      _html = '<p>'+_html.replace(/<br(\s+[^>]+)?(\s*\/)?>/, '</p><p>')+'</p>'
      return _html
    },
    // ツールバーを閉じる(VisualTextとの互換用)
    closeToolbar () { }
  }
}
</script>
<style lang="scss" scoped>
@import '@/styles/valiables.scss';
@import '@/styles/animation.scss';

/deep/.ql-editor {
  outline: none;
  line-height: 1.5em;
}
/deep/.ql-clipboard {
  display: none;
}

.BEV-plain-text {
  width: 100% ;
  box-sizing: border-box;
  top: 0;
  left: 0;

  p {
    margin: 0;
  }
}
</style>
