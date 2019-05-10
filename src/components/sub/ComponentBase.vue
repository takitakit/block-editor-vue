<script>
import Util, {Rect} from '@/scripts/Util.js'
const FILE_BROWSER_INFO = {}
let UPDATE_TIMER

// 全コンポーネントで共通して使用する処理を記述する
export default {
  computed: {
    // タッチデバイスかどうか
    isTouchDevice () {
      return this.$store.state.isTouchDevice
    },
    // エディタの幅
    editorWidth () {
      return this.$store.state.editorWidth
    },
    // レイアウトモード
    layoutMode () {
      return this.$store.state.layoutMode
    },
  },
  methods: {
    addHistory (delta) {
      if (this.getConfig('allowHistories')) {
        // 履歴有効時
        this.$store.commit('histories', delta)
      }
      // onUpdateコールバックの呼び出し
      this.onUpdate()
    },
    // onUpdateコールバックの呼び出し
    // 連続した操作をある程度間引く
    onUpdate () {
      // onUpdateコールバックの呼び出し
      if (UPDATE_TIMER) {
        clearTimeout(UPDATE_TIMER)
        UPDATE_TIMER = null
      }
      UPDATE_TIMER = setTimeout(()=>{
        const html = this.getHtml()
        if (this.$root.$refs.sendData) {
          // データ送信用のinputが設置されている
          // 変更されたHTMLをvalueに反映
          this.$root.$refs.sendData.value = html
        }
        const on_update = this.getConfig('onUpdate')
        if (on_update) {
          // onUpdateコールバックが有効
          on_update.call(
            this.$root, html
          )
        }
      }, 200)
    },
    // HTMLを取得する
    getHtml () {
      const nl = this.getConfig('outputNewLine')
      const item_ins = this.$store.state.itemInstances
      const items = this.$store.state.items
      let html = `<div class="${this.getConfig('rootClass')}">${nl}`
      if (items) {
        for (const item of items) {
          const ins = item_ins[item.name]
          if (ins) {
            const _html = ins.getHtml(item, 1)
            if (_html) {
              html += `${_html}${nl}`
            }
          }
        }
      }
      html += `</div>${nl}`
      return html
    },
    // アイテムの差分を適用する
    // (アンドゥ、リドゥ用)
    // patch: 差分データ
    // 戻り値: 差分の適用を取り消す差分データ
    applyDelta (delta) {
      if (!Array.isArray(delta)) {
        delta = [delta]
      }
      const ret = []
      delta.forEach(d => {
        if (d.type === 'insert') {
          // 挿入
          let rev_delta = {
            type: 'delete',
            target: d.target,
            key: d.key,
          }
          if (typeof d.length !== 'undefined') {
            // 複数データ（サイズ1の配列も含む）挿入
            d.target.splice(d.key, 0, ...d.data)
            rev_delta.length = d.length
          } else {
            // 単一のデータ挿入
            d.target.splice(d.key, 0, d.data)
          }
          ret.push(rev_delta)
        } else if (d.type === 'delete') {
          // 削除
          let rev_delta = {
            type: 'insert',
            target: d.target,
            key: d.key,
          }
          if (typeof d.length !== 'undefined') {
            // 複数個のデータ(サイズ1の配列も含む)削除
            rev_delta.data = d.target.splice(d.key, d.length)
            rev_delta.length = d.length
          } else {
            rev_delta.data = d.target.splice(d.key, 1)[0]
          }
          ret.push(rev_delta)
        } else if (d.type === 'change') {
          const curr_val = Util.deepCopy(d.target[d.key])
          this.$set(d.target, d.key, d.data)
          ret.push({
            type: 'change',
            target: d.target,
            key: d.key,
            data: curr_val
          })
        } else if (d.type === 'move') {
          const item = d.target.splice(d.fromIndex, 1)[0]
          d.target.splice(d.toIndex, 0, item)
          ret.push({
            type: 'move',
            target: d.target,
            fromIndex: d.toIndex,
            toIndex: d.fromIndex
          })
        }
      })
      if (ret.length===1) return ret.shift()
      else return ret
    },

    // エディタのリサイズ時イベント
    onResize (width) {},

    // 引数で渡されたアイテムが
    // 包含される親アイテムのリストを返す
    // item=Columnの場合は、Columnのカラムのアイテムリストを、
    // それ以外はトップレベルの全アイテムリストを返す
    getParentItems (item) {
      if (this.$store.state.items.indexOf(item) !== -1) return this.$store.state.items

      let ret_items = null
      this.$store.state.items.some(_item => {
        if (_item.name !== 'Column') return
        _item.columns.some(_column => {
          if (_column.items.indexOf(item) !== -1) {
            // Columnの子アイテム内に発見
            ret_items = _column.items
          }
        })
      })
      return ret_items
    },

    getItemInstance () {
      return this.$store.state.itemInstances[this.item.name]
    },

    // ファイルブラウザの表示
    showFileBrowserWindow (callback) {
      // ファイルブラウザの表示制御
      this.$store.commit('flgFileBrowser', true)

      // 設定ファイル取得
      const conf = this.getConfig('FileBrowser')
      const a = document.createElement('a')
      a.setAttribute('href', conf.url)
      FILE_BROWSER_INFO.origin = `${a.protocol}//${a.host}`
      FILE_BROWSER_INFO.callback = callback
      // console.log(a.protocol, a.host, a.hostname, a.port, a.hash, a.pathname, a.search)

      // ファイルブラウザからのファイルURL取得
      window.addEventListener('message', this._fileBrowserCallback)
      
      // ファイルブラウザの外のクリック検知
      if (this.$store.state.fileBrowserRef) {
        this.$store.state.fileBrowserRef.addEventListener('click', this.closeFileBrowserWindow)
      }
    },
    // ファイルブラウザを閉じる
    closeFileBrowserWindow () {
      // ファイルブラウザの非表示
      this.$store.commit('flgFileBrowser', false)
      window.removeEventListener('message', this._fileBrowserCallback)
      if (this.$store.state.fileBrowserRef) {
        this.$store.state.fileBrowserRef.removeEventListener('click', this.closeFileBrowserWindow)
      }
    },
    _fileBrowserCallback (ev) {
      if (FILE_BROWSER_INFO.origin !== ev.origin) return
     
      // 呼び出し元にファイルを返す
      FILE_BROWSER_INFO.callback(ev.data)
      // ファイルブラウザを閉じる
      this.closeFileBrowserWindow()
    },
    // ポップアップメニューの配置処理
    // target: メニュー
    // base: 基準となる要素 or 位置を表すRectインスタンス
    // offset: baseに対して配置されるtargetのマージン
    // ignore_tf: 位置の計算時、transformの移動量を無視するかどうか
    arrangePopup (target, base, offset, ignore_tf) {
      if (typeof offset === 'undefined') offset = {x:0, y:0}
      if (typeof ignore_tf === 'undefined') ignore_tf = false

      target.style.top = 0
      target.style.left = 0
      const target_abs_pos = this._absPosition(target, ignore_tf)
      const target_rel_pos = this._relPosition(target)
      const target_h = parseFloat(target.offsetHeight)
      const target_w = parseFloat(target.offsetWidth)
            
      // getBBoxはbaseがsvg要素の場合
      const base_abs_pos = 
        base instanceof Rect
          ? {x:base.x, y:base.y}
          : this._absPosition(base, ignore_tf)
      const base_h = 
        base instanceof Rect 
          ? base.height
          : parseFloat(base.getBBox ? base.getBBox().height : base.offsetHeight)
      const base_w = 
        base instanceof Rect 
          ? base.width
          : parseFloat(base.getBBox ? base.getBBox().width : base.offsetWidth)
      
      const dx = base_abs_pos.x - target_abs_pos.x
      const dy = base_abs_pos.y - target_abs_pos.y
      
      const doc_w = parseFloat(document.documentElement.clientWidth)
      const doc_h = parseFloat(document.documentElement.clientHeight)

      const scroll_x = window.pageXOffset
      const scroll_y = window.pageYOffset
            
      let x, y
      if (base_abs_pos.x + target_w + offset.x > doc_w + scroll_x) {
        // 画面右端を超過する
        x = dx + offset.x - target_w + base_w
      } else {
        x = dx + offset.x
      }
      
      if (base_abs_pos.y - target_h - offset.y < scroll_y) {
        // 画面上端を超過する
        y = dy + base_h + offset.y
      } else {
        y = dy - target_h - offset.y
      }

      // console.log('offset=', offset)
      // console.log('target=', target)
      // console.log('base=', base)
      // console.log('(scroll_x,scroll_y)=', scroll_x, scroll_y)
      // console.log('target_abs_pos:', target_abs_pos)
      // console.log('target_rel_pos:', target_rel_pos)
      // console.log('target (w,h)=', target_w, target_h)
      // console.log('base_abs_pos:', base_abs_pos)
      // console.log('base (w,h)=', base_w, base_h)
      // console.log('(dx,dy)=', dx, dy)
      // console.log('doc (w,h)=', doc_w, doc_h)
      // console.log('(x,y)=',x,y)
      
      target.style.left = x + 'px'
      target.style.top = y + 'px'
    },
    // 要素の画面内の絶対位置を返す
    // (transformによる移動は除外)
    _absPosition (elm, ignore_tf) {
      const rect = elm.getBoundingClientRect()
      // console.log(rect)
      const style = window.getComputedStyle(elm)
      const vendors = ['webkit', 'Moz']
      let transform
      vendors.some(v => {
        if (style[v+'Transform']) {
          transform = style[v+'Transform']
          return true
        }
      })
      
      const REG_MATRIX = /matrix\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)/
      const ts = {x:0, y:0}
      if (!ignore_tf) {
        let matched
        if (transform && (matched=transform.match(REG_MATRIX))) {
          const m = matched.slice(1)
          ts.x = m[4]
          ts.y = m[5]
        }
        // console.log('(ts.x,ts.y)=',ts.x,ts.y)
      }

      return {
        x: window.pageXOffset + rect.x - ts.x,
        y: window.pageYOffset + rect.y - ts.y
      }
    },
    // 設定の取得
    getConfig (key) {
      const options = this.$store.state.appOptions

      let m
      if ((m = key.match(/^(.+?)\.(.+?)$/))) {
        // Category.key の形式
        const category = m[1]
        const key = m[2]
        if (typeof options[category] !== 'undefined' && typeof options[category][key] !== 'undefined') {
          return options[category][key]  
        }
        return null
      }

      let item_name
      if (typeof this.item !== 'undefined') {
        item_name = this.item.name
      }
      
      if (typeof item_name !== 'undefined' && typeof options[item_name] !== 'undefined' && typeof options[item_name][key] !== 'undefined') {
        return options[item_name][key]
      } else if (typeof options[key] !== 'undefined') {
        return options[key]
      } else {
        return null
      }
    },
    // アクティブ状態にする
    activateItem (item) {
      // エディタ全体をアクティブにする
      window.BLOCK_EDITOR_STORE.commit('activeEditor', this.$store.state.rootElement)

      // 自分をアクティブにする
      if (item.name === 'Column') {
        // アクティブにしようとしているアイテムがColumnの場合は例外
        // Columnの場合は、それ自身がアクティブにはならず、
        // 子アイテムのみがアクティブになる
        // (子アイテムが一つもなければ、自身をアクティブにする)
        let _item
        for (let i=0; i<item.columns.length; i++) {
          const column = item.columns[i]
          for (let j=0; j<column.items.length; j++) {
            _item = column.items[j]
            break
          }
          if (_item) break
        }
        if (_item) {
          this.$store.commit('activeItem', _item)
        } else {
          this.$store.commit('activeItem', item)
        }
      } else {
        this.$store.commit('activeItem', item)
      }
    },
    // 要素の親要素からの相対位置を返す
    _relPosition (elm) {
      const style = window.getComputedStyle(elm)
      return {
        x: parseFloat(style.left.replace(/px/, '')),
        y: parseFloat(style.top.replace(/px/, ''))
      }
    },

    _test (arg) {
      // console.log(arg)
    },
    _alert (arg) {
      alert(arg)
    }
  },
  watch: {
    // エディタ幅の監視 
    editorWidth (newVal) {
      this.onResize(newVal)
    }
  }
}
</script>

<style lang="scss" scoped>
</style>