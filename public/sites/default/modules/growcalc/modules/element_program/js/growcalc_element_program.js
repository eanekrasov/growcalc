(function (global) {
  "use strict";
  var $ = global.jQuery;
  $(function () {
    var growcalc = global.GrowCalc(),
      log = function(msg) {
        growcalc.log(msg);
      },
      fertilizers = growcalc.getFertilizers(),
      i,
      j;

    $('.growcalc-element-program').each(function () {
      var growcalc_element_program = Drupal.settings.growcalc.growcalc_element_programs[$(this).data('id')];
      for(i in growcalc_element_program.elements) {
        growcalc_element_program.elements[i] = growcalc.getElement(growcalc_element_program.elements[i]);
      }
      var editor = new global.GCeditor($(this).attr('id'), function (seriesId, index, value) {
        _elementProgram.data[seriesAliases[seriesId]][index] = value;
      });

      var _elementProgram = false;
      var seriesAliases = {};

      var loadElementProgram = function (elementProgram) {
        // (name, description, elements, labels, data)
        _elementProgram = elementProgram;

              console.log(_elementProgram);

        log("loading " + _elementProgram.name + " " + _elementProgram.description);

        for(i in _elementProgram.elements) {
          var element = _elementProgram.elements[i],
            values = _elementProgram.data[i];

          seriesAliases[element.name] = i;
          editor.addSeries(element.name, values, element.color, false);
          editor.setLabels(_elementProgram.labels);
          editor.render();
        }
      }

      var saveElementProgram = function () {
        return _elementProgram;
      }

      loadElementProgram(growcalc_element_program);
    });
  });
}(window));