import Vue from 'vue'
import Vuex from 'vuex'
import VTooltip from 'v-tooltip'
import VueI18n from 'vue-i18n'
import App from './App.vue'
import Util from '@/scripts/Util.js'

Vue.config.productionTip = false

// v-tooltipのオプション
const TOOLTIP_OPTIONS = {
  defaultTemplate: '<div class="BEV-tooltip" role="tooltip"><div class="BEV-tooltip-arrow"></div><div class="BEV-tooltip-inner"></div></div>',
  defaultArrowSelector: '.BEV-tooltip-arrow',
  defaultInnerSelector: '.BEV-tooltip-inner',
  defaultOffset: 5,
  defaultDelay: {show:550, hide:0}, 
}

Vue.use(Vuex)
Vue.use(VTooltip, TOOLTIP_OPTIONS)
Vue.use(VueI18n)

// ファイルからコンポーネントのロード
import {components as COMPONENTS, item_classes as ITEM_CLASSES} from '@/scripts/LoadComponents.js'
for (const name in COMPONENTS) {
  Vue.component(name, COMPONENTS[name])
}

// ページ全体で共通のストア
window.BLOCK_EDITOR_STORE = new Vuex.Store({
  state: {
    activeEditor: null,             // 現在アクティブなエディタDOM要素
  },
  mutations: {
    activeEditor (state, element) {
      state.activeEditor = element
    }
  }
})

// 翻訳データの取得
import i18nMsg from '@/i18n/load.js';

