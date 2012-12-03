// custom css expression for a case-insensitive contains()
jQuery.expr[':'].Contains = function(a,i,m){
  return (a.textContent || a.innerText || "").toUpperCase().indexOf(m[3].toUpperCase())>=0;
};

(function ($) {
  "use strict";

  $.listFilter = function(el, list, options){
    // To avoid scope issues, use 'base' instead of 'this'
    // to reference this class from internal events and functions.
    var base = this;
    
    // Access to jQuery and DOM versions of element
    base.$el = $(el);
    base.el = el;
    
    // Add a reverse reference to the DOM object
    base.$el.data("listFilter", base);
    
    base.init = function(){
      if( typeof( list ) === "undefined" || list === null ) list = [];
      
      base.list = list;
      
      base.options = $.extend({},$.listFilter.defaultOptions, options);
      
      // Put your initialization code here
      // create and add the filter form to the header
      $(el).change( function () {
        var filter = $(this).val();
        if(filter) {
          // this finds all links in a list that contain the input,
          // and hide the ones not containing the input while showing the ones that do
          $(base.list).find("li:not(:Contains(" + filter + "))").hide();
          $(base.list).find("li:Contains(" + filter + ")").show();
        } else {
          $(base.list).find("li").show();
        }
        return false;
      })
      .keyup( function () {
        // fire the above change event after every letter
        $(el).change();
      });
      $(el).change();
    };
        
    // Sample Function, Uncomment to use
    // base.functionName = function(paramaters){
    // 
    // };
    
    // Run initializer
    base.init();
  };
    
  $.listFilter.defaultOptions = {
      list: []
  };
  
  $.fn.listFilter = function(list, options){
    return this.each(function(){
      (new $.listFilter(this, list, options));

	    // HAVE YOUR PLUGIN DO STUFF HERE
		

	    // END DOING STUFF

    });
  };

})(jQuery);