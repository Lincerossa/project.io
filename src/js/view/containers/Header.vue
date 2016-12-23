<template>
    <header>
      <MenuHeader></MenuHeader>
    </header>
</template>


<script>

import MenuHeader from '../components/MenuHeader.vue';

export default {
  data () {
    return {
      msg: 'lorem ipsum'
    }
  },
  components: {
    MenuHeader
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