export class BlockEditor {
  constructor(selector, options) {
    let element
    if (typeof selector === 'string') {
      // クエリセレクタの指定
      element = document.querySelector(selector)
    } else if (selector instanceof HTMLElement) {
      // Elementの直接指定
      element = selector
    } else if (selector instanceof NodeList && selector.length) {
      // NodeListの指定
      element = selector[0]
    }

    if (element) {
      const self = this
      const defaultOptions = {
        rootClass: 've',                                  // 全要素を包含する要素のクラス
        baseFontSize: 16,                                 // 基準となるフォントサイズ(px)
        loadItemsFromInputTag: true,                      // アイテムをinputタグから読み込む 
        allowStyledText: false,                           // スタイル付きのテキスト編集許可
        styledTextClasses: ['link'],                      // スタイル付きテキストのインラインCSSクラス(allowStyledText=true時)
        allowCssClass: true,                              // CSSクラスの設定を許可
        cssClasses: null,                                 // CSSクラスのリスト(allowCssClass=true時)
        enabledItemNames: null,                           // サポートするアイテムの種類(nullならすべてサポート)
        // enabledItemNames: ['Table', 'Heading', 'Column', 'Html'],
        itemOrder: [                                      // メニュー上のアイテムの表示順序
          'Paragraph', 'Heading', 'List', 'Table', 'Column', 'Html',
        ],
        enabledItemNamesInColumn: null,                   // カラム内でサポートするアイテムの種類(nullならすべてサポート)
        setAsHtmlIfNotMatched: true,                      // アイテムの種類がどのコンポーネントにも一致しない場合、Htmlアイテムとして扱う
        items: [],                                        // アイテムデータ
        // ImageEditコンポーネント用
        allowImages: true,                                // 画像の添付を許可するか
        imageExtensions: ['jpg', 'jpeg', 'jpe', 'gif', 'png'], // 添付を許可する画像の拡張子  
        maxImageSize: '2MB',                              // アップロード可能な最大画像サイズ（サーバサイドの設定値よりも小さい値を入れること）
        maxImages: 5,                                     // 最大画像数
        allowFileBrowser: false,                          // ファイルブラウザの有効

        // ファイルブラウザの設定
        FileBrowser: {
          url: null,                                // ファイルブラウザのURL(iframe経由で表示)
          width: null,                              // ファイルブラウザの幅
          height: null,                             // ファイルブラウザの高さ
        },
        
        allowHistories: true,                       // 履歴の有効化
        historyMax: 50,                             // 履歴の保存数
        historyMinInterval: 300,                    // 前回の変更から指定以下の時間操作が連続する場合は履歴登録をスキップする（追加、削除、移動、カラム外取り出しを除く）
        historyMaxWait: 1000,                       // 連続した操作が続いても、指定の秒数を超える場合は履歴登録を行う(historyMinInterval < historyMaxWait であること)
        
        outputNewLine: "\n",                        // マークアップ出力用の改行コード
        outputIndent: "\t",                         // マークアップ出力用のインデント
        locale: 'en',                               // 翻訳用ロケール
        onLoad: null,                               // ロード時コールバック
        onUpdate: null,                             // 更新時コールバック
        
        // ------ アイテム固有の設定 ----------------------------------------
        // 段落の設定
        Paragraph: {
          defaultImageAlign: 'left',                    // デフォルトの画像回り込み(left/right/center)
          tagName: 'div',                               // アイテムを識別するタグ名
          tagClassName: 'paragraph-wrap',               // アイテムを識別するクラス名
          dispName: null,                               // ラベル（指定がなければi18nで定義された表示名が使用される）
          presets: null,                         // プリセットリスト
        },
        Heading: {
          levels: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
          levelNames: null,
          defaultLevel: 'h3',
          dispName: null,                               // ラベル（指定がなければi18nで定義された表示名が使用される）
          presets: null,                         // プリセットリスト
        },
        List: {
          types: ['ordered', 'unordered'],              // サポートする種類(ordered | unordered)
          defaultType: 'unordered',                     // デフォルトの種類(ordered | unordered)
          maxRows: 50,                                  // 最大行数
          dispName: null,                               // ラベル（指定がなければi18nで定義された表示名が使用される）
          presets: null,                         // プリセットリスト
        },
        Table: {
          maxRow: 50,                                   // テーブルの最大行数
          minRow: 1,                                    // テーブルの最小行数
          defaultRowNum: 2,                             // テーブルのデフォルト行数
          maxCol: 10,                                   // テーブルの最大列数
          minCol: 2,                                    // テーブルの最小列数
          defaultColNum: 2,                             // テーブルのデフォルト列数 
          dispName: null,                               // ラベル（指定がなければi18nで定義された表示名が使用される）
          presets: null,                         // プリセットリスト
        },
        // カラムの設定
        Column: {
          allowChangeNumColumn: true,                   // カラム数の変更許可
          maxColumn: 4,                                 // 段組の最大数
          minColumn: 2,                                 // 段組の最小数
          defaultNumColumn: 2,                          // デフォルトのカラム数
          tagName: 'div',                               // アイテムを識別するタグ名
          tagClassName: 'column-wrap',                  // アイテムを識別するクラス名
          columnTagName: 'div',                         // カラムを識別するタグ名 
          columnTagClassName: 'column-item',            // カラムを識別するクラス名 
          dispName: null,                               // ラベル（指定がなければi18nで定義された表示名が使用される）
          presets: null,                         // プリセットリスト
        },
        Html: {
          tagName: 'div',                               // アイテムを識別するタグ名
          tagClassName: 'html-wrap',                    // アイテムを識別するクラス名
          dispName: null,                               // ラベル（指定がなければi18nで定義された表示名が使用される）
          presets: null,                         // プリセットリスト
        },
      }
      // 設定値のコピー
      options = Util.deepMerge(defaultOptions, options)
      // console.log(options)

      // 設定ファイルの整合性チェック
      if (!options.rootClass) {
        options.rootClass = 've'
      }
      if (!options.styledTextClasses || options.styledTextClasses.length===0) {
        options.styledTextClasses = ['link']
      }

      // リスト
      if (Array.isArray(options.List.types)) {
        // ordered/undereed以外の項目は削除
        const _types = []
        options.List.types.forEach(type=>{
          if (['ordered', 'unordered'].indexOf(type)!==-1) {
            _types.push(type)
          }
        })
        options.List.types = _types
      }
      if (!Array.isArray(options.List.types) || options.List.types.length===0) {
        // 種類が一つも定義されていない場合
        options.List.types = ['ordered', 'unordered']
      }
      if (options.List.types.indexOf(options.List.defaultType)===-1) {
        // デフォルト種類の定義が不正
        options.List.defaultType = 'unordered'
      }

      // 見出し
      if (!Array.isArray(options.Heading.levels) || options.Heading.levels.length===0) {
        options.Heading.levels = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
      }
      options.Heading.levels = options.Heading.levels.filter(level => ['h1','h2','h3','h4','h5','h6'].indexOf(level)!==-1)
      if (!options.Heading.defaultLevel || options.Heading.levels.indexOf(options.Heading.defaultLevel)===-1) {
        options.Heading.defaultLevel = options.Heading.levels[0]
      }
      // console.log(options.Heading)

      // カラム
      if (options.Column.minColumn < 2) {
        // 最小カラム数が2未満
        options.Column.minColumn = 2
      } else if (options.Column.minColumn > 10) {
        // 最小カラム数が10を超過
        options.Column.minColumn = 10
      }
      if (options.Column.maxColumn < 3) {
        // 最大カラム数が3未満
        options.Column.maxColumn = 3
      } else if (options.Column.maxColumn > 10) {
        // 最大カラム数が10を超過
        options.Column.maxColumn = 10
      }
      if (options.Column.maxColumn < options.Column.minColumn) {
        options.Column.minColumn = 2
        options.Column.maxColumn = 4
      }
      if (options.Column.defaultNumColumn < options.Column.minColumn || 
          options.Column.defaultNumColumn > options.Column.maxColumn) {
        // デフォルトカラム数が最小〜最大の範囲内にない
        options.Column.defaultNumColumn = options.Column.minColumn
      } 
      if (options.Column.minColumn === options.Column.maxColumn) {
        options.Column.allowChangeNumColumn = false
        options.Column.defaultNumColumn = options.Column.minColumn
      }

      // アイテム処理クラスのインスタンス化
      const item_ins = {}
      let column_cls
      for (const name in ITEM_CLASSES) {
        if (options['enabledItemNames'] !== null && 
        options['enabledItemNames'].indexOf(name) === -1) continue; // 項目種類のサポートがなければスキップ
  
        if (name === 'Column') {
          // コラムの場合は、アイテム処理クラスをコンストラクタに渡す必要があるため、
          // 一番最後にインスタンス化する
          column_cls = ITEM_CLASSES[name]
        } else {
          item_ins[name] = new ITEM_CLASSES[name](options)
        }
      }
      if (column_cls) {
        // コラムアイテム処理クラスをインスタンス化
        item_ins['Column'] = new column_cls(options, item_ins)
      }

      const items = options.items && options.items instanceof Array
                      ? options.items
                      : []
      // アイテムデータの正常化
      const _items = []
      items.forEach(item => {
        // サポートされていないアイテムは除外する
        if (options.enabledItemNames !== null && 
          options.enabledItemNames.indexOf(item.name)===-1) return
        const ins = item_ins[item.name]
        if (ins) {
          ins.normalizeItem(item)
          const def = ins.getPreset(item)
          if (def) { // 定義セットに一致するものが見つかった
            item.preset = def
          }
        }
        _items.push(item)
      })

      const store = new Vuex.Store({
        state: {
          appOptions: options,                  // 実行時のオプション
          items: _items,                        // 全アイテムリスト
          layoutMode: 'pc',                     // レイアウトモード(pc or sp)
          isTouchDevice: Util.isTouchDevice(),  // タッチデバイスかどうかの判定
          rootElement: element,                 // Vueが適用されたDOM要素
          activeItem: null,                     // 現在アクティブなアイテム
          activeChildItem: null,                // 現在アクティブなアイテム（子要素）
          hoverItem: null,                      // 現在ホバー中のアイテム
          draggingItem: null,                   // ドラッグ中のアイテム
          editorInstance: self,                 // BlockEditorVueのインスタンス
          itemInstances: item_ins,              // アイテムのデータ処理クラスのインスタンス
          flgFileBrowser: false,                // ファイルブラウザの表示制御フラグ
          fileBrowserRef: null,                 // ファイルブラウザのDOM要素
          editorWidth: null,                    // エディタ全体の幅(自動計算)
          histories: [],                        // アンドゥ・リドゥ用の履歴データ
          historyIndex: 0,                      // 現在の履歴位置
          historyWaitChangeFrom: null,          // 最初に発生した変更日時（同一内容変更のグループ化の制御用）
          flgHistory: false,                    // 履歴の追加制御フラグ（undoやredoの際の値変更イベントは無視する）
        },
        mutations: {
          layoutMode (state, mode) {
            state.layoutMode = mode
          },
          activeItem(state, item) {
            // console.log('activateItem', item ? item.name : null)
            state.activeItem = item
          },
          activeChildItem(state, item) {
            state.activeChildItem = item
          },
          hoverItem(state, item) {
            state.hoverItem = item
          },
          draggingItem(state, item) {
            state.draggingItem = item
          },
          itemInstances(state, data) {
            state.itemInstances = data
          },
          editorWidth(state, data) {
            state.editorWidth = data
          },
          flgFileBrowser (state, val) {
            state.flgFileBrowser = val
          },
          fileBrowserRef (state, val) {
            state.fileBrowserRef = val
          },
          // 履歴の追加
          histories (state, delta) {
            // 制御フラグが立っている場合は
            // UNDO、REDOによる変更処理による検知のため、
            // 追加をスキップする
            if (state.flgHistory) return false

            // 現在のタイムスタンプ取得
            const history = {
              timestamp: (new Date()).getTime(),
              delta: delta
            }            
            if (history.delta.type === 'change' && state.historyWaitChangeFrom===null) {
              state.historyWaitChangeFrom = history.timestamp
            }

            const options = state.appOptions
            if (state.histories.length && history.delta.type === 'change' && state.historyIndex >= 0) {
              // 履歴のアクションが「変更」の場合で、履歴の位置が設定されている場合
              const prev_history = state.histories[state.historyIndex] // 現在の履歴を取得
              if (prev_history.delta.type === 'change' &&
                history.target === prev_history.target &&
                history.delta.key === prev_history.delta.key) {
                // 前回の操作と同一の変更

                const max_wait_exceeds = history.timestamp - state.historyWaitChangeFrom >= options['historyMaxWait']
                if (history.timestamp - prev_history.timestamp < options['historyMinInterval'] && !max_wait_exceeds) {
                  // 前回の操作と今回の操作の時間の差が一定以下
                  // かつ最大経過時間を超えていない場合
                  // 操作をグループ化し一つの変更と見なす
                  state.histories.splice(state.historyIndex, 1)
                  history.delta.data = prev_history.delta.data
                } else {
                  // 前回の操作と今回の操作の時間の差が一定以上か、
                  // 最大経過時間を超えている場合
                  state.historyWaitChangeFrom = null // タイマーリセット
                }
              } else {
                // 前回と同一でない変更
                state.historyWaitChangeFrom = null // タイマーリセット
              }
            } else {
              state.historyWaitChangeFrom = null // タイマーリセット
            }

            if (state.histories.length >= options['historyMax']) {
              // 履歴の最大数に達した場合、古いものから履歴をひとつ削除
              state.histories.shift()
            }

            // リドゥ中の場合は、変更された地点から後の履歴は破棄
            state.histories.splice(state.historyIndex + 1, state.histories.length - state.historyIndex - 1)

            state.histories.push(history)
            state.historyIndex = state.histories.length - 1
          },
          flgHistory(state, val) {
            state.flgHistory = val
          },
          // 履歴位置の増減
          decrementHistoryIndex (state) {
            state.historyIndex--
          },
          incrementHistoryIndex(state) {
            state.historyIndex++
          }
        }
      })

      // 翻訳プラグイン
      const i18n = new VueI18n({
        locale: options.locale,
        fallbackLocale: 'en',
        silentTranslationWarn: true,
        messages: i18nMsg
      })

      const input_html = options.loadItemsFromInputTag ? element.value : null
      let input_tag = ''
      if (options.loadItemsFromInputTag) { // タグからアイテムデータを読み込むモードの場合
        // 読み込んだinputタグのnameをつかってhiddenタグを再構築する
        let name = element.getAttribute('name')
        if (!name) name = 'send_data'
        input_tag = `<template v-slot:sendData><input type="hidden" name="${name}" ref="sendData" /></template>`
      }

      this.vue = new Vue({
        components: {App},
        template: `<App 
          :html="html"
          :items="items"
          ref="BlockEditor">
            ${input_tag}
        </App>`,
        el: element,
        i18n,
        store,
        data: function () {
          return {
            items: _items,
            html: input_html ? input_html : ''
          }
        },
      })

      // HTMLを取得する
      this.getHtml = () => {
        if (!this.vue.$refs || !this.vue.$refs.BlockEditor) return null
        return this.vue.$refs.BlockEditor.getHtml()
      }
    }
  }
}
window.BlockEditor = BlockEditor