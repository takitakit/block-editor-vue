# block-editor-vue

「block-editor-vue」は段落、見出し、リスト、その他などのブロック要素を自由な組み合わせで積み上げ可能なブロックエディタです。  
コンテンツの編集を行う場合、CKEditorやTinyMCEなどのWSYIWIGエディタを使用すると自由度は高いですが、要素の移動などが直感的に出来なかったり、要素を削除したときにゴミのマークアップが残ったりするなど、操作に慣れが必要です。  
また、CMSの管理画面などを第三者に開示する場合、ページ内で使用できるマークアップの種類を限りたいなどの制限が必要な場合があります（例えば、大見出し、小見出しと本文のみ許可したいが、テーブルは不許可にしたい、など）。  
そこで、なるべく操作は簡単で、使用する要素の制限をプログラマブルに設定可能な、HTMLマークアップ編集のためのツールを制作しました。  

<p align="center">
  <br>
  <img width="400" src="./screenshot.png" alt="logo of vue-awesome repository">
  <br>
</p>

## ビルド

```
npm install
npm run build
```

## デモ

[Codepen](https://codepen.io/takitakit/pen/VOabaN)

## 使い方

### Step 1: HTMLファイルにライブラリをリンクする

```
<script src="block-editor-vue.js"></script>
```

### Step 2: 起点となるHTMLマークアップを作る

#### INPUTタグ経由でデータを入出力したい場合

```
<input name="content" id="editor" type="hidden" value="(Escaped HTML markup)">
```

valueに対して設定されたHTMLマークアップデータをエディタが受け取り、初期表示を行います。HTMLマークアップデータは、種類ごとに決められた構造になっている必要があります。

#### 純粋にブロックエディタのみ使用する場合

```
<div id="editor"></div>
```

### Step 3: ライブラリを起動する

```
new BlockEditor('#editor');
```

オプションを設定する場合
```
new BlockEditor('#editor', {rootClass: 've'});
```

## オプション

- [Common](#common)
  - [rootClass](#rootclass)
  - [baseFontSize](#basefontsize)
  - [loadItemsFromInputTag](#loaditemsfrominputtag)
  - [allowStyledText](#allowstyledtext)
  - [styledTextClasses](#styledtextclasses)
  - [allowCssClass](#allowcssclass)
  - [cssClasses](#cssclasses)
  - [enabledItemNames](#enableditemnames)
  - [itemOrder](#itemorder)
  - [enabledItemNamesInColumn](#enableditemnamesincolumn)
  - [setAsHtmlIfNotMatched](#setashtmlifnotmatched)
  - [items](#items)
  - [allowImages](#allowimages)
  - [imageExtensions](#imageextensions)
  - [maxImages](#maximages)
  - [allowFileBrowser](#allowfilebrowser)
  - [allowHistories](#allowhistories)
  - [historyMax](#historymax)
  - [historyMinInterval](#historymininterval)
  - [historyMaxWait](#historymaxwait)
  - [outputNewLine](#outputnewline)
  - [outputIndent](#outputindent)
  - [locale](#locale)
- [Paragraph](#paragraph)
  - [defaultImageAlign](#defaultimagealign)
  - [tagName](#tagname)
  - [tagClassName](#tagclassname)
  - [dispName](#dispname)
  - [presets](#presets)
- [Heading](#heading)
  - [levels](#levels)
  - [defaultLevel](#defaultlevel)
  - [levelNames](#levelnames)
  - [dispName](#dispname-1)
  - [presets](#presets-1)
- [List](#list)
  - [types](#types)
  - [defaultType](#defaulttype)
  - [maxRows](#maxrows)
  - [dispName](#dispname-2)
  - [presets](#presets-2)
- [Table](#table)
  - [maxRow](#maxrow)
  - [minRow](#minrow)
  - [defaultRowNum](#defaultrownum)
  - [maxCol](#maxcol)
  - [minCol](#mincol)
  - [defaultColNum](#defaultcolnum)
  - [dispName](#dispname-3)
  - [presets](#presets-3)
- [Column](#column)
  - [allowChangeNumColumn](#allowchangenumcolumn)
  - [maxColumn](#maxcolumn)
  - [minColumn](#mincolumn)
  - [defaultNumColumn](#defaultnumcolumn)
  - [tagName](#tagname-1)
  - [tagClassName](#tagclassname-1)
  - [columnTagName](#columntagname)
  - [columnTagClassName](#columntagclassname)
  - [dispName](#dispname-4)
  - [presets](#presets-4)
- [Html](#html)
  - [tagName](#tagname-2)
  - [tagClassName](#tagclassname-2)
  - [dispName](#dispname-5)
  - [presets](#presets-5)
- [Events](#events)
  - [onLoad](#onload)
  - [onUpdate](#onupdate)
- [プリセットについて](#プリセットについて)

### Common
#### rootClass

生成されるHTMLの全要素を内包する、ルート要素のCSSクラス名。  
デフォルトではHTMLは下記のようなマークアップになります。

```
<div class="ve">...(内包する要素のHTML)...</div>
```

```
type: string
default: 've'
```

#### baseFontSize

エディタの表示の基準となるフォントサイズ(px)
```
type: integer
default: 16
```

#### loadItemsFromInputTag

エディタの起動時に、ブロック要素の構成をinputタグから読み込むかどうか。  
他ページからHTMLマークアップをPOSTして、エディタで編集を行いたい場合に使用します。  
trueにした場合、例えば下記のようなinputをエディタの起点として指定すると、見出し、段落が初期状態として読み込まれます。  

```
<input type="hidden" value="&lt;h3&gt;見出し&lt;/h3&gt;
&lt;div class=&quot;paragraph-wrap&quot;&gt;段落のテキスト&lt;/div&gt;">
```

```
type: boolean
default: true
```

#### allowStyledText

各ブロック要素内で、インラインスタイル付きのテキスト編集を許可するかどうか  
trueにした場合、"styledTextClasses"オプションでインラインスタイルのCSSクラスを指定できます。

```
type: boolean
default: false
```

#### styledTextClasses

インラインスタイルとしてテキストに適用するCSSクラス名。  
クラス名にはprefixとして’ve-‘がつけられます。  
"link"のみ予約語で、テキストに対してリンクを設定することができます。  
※ このオプションを使用するには、allowStyledText=true である必要があります。

```
type: array
default: ['link']
```

##### Example
```
styledTextClasses: [
  'link',  // allow link tag (reserved word)
  'bold',  // css class name is 've-bold'
  {red: 'display name of "red"'},  // css class name is 've-red' and displayed 'red' on style toolbar.
]
```

#### allowCssClass

各ブロック要素に対して、CSSクラス名の指定を許可するかどうか  
trueにした場合、"cssClasses"オプションで選択可能なCSSクラスを指定できます。

```
type: boolean
default: true
```

#### cssClasses

ブロック要素に対して適用するCSSクラス名のリスト  
nullを設定した場合は、選択式ではなく自由入力が可能。

```
type: array
default: null
```

##### Example

```
cssClasses: [
  'class1',  // class="class1"
  'class2',  // class="class2"
  {class3: 'Class name 3'} // class="class3" displayed "Class name 3" on editor
]
```

#### enabledItemNames

エディタで使用可能なブロック要素の種類  
nullを指定した場合、全ての種類が使用可能。

```
type: array
default: null
options: 'Paragraph', 'Heading', List, 'Table', 'Column', 'Html'
```

##### Example

```
// only 'Paragraph' and 'Heading' are supported
enabledItemNames: ['Paragraph', 'Heading']
```

#### itemOrder

追加メニュー上の、ブロック要素の表示順

```
type: array
default: ['Paragraph', 'Heading', 'List', 'Table', 'Column', 'Html']
options: 'Paragraph', 'Heading', List, 'Table', 'Column', 'Html'
```

#### enabledItemNamesInColumn

カラム要素内で使用可能なブロック要素の種類  
nullを指定した場合、全ての種類が使用可能。

```
type: array
default: null
options: 'Paragraph', 'Heading', List, 'Table', 'Html'
```

#### setAsHtmlIfNotMatched

inputからブロック要素の構成を読み込む場合(loadItemsFromInputTag=true時)に、どの要素にもマッチしなかった場合に、その要素をHTML要素として扱うかどうか。

```
type: boolean
default: true
```

#### items

エディタ起動時に初期構成として読み込む、ブロック要素の構成データ

```
type: object
default: null
```

#### allowImages

ブロック要素上で画像の添付を許可するかどうか(現時点ではParagraphのみ対応)

```
type: boolean
default: true
```

#### imageExtensions

添付を許可する画像の拡張子のリスト(allowImages=true時)

```
type: array
default: ['jpg', 'jpeg', 'jpe', 'gif', 'png']
```

#### maxImages

一つの要素内で添付可能な最大画像数

```
type: integer
default: 5
```

#### allowFileBrowser

画像の外部アップローダの使用を許可するかどうか  
trueの場合、別途FileBrowserオプションの設定が必要。

```
type: boolean
default: false
```

#### allowHistories

エディタ上の操作の履歴保持(Undo / Redo)を許可するかどうか

```
type: boolean
default: true
```

#### historyMax

保持する操作履歴のステップ数

```
type: integer
default: 50
```

#### historyMinInterval

操作履歴について、前回の変更から指定以下の時間操作が連続する場合は履歴登録をスキップする(msec)。  
(文字入力など短時間で多くの操作ステップが発生したときに、ステップ数が細かくなり過ぎるのを防ぐため)

```
type: integer
default: 300
```

#### historyMaxWait

操作履歴について、連続した操作が続いても、起点の操作から指定の時間を超える場合は履歴登録を行う。(msec)
(文字入力など、継続して文字を入力していても、ある程度の時間が経過すると履歴としてステップを登録するために使用。

```
type: integer
default: 1000
notice: historyMinInterval < historyMaxWait
```

#### outputNewLine

HTMLマークアップ出力時に使用する改行コード

```
type: string
default: "\n"
```

#### outputIndent

HTMLマークアップ出力時に使用するインデントの文字

```
type: string
default: "\t"
```

#### locale

エディタの表示に使用する翻訳ロケール名

```
type: string
default: 'en'
options: 'en', 'ja'
```

### Paragraph

#### defaultImageAlign

画像に設定する文字の回り込み設定

```
type: string
default: 'left'
options: 'left', 'center', 'right'
```

#### tagName

ブロック要素を識別するHTMLマークアップ上のタグ名

```
type: string
default: 'div'
```

#### tagClassName

ブロック要素を識別するHTMLマークアップ上のタグのCSSクラス名

```
type: string
default: 'paragraph-wrap'
```

tagName='div', tagClassName='paragraph-wrap'の場合、下記のようなマークアップになります。  

```
<div class="paragraph-wrap">...(contents in Paragraph)...</div>
```

#### dispName

ブロック要素の表示名  
nullが設定されると、翻訳データに基づいた名称が使用される。

```
type: string
default: null
```

#### presets

CSSクラス名、その他の要素を固定して組み合わせた、プリセットのリスト  
プリセットの詳細は[こちら](#プリセットについて)を参照

```
type: array
default: null
```

### Heading
#### levels

見出しレベルのリスト

```
type: array
default: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']
options: 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
```

#### defaultLevel

デフォルトの見出しレベル

```
type: string
default: 'h3'
options: 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
```

#### levelNames

見出しレベルごとに設定する表示名  
nullが設定されると、見出しレベルの設定を大文字に変換したものがそのまま使用されます。(例：H3)

```
type: object
default: null
```

##### Example

```
levelNames: {
  h2: 'extra-big heading', 
  h3: 'big heading', 
  h4: 'middle heading', 
  h5: 'small heading', 
  h6: 'extra-small heading'
}
```

#### dispName

ブロック要素の表示名  
nullが設定されると、翻訳データに基づいた名称が使用されます。

```
type: string
default: null
```

#### presets

CSSクラス名、その他の要素を固定して組み合わせた、プリセットのリスト  
プリセットの詳細は[こちら](#プリセットについて)を参照

```
type: array
default: null
```

### List

#### types

リストの種類の定義リスト

```
type: array
default: ['ordered', 'unordered']
options: 'ordered', 'unordered'
```

#### defaultType

デフォルトのリストの種類

```
type: string
default: 'unordered'
options: 'ordered', 'unordered'
```

#### maxRows

リストに追加できる最大行数

```
type: integer
default: 50
```

#### dispName

ブロック要素の表示名  
nullが設定されると、翻訳データに基づいた名称が使用されます。

```
type: string
default: null
```

#### presets

CSSクラス名、その他の要素を固定して組み合わせた、プリセットのリスト  
プリセットの詳細は[こちら](#プリセットについて)を参照

```
type: array
default: null
```

### Table

#### maxRow

テーブルに追加できる最大行数

```
type: integer
default: 50
```

#### minRow

テーブルに追加できる最小行数

```
type: integer
default: 1
```

#### defaultRowNum

デフォルトの行数

```
type: integer
default: 2
```

#### maxCol

テーブルに追加できる最大列数

```
type: integer
default: 10
```

#### minCol

テーブルに追加できる最小列数

```
type: integer
default: 2
```

#### defaultColNum

デフォルトの列数

```
type: integer
default: 2
```

#### dispName

ブロック要素の表示名  
nullが設定されると、翻訳データに基づいた名称が使用されます。

```
type: string
default: null
```

#### presets

CSSクラス名、その他の要素を固定して組み合わせた、プリセットのリスト  
プリセットの詳細は[こちら](#プリセットについて)を参照

```
type: array
default: null
```

### Column

#### allowChangeNumColumn

カラム数の変更を許可するかどうか

```
type: boolean
default: true
```

#### maxColumn

適用可能な最大カラム数

```
type: integer
default: 4
```

#### minColumn

適用可能な最小カラム数

```
type: integer
default: 2
```

#### defaultNumColumn

デフォルトのカラム数

```
type: integer
default: 2
```

#### tagName

ブロック要素を識別するHTMLマークアップ上のタグ名

```
type: string
default: 'div'
```

#### tagClassName

ブロック要素を識別するHTMLマークアップ上のタグのCSSクラス名

```
type: string
default: 'column-wrap'
```

#### columnTagName

ブロック要素内のカラム要素を識別するHTMLマークアップ上のタグ名

```
type: string
default: 'div'
```

#### columnTagClassName

ブロック要素内のカラム要素を識別するHTMLマークアップ上のタグのCSSクラス名

```
type: string
default: 'column-item'
```

tagName: 'div', tagClassName: 'column-wrap', columnTagName: 'div', columnTagClassName: 'column-item'の場合、下記のようなマークアップになります。  

```
<div class="column-wrap">
  <div class="column-item">...(contents of column)...</div>
  <div class="column-item">...(contents of column)...</div>
  <div class="column-item">...(contents of column)...</div>
</div>
```

#### dispName

ブロック要素の表示名  
nullが設定されると、翻訳データに基づいた名称が使用される。

```
type: string
default: null
```

#### presets

CSSクラス名、その他の要素を固定して組み合わせた、プリセットのリスト  
プリセットの詳細は[こちら](#プリセットについて)を参照

```
type: array
default: null
```

### Html

#### tagName

ブロック要素を識別するHTMLマークアップ上のタグ名

```
type: string
default: 'div'
```

#### tagClassName

ブロック要素を識別するHTMLマークアップ上のタグのCSSクラス名

```
type: string
default: 'html-wrap'
```

tagName: 'div', tagClassName: 'html-wrap'の場合、下記のようなマークアップになります。  

```
<div class="html-wrap">...(contents in Html)...</div>
```

#### dispName

ブロック要素の表示名  
nullが設定されると、翻訳データに基づいた名称が使用される。

```
type: string
default: null
```

#### presets

CSSクラス名、その他の要素を固定して組み合わせた、プリセットのリスト  
プリセットの詳細は[こちら](#プリセットについて)を参照

```
type: array
default: null
```

### FileBrowser

#### url

ファイルブラウザのフロントエンドURL
(iframeとして表示されます)  
実際にファイル選択の連携を行う場合、ファイルブラウザ側で設定およびコードを実装する必要があります。

```
type: string
default: null
```

### width

ファイルブラウザの表示幅  
数値で指定した場合は%、その他は設定値がそのまま使用されます。

```
type: integer or string
default: null
```

### height

ファイルブラウザの表示高さ  
数値で指定した場合は%、その他は設定値がそのまま使用されます。

```
type: integer or string
default: null
```

### Events

#### onLoad

エディタの起動が完了したときに呼ばれるコールバック関数

##### arguments

```
html: エディタの起動時に設定されているHTMLマークアップデータ
```

##### Example

```
onLoad: function (html) {
  //...(some sort of processing)...
}
```

#### onUpdate

エディタ上で操作が行われた際に呼び出されるコールバック関数

##### arguments

```
html: 現在のHTMLマークアップデータ
```

##### Example

```
onUpdate: function (html) {
  //...(some sort of processing)...
}
```

### プリセットについて

各ブロック要素について、CSSクラスやその他の属性をあらかじめ固定としたプリセットを定義可能です。  

[デモ](https://codepen.io/takitakit/pen/arNwGv)  

例えば、見出しにおいて、```<h3 class="title">``` というHTMLマークアップが必要であれば、Heading要素の設定は下記のようになります。

```
Heading: {
  presets: [
    {level: 'h3', className: 'title', dispName: '見出しタイトル'}
  ]
}
```

各ブロック要素ごとに、使用可能な属性は下記の通りです。

#### Paragraph

##### className

CSSクラス名

```
type: string
default: null
``` 

##### imageAlign

画像に対する、テキストの回り込み指定

```
type: string
default: "Paragraph.defaultImageAlign"の値
options: 'left', 'center', 'right'
``` 

#### Heading

##### className

CSSクラス名

```
type: string
default: null
``` 

##### level

見出しの深さ

```
type: string
default: "Heading.defaultLevel"の値
options: 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
```

#### List

##### className

CSSクラス名

```
type: string
default: null
``` 

##### type

リストの種類

```
type: string
default: "List.defaultType"の値
options: 'unordered', 'ordered'
``` 

#### Table

##### className

CSSクラス名

```
type: string
default: null
``` 

#### Column

##### className

CSSクラス名

```
type: string
default: null
``` 

#### Html

##### className

CSSクラス名

```
type: string
default: null
``` 

## 動作環境

* Google Chrome
* Firefox
* Safari

## Licence

[MIT](https://github.com/takitakit/block-editor-vue/blob/master/LICENSE)

## Author

[takitakit](https://github.com/takitakit)

