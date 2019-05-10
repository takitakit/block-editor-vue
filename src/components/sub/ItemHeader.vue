<template>
  <transition name="fade">
  <div 
    v-show="!$store.state.draggingItem"
    :class="{'BEV-header-active': active, 'BEV-header-hover': hover, 'BEV-compact': shouldHideSubLabel}"
    ref="nameWrap"
    class="BEV-name-wrap">

    <div 
      @mouseenter="showMoveButton()"
      @mouseleave="hideMoveButton()"
      @click.stop="activateItem(item);$emit('label-click', $event)"
      @dragstart="$emit('label-dragstart', $event);hideMoveButton();"
      @dragend="$emit('label-dragend', $event)"
      draggable="true"
      ref="name"
      :class="{'BEV-hassub': allowCssClass && item.className}"
      class="BEV-name">

      <!-- ドラッグハンドル -->
      <div 
          v-if="!isTouchDevice"
          class="BEV-drag">
        <IconBase 
          width="12" height="12">
          <IconGrid />
        </IconBase>
      </div>

      <span>{{itemName}}</span>

      <!-- 上下移動アロー -->
      <transition name="moveup">
        <div 
          @click.stop="activateItem(item);$emit('moveup-click', $event)"
          @mouseenter="showMoveButton()"
          @mouseleave="hideMoveButton()"
          v-show="!isFirst && flgMoveBtn" 
          v-tooltip="$t('common.moveUpItem')"
          class="BEV-move-up">
          <IconBase 
            width="17" height="17">
            <IconArrowUp />
          </IconBase>
        </div>
      </transition>
      <transition name="movedown">
        <div 
          @click.stop="activateItem(item);$emit('movedown-click', $event)"
          @mouseenter="showMoveButton()"
          @mouseleave="hideMoveButton()"
          v-show="!isLast && flgMoveBtn" 
          v-tooltip="$t('common.moveDownItem')"
          class="BEV-move-down">
          <IconBase 
            width="17" height="17">
            <IconArrowDown />
          </IconBase>
        </div>
      </transition>
    </div>
    <div 
      v-if="allowCssClass"
      v-show="item.className"
      v-tooltip="$t('common.cssClassName') + ' : '+item.className"
      @click.stop="activateItem(item);$emit('sub-label-click', $event)"
      class="BEV-sub-name">
      <span v-if="!shouldHideSubLabel">{{getClassName(item.className)}}</span>
      <IconBase 
        v-else
        width="18" height="10">
        <IconEllipsisH 
          :active="active"
          />
      </IconBase>
    </div>

    <transition name="fade">
    <div 
      v-show="!hideConfig && (isTouchDevice || active || hover)"
      ref="config"
      class="BEV-config">
      <button
        @focus="activateItem(item)"
        @click="$emit('menu-mouseenter', $event)"
        @mouseenter="!isTouchDevice ? $emit('menu-mouseenter', $event) : false"
        @mouseleave="!isTouchDevice ? $emit('menu-mouseleave', $event) : false"
        type="button"
      >
        <IconBase 
          width="17" height="17">
          <IconEllipsisV 
            :active="active" />
        </IconBase>
      </button>
    </div>
    </transition>
  </div>
  </transition>
</template>

<script>
import ComponentBase from '@/components/sub/ComponentBase.vue'

import IconBase from '@/components/sub/IconBase.vue'
import IconGrid from '@/components/icons/IconGrid.vue'
import IconArrowUp from '@/components/icons/IconArrowUp.vue'
import IconArrowDown from '@/components/icons/IconArrowDown.vue'
import IconEllipsisV from '@/components/icons/IconEllipsisV.vue'
import IconEllipsisH from '@/components/icons/IconEllipsisH.vue'

// 上下移動ボタンの制御用タイマー
let MOVE_BTN_TIMER = null

