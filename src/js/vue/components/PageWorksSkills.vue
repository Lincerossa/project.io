<template>
	  
	  <ul class="row">
	    <li class="col-xs-12"><strong class="col-xs-3">Tecnologie utilizzate</strong><strong class="col-xs-9">Impatto</strong></li>
	    <li class="col-xs-12" v-for="item in skills">
	      <p class="col-xs-3" >{{ item.type }}</p>
	      <div class="col-xs-9">
	        <div class="progression" :class="item.value"></div>
	      </div>
	    </li>
	  </ul>
</template>




<script>



export default {
  props:['skills']
}
</script>


<style scoped lang="less">
@import "./../../../less/library/bootstrap/mixins/vendor-prefixes.less";

  ul{
  	list-style: none;
  	padding: 0;
  	margin-top: 10px;

  	li{
			p{
				margin:0;
			}

			& > div{
				margin-top: 5px;
			}

			.progression{
				height: 10px;
				background-color: #00cc00;
				border-top-right-radius: 4px;
				-webkit-border-top-right-radius: 4px;
				-moz-border-top-right-radius: 4px;
				-o-border-top-right-radius: 4px;
				border-bottom-right-radius: 4px;
				-webkit-border-bottom-right-radius: 4px;
				-moz-border-bottom-right-radius: 4px;
				-o-border-bottom-right-radius: 4px;
				width: 0%;
		  	.animation-duration(1s);
		  	.animation-fill-mode(forwards);
		  	.animation-iteration-count(1);
	  	}
	  }

  }

  ul.open .one{
  	.animation-name(skillOne);
  }

  ul.open .two{
  	.animation-name(skillTwo);
  }

  ul.open .three{
  	.animation-name(skillThree);
  }

  ul.open .four{
  	.animation-name(skillFour);
  }

  ul.open .five{
  	.animation-name(skillFive);
  }

	@keyframes skillOne{
		from{width:0%};
		to{width:20%};
	}

	@-webkit-keyframes skillOne{
		from{width:0%};
		to{width:20%};
	}

	@-moz-keyframes skillOne{
		from{width:0%};
		to{width:20%};
	}

	@-o-keyframes skillOne{
		from{width:0%};
		to{width:20%};
	}

	@keyframes skillTwo{
		from{width:0%};
		to{width:40%};
	}

	@-webkit-keyframes skillTwo{
		from{width:0%};
		to{width:40%};
	}

	@-moz-keyframes skillTwo{
		from{width:0%};
		to{width:40%};
	}

	@-o-keyframes skillTwo{
		from{width:0%};
		to{width:40%};
	}




	@keyframes skillThree{
		from{width:0%};
		to{width:60%};
	}
	



	@-webkit-keyframes skillThree{
		from{width:0%};
		to{width:60%};
	}
	


	@-moz-keyframes skillThree{
		from{width:0%};
		to{width:60%};
	}
	


	@-o-keyframes skillThree{
		from{width:0%};
		to{width:60%};
	}
	

	@keyframes skillThree{
		from{width:0%};
		to{width:60%};
	}

	@-webkit-keyframes skillThree{
		from{width:0%};
		to{width:60%};
	}
	@-moz-keyframes skillThree{
		from{width:0%};
		to{width:60%};
	}

	@-o-keyframes skillThree{
		from{width:0%};
		to{width:60%};
	}
	
	@keyframes skillFour{
		from{width:0%};
		to{width:80%};
	}
	
	@-webkit-keyframes skillFour{
		from{width:0%};
		to{width:80%};
	}	

	@-moz-keyframes skillFour{
		from{width:0%};
		to{width:80%};
	}

	@-o-keyframes skillFour{
		from{width:0%};
		to{width:80%};
	}
	
	@keyframes skillFive{
		from{width:0%};
		to{width:100%};
	}
	
	@-webkit-keyframes skillFive{
		from{width:0%};
		to{width:100%};
	}

	@-moz-keyframes skillFive{
		from{width:0%};
		to{width:100%};
	}

	@-o-keyframes skillFive{
		from{width:0%};
		to{width:100%};
	}

</style>