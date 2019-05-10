<template>
  <div 
    :class="{'BEV-primary': type==='primary', 'BEV-danger': type==='danger'}"
    class="BEV-checkbox-wrap">
    <input 
      :checked="value"
      value="1"
      @change="$emit('input',$event.target.checked)"
      type="checkbox" :id="id" :disabled="disabled">
    <label :for="id">{{label}}</label>
  </div>
</template>

<script>
import Util from '@/scripts/Util.js'
export default {
  props: ['label', 'value', 'disabled', 'type'],
  data () {
    return {
      id: 'check_'+Util.generateID()
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/valiables.scss';
.BEV-checkbox-wrap {
  position: relative;
  padding: 0 0 0 1.18em;
}
input {
  position: absolute;
  z-index: -1;
  opacity: 0;
}
label {
  position: relative;
  color: $lbl-text-color;
  // @include font-size(.9);
}
label::before {
  transition: all .15s;
  position: absolute;
  top: 0;
  left: -1.18em;
  display: block;
  width: .8em;
  height: .8em;
  pointer-events: none;
  content: "";
  background-color: $chk-scd-bg-color;
  border: $chk-scd-border;
  border-radius: 3px;
}
input:checked~label::before {
    color: #fff;
    background-color: $chk-scd-fill-color;
}
input:focus~label::before {
  box-shadow: $chk-scd-active-shadow;
}
input:checked~label::before {
  color: #fff;
  background-color: $chk-scd-fill-color;
}

label::after {
  content: "";
  width: .8em;
  height: .8em;
  position: absolute;
  top: .05em;
  left: -1.14em;
  background-size: 100% 100%;
  background-position: 50% 50%;
}

input:checked~label:after {
  background-image: url("data:image/svg+xml,%3csvg%20width%3d%2213px%22%20height%3d%2213px%22%20viewBox%3d%220%200%2013%2013%22%20version%3d%221%2e1%22%20xmlns%3d%22http%3a%2f%2fwww%2ew3%2eorg%2f2000%2fsvg%22%20xmlns%3axlink%3d%22http%3a%2f%2fwww%2ew3%2eorg%2f1999%2fxlink%22%3e%0d%0a%20%20%20%20%3cg%20stroke%3d%22none%22%20stroke%2dwidth%3d%221%22%20fill%3d%22none%22%20fill%2drule%3d%22evenodd%22%3e%0d%0a%20%20%20%20%20%20%20%20%3cpath%20d%3d%22M4%2e8990873%2c8%2e1490873%20L10%2e901728%2c2%2e14644661%20C11%2e0969901%2c1%2e95118446%2011%2e4135726%2c1%2e95118446%2011%2e6088348%2c2%2e14644661%20L12%2e3159415%2c2%2e85355339%20C12%2e5112037%2c3%2e04881554%2012%2e5112037%2c3%2e36539803%2012%2e3159415%2c3%2e56066017%20L6%2e01006571%2c9%2e86653601%20C5%2e99597194%2c9%2e88531348%205%2e98038366%2c9%2e90332484%205%2e96330086%2c9%2e92040764%20L5%2e25619408%2c10%2e6275144%20C5%2e2022536%2c10%2e6814549%205%2e13905491%2c10%2e7204945%205%2e07171311%2c10%2e7446333%20C4%2e892784%2c10%2e813718%204%2e68212187%2c10%2e7760829%204%2e53776695%2c10%2e631728%20L3%2e83066017%2c9%2e9246212%20C3%2e80526257%2c9%2e8992236%203%2e78316841%2c9%2e8717735%203%2e7643777%2c9%2e84280483%20L1%2e01355339%2c7%2e09198052%20C0%2e818291245%2c6%2e89671837%200%2e818291245%2c6%2e58013588%201%2e01355339%2c6%2e38487373%20L1%2e72066017%2c5%2e67776695%20C1%2e91592232%2c5%2e48250481%202%2e23250481%2c5%2e48250481%202%2e42776695%2c5%2e67776695%20L4%2e8990873%2c8%2e1490873%20Z%22%20id%3d%22Combined%2dShape%22%20fill%3d%22%23FFFFFF%22%3e%3c%2fpath%3e%0d%0a%20%20%20%20%3c%2fg%3e%0d%0a%3c%2fsvg%3e");
}

input:disabled~label {
  color: $chk-label-disabled-text-color;
}
input:disabled~label::before {
  border: $chk-scd-disabled-border;
}

.BEV-primary {
  label::before {
    background-color: $chk-prm-bg-color;
    border: $chk-prm-border;
  }
  input:checked~label::before {
    color: #fff;
    background-color: $chk-prm-fill-color;
  }
  input:focus~label::before {
    box-shadow: $btn-prm-active-shadow;
  }
}
.BEV-danger {
  label::before {
    background-color: $chk-dgr-bg-color;
    border: $chk-dgr-border;
  }
  input:checked~label::before {
    color: #fff;
    background-color: $chk-dgr-fill-color;
  }
  input:focus~label::before {
    box-shadow: $btn-dgr-active-shadow;
  }
}
</style>