import mergeWith from 'lodash/mergeWith'
import cloneDeep from 'lodash/cloneDeep'

export default class Util {
  static generateID(len, type) {
    if (typeof len === 'undefined') len = 8
    if (typeof type === 'undefined') type = 'alphanumeric'

    let chars
    if (type === 'alphanumeric') chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    else if (type === 'numeric') chars = '0123456789'

    const clen = chars.length
    let r = ""
    for (let i = 0; i < len; i++) {
      r += chars[Math.floor(Math.random() * clen)]
    }
    return r
  }

  // WYSIWYGエディタで入力されたHTMLを整形する
  static arrangeEditableHtml(html) {
    if (!html) return ''
    // <p><br></p>の形式は<p>に変換
    html = html.replace(/<p(\s+[^>]+)?><br(\s+[^>]+)?(\s*\/)?><\/p>/ig, '<p></p>')
    // DIV および Pタグの開始タグは改行に変換
    html = html.replace(/(<div.*?>|<p.*?>)/ig, '<br>')
    // DIV および Pタグの終了タグは除去
    html = html.replace(/(<\/\s*div\s*>|<\/\s*p\s*>)/ig, '')
    // 先頭のBRタグは除去
    html = html.replace(/^(<br(\s+[^>]+)?(\s*\/)?>)+/i, '')
    return html
  }

  // データをクリップボードにコピーする
  static copyToClipboard(data) {
    let elm = document.createElement('div')
    elm.appendChild(document.createElement('pre')).textContent = data

    elm.style.position = 'fixed'
    elm.style.left = '-100%'

    document.body.appendChild(elm)
    document.getSelection().selectAllChildren(elm)

    let result = document.execCommand('copy')
    document.body.removeChild(elm)
    return result
  }

  // サイズ表記からバイト数への変換
  static sizeToByte(size_str) {
    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
    size_str = size_str.toUpperCase()
    const reg = new RegExp('^(([1-9]\\d*|0)(\\.\\d+)?)\\s*(' + units.join('|') + '?)$')

    if (size_str.match(reg)) {
      const size = RegExp.$1
      const unit = RegExp.$4
      const pos = units.indexOf(unit)
      return Math.floor(size * Math.pow(1024, pos))
    }
    return null
  }

  // タッチデバイス判定
  static isTouchDevice() {
    return ('ontouchstart' in document) && ('orientation' in window)
  }

  // オブジェクトのディープコピー
  static deepCopy(obj) {
    return cloneDeep(obj)
  }
  // オブジェクトのディープマージ
  static deepMerge(target, src) {
    return mergeWith(target, src, (obj, src)=>{
      if (Array.isArray(obj)) {
        return src
      }
    })
  }
}

export class Rect {
  constructor(x, y, w, h) {
    this.x = x
    this.y = y
    this.width = w
    this.height = h
  }
}