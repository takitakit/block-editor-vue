<template>
  <div
    class="BEV-image-list-wrap"
    :class="{'BEV-single': images.length===1, 'BEV-double': images.length===2, 'BEV-multiple': images.length>=3}"
  >
    <div 
      v-show="images.length > 1"
      class="BEV-number">
      {{$tc('ImageList.images', images.length, {n: images.length > 9 ? '+9': images.length })}}
    </div>
    <div class="BEV-list-wrap">
      <div 
        v-for="(image, index) in images"
        v-if="index < 3"
        :key="image.id"
        class="BEV-image-wrap"
      >
        <transition name="fade">
          <BrokenImage 
            class="BEV-broken-image"
            v-if="image.error"/>
        </transition>
        <img 
          ref="img"
          v-show="!image.error"
          @load="$emit('success',image)"
          @error="$emit('error',image)"
          draggable="false"
          :src="image.src">
      </div>
    </div>
  </div>
</template>
<script>
import ComponentBase from '@/components/sub/ComponentBase.vue'
import BrokenImage from '@/components/sub/BrokenImage.vue'
export default {
  extends: ComponentBase,
  props: ['images'],
  components: {BrokenImage},
}
</script>
<style lang="scss" scoped>
@import '@/styles/valiables.scss';
@import '@/styles/animation.scss';

$slip-at-double: 5px;
$slip-at-multiple: 5px;

.BEV-image-list-wrap {
  position: relative;
}

.BEV-list-wrap {
  position: relative;
  line-height: 0;
  
  .BEV-image-wrap:nth-child(1) {
    position: relative;
    z-index: 10;
  }
  .BEV-image-wrap:nth-child(2) {
    position: absolute;
    z-index: 9;
    height: 100%;
    box-sizing: border-box;
    img {
      height: 100%;
      opacity: .8;
    }
  }
  .BEV-image-wrap:nth-child(3) {
    position: absolute;
    z-index: 8;
    height: 100%;
    box-sizing: border-box;
    img {
      height: 100%;
      opacity: .8;
    }
  }
  .BEV-image-wrap {
    background-color: #fff;
    width: 100%;
    box-sizing: border-box;
    border-radius: 3px;
    overflow: hidden;

    img {
      width: 100%;
      box-sizing: border-box;
    }
    .BEV-broken-image {
      position: relative;
      width: 100%;
      min-height: 150px;
      min-width: 150px;
    }
  }
}
// 2枚の時
.BEV-double {
  padding-bottom: $slip-at-double;
  
  .BEV-image-wrap {
    width: calc(100% - #{$slip-at-double});
  }
  .BEV-image-wrap:nth-child(2) {
    top: $slip-at-double;
    left: $slip-at-double;
    height: 100%;
    img {
      height: 100%;
    }
  }
}
// 3枚以上の時
.BEV-multiple {
  padding-bottom: $slip-at-multiple * 2;

  .BEV-image-wrap {
    width: calc(100% - #{$slip-at-multiple * 2});
  }
  .BEV-image-wrap:nth-child(2) {
    top: $slip-at-multiple;
    left: $slip-at-multiple;
    height: 100%;
    img {
      height: 100%;
    }
  }
  .BEV-image-wrap:nth-child(3) {
    top: $slip-at-multiple * 2;
    left: $slip-at-multiple * 2;
    height: 100%;
    img {
      height: 100%;
    }
  }
}

.BEV-number {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 20;
  border-top-left-radius: 3px;
  border-bottom-right-radius: 3px;
  user-select: none;

  display: inline-block;
  text-align: center;
  vertical-align: middle;
  font-size: .76em;
  line-height: 1.1em;
  padding: .2em .4em;
  background: rgba(0,0,0, .6);
  color : #FFF;
}
</style>