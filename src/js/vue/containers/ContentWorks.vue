<template>
  <div class="container page-container">
    <div class="content" v-for="item in content" v-on:click="toggle($event)">
      <h2>{{item.title}}</h2>
      <div class="content-toggle"><img v-if="item.img" :src="item.imgLink"><p>{{item.description}}</p></div>
    </div>
  </div>
</template>


<script>

import PageContent from '../components/PageContent.vue';

export default {

  methods : {
    toggle(e){
      $(e.currentTarget).siblings().removeClass("open").find("div").slideUp();
      $(e.currentTarget).addClass("open").find("div").slideDown();
    }

  },
  data(){
  	return{
  		content:[
	  		{
	  			title:"Landing Page Tim",
	  		  description:"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent enim ante, dignissim a fermentum ac, interdum sit amet odio. Vivamus a augue ac diam consectetur faucibus. Sed interdum vulputate urna, at pharetra nulla porttitor at. Vestibulum id euismod enim. Curabitur nulla felis, malesuada ut lorem quis, ornare pulvinar elit. E",
          img:true,
          imgLink:'/project.io/static/img/logo.svg'
	  		},
	  		{
	  			title:"due",
	  		  description:"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent enim ante, dignissim a fermentum ac, interdum sit amet odio. Vivamus a augue ac diam consectetur faucibus. Sed interdum vulputate urna, at pharetra nulla porttitor at. Vestibulum id euismod enim. Curabitur nulla felis, malesuada ut lorem quis, ornare pulvinar elit. E",
          img:false
	  	  },
	  		{
	  			title:"tre",
	  		  description:"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent enim ante, dignissim a fermentum ac, interdum sit amet odio. Vivamus a augue ac diam consectetur faucibus. Sed interdum vulputate urna, at pharetra nulla porttitor at. Vestibulum id euismod enim. Curabitur nulla felis, malesuada ut lorem quis, ornare pulvinar elit. E",
          img:false
	  	  },
	  		{
	  			title:"quattro",
	  			description:"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent enim ante, dignissim a fermentum ac, interdum sit amet odio. Vivamus a augue ac diam consectetur faucibus. Sed interdum vulputate urna, at pharetra nulla porttitor at. Vestibulum id euismod enim. Curabitur nulla felis, malesuada ut lorem quis, ornare pulvinar elit. E",
          img:false
	  		},
	  		{
	  			title:"cique",description:"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent enim ante, dignissim a fermentum ac, interdum sit amet odio. Vivamus a augue ac diam consectetur faucibus. Sed interdum vulputate urna, at pharetra nulla porttitor at. Vestibulum id euismod enim. Curabitur nulla felis, malesuada ut lorem quis, ornare,pulvinar elit. E",
          img:false
	  		}
  		]
  	}
  }
}
</script>



<style scoped lang="less">

  @import "./../../../less/library/custom/variables.less";

  @import "./../../../less/library/font-awesome-4.7.0/less/font-awesome.less";
  
  .page-container{
  	padding-top: 60px;

  	.content{
  		border-bottom:1px solid @color-border;
  		padding:10px;
  		border-radius: 2px;
  		margin:0;
      cursor:pointer;
      overflow: hidden;

      &.open{
        &:after{
          content:"\f067";
          font-family: FontAwesome;
          position: absolute;
          left: 0;
        }

      }
  		h2{
  			margin:0;
  		}

      &-toggle{
        display: none;
        margin:0;

        img{
          width:60px;
          display: inline-block;
        }
        p{
          margin:0;
        }

      }


  	}


  }


</style>