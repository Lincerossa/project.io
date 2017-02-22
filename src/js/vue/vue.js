var Vue = require('vue');
var Header = require('./containers/Header.vue');

new Vue({
  el: 'header',
  render: function (createElement) {
    return createElement(Header)
  }
})

if(document.getElementById("page-works")){
	var PageWorks = require('./containers/PageWorks.vue');
	new Vue({
	  el: '#page-works',
	  render: function (createElement) {
	    return createElement(PageWorks)
	  }
	}) 
}

if(document.getElementById("page-index")){
	var PageIndex = require('./containers/PageIndex.vue');
	new Vue({
	  el: '#page-index',
	  render: function (createElement) {
	    return createElement(PageIndex)
	  }
	}) 
}