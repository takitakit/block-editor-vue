// アイテムデータ処理クラスの基底クラス
export default class ItemBase {

  constructor (options) {
    this.options = options
    this.baseIndentLevel = 0
    this.name
  }

  // 設定取得
  getConfig (key) {
    if (typeof this.options[this.name] !== 'undefined' && typeof this.options[this.name][key] !== 'undefined') {
      return this.options[this.name][key]
    } else if (typeof this.options[key] !== 'undefined') {
      return this.options[key]
    } else {
      return null
    }
  }

  // 渡されたHTMLElementが、このコンポーネントで処理可能か判断する 
  matches () { return false }

  // 渡されたHTMLElementから、コンポーネントで扱えるデータに変換する
  getItem (element) { return null }

  // アイテムデータをHTMLに変換する
  getHtml(item, base_ind) {
    if (typeof base_ind !== 'undefined') {
      this.baseIndentLevel = base_ind
    }
    return null
  }

  // アイテムデータから、
  // 定義セット情報を取得する
  getPreset (item) {
    const conf = this.getConfig('presets')
    if (!conf) return null

    let matched_def = null
    conf.some(def => {
      let key_num = 0, matched_num = 0
      for (let key in def) {
        if (key === 'dispName') continue
        if (def[key] === item[key]) matched_num++
        key_num++
      }      
      if (matched_num === key_num) { // 一致する定義セットが見つかった
        matched_def = def
        return true
      }
    })
    return matched_def
  }

  // 空のデータを返す
  getEmptyItem() { return null }

  // インデントを返す
  _indent (level) {
    let indent = this.options['outputIndent']     // インデント
    return indent.repeat(this.baseIndentLevel + level)
  }
}