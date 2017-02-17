<template>
    <div class="header-fixed">
      <div class="[ jsHamburger ] header-fixed-hamburger" v-on:click="toggle">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>
      <div class="[ jsOverlay ] header-fixed-overlay">
        <ul>
          <li v-for="item in items">{{item.text}}</li>
        <ul>
      </div>
      <img src="/project.io/static/img/logo.jpg">
    </div>
</template>




<script>


export default {

  data(){
    return {
      items : [{text: 'experience'},{text: 'strategy'},{text: 'product'},
      ]
    }
  },

  methods: {
    toggle () {
      $(".jsHamburger, .jsOverlay").toggleClass("open");
    }
  },
}

</script>













<style scoped lang="less">
   @navbar-menu-color : #505050;

  .header-fixed{
    position: fixed;
    top:0;
    height: 50px;
    left: 0;
    z-index: 2;
    background-color:#fff;
    right:0;
    border-bottom: 1px solid grey;
    display: flex;
    justify-content:space-between;

    img{
      width: 50px;
    }

    &-hamburger{
      width:35px;
      z-index: 3;
      height: 35px;
      margin-top: 15px;
      -webkit-transform: rotate(0deg);
      -moz-transform: rotate(0deg);
      -o-transform: rotate(0deg);
      transform: rotate(0deg);
      -webkit-transition: .5s ease-in-out;
      -moz-transition: .5s ease-in-out;
      -o-transition: .5s ease-in-out;
      transition: .5s ease-in-out;
      cursor: pointer;

      span {
        display: block;
        position: absolute;
        height: 5px;
        width: 50%;
        background: @navbar-menu-color;
        opacity: 1;
        -webkit-transform: rotate(0deg);
        -moz-transform: rotate(0deg);
        -o-transform: rotate(0deg);
        transform: rotate(0deg);
        -webkit-transition: .25s ease-in-out;
        -moz-transition: .25s ease-in-out;
        -o-transition: .25s ease-in-out;
        transition: .25s ease-in-out;
      }

      span:nth-child(even) {
        left: 50%;
        border-radius: 0 9px 9px 0;
        -webkit-border-radius: 0 9px 9px 0;
        -moz-border-radius: 0 9px 9px 0;
        -o-border-radius: 0 9px 9px 0;
      }

      span:nth-child(odd) {
        left:0px;
        border-radius: 9px 0 0 9px;
        -webkit-border-radius: 9px 0 0 9px;
        -moz-border-radius: 9px 0 0 9px;
        -o-border-radius: 9px 0 0 9px;
      }

      span:nth-child(1),  span:nth-child(2) {
        top: 0px;
      }

      span:nth-child(3), span:nth-child(4) {
        top: 10px;
      }

      span:nth-child(5),  span:nth-child(6) {
        top: 20px;
      }

      &.open span:nth-child(1), &.open span:nth-child(6) {
        -webkit-transform: rotate(45deg);
        -moz-transform: rotate(45deg);
        -o-transform: rotate(45deg);
        transform: rotate(45deg);
      }

      &.open span:nth-child(2), &.open span:nth-child(5) {
        -webkit-transform: rotate(-45deg);
        -moz-transform: rotate(-45deg);
        -o-transform: rotate(-45deg);
        transform: rotate(-45deg);
      }

      &.open span:nth-child(1) {
        left: 5px;
        top: 5px;
      }

      &.open span:nth-child(2) {
        left: calc(50% - 5px);
        top: 5px;
      }

      &.open span:nth-child(3) {
        left: -50%;
        opacity: 0;
      }

      &.open span:nth-child(4) {
        left: 100%;
        opacity: 0;
      }

      &.open span:nth-child(5) {
        left: 5px;
        top: 15px;
      }

      &.open span:nth-child(6) {
        left: calc(50% - 5px);
        top: 15px;
      }
    }

    &-overlay{
      position: fixed;
      width: 100vw;
      height: 100vh;
      background-color: #fff;
      display: none;

      &.open{
        display: flex;
        display: -webkit-flex;
        
        justify-content: center;
        o-content: center;
        webkit-justify-content: center;
        align-items: center;
        webkit-align-items: center;
        o-align-items: center;

        ul{
          list-style: none;
          padding: 0;
          li{
            font-size: 6rem;
            font-weight: 600;
            margin-bottom: 20px;
            padding-bottom: 5px;
            border-bottom: 1px solid grey;
            right:100vh;
            opacity:0;
            position: relative;
            animation-iteration-count:1;
            animation-fill-mode:forwards;
            animation-duration:.25s;
            -webkit-animation-iteration-count:1;
            -webkit-animation-fill-mode:forwards;
            -webkit-animation-duration:.5s;
            -o-animation-iteration-count:1;
            -o-animation-fill-mode:forwards;
            -o-animation-duration:.25s;
            -moz-animation-iteration-count:1;
            -moz-animation-fill-mode:forwards;
            -moz-animation-duration:.25s;
            animation-name:insertLi;
            -moz-animation-name:insertLi;
            -webkit-animation-name:insertLi;
            -o-animation-name:insertLi;
            &:hover{
              border-bottom:1px solid green;
              cursor: pointer;
            }


            &:nth-of-type(1){
              animation-delay:0s;
              -moz-animation-delay:0s;
              -o-animation-delay:0s;
              -webkit-animation-delay:0s;
            }
            &:nth-of-type(2){
              animation-delay:.25s;
              -moz-animation-delay:.25s;
              -o-animation-delay:.25s;
              -webkit-animation-delay:.25s;
            }
            &:nth-of-type(3){
              animation-delay:.5s;
              -moz-animation-delay:.5s;
              -o-animation-delay:.5s;
              -webkit-animation-delay:.5s;
            }
          }

        }

       
        @keyframes insertLi{
          from{right:100vh;opacity:0;}
          to{right:0vh;opacity:1;}
        }
        @-webkit-keyframes insertLi{
          from{right:100vh;opacity:0;}
          to{right:0vh;opacity:1;}
        }
        @-moz-keyframes insertLi{
          from{right:100vh;opacity:0;}
          to{right:0vh;opacity:1;}
        }
        @-o-keyframes insertLi{
          from{right:100vh;opacity:0;}
          to{right:0vh;opacity:1;}
        }

      }

    }
  }


</style>