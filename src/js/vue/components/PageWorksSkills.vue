<template>
	  
	  <ul class="row">
	    <li class="col-xs-12"><strong class="col-xs-3">Tecnologie utilizzate</strong><strong class="col-xs-9">Impatto</strong></li>
	    <li class="col-xs-12" v-for="item in skills">
	      <p class="col-xs-3">{{ item.type }}</p>
	      <div class="col-xs-9">{{ item.value }}</div>
	    </li>
	  </ul>
</template>




<script>
export default {
  props:['skills']
}
</script>


<style scoped lang="less">



  ul{
  	list-style: none;
  	padding: 0;
  	margin-top: 10px;

  	li{
		p{
			margin:0;
		}

  	}
  }



</style>