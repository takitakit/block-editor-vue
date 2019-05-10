export default class DOM {
    // 指定されたセレクタにマッチするかどうか
    static matches (node, selector) {
        return (node.matches || node.msMatchesSelector).call(node, selector)
    }

    // 指定したセレクタに一致する最も近い先祖要素を返す
    static closest (node, selector) {
        return (node.closest || function(_selector) {
            do {
                if ((node.matches || node.msMatchesSelector).call(node, _selector)) {
                    return node
                }
                node = node.parentElement || node.parentNode
            } while (node !== null && node.nodeType === 1)
            return null
        }).call(node, selector)
    }
    // 指定したセレクタに一致する要素内のうち、何番目の要素かを返す
    static index (node, selector, base_node) {
        base_node = typeof base_node==='undefined' ? document : base_node
        let nodes = base_node.querySelectorAll(selector)
        let index = false
        for (let i=0; i<nodes.length; i++) {
            if (nodes[i]===node) return i
        }
        return false
    } 
    // 親要素からの相対座標を取得する
    // node: 対象の要素
    // parent: 基準となる要素
    // scroll: スクロール量の考慮
    static position (node, parent, scroll) {
        if (typeof parent==='undefined') parent = node.parentNode
        
        let p_rect = parent.nodeType==1 ? parent.getBoundingClientRect() : {x:0,y:0}
        let rect = node.getBoundingClientRect()

        return {
            x: rect.x - p_rect.x + (scroll ? window.pageXOffset : 0),
            y: rect.y - p_rect.y + (scroll ? window.pageYOffset : 0),
        }
    }
    static eq (index, selector, base_node) {
        base_node = typeof base_node==='undefined' ? document : base_node
        let nodes = base_node.querySelectorAll(selector)
        if (index >= nodes.length) return null
        return nodes[index]
    }
}