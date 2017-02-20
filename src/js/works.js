var Vue = require('vue');
var Header = require('./vue/containers/Header.vue');
var Content = require('./vue/containers/Content.vue');

new Vue({
  el: 'header',
  render: function (createElement) {
    return createElement(Header)
  }
})

new Vue({
  el: '#page-container',
  render: function (createElement) {
    return createElement(Content)
  }
}) 