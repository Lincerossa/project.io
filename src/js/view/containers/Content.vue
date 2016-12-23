<template>
    <div class="page-container">
    {{msg}}
    </div>
</template>


<script>


export default {
  data () {
    return {
      msg: 'lorem ipsum'
    }
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