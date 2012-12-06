/*jslint browser: true, indent: 2, plusplus: false */

(function ($, Ember, Drupal, window, document, undefined) {
  "use strict";

  var GrowCalc = window.GrowCalc = Ember.Application.create();

  GrowCalc.DrupalSavable = Ember.Mixin.create({
    Type: 'node type',
    PrimaryKey: 'Id',
    GetSaveUrl: function () {
      var key = this.get(this.get('PrimaryKey'));
      return Drupal.settings.basePath + "growcalc/ajax/" + this.get('Type') + "/" + 
        ((key === 0) ? "create" : key + "/update");
    },
    GetDeleteUrl: function () {
      var key = this.get(this.get('PrimaryKey'));
      return Drupal.settings.basePath + "growcalc/ajax/" + this.get('Type') + "/" + key + "/delete";
    },
    PrepareData: function () {
      return [];
    },
    IsNew: function () {
      var key = this.get(this.get('PrimaryKey'));
      return (key === 0);
    },
  });

  GrowCalc.Drupal = function () {
    var drupal = (function () {
      // private interface
      var status = true; // online/offline status.

      // public interface
      return {
        Save: function (v) {
          if (status) {
            $.ajax({
              type: 'POST',
              url: v.object.GetSaveUrl(),
              data: v.object.PrepareData(),
              success: function (data) {
                if (v.hasOwnProperty('success')) v.success(data);
              },
              error: function (jqXHR, textStatus, errorThrown) {
                if (v.hasOwnProperty('failure')) v.failure(jqXHR, textStatus, errorThrown);
              }
            });
          }
        },
        Delete: function (v) {
          if (!v.object.IsNew()) {
            $.ajax({
              type: 'POST',
              url: v.object.GetDeleteUrl(),
              success: function (data) {
                if (v.success) {
                  v.success(data);
                }
              }
            });
          }
        },
        SetStatus: function (newStatus) {
          status = !!newStatus;
        },
        GetStatus: function () {
          return status;
        },
      };
    })();

    window.GrowCalc.Drupal = function () { // re-define the function for subsequent calls
      return drupal;
    };

    return drupal;
  };

  GrowCalc.NumberField = Ember.TextField.extend({
    // implementation of this function, see http://stackoverflow.com/a/995193/65542
    keyDown: function (event) {

      if (event.keyCode == 38) { // up
        this.set('value', parseFloat(this.get('value')) + 1);
      }

      if (event.keyCode == 40) { // down
        this.set('value', parseFloat(this.get('value')) - 1);
      }

      
      // Allow: backspace, delete, tab, escape, and enter
      if (event.keyCode == 46 || event.keyCode == 8 || event.keyCode == 9 || event.keyCode == 27 || event.keyCode == 13 ||
      // Allow: Ctrl+A
      (event.keyCode == 65 && event.ctrlKey === true) ||
      // Allow: home, end, left, right
      (event.keyCode >= 35 && event.keyCode <= 39)) {
        // let it happen, don't do anything
        return;
      }
      else {
        // Ensure that it is a number and stop the keypress
        if (event.shiftKey || (event.keyCode < 48 || event.keyCode > 57) && (event.keyCode < 96 || event.keyCode > 105)) {
          event.preventDefault();
        }
      }
    }
  });

  GrowCalc.ScrollView = Ember.View.extend({
    template: Ember.Handlebars.compile('<div class="min">{{view.min}}</div><div class="value color" style="background-color: #{{unbound view.color}}">></div><div class="max">{{view.max}}</div>'),
    classNames: ['scroll'],
    scrollState: 0,
    min: 0,
    max: 100,
    attributeBindings: ['value', 'color'],
    valueBinding: "",
    color: 'f00',
    precision: 2,
    mouseDown: function (e) {
      e.preventDefault();
      this.scrollState = 1;
    },
    mouseMove: function (e) {
      e.preventDefault();
      if (this.scrollState === 1) {
        this.updateValue(this.max * (e.pageX - $('.value', this.$()).offset().left) / this.$().width());
      }
    },
    mouseUp: function (e) {
      e.preventDefault();
      if (this.scrollState === 1) {
        this.mouseMove(e);
        this.scrollState = 0;
        delete this.oldValue;
        delete this.updateValueDelta;
      }
    },
    mouseLeave: function (e) {
      this.mouseUp(e);
    },
    updateValue: function (value) {
      if (typeof this.oldValue == 'undefined') {
        this.oldValue = value;
      }

      if (value !== this.oldValue) {
        if (typeof this.updateValueDelta == 'undefined') {
          this.updateValueDelta = 0;
        }

        this.updateValueDelta = this.updateValueDelta + value - this.oldValue; // .toFixed(this.get('precision'))
        this.oldValue = value;
        if (Math.abs(this.updateValueDelta) > Math.pow(10, -parseInt(this.get('precision'), 10))) {
          var newValue = parseFloat(this.get('value')) + parseFloat(this.updateValueDelta.toFixed(this.get('precision')));
          this.set('value', newValue.toFixed(this.get('precision')));
          this.updateValueDelta = this.updateValueDelta - this.updateValueDelta.toFixed(this.get('precision'));
        }
      }
    },
    didInsertElement: function () {
      this.valueUpdated();
      this.colorUpdated();
    },
    valueUpdated: function () {
      $('.value', this.$()).width((100 * parseFloat(this.get('value')) / this.max) + "%");
    }.observes('value'),
    colorUpdated: function () {
      $('.value', this.$()).css({background: '#' + this.get('color')});
    }.observes('color')
  });

  $(document).ajaxSuccess(function (event, jqXHR, ajaxSettings) {
    if (jqXHR.hasOwnProperty('context')) {
      jqXHR.context.pnotify({
        title: "Успешно!",
        text: "Данные сохранены на сервере.",
        type: "success",
        hide: true,
        closer: true,
        sticker: true,
        icon:  "ui-icon ui-icon-check",
        opacity: 1,
        shadow: true,
        width: $.pnotify.defaults.width,
        delay: 100
      });
    }
  });

  $(document).ajaxError(function (event, jqXHR, ajaxSettings, thrownError) {
    if (jqXHR.hasOwnProperty('context')) {
      jqXHR.context.pnotify({
        title: "Ошибка!",
        type: "error",
        text: jqXHR.responseText, 
        closer: true,
        sticker: true,
        icon:  "ui-icon ui-icon-alert",
        opacity: 1,
        shadow: true,
        width: $.pnotify.defaults.width,
        delay: 1000
      });
    }
  });

  $(document).ajaxSend(function (event, jqXHR, ajaxSettings) {
    jqXHR.context = $.pnotify({
      title: "Сохранение ",
      text: "Отправка на сервер..", 
      type: "info",
      icon: "ui-icon ui-icon-info",
      hide: false,
      closer: false,
      sticker: false,
      opacity: 0.75,
      shadow: false,
      styling: 'jqueryui'
    });
  });

})(window.jQuery, window.Ember, window.Drupal, window, window.document);
