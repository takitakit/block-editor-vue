<template>
  <div 
    :class="{'BEV-noscale':!showScale}"
    class="BEV-range-wrap">
    <input type="range" 
      @input="$emit('input', $event.target.value)"
      :max="max"
      :min="min"
      :step="step"
      :value="value"
    />
    <div v-if="showScale" class="BEV-scale">
      <div class="BEV-scale-inner">
        <div 
          :style="scaleStyle"
          class="BEV-scale-meter">
          <div 
            :key="num"
            v-for="num in scales" class="BEV-scale-item"><span>{{num}}</span></div>
        </div>
      </div>
    </div>
    <div v-else class="BEV-value"><span>{{value}}</span></div>
  </div>
</template>

<script>
export default {
  props: ['value', 'min', 'max', 'step', 'showScale'],
  data () {
    return {
      scales: [],
      scaleNums: [],
    }
  },
  created () {
    for (let i=this.min; i<=this.max; i+=this.step) {
      this.scales.push(i)
    }
    this.scaleStyle = {
      width: `calc(100% + (100% / ${(this.max-this.min)/this.step}) + 2px)`
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/valiables.scss';
$focus-shadow-width: .2em;
$focus-box-shadow: 0 0 0 0.17em rgba(49,126,246,.3);
$transition: background-color .15s ease-in-out, border-color .15s ease-in-out, box-shadow .15s ease-in-out !default;

$thumb-height: .8em;
$thumb-width: .8em;
$thumb-border-radius: .8em;
$thumb-border: 0;
$thumb-box-shadow: 0 .1em .25em rgba(#000, .1);
$thumb-bg: #307DF6;
$thumb-active-bg: lighten(#307DF6, 35%);
$thumb-disabled-bg: #adb5bd;

$track-height: .2em;
$track-width: 100%;
$track-cursor: pointer;
$track-bg: #CED1D4;
$track-border-radius: 1em;
$track-box-shadow: none;

.BEV-range-wrap {
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
  padding: 0 3px;
}
input[type=range] {
  width: 100%;
  height: calc(#{$thumb-height} + #{$focus-shadow-width * 2});
  padding: 0; // Need to reset padding
  background-color: transparent;
  appearance: none;

  &:focus {
    outline: none;

    // Pseudo-elements must be split across multiple rulesets to have an effect.
    // No box-shadow() mixin for focus accessibility.
    &::-webkit-slider-thumb { box-shadow: $focus-box-shadow; }
    &::-moz-range-thumb     { box-shadow: $focus-box-shadow; }
    &::-ms-thumb            { box-shadow: $focus-box-shadow; }
  }

  &::-moz-focus-outer {
    border: 0;
  }

  &::-webkit-slider-thumb {
    width: $thumb-width;
    height: $thumb-height;
    margin-top: ($track-height - $thumb-height) / 2; // Webkit specific
    background-color: $thumb-bg;
    border: $thumb-border;
    border-radius: $thumb-border-radius;
    box-shadow: $thumb-box-shadow;
    transition: $transition;
    appearance: none;

    &:active {
      background-color: $thumb-active-bg;
    }
  }

  &::-webkit-slider-runnable-track {
    width: $track-width;
    height: $track-height;
    color: transparent; // Why?
    cursor: $track-cursor;
    background-color: $track-bg;
    border-color: transparent;
    border-radius: $track-border-radius;
    box-shadow: $track-box-shadow;
  }

  &::-moz-range-thumb {
    width: $thumb-width;
    height: $thumb-height;
    background-color: $thumb-bg;
    border: $thumb-border;
    border-radius: $thumb-border-radius;
    box-shadow: $thumb-box-shadow;
    transition: $transition;
    appearance: none;

    &:active {
      background-color: $thumb-active-bg;
    }
  }

  &::-moz-range-track {
    width: $track-width;
    height: $track-height;
    color: transparent;
    cursor: $track-cursor;
    background-color: $track-bg;
    border-color: transparent; // Firefox specific?
    border-radius: $track-border-radius;
    box-shadow: $track-box-shadow;
  }

  &::-ms-thumb {
    width: $thumb-width;
    height: $thumb-height;
    margin-top: 0; // Edge specific
    margin-right: $focus-shadow-width; // Workaround that overflowed box-shadow is hidden.
    margin-left: $focus-shadow-width;  // Workaround that overflowed box-shadow is hidden.
    background-color: $thumb-bg;
    border: $thumb-border;
    border-radius: $thumb-border-radius;
    box-shadow: $thumb-box-shadow;
    transition: $transition;
    appearance: none;

    &:active {
      background-color: $thumb-active-bg;
    }
  }

  &::-ms-track {
    width: $track-width;
    height: $track-height;
    color: transparent;
    cursor: $track-cursor;
    background-color: transparent;
    border-color: transparent;
    border-width: $thumb-height / 2;
    box-shadow: $track-box-shadow;
  }

  &::-ms-fill-lower {
    background-color: $track-bg;
    border-radius: $track-border-radius;
  }

  &::-ms-fill-upper {
    margin-right: 15px; // arbitrary?
    background-color: $track-bg;
    border-radius: $track-border-radius;
  }

  &:disabled {
    &::-webkit-slider-thumb {
      background-color: $thumb-disabled-bg;
    }

    &::-webkit-slider-runnable-track {
      cursor: default;
    }

    &::-moz-range-thumb {
      background-color: $thumb-disabled-bg;
    }

    &::-moz-range-track {
      cursor: default;
    }

    &::-ms-thumb {
      background-color: $thumb-disabled-bg;
    }
  }
}

.BEV-scale {
  width: 100%;
  position: relative;
  // overflow: hidden;

  .BEV-scale-inner {
    width: calc(100% - #{$thumb-width});
    margin: 0 0 0 $thumb-width/2;
    position: relative;
  }

  .BEV-scale-meter {
    width: calc(100% + 1px);
    display: table;
    table-layout: fixed;
    
    .BEV-scale-item:first-child {
      // border-left: 1px solid #AEB2B7;
    }
    .BEV-scale-item {
      position: relative;
      display: table-cell;
      // border-right: 1px solid #AEB2B7;
      height: calc(5px + .7em);

      span {
        font-size: .7em;
        position: absolute;
        top: 0;
        left: 0;
        transform: translate(-50%, 0);
      }
    }
  }
}
.BEV-noscale {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}
.BEV-value {
  position: relative;
  margin: 0 0 0 5px;
  span {
    font-size: .8em;
    line-height: .8em;
    position: relative;
    display: flex;
    margin: 0;
    background-color: #CED1D4;
    border-radius: 2px;
    box-sizing: border-box;
    width: 1.2em;
    height: 1.2em;
    text-align: center;
    align-items: center;
    justify-content: center; 
  }
}
input:focus ~.BEV-value {
  span {
    background-color: #C5DBFA;
  }
}
</style>