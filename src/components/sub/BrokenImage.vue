<template>
  <div class="BEV-broken-image">
    <div class="BEV-image-alt">
      <IconBase width="15" height="15"><IconUnlink /></IconBase> 
      <span>{{$t('common.brokenImage')}}</span>  
    </div>
  </div>
</template>
<script>
import ComponentBase from '@/components/sub/ComponentBase.vue'
import IconBase from '@/components/sub/IconBase.vue'
import IconUnlink from '@/components/icons/IconUnlink.vue'

export default {
  extends: ComponentBase,
  props: ['width', 'height'],
  components: {IconBase, IconUnlink}
}
</script>
<style lang="scss" scoped>
@import '@/styles/valiables.scss';
@import '@/styles/animation.scss';

.BEV-broken-image {
  user-select: none;
  position: relative;
  background-color: #EFF0F1;
  
  .BEV-image-alt {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: .8em;
    width: 100%;
    text-align: center;
    color: #AEB2B7;

    display: flex;
    align-items: center;
    justify-content: center;
    span {
      line-height: .8em;
    }
  }
}
</style>
