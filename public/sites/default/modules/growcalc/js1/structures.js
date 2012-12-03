/*jslint browser: true, indent: 2, plusplus: false */

(function (global) {
  "use strict";
  var $ = global.jQuery,
    gcstructures,
    log = function (msg, opts) {
      opts = opts || {};
      $.jGrowl(msg, opts);
    },
    GCStructures = function () {
      // Элемент
      var Element = function (description, name, atomicMass, tag, oxidation, color) {
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
            log(that.description + " clicked");
            that.node.detach();
            setTimeout(function () {
              that.node.appendTo("#calc-elements ul");
            }, 1000);
          });

          return this;
        },
        // Удобрение
        Fertilizer = function (description, name, tag, elements) {
          var that = this;
          that.description = description;
          that.name = name;
          that.tag = tag;
          that.elements = elements;

          that.node = $("<li><a href=\"#\">" + description + "</a></li>").appendTo("#calc-fertilizers ul");
          if (typeof that.node.popover !== "undefined") {
            that.node.popover({
              title: description + " ( " + name + " )",
              content: (function (els) {
                var output = "<p>Тэг: " + tag + "</p><table class=\"table table-striped table-condensed\"><thead><tr><th>Элемент</th><th>Количество</th></tr></thead><tbody>",
                  el;
                for (el in els) if (els.hasOwnProperty(el)) {

                  if (typeof els[el].element !== 'undefined') {
                    output += "<tr><td>" + els[el].element.description + " ( " + els[el].element.name + ")</td><td>" + els[el].amount + "%</td></tr>";
                  }
                }
                output += "</tbody></table>";
                return output;
              }(elements))
            });
          }

          that.node.click(function (e) {
            e.preventDefault();
            // TODO: add element
            log(that.description + " fertilizer clicked");
            that.node.detach();
            setTimeout(function () {
              that.node.appendTo("#calc-fertilizers ul");
            }, 1000);
          });

          return this; // ^_^
        },
        ElementProgram = function (name, description, elements, labels, data) {
          var that = this;
          that.name = name;
          that.description = description;
          that.elements = elements;
          that.labels = labels;
          that.data = data;


          this.debug = function () {
            var output = "<table class=\"table table-striped table-bordered table-condensed\"><tbody>",
              i,
              j;
            for(i in this.data) {
              output += "<tr><td>" + this.elements[i].name + "</td>";
              for(j in this.data[i]) {
                output += "<td>" + Math.round(this.data[i][j]) + "</td>";
              }
              output += "</tr>";
            }
            output += "</tbody></table>";
            log(output, {
              theme: 'info',
              beforeClose: function() { return false; }
            });
          };

          return this;
        },
        // TODO: Программа питания удобрениями.
        FertilizerProgram = function (name, description, elements, labels, data) {

          return this;
        };

      return {
        Element: Element,
        Fertilizer: Fertilizer,
        ElementProgram: ElementProgram,
        FertilizerProgram: FertilizerProgram
      };
    };

  global.GCStructures = function () {
    return gcstructures || (gcstructures = new GCStructures());
  };
}(window));
