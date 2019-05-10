<template>
  <div class="BEV-switch-wrap">
    <input 
      type="checkbox" 
      :checked="value ? true : false"
      :disabled="disabled"
      @change="$emit('input', $event.target.checked)" 
      :id="checkboxID" value="1">
    <label :for="checkboxID"><span>{{label}}</span></label>
  </div>
</template>

<script>
import Util from '@/scripts/Util.js'
export default {
  props: ['label', 'value', 'disabled'],
  data () {
    return {
      checkboxID: Util.generateID() 
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/valiables.scss';
.BEV-switch-wrap {
  padding-left: 32px;
  height: 16px;
}
input[type="checkbox"] {
  position: absolute;
  z-index: -1;
  opacity: 0;
}
label {
  display: inline-block;
  position: relative;
  margin: 0;
  vertical-align: top;
  font-size: .9em;
  line-height: .9em;
  height: .9em;
  color: $switch-label-text-color;
  font-weight: normal;

  span {
    display: inline-block;
    padding: 2px 0 0 0;
  }
}
label::before {
  position: absolute;
  display: block;
  top: 0px;
  left: -33px;
  width: 27px;
  height: 16px;
  border-radius: 16px;
  pointer-events: none;
  content: "";
  background-color: $switch-normal-bg-color;
  border: $switch-normal-border;
  pointer-events: all;
  box-sizing: border-box;
}
label::after {
  position: absolute;
  display: block;
  top: 2px;
  left: -31px;
  width: 12px;
  height: 12px;
  border-radius: 6px;
  content: "";
  background-color: $switch-normal-fill-color;
  transition: background-color .15s ease-in-out, border-color .15s ease-in-out, box-shadow .15s ease-in-out, transform .15s ease-in-out;
}

// チェック時のスタイル
input[type="checkbox"]:checked~label::before {
  border: $switch-active-border;
  background-color: $switch-active-bg-color;
}
input[type="checkbox"]:checked~label::after {
  background-color: $swith-active-fill-color;
  transform: translateX(11px);
}

// 無効時のスタイル
input[type="checkbox"]:disabled~label {
  color: $switch-label-disabled-text-color;
}
input[type="checkbox"]:disabled~label::before {
  border: $switch-disabled-border;
  background-color: $switch-disabled-bg-color;
}
input[type="checkbox"]:disabled~label::after {
  background-color: $swith-disabled-fill-color;
  transform: translateX(11px);
}
</style>