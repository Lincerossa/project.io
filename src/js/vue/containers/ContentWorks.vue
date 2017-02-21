<template>
  <div class="container page-container">
    <div class="content" v-for="item in content" v-on:click="toggle($event)">
      <h2>{{item.title}}</h2>
      <p>{{item.description}}</p>
    </div>
  </div>
</template>


<script>

import PageContent from '../components/PageContent.vue';

export default {

  methods : {
    toggle(e){
      $(e.currentTarget).siblings().removeClass("open");
      $(e.currentTarget).toggleClass("open")
    }

  },
  data(){
  	return{
  		content:[
	  		{
	  			title:"uno",
	  		  description:"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent enim ante, dignissim a fermentum ac, interdum sit amet odio. Vivamus a augue ac diam consectetur faucibus. Sed interdum vulputate urna, at pharetra nulla porttitor at. Vestibulum id euismod enim. Curabitur nulla felis, malesuada ut lorem quis, ornare pulvinar elit. E",
          active:true
	  		},
	  		{
	  			title:"due",
	  		  description:"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent enim ante, dignissim a fermentum ac, interdum sit amet odio. Vivamus a augue ac diam consectetur faucibus. Sed interdum vulputate urna, at pharetra nulla porttitor at. Vestibulum id euismod enim. Curabitur nulla felis, malesuada ut lorem quis, ornare pulvinar elit. E",
          active:false
	  	  },
	  		{
	  			title:"tre",
	  		  description:"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent enim ante, dignissim a fermentum ac, interdum sit amet odio. Vivamus a augue ac diam consectetur faucibus. Sed interdum vulputate urna, at pharetra nulla porttitor at. Vestibulum id euismod enim. Curabitur nulla felis, malesuada ut lorem quis, ornare pulvinar elit. E",
          active:false
	  	  },
	  		{
	  			title:"quattro",
	  			description:"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent enim ante, dignissim a fermentum ac, interdum sit amet odio. Vivamus a augue ac diam consectetur faucibus. Sed interdum vulputate urna, at pharetra nulla porttitor at. Vestibulum id euismod enim. Curabitur nulla felis, malesuada ut lorem quis, ornare pulvinar elit. E",
          active:false
	  		},
	  		{
	  			title:"cique",description:"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent enim ante, dignissim a fermentum ac, interdum sit amet odio. Vivamus a augue ac diam consectetur faucibus. Sed interdum vulputate urna, at pharetra nulla porttitor at. Vestibulum id euismod enim. Curabitur nulla felis, malesuada ut lorem quis, ornare,pulvinar elit. E",
          active:false
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
  		padding:5px 10px;
  		border-radius: 2px;
  		margin:0;
      height: 45px;
      transition:height .5;
      cursor:pointer;
      overflow: hidden;
  		h2{
  			margin:0;
  			margin-bottom: 5px;
  		}

      &.open{
        animation-name:accordion;
        animation-duration:0.5s;
        animation-iteration-count:1;
        animation-fill-mode:forwards;
      }


      @keyframes accordion{
        from{height:45px;}
        to{height:100px;}
      }


  	}


  }


</style>