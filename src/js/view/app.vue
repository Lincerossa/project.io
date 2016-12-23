<template>
  <div>
    <Menu></Menu>
    <h1 class="red-el">{{msg}}</h1>
    <p> asdjnasidasnd</p>
  </div>
</template>


<script>

import Menu from './components/Menu.vue';

export default {
  data () {
    return {
      msg: 'lorem ipsum'
    }
  },
  components: {
    Menu
  }
}
</script>

<style scoped lang="less">
.red{  
  color: #f00;

  &-el{
  color:red
  }
}
</style>
