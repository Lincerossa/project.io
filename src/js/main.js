window.onload = function(e){ 
	//This is the main VueJS app file.
	//This file renders the vueJs Vue, injecting it into any page
	var Vue = require('vue');
	var Header = require('./view/containers/Header.vue');
	var Content = require('./view/containers/Content.vue');

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
}	
