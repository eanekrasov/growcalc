/*jslint browser: true, indent: 2, plusplus: false */

(function ($, Drupal, window, document, undefined) {
  "use strict";
  var global = window,
    Raphael = global.Raphael,
    growcalc; // экземпляр синглтона. Доступен через глобальный GrowCalc().

  function GrowCalc() {
    // singleton does have a constructor that should only be used once
    var elements = {},
      fertilizers = {},
      elementPrograms = {},
      fertilizerPrograms = {},
      GCStructures = global.GCStructures();

    /*this.Element = GCStructures.Element;

    this.getElements = function () {
      return elements;
    };

    this.getElement = function (name) {
      return elements[name];
    };


    this.addElement = function (description, name, atomicMass, tag, oxidation, color) {
      return elements[name] || (elements[name] = new this.Element(description, name, atomicMass, tag, oxidation, color));
    };
*/
    this.Models = {};
    
    this.Fertilizer = GCStructures.Fertilizer;

    this.getFertilizers = function () {
      return fertilizers;
    };

    this.addFertilizer = function (description, name, tag, elements) {
      return fertilizers[name] || (fertilizers[name] = new this.Fertilizer(description, name, tag, elements));
    };

    this.ElementProgram = GCStructures.ElementProgram;

    this.getElementPrograms = function () {
      return elementPrograms;
    };

    this.addElementProgram = function (name, description, elements, labels, data) {
      return elementPrograms[name] || (elementPrograms[name] = new this.ElementProgram(name, description, elements, labels, data));
    };

    this.FertilizerProgram = GCStructures.FertilizerProgram;

    this.getFertilizerPrograms = function () {
      return fertilizerPrograms;
    };

    this.addFertilizerProgram = function (name, description, elements, labels, data) {
      return fertilizerPrograms[name] || (fertilizerPrograms[name] = new this.FertilizerProgram(name, description, elements, labels, data));
    };

    this.log = function (msg) {
      global.jQuery.jGrowl(msg);
    }

    // delete GrowCalc;
  }

  global.GrowCalc = function () {
    return growcalc || (growcalc = new GrowCalc());
  };
}(window));

/*(function (global) {
  "use strict";
  var $ = global.jQuery;
  $(function () {
    var growcalc = global.GrowCalc(),
      log = function(msg) {
        growcalc.log(msg);
      },
      elements = growcalc.getElements(),
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

    var defaultFertilizers = Drupal.settings.growcalc.fertilizers;
    for (i in defaultFertilizers) if (defaultFertilizers.hasOwnProperty(i)) {
      for (j in defaultFertilizers[i].elements) if (defaultFertilizers[i].elements.hasOwnProperty(j)) {
        defaultFertilizers[i].elements[j].element = elements[defaultFertilizers[i].elements[j].element];
      }
      if (defaultFertilizers[i].status === "1") {
        growcalc.addFertilizer(
          defaultFertilizers[i].description,
          defaultFertilizers[i].name,
          i,
          defaultFertilizers[i].elements
        );
      }
    }
  });
}(window));

*/


(function ($) {
  // custom css expression for a case-insensitive contains()
  jQuery.expr[':'].Contains = function(a,i,m){
      return (a.textContent || a.innerText || "").toUpperCase().indexOf(m[3].toUpperCase())>=0;
  };


  function listFilter(input, list) { // header is any element, list is an unordered list
    // create and add the filter form to the header
    $(input)
      .change( function () {
        var filter = $(this).val();
        if(filter) {
          // this finds all links in a list that contain the input,
          // and hide the ones not containing the input while showing the ones that do
          $(list).find("a:not(:Contains(" + filter + "))").parent().hide();
          $(list).find("a:Contains(" + filter + ")").parent().show();
        } else {
          $(list).find("li").show();
        }
        return false;
      })
    .keyup( function () {
        // fire the above change event after every letter
        $(this).change();
    });
  }

  $(function () {
    $(".list-with-filter").each(function (e) {
      listFilter($(".filter", this), $("ul", this));
    });
  });
}(jQuery));