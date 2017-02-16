<template>
  <header>
    <HeaderFixed></HeaderFixed>
    <HeaderMenu></HeaderMenu>
  </header>
</template>


<script>

  import HeaderMenu from '../components/HeaderMenu.vue';
  import HeaderFixed from '../components/HeaderFixed.vue';

  export default {
    components: {
      HeaderMenu,
      HeaderFixed
    }
  }
</script>

