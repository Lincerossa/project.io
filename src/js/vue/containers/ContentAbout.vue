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
	  		{
	  			title:"uno",
	  		  description:"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent enim ante, dignissim a fermentum ac, interdum sit amet odio. Vivamus a augue ac diam consectetur faucibus. Sed interdum vulputate urna, at pharetra nulla porttitor at. Vestibulum id euismod enim. Curabitur nulla felis, malesuada ut lorem quis, ornare pulvinar elit. E"
	  		},
	  		{
	  			title:"due",
	  		  description:"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent enim ante, dignissim a fermentum ac, interdum sit amet odio. Vivamus a augue ac diam consectetur faucibus. Sed interdum vulputate urna, at pharetra nulla porttitor at. Vestibulum id euismod enim. Curabitur nulla felis, malesuada ut lorem quis, ornare pulvinar elit. E"
	  	  },
	  		{
	  			title:"tre",
	  		  description:"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent enim ante, dignissim a fermentum ac, interdum sit amet odio. Vivamus a augue ac diam consectetur faucibus. Sed interdum vulputate urna, at pharetra nulla porttitor at. Vestibulum id euismod enim. Curabitur nulla felis, malesuada ut lorem quis, ornare pulvinar elit. E"
	  	  },
	  		{
	  			title:"quattro",
	  			description:"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent enim ante, dignissim a fermentum ac, interdum sit amet odio. Vivamus a augue ac diam consectetur faucibus. Sed interdum vulputate urna, at pharetra nulla porttitor at. Vestibulum id euismod enim. Curabitur nulla felis, malesuada ut lorem quis, ornare pulvinar elit. E"
	  		},
	  		{
	  			title:"cique",description:"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent enim ante, dignissim a fermentum ac, interdum sit amet odio. Vivamus a augue ac diam consectetur faucibus. Sed interdum vulputate urna, at pharetra nulla porttitor at. Vestibulum id euismod enim. Curabitur nulla felis, malesuada ut lorem quis, ornare pulvinar elit. E"
	  		}
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
  		border-bottom:1px solid @color-border;
  		padding:10px;
  		border-radius: 2px;
  		margin:10px 0;
  		h2{
  			margin:0;
  			margin-bottom: 5px;
  		}
  	}


  }


</style>