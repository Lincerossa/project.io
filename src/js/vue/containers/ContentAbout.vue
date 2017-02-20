<template>
  <div class="container page-container">
    <div class="content" v-for="item in content">
      <h2>{{item.title}}</h2>
      <p>{{item.description}}</p>
    </div>
  </div>
</template>


<script>

import PageContent from '../components/PageContent.vue';

export default {
  data(){
  	return{
  		content:[
  		{title:"uno",description:""},
  		{title:"due",description:""},
  		{title:"tre",description:""},
  		{title:"quattro",description:""},
  		{title:"cique",description:""}
  		]
  	}
  }
}
</script>



<style scoped lang="less">

  @import "./../../../less/library/custom/variables.less";
  .page-container{
  	padding-top: 60px;

  	.content{
  		border:1px solid @color-border;
  		padding:10px;
  		border-radius: 2px;
  	}


  }


</style>