export default {
  extends: ComponentBase,
  components: {
    IconBase,
    IconGrid,
    IconArrowUp,
    IconArrowDown,
    IconEllipsisV,
    IconEllipsisH
  },
  props: ['item', 'active', 'hover', 'label', 'parentWidth', 'classes', 'allowCssClass', 'hideConfig'],
  computed: {
    // 最後の要素かどうか
    isLast () {
      const items = this.getParentItems(this.item)
      return items && items.indexOf(this.item) === items.length-1
    },
    // 最初の要素かどうか
    isFirst () {
      const items = this.getParentItems(this.item)
      return items && items.indexOf(this.item) === 0
    },
    // サブラベルを非表示にするべきかどうか
    shouldHideSubLabel () {
      // エディタの幅から
      // CSSクラス表示のためのラベルを表示すべきかどうかを判断する
      return (this.parentWidth / this.getConfig('baseFontSize')) < 26
    },
    // アイテム表示名
    itemName () {
      // ラベルが直に指定されているか、
      // 定義セットが指定されてる場合
      if (this.label) return this.label
      else if (this.item.preset && this.item.preset.dispName) return this.item.preset.dispName
 
      const conf = this.getConfig(this.item.name)
      if (conf && conf.dispName) {
        return conf.dispName
      } else {
        return this.$t(`common.${this.item.name}`)
      }
    }
  },
  data () {
    return {
      flgMoveBtn: false,
    }
  },
  methods: {
    // 上下移動のためのボタン表示
    showMoveButton () {
      this.flgMoveBtn = true
      if (MOVE_BTN_TIMER) clearTimeout(MOVE_BTN_TIMER)
    },
    // 上下移動のためのボタン非表示処理
    hideMoveButton () {
      // 時間差でフラグを制御する
      if (MOVE_BTN_TIMER) clearTimeout()
      MOVE_BTN_TIMER = setTimeout(()=>{
        this.flgMoveBtn = false
      }, 100)
    },
    // CSSクラスの名前付きリスト
    getClassName (class_item) {
      if (!this.classes || !Array.isArray(this.classes) || this.classes.length===0) return '.'+class_item

      const options = {}
      this.classes.forEach(cls => {
        if (typeof cls === 'string') {
          options[cls] = '.'+cls
        } else if (typeof cls === 'object') {
          const key = Object.keys(cls)[0]
          options[key] = cls[key]
        }
      })
      return options[class_item] ? options[class_item] : '.'+class_item
    },
  },
  watch: {
    hoverName () {
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/valiables.scss';

$header-height: 1.2em;             // 要素の高さ
$label-max-width: 7em;             // ラベルの最大幅
$sub-label-min-width: 30px;               // サブラベルの最低幅
$sub-label-compact-min-width: 25px;       // サブラベルの最低幅（コンパクトモード時）
$config-width: 1.2em;                      // 設定ボタンの幅
$sep-btn-width: 26px;                     // セパレータの追加ボタンの想定幅

// タイトル
%title {
  transition: background .2s;
  padding: 0 .5em;
  box-sizing: border-box;
  white-space: nowrap;
  span {
    font-size: .8em;
  }
}
%primary-title {
  @extend %title;
  background-color: $ttl-prm-bg-color;
  color: $ttl-prm-text-color;

  &.BEV-disabled {
    background-color: $ttl-prm-disabled-bg-color;
    color: $ttl-prm-disabled-text-color;
  }
}
%primary-subtitle {
  @extend %title;
  background-color: $subttl-prm-bg-color;
  color: $subttl-prm-text-color;

  &.BEV-disabled {
    background-color: $subttl-prm-disabled-bg-color;
    color: $subttl-prm-disabled-text-color;
  }
}
%secondary-title {
  @extend %title;
  background-color: $ttl-scd-bg-color;
  color: $ttl-scd-text-color;

  &.BEV-disabled {
    background-color: $ttl-scd-disabled-bg-color;
    color: $ttl-scd-disabled-text-color;
  }
}
%secondary-subtitle {
  @extend %title;
  background-color: $subttl-scd-bg-color;
  color: $subttl-scd-text-color;

  &.BEV-disabled {
    background-color: $subttl-scd-disabled-bg-color;
    color: $subttl-scd-disabled-text-color;
  }
}

.BEV-name-wrap {
  position: absolute;
  
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;

  height: 0;
  width: 100%;
  top: calc(#{-$header-height} - 5px);
  left: 0;
  z-index: 1;
//   transform: translate(0, calc(#{-$header-height} - 5px));

  & > * {
    position: relative;
    box-sizing: border-box;
    height: $header-height;
  }

  .BEV-name {
    @extend %secondary-title;

    max-width: $label-max-width;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 2em;
    cursor: grab;
    cursor: -webkit-grab;
    z-index: 1;
    text-overflow: ellipsis;

    .BEV-drag {
      width: 12px;
      height: 12px;
      position: relative;
      padding: 0 3px 0 0;
      margin: 0; 
      pointer-events: none;
      box-sizing: content-box;
      
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1;
    }

    .BEV-move-up, .BEV-move-down {
      position: absolute;
      height: 100%;
      width: 100%;
      top: 0;
      left: 0;
      padding: 0;
      box-sizing: border-box;

      color: $input-text-color;
      cursor: pointer;
    //   background-color: pink;
      display: flex;
      align-items: center;
      justify-content: center;

      svg {
        // ボタン自体のmouseイベントを横取りしないため
        pointer-events: none;
      }
    }
    .BEV-move-up {
      // +-4pxは、ラベル部分のmouseenterを横取りしないためのスペース
      transform: translate(0, calc(-100% - 4px));
    }
    .BEV-move-down {
      transform: translate(0, calc(100% + 4px));
    }
  }
  // sub nameを持つ場合のスタイル
  .BEV-name.BEV-hassub {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }

  .BEV-sub-name {
    @extend %secondary-subtitle;

    display: flex;
    align-items: center;
    justify-content: flex-start;
    min-width: $sub-label-min-width;
    max-width: calc(50% - #{$sep-btn-width/2} - #{$config-width} - #{$label-max-width});
    border-top-right-radius: 2em;
    border-bottom-right-radius: 2em;
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    padding: 0 .5em;
    margin: 0;
    z-index: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .BEV-config {
    width: $config-width;
    height: $header-height;

    button {
      @extend %secondary-button;
      width: 100%;
      height: 100%;
      padding: 0;
      margin: 0 0 0 5px;
      display: flex;
      justify-content: center;
      align-items: center;

      svg {
        // ボタンのみでクリックイベントを受けるため
        pointer-events: none;
      }
    }
  }
}

// ホバー時スタイル
.BEV-name:hover {
  background-color: darken($ttl-prm-bg-color, 5%);
}

// アクティブ時スタイル
.BEV-header-active.BEV-name-wrap {
  .BEV-name {
    @extend %primary-title;
  }
  .BEV-sub-name {
    @extend %primary-subtitle;
  }
  .BEV-config {
    button {
      @extend %primary-button;
      padding: 0;
      margin: 0 0 0 5px;
    }
  }
}

// エディタ幅が十分でないとき
.BEV-compact {
  .BEV-sub-name {
    padding: 0 3px!important;
    min-width: $sub-label-compact-min-width;
  }
}

// ソート矢印アニメーション
.moveup-enter-active, .moveup-leave-active,
.movedown-enter-active, .movedown-leave-active {
  transition: all .1s;
}
.moveup-enter, .moveup-leave-to {
  opacity: 0;
  transform: translateY(100%);
}
.movedown-enter, .movedown-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}

// フェードアニメーション
.fade-enter-active, .fade-leave-active {
  transition: opacity .2s;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}
</style>