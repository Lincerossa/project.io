<template>
    <div class="header-fixed">
      <img src="/project.io/static/img/logo.jpg">
      <div class="[ jsHamburger ] header-fixed-hamburger" v-on:click="toggle">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
</template>




<script>


export default {

  methods: {
    toggle () {
      var el = $(".jsHamburger");
      el.toggleClass("open")

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
  }


</style>