/*jslint browser: true, indent: 2, plusplus: false */

(function ($, Drupal, window, document, undefined) {
  "use strict";

  var global = window,
  	growcalc = global.GrowCalc()
    gcstructures,
    Element = function (description, name, atomicMass, tag, oxidation, color) {
      var that = this;
      that.description = description;
      that.name = name;
      that.atomicMass = atomicMass;
      that.tag = tag;
      that.oxidation = oxidation;
      that.color = color;

      that.node = $("<li><a href=\"#\">" + description + "</a></li>").appendTo("#calc-elements ul");
      if (typeof that.node.popover !== "undefined") {
        that.node.popover({
          title: description + " ( " + name + " )",
          content: "Атомная масса: " + atomicMass + "<br />" +
            "Тэг: " + tag + "<br />" +
            "Степень окисления: " + oxidation + "<br />" +
            "Цвет: " + color
        });
      }

      that.node.click(function (e) {
        e.preventDefault();
        // TODO: add element
        growcalc.log(that.description + " clicked");
        that.node.detach();
        setTimeout(function () {
          that.node.appendTo("#calc-elements ul");
        }, 1000);
      });

      return this;
    };

	var gcstructuresGCStructures()['Element'] = Element;

	$(function () {
		Drupal.behaviors.growcalc_element_block = {
    attach: function(context) {
    	$('.block-growcalc-element', context).once('growcalc_element_block', function () {
    		var elements = growcalc.getElements(),
		      i,
		      j;

		    var defaultElements = Drupal.settings.growcalc.elements;
		    for (i in defaultElements) if (defaultElements.hasOwnProperty(i)) {
		      if (defaultElements[i].status === "1") {
		        growcalc.addElement(
		          defaultElements[i].description,
		          i, // name
		          defaultElements[i].atomic_mass,
		          '',
		          defaultElements[i].oxidation || 0,
		          '#' + defaultElements[i].color || ""
		        );
		      }
		    }

    	}
    }
	});
})(jQuery, Drupal, this, this.document);
