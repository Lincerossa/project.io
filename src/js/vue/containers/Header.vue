<template>
  <div class="header">
    <div class="[ jsHamburger ] header-hamburger" v-on:click="toggle">
      <span v-for="n in 6"></span>
    </div>
    <div class="[ jsOverlay ] header-overlay">
      <ul class="text-center">
        <li v-for="item in items">
          <a v-bind:href="item.link">{{item.text}}</a>
        </li>
        <div class="col-xs-12 social">
          <a class="col-xs-4" href="https://github.com/Lincerossa"><img src="/project.io/static/img/GitHub-Mark-64px.png"></a>
          <a class="col-xs-4" href="https://github.com/Lincerossa"><img src="/project.io/static/img/GitHub-Mark-64px.png"></a>
          <a class="col-xs-4" hhref="https://github.com/Lincerossa"><img src="/project.io/static/img/GitHub-Mark-64px.png"></a>
        </div>
      <ul>
    </div>
    <a href="/project.io/" class="header-logo"><img src="/project.io/static/img/logo.svg"></a>
  </div>
</template>

<script>

  export default {
    data(){
      return {
        items : [
          {text: 'About', link:'/project.io/page/about.html'},
          {text: 'Skills', link:'/project.io/page/skills.html'},
          {text: 'Works', link:'/project.io/page/works.html'}
        ]
      }
    },

    methods: {
      toggle () {
        $(".jsHamburger, .jsOverlay").toggleClass("open");
      }
    }

  }

</script>

<style scoped lang="less">
  @navbar-menu-color:#505050;
  .header{
    position: fixed;
    top:0;
    padding: 0px 20px;
    height: 55px;
    left: 0;
    z-index: 2;
    background-color:#fff;
    right:0;
    border-bottom: 1px solid grey;
    display: flex;
    display: -webkit-flex;
    justify-content:space-between;
    -webkit-justify-content:space-between;

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
      left: 0;
      top:0;
      background-color: #fff;
      display: none;

      &.open{
        display: -webkit-flex;
        display: flex;
        justify-content: center;
        webkit-justify-content: center;
        align-items: center;
        webkit-align-items: center;

        ul{
          list-style: none;
          padding: 0;
          position: relative;
          li{
            font-size: 5rem;
            font-weight: 600;
            margin-bottom: 10px;
            border-bottom: 1px solid grey;
            transform:translate(-100vw,0);
            -webkit-transform:translate(-100vw,0);
            -moz-transform:translate(-100vw,0);
            opacity:0;
            position: relative;
            animation-name:insertLi;
            animation-iteration-count:1;
            animation-fill-mode:forwards;
            animation-duration:.25s;
            -webkit-animation-name:insertLi;
            -webkit-animation-iteration-count:1;
            -webkit-animation-fill-mode:forwards;
            -webkit-animation-duration:.25s;
            -o-animation-name:insertLi;
            -o-animation-iteration-count:1;
            -o-animation-fill-mode:forwards;
            -o-animation-duration:.25s;
            -moz-animation-name:insertLi;
            -moz-animation-iteration-count:1;
            -moz-animation-fill-mode:forwards;
            -moz-animation-duration:.25s;

            a{
              &:hover{
                text-decoration: none;
              }
            }

            &:hover{
              border-bottom:1px solid green;
              cursor: pointer;
            }

            &:nth-of-type(1){
              animation-delay:0s;
              -webkit-animation-delay:0s;
              -moz-animation-delay:0s;
              -o-animation-delay:0s;
            }

            &:nth-of-type(2){
              animation-delay:.25s;
              -webkit-animation-delay:.25s;
              -moz-animation-delay:.25s;
              -o-animation-delay:.25s;
            }

            &:nth-of-type(3){
              animation-delay:.5s;
              -webkit-animation-delay:.5s;
              -moz-animation-delay:.5s;
              -o-animation-delay:.5s;
            }
          }

          .social{
            margin-top: 10px;

            a:nth-of-type(1){
              -moz-animation-delay:1s;
              -webkit-animation-delay:1s;
              -o-animation-delay:1s;
              animation-delay:1s;
            }

            a:nth-of-type(2){
              -moz-animation-delay:1.5s;
              -webkit-animation-delay:1.5s;
              -o-animation-delay:1.5s;
              animation-delay:1.5s;
            }

            a:nth-of-type(3){
              -moz-animation-delay:2s;
              -webkit-animation-delay:2s;
              -o-animation-delay:2s;
              animation-delay:2s;
            }

            a{
              opacity: 0;
              display: block;
              animation-name:insertSocial;
              animation-iteration-count:1;
              animation-fill-mode:forwards;
              animation-duration:.5s;
              -webkit-animation-name:insertSocial;
              -webkit-animation-iteration-count:1;
              -webkit-animation-fill-mode:forwards;
              -webkit-animation-duration:.5s;
              -o-animation-name:insertSocial;
              -o-animation-iteration-count:1;
              -o-animation-fill-mode:forwards;
              -o-animation-duration:.5s;
              -moz-animation-name:insertSocial;
              -moz-animation-iteration-count:1;
              -moz-animation-fill-mode:forwards;
              -moz-animation-duration:.5s;
            }
          }
        }

        @keyframes insertLi{
          from{transform:translate(-100vw,0);opacity:0;}
          to{transform:translate(0,0);opacity:1;}
        }

        @-webkit-keyframes insertLi{
          from{-webkit-transform:translate(-100vw,0);opacity:0;}
          to{-webkit-transform:translate(0,0);opacity:1;}
        }

        @-moz-keyframes insertLi{
          from{-moz-transform:translate(-100vw,0);opacity:0;}
          to{-moz-transform:translate(0,0);opacity:1;}
        }

        @-o-keyframes insertLi{
          from{-o-transform:translate(-100vw,0);opacity:0;}
          to{-o-transform:translate(0,0);opacity:1;}
        }

        @keyframes insertSocial{
          from{opacity:0;}
          to{opacity:1;}
        }
        @-webkit-keyframes insertSocial{
          from{opacity:0;}
          to{opacity:1;}
        }
        @-moz-keyframes insertSocial{
          from{opacity:0;}
          to{opacity:1;}
        }
        @-o-keyframes insertSocial{
          from{opacity:0;}
          to{opacity:1;}
        }
      }
    }

    &-logo{
      width: 60px;
      &:hover{
        cursor:pointer;
      }
      
      img{
        width: 100%;
      }
    }
  }

</style>