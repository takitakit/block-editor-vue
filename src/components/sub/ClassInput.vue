<template>
  <div
    @click="isTouchDevice ? $emit('cancel') : false"
    :class="{'BEV-sp': isTouchDevice}"
    class="BEV-menu-wrap"
  >
    <div 
      @click.stop
      class="BEV-menu BEV-dialog">
      <div
        v-if="isTouchDevice" 
        class="BEV-menu-title">{{$t('common.setCssClass')}}
      </div>
      <div class="BEV-input">
        <select 
          v-if="classOptions"
          v-model="input"
        >
          <option :value="null">{{$t('common.selectClass')}}</option>
          <option
            v-for="(value, key) in classOptions"
            :key="key"
            :value="key">{{value}}</option>
        </select>
        <TextInput
          v-else
          v-model="input"
          ref="input"
          @clear="input=''"
          @enter="$emit('input', input)"
          @escape="input=value;$emit('cancel')"
          :placeholder="$t('common.cssClassName')"
        />
      </div>
      <div class="BEV-buttons">
        <button 
            @click="input=value;$emit('cancel')"
            class="BEV-cancel"
            type="button">{{$t('common.cancel')}}</button>
        <button 
            @click="$emit('input', input)"
            class="BEV-save"
            type="button">{{$t('common.apply')}}</button>
      </div>

    </div>
  </div>
</template>

<script>
import ComponentBase from '@/components/sub/ComponentBase.vue'
import TextInput from "@/components/sub/TextInput.vue"

export default {
  extends: ComponentBase,
  components: {
    TextInput,
  },
  props: ['value', 'classes'],
  computed: {
    classOptions () {
      if (!this.classes || !Array.isArray(this.classes) || this.classes.length===0) return null

      const options = {}
      this.classes.forEach(cls => {
        if (typeof cls === 'string') {
          options[cls] = cls
        } else if (typeof cls === 'object') {
          const key = Object.keys(cls)[0]
          options[key] = cls[key]
        }
      })
      return options
    }
  },
  data () {
    return {
      input: null,
    }
  },
  mounted () {
    this.input = this.value
  },
  methods: {
    focus () {
      if (this.$refs.input) {
        this.$refs.input.focus()
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/valiables.scss';

.BEV-menu-wrap {
  @extend %popup-menu-wrap;
  .BEV-menu {
    width: 12em;
  }
}
</style>