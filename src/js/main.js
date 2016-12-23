var Vue = require('vue');
var App = require('./view/app.vue')

new Vue({
  el: '#app',
  render: function (createElement) {
    return createElement(App)
  }
})