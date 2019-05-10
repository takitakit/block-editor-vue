import DOM from '@/scripts/DOM.js'

// ドラッグ＆ドロップのライブラリクラス
export default class DragItemUtil {
  constructor (options) {
    // ドラッグ対象のDOM要素(実際にはcloneした要素を表示に使う)
    const target = options.targetElement
    this.dragTargetElement = target.cloneNode(true)

    const wrap = document.createElement('div')
    wrap.appendChild(this.dragTargetElement)
    this.wrapElement = wrap
    this.wrapElement.style.position = 'absolute'
    this.wrapElement.style.top = '0px'
    this.wrapElement.style.left = '0px'
    this.wrapElement.style.pointerEvents = 'none'
    this.wrapElement.style.boxSizing = 'border-box'
    this.wrapElement.style.transition = 'opacity .2s'
    this.wrapElement.style.zIndex = '1000'
    this.wrapElement.style.cursor = 'grabbing'
    this.wrapElement.opacity = 0

    this.dragStartEvent = options.dragStartEvent

    // ドラッグイメージを包含するDOM要素
    this.parentElement = options.parentElement
    
    // ドラッグ対象の要素の位置を記録
    this.srcPosition = DOM.position(target, this.parentElement)
    this.startPosition = {x: options.dragStartEvent.pageX, y: options.dragStartEvent.pageY}
    
    if (options.draggingClass) {
      // クラスの指定があれば、ドラッグ対象の要素にクラスを設定する
      setTimeout(()=>{
        this.dragTargetElement.classList.add(options.draggingClass)
      },0 )
    }

    // ドラッグイメージのサイズ、位置を調整して初期化する
    this.dragTargetElement.style.width = target.offsetWidth + 'px'
    this.dragTargetElement.style.height = target.offsetHeight + 'px'
    this.parentElement.appendChild(this.wrapElement)
    this.dragover(this.dragStartEvent)

    // ドラッグ時の表示制御のためのダミー画像
    const dummy = document.createElement('div')
    dummy.style.position = 'absolute'
    dummy.style.opacity = '0'
    dummy.style.width = '1px'
    dummy.style.height = '1px'
    dummy.style.pointerEvents = 'none'
    this.parentElement.appendChild(dummy)
    this.dragStartEvent.dataTransfer.setDragImage(dummy, 0, 0)

    this.dragoverFunc = ev => {
      this.dragover(ev)
    }
    document.addEventListener('dragover', this.dragoverFunc)
  }

  // ドラッグオーバー処理
  dragover (ev) {
    const dx = ev.pageX - this.startPosition.x
    const dy = ev.pageY - this.startPosition.y
    const x = this.srcPosition.x + dx
    const y = this.srcPosition.y + dy
    this.wrapElement.style.transform = `translate(${x}px, ${y}px)`
  }

  // 破棄時の処理
  destroy () {
    this.wrapElement.style.opacity = 1
    this.wrapElement.style.transition = 'opacity .2s'
    this.wrapElement.style.opacity = 0
    setTimeout(()=>{
      this.wrapElement.remove()
    },200)
    document.removeEventListener('dragover', this.dragoverFunc)
  }
}