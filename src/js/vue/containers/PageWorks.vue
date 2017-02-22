<template>
  <div class="container page-container">
    <div class="content" v-for="item in content" v-on:click="toggle($event)">
      <div class="content-header">{{item.title}}</div>
      <div class="content-toggle">
        <img v-if="item.img" :src="item.imgLink">
        <strong>{{item.date}}</strong>
        <p>{{item.description}}</p>
        <PageWorksSkills :skills="item.skills"></PageWorksSkills>
      </div>
    </div>
  </div>
</template>


<script>

import PageWorksSkills from '../components/PageWorksSkills.vue';

export default {

  methods : {
    toggle(e){
      $(e.currentTarget).siblings().removeClass("open").find(".content-toggle").slideUp();
      if($(e.currentTarget).hasClass("open")){
        $(e.currentTarget).removeClass("open").find(".content-toggle").slideUp();
      }else{
        $(e.currentTarget).addClass("open").find(".content-toggle").slideDown();
      }   
    }
  },
  components: {
    PageWorksSkills
  },
  
  data(){
  	return{
  		content:[
	  		{
	  			title:"Landing Page Tim",
          date:"16/02/2016",
	  		  description:"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent enim ante, dignissim a fermentum ac, interdum sit amet odio. Vivamus a augue ac diam consectetur faucibus. Sed interdum vulputate urna, at pharetra nulla porttitor at. Vestibulum id euismod enim. Curabitur nulla felis, malesuada ut lorem quis, ornare pulvinar elit. E",
          img:true,
          imgLink:'/project.io/static/img/logo.svg',
          skills:[
            {
              type:"css",
              value:3
            },
            {
              type:"css",
              value:3
            },
            {
              type:"css",
              value:3
            },
            {
              type:"css",
              value:3
            },
          ]
	  		},
	  		{
	  			title:"due",
          date:"16/02/2016",
	  		  description:"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent enim ante, dignissim a fermentum ac, interdum sit amet odio. Vivamus a augue ac diam consectetur faucibus. Sed interdum vulputate urna, at pharetra nulla porttitor at. Vestibulum id euismod enim. Curabitur nulla felis, malesuada ut lorem quis, ornare pulvinar elit. E",
          img:false,
          skills:[
            {
              type:"css",
              value:3
            },
            {
              type:"css",
              value:3
            },
            {
              type:"css",
              value:3
            },
            {
              type:"css",
              value:3
            },
          ]
	  	  },
	  		{
	  			title:"tre",
          date:"16/02/2016",
	  		  description:"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent enim ante, dignissim a fermentum ac, interdum sit amet odio. Vivamus a augue ac diam consectetur faucibus. Sed interdum vulputate urna, at pharetra nulla porttitor at. Vestibulum id euismod enim. Curabitur nulla felis, malesuada ut lorem quis, ornare pulvinar elit. E",
          img:false,
          skills:[
            {
              type:"css",
              value:3
            },
            {
              type:"css",
              value:3
            },
            {
              type:"css",
              value:3
            },
            {
              type:"css",
              value:3
            },
          ]
	  	  },
	  		{
	  			title:"quattro",
          date:"16/02/2016",
	  			description:"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent enim ante, dignissim a fermentum ac, interdum sit amet odio. Vivamus a augue ac diam consectetur faucibus. Sed interdum vulputate urna, at pharetra nulla porttitor at. Vestibulum id euismod enim. Curabitur nulla felis, malesuada ut lorem quis, ornare pulvinar elit. E",
          img:false,
          skills:[
            {
              type:"css",
              value:3
            },
            {
              type:"css",
              value:3
            },
            {
              type:"css",
              value:3
            },
            {
              type:"css",
              value:3
            }
          ]
	  		},
	  		{
	  			title:"cique",
          date:"16/02/2016",
          description:"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent enim ante, dignissim a fermentum ac, interdum sit amet odio. Vivamus a augue ac diam consectetur faucibus. Sed interdum vulputate urna, at pharetra nulla porttitor at. Vestibulum id euismod enim. Curabitur nulla felis, malesuada ut lorem quis, ornare,pulvinar elit. E",
          img:false,
          skills:[
            {
              type:"css",
              value:3
            },
            {
              type:"css",
              value:3
            },
            {
              type:"css",
              value:3
            },
            {
              type:"css",
              value:3
            },
          ]
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
  		margin:0;
      cursor:pointer;
      position: relative;
      overflow: hidden;

      &.open{

        .content-header:after{
          content:"\f068";
        }

      }

  		&-header{
  			margin:0;
        font-size: 30px;
        padding:10px;

        &:after{
          content:"\f067";
          font-family: FontAwesome;
          position: absolute;
          right: 5px;
          top: 10px;
          font-size: 30px;
        }
  		}

      &-toggle{
        display: none;
        margin:0;
        padding:10px;

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