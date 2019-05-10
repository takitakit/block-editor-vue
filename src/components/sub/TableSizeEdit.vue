<template>
  <div
    @click="isTouchDevice ? $emit('cancel') : false"
    :class="{'BEV-sp': isTouchDevice}"
    class="BEV-menu-wrap"
  >
    <div @click.stop class="BEV-menu BEV-dialog">
      <div class="BEV-input">
        <label>{{$t("Table.numberOfColumns")}}</label>
        <input 
          :max="maxCol"
          :min="minCol"
          v-model="inputCol" type="number" />
        <span class="BEV-cross">x</span>
        <label>{{$t("Table.numberOfRows")}}</label>
        <input 
          :max="maxRow"
          :min="minRow"
          v-model="inputRow" type="number" />
      </div>
      <div 
        v-if="validateMessages"
        class="BEV-errors">
        <transition-group name="fade" tag="div">
        <div 
          class="BEV-error"
          :key="msg"
          v-for="msg in validateMessages">
          {{msg}}
        </div>
        </transition-group>
      </div>
      <div class="BEV-buttons">
        <button 
          @click="$emit('cancel')"
          class="BEV-cancel"
          type="button">{{$t('common.cancel')}}</button>
        <button 
          :disabled="validateMessages.length ? true : false"
          @click="apply()"
          class="BEV-save"
          type="button">{{$t('common.apply')}}</button>
      </div>
    </div>
  </div>
</template>

<script>
import ComponentBase from '@/components/sub/ComponentBase.vue'

export default {
  extends: ComponentBase,
  components: {
  },
  props: ['maxCol', 'minCol', 'maxRow', 'minRow', 'row', 'col'],
  computed: {
  },
  watch: {
    inputRow () {
      this.validate()
    },
    inputCol () {
      this.validate()
    }
  },
  data () {
    return {
      inputRow: 0,
      inputCol: 0,
      validateMessages: [],
    }
  },
  mounted () {
    this.inputRow = this.row
    this.inputCol = this.col
  },
  methods: {
    validate () {
      const msg = []
      if (!this.inputRow) { 
        // 行数が入力されていない
        msg.push(this.$t('Table.rowEmptyError'))
      }
      if (!this.inputCol) { 
        // 列数が入力されていない
        msg.push(this.$t('Table.colEmptyError'))
      }
      if (msg.length) {
        this.$set(this, 'validateMessages', msg)
        return false
      }

      if (this.inputRow < this.minRow || 
          this.inputRow > this.maxRow) {
        msg.push(this.$t('Table.rowRangeError', {min: this.minRow, max: this.maxRow}))
      }
      if (this.inputCol < this.minCol || 
          this.inputCol > this.maxCol) {
        msg.push(this.$t('Table.colRangeError', {min: this.minCol, max: this.maxCol}))
      }
      if (msg.length) {
        this.$set(this, 'validateMessages', msg)
        return false
      }
      this.$set(this, 'validateMessages', [])
      return true
    },
    apply () {
      if (!this.validate) return false
      this.$emit('apply', {row: this.inputRow, col: this.inputCol})
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/valiables.scss';
@import '@/styles/animation.scss';

.BEV-menu-wrap {
  @extend %popup-menu-wrap;
  .BEV-menu {
    .BEV-input {
      display: flex;
      align-items: center;
      justify-content: flex-start;

      label {
        @extend %label;
        font-size: .8em;
      }
      input {
        @extend %input;
        font-size: .8em;
        width: 3.5em;
        box-sizing: border-box;
      }
      .BEV-cross {
        @extend %label;
      }
    }

    .BEV-errors {
      margin: 5px 0 0 0;
      .BEV-error {
        font-size: .8em;
        color: $lbl-dgr-text-color;
      }
    }
  }
}
</style>