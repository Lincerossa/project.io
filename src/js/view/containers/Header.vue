<template>
    <header>
      <MenuHeader></MenuHeader>
    </header>
</template>


<script>

  import MenuHeader from '../components/MenuHeader.vue';

  export default {
    components: {
      MenuHeader
    }
  }
</script>

<style scoped lang="less">
  header{
    position: fixed;
    top: 0;
    width: 100%;
    left: 0;
    right: 0;
  }
</style>