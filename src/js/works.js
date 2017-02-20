var Vue = require('vue');
var Header = require('./vue/containers/Header.vue');

new Vue({
  el: 'header',
  render: function (createElement) {
    return createElement(Header)
  }
})