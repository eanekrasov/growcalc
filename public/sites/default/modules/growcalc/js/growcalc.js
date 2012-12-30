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
    IsTemporary: function () {
      var key = this.get(this.get('PrimaryKey'));
      return (key === 0);
    },
  });

  GrowCalc.Drupal = function () {
    var drupal = (function () {
      var supportLocalStorage = ('localStorage' in window) && window['localStorage'] !== null,
        // private interface
        status = true; // online/offline status.
        // public interface
      return {
        supportLocalStorage: supportLocalStorage,
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
          } else {
            localStorage[v.object.toString()] = JSON.stringify(v.object.PrepareData());

            handle_storage();
          }
        },
        Delete: function (v) {
          if (status) {
            if (!v.object.IsTemporary()) {
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
          } else {
            localStorage.removeItem(v.object.toString());
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

  GrowCalc.LocalStorageView = JQ.Dialog.extend({
    classNames: ['local-storage-dialog'],
    width: 100,
    minWidth: 100,
    autoOpen: true,
    title: "localStorage",
    template: Ember.Handlebars.compile(
      '<p>Status: {{Status}}</p>' +
      '<button class="action action-toggle-status" {{action "ToggleStatus" target on="click"}} title="Переключить режим"><span class="ui-icon ui-icon-check"></span></button>' +
      '<button class="action action-clear" {{action "Clear" target on="click"}} title="Очистить локальное хранилище"><span class="ui-icon ui-icon-trash"></span></button>'
    ),
    Status: GrowCalc.Drupal().GetStatus() ? 'online' : 'offline',
    ToggleStatus: function () {
      GrowCalc.Drupal().SetStatus(!GrowCalc.Drupal().GetStatus());
      this.set('Status', GrowCalc.Drupal().GetStatus() ? 'online' : 'offline');
      $(this.$('.action-toggle-status .ui-icon'))
        .toggleClass('ui-icon-check', GrowCalc.Drupal().GetStatus())
        .toggleClass('ui-icon-cancel', !GrowCalc.Drupal().GetStatus());
    },
    Clear: function () {
      localStorage.clear();
    },
    didInsertElement: function() {
      var that = this;
      that._super();
      $("button", that.$()).button();
    }
  });

  $(function() {
    //GrowCalc.localStorageView = GrowCalc.LocalStorageView.create().appendTo(document);
  });

  GrowCalc.NumberField = Ember.View.extend({
    value: 0,
    classNames: ['ember-number-field'],
    size: 10,
    template: Ember.Handlebars.compile('<input {{bindAttr value="view.value"}} {{bindAttr size="view.size"}}/>' +
      '<div class="actions">' +
      '<button class="action action-plus" {{action "Plus" target on="click"}} title="+">+</button>' +
      '<button class="action action-minus" {{action "Minus" target on="click"}} title="-">-</button>' +
      '</div>'),
    Plus: function () {
      this.set('value', parseFloat(this.get('value')) + 1);
    },
    Minus: function () {
      this.set('value', parseFloat(this.get('value')) - 1);
    },
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
    },
    keyUp: function (event) {
      if (event.shiftKey || (event.keyCode < 48 || event.keyCode > 57) && (event.keyCode < 96 || event.keyCode > 105) && (event.keyCode != 46) && (event.keyCode != 8)) {
        event.preventDefault();

      } else {
        this.set('value', parseFloat(this.$('input').attr('value')));
      }
    },
    didInsertElement: function () {
      this._super();
      this.$('button').button();
    }
  });

  /*
  GrowCalc.NumberField = Ember.View.extend({
    value: 0,
    classNames: ['ember-number-field'],
    template: Ember.Handlebars.compile('<input {{bindAttr value="view.value"}}/>' +
      '<div class="actions">' +
      '<button class="action action-plus" {{action "Plus" target on="click"}} title="+">+</button>' +
      '<button class="action action-minus" {{action "Minus" target on="click"}} title="-">-</button>' +
      '</div>'),
    Plus: function () {
      this.set('value', parseFloat(this.get('value')) + 1);
    },
    Minus: function () {
      this.set('value', parseFloat(this.get('value')) - 1);
    },
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
    },
    didInsertElement: function () {
      this._super();
      this.$('button').button();
    }
  });
*/
  GrowCalc.ScrollView = Ember.View.extend({
    template: Ember.Handlebars.compile(
      //'<div class="min">{{view.min}}</div>' +
      '<div class="background-value"><div class="color" style="background-color: {{unbound view.backgroundColor}}"></div></div>' +
      '<div class="picker"></div>' +
      '<div class="title background">{{view.title}}</div>' +
      '<div class="background-label">{{view.backgroundValue}}</div>' +
      '<div class="value color" style="background-color: #{{unbound view.color}}; border-color: #{{unbound view.color}};"><div class="gradient"></div><div class="title">{{view.title}}</div></div>' +
      '' // '<div class="max">{{view.max}}</div>'
    ),
    classNames: ['scroll'],
    min: 0,
    max: 100,
    minValue: 0,
    maxValue: undefined,
    orientation: 'horizontal',
    reversed: 'false',
    attributeBindings: ['value', 'enabled', 'backgroundEnabled', 'title', 'backgroundValue', 'backgroundValueVisible', 'color', 'min', 'max', 'orientation', 'reversed'],
    title: '',
    enabled: true,
    backgroundEnabled: true,
    value: 0,
    backgroundValue: 10,
    color: 'f00',
    backgroundValueVisible: false,
    backgroundValueVisibleChanged: function () {
      this.$('.background-value').toggle(this.get('backgroundValueVisible') === 'true');
      this.$('.background-label').toggle(this.get('backgroundValueVisible') === 'true');
      this.$('.picker').toggle(this.get('backgroundValueVisible') === 'true');
    }.observes('backgroundValueVisible'),
    backgroundColor: function () {
      return net.brehaut.Color('#' + this.get('color')).blend(net.brehaut.Color('#FFFFFF'), 0.9).toCSS();
    }.property('color'),
    precision: 2,
    scrollStates: [{}, {}],
    scrollState: -1,
    mouseDown: function (e) {
      e.preventDefault();
      if ((this.get('enabled') == true) && !$(e.target).hasClass('picker')) {
        this.set('scrollState', 0);
        delete this.get('scrollStates')[0].oldValue;
      } else if ((this.get('backgroundEnabled') == true) && $(e.target).hasClass('picker')) {
        this.set('scrollState', 1);
        delete this.get('scrollStates')[1].oldValue;
      } 
    },
    mouseMove: function (e) {
      var state = this.get('scrollState');
      if (state !== -1) {
        e.preventDefault();
        if (this.get('orientation') == 'horizontal') {
          this.updateValue(this.max * (e.pageX - (this.$().offset().left + 4)) / (this.$().width() - 8));
        } else {
          this.updateValue(this.max * (e.pageY - this.$().offset().top - 4) / (this.$().height() - 8));
        }
      }
    },
    mouseUp: function (e) {
      var state = this.get('scrollState');
      if (state !== -1) {
        e.preventDefault();
        this.mouseMove(e);
        delete this.get('scrollStates')[state].oldValue;
        delete this.get('scrollStates')[state].updateValueDelta;
        this.set('scrollState', -1);
      }
    },
    mouseLeave: function (e) {
      this.mouseUp(e);
    },
    updateValue: function (value) {
      if (this.get('reversed') == 'true') {
        value = this.get('max') - value;
      }
      var state = this.get('scrollState');
      if (typeof this.get('scrollStates')[state].oldValue == 'undefined') {
        this.get('scrollStates')[state].oldValue = value;
      }

      if (value !== this.get('scrollStates')[state].oldValue) {
        if (typeof this.get('scrollStates')[state].updateValueDelta == 'undefined') {
          this.get('scrollStates')[state].updateValueDelta = 0;
        }

        this.get('scrollStates')[state].updateValueDelta = this.get('scrollStates')[state].updateValueDelta + value - this.get('scrollStates')[state].oldValue; // .toFixed(this.get('precision'))
        this.get('scrollStates')[state].oldValue = value;
        if (Math.abs(this.get('scrollStates')[state].updateValueDelta) > Math.pow(10, -parseInt(this.get('precision'), 10))) {
          var step = parseFloat(this.get('scrollStates')[state].updateValueDelta.toFixed(this.get('precision'))),
            newVal = (parseFloat(this.get((state) ? 'backgroundValue' : 'value')) + step).toFixed(this.get('precision'));
          if ((this.get('minValue') != undefined) && (newVal < this.get('minValue'))) {
            newVal = this.get('minValue');
          }
          if ((this.get('maxValue') != undefined) && (newVal > this.get('maxValue'))) {
            newVal = this.get('maxValue');
          }
          this.set((state) ? 'backgroundValue' : 'value', parseFloat(newVal));
          this.get('scrollStates')[state].updateValueDelta -= step;
        }
      }
    },
    didInsertElement: function () {
      var that = this;
      this._super();
      this.$().addClass(this.get('orientation'));
      if (this.get('reversed') == 'true') {
        this.$().addClass('reversed');
      }

      this.$().hammer()
      .bind('drag', function (e) {
        that.mouseMove(e.originalEvent);
      });
      this.valueUpdated();
      this.colorUpdated();
      this.backgroundValueVisibleChanged();
      this.backgroundValueUpdated();
    },
    valueUpdated: function () {
      if (this.get('orientation') == 'horizontal') {
        this.$('.value').width(
          (
            100 * (parseFloat(this.get('value')) / this.get('max')) * ((this.$().width() - 8) / this.$().width())
          ) + "%"
          //((this.$().width() - 5) * parseFloat(this.get('value')) / this.get('max')) + "px"
        );
      } else {
        this.$('.value').height(
          (
            100 * (parseFloat(this.get('value')) / this.get('max')) * ((this.$().height() - 8) / this.$().height())
          ) + "%"
          //(this.$().height() * parseFloat(this.get('value')) / this.get('max') - 6) + "px"
        );
      }
    }.observes('value', 'max', 'min'),
    backgroundValueUpdated: function () {
      if (this.get('orientation') == 'horizontal') {
        $('.background-value', this.$()).width((100 * parseFloat(this.get('backgroundValue')) / this.get('max')) + "%");
        $('.background-label', this.$()).css(((this.get('reversed') == 'true') ? 'right' : 'left'), (100 * parseFloat(this.get('backgroundValue')) / this.get('max')) + "%");
        this.$('.picker').css(((this.get('reversed') == 'true') ? 'right' : 'left'), (100 * parseFloat(this.get('backgroundValue')) / this.get('max')) + "%");
      } else {
        $('.background-value', this.$()).height((100 * parseFloat(this.get('backgroundValue')) / this.get('max')) + "%");
        $('.background-label', this.$()).css(((this.get('reversed') == 'true') ? 'bottom' : 'top'), (100 * parseFloat(this.get('backgroundValue')) / this.get('max')) + "%");
        this.$('.picker').css(((this.get('reversed') == 'true') ? 'bottom' : 'top'), (100 * parseFloat(this.get('backgroundValue')) / this.get('max')) + "%");
      }
    }.observes('backgroundValue', 'max', 'min'),
    colorUpdated: function () {
      $('.value.color', this.$()).css({backgroundColor: '#' + this.get('color'), borderColor: '#' + this.get('color')});
      $('.background-value .color', this.$()).css({background: this.get('backgroundColor')});
    }.observes('color')
  });

  GrowCalc.OfflineTrigger = Ember.View.extend({
    classNames: ['trigger'],
    template: Ember.Handlebars.compile(
    '<div class="values">' +
      '<div class="on">{{On}}</div>' +
      '<div class="picker"></div>' +
      '<div class="off">{{Off}}</div>' +
    '</div>'),
    On: 'Online',
    Off: 'Offline',
    valueDelta: 0,
    scrollState: 0,
    value: 54,
    mouseDown: function (e) {
      e.preventDefault();
      var that = this;
      that.set('scrollState', 1);
      that.set('valueDelta', (e.pageX - this.$().offset().left) - this.get('value'));
      that.$().removeClass('animated');
      that.set('timeout', setTimeout(function () {
        var tick = function () {
          that.set('timeinterval', setTimeout(function () {
            that.$().toggleClass('on');
            tick();
          }, Math.round(Math.random() * 100) ));
        };

        tick();
      }, 1000));
    },
    mouseMove: function (e) {
      var state = this.get('scrollState'),
        value = this.get('value'),
        valueDelta = this.get('valueDelta'),
        newValue = e.pageX - this.$().offset().left - valueDelta,
        delta = newValue - value;
      if (state !== 0) {
        if (state == 1) {
          if (
            ((delta > 0) && (newValue > 27)) ||
            ((delta < 0) && (newValue < 27))
          ) {
            this.set('scrollState', 2);
          }
        }
        e.preventDefault();
        this.updateValue(newValue);
      }
    },
    mouseUp: function (e) {
      var state = this.get('scrollState');
      if (state !== 0) {
        this.$().addClass('animated');
        e.preventDefault();
        if (state == 1) {
          this.set('value', (this.get('value') > 27) ? 0 : 54);
        } else if (state == 2) {
          this.set('value', (this.get('value') > 27) ? 54: 0);
        }
        clearTimeout(this.get('timeout'));
        clearInterval(this.get('timeinterval'));
        this.set('scrollState', 0);
      }
    },
    mouseLeave: function (e) {
      this.mouseUp(e);
    },
    updateValue: function (value) {
       this.set('value', value);
    },
    didInsertElement: function () {
      this._super();
      this.valueUpdated();
    },
    valueUpdated: function () {
      this.$('.values').css({
        left: (parseFloat(this.get('value')) - 54) + "px"
      });
      this.$().toggleClass('off', this.get('value') < 27);
      this.$().toggleClass('on', this.get('value') > 27);

      GrowCalc.Drupal().SetStatus(this.get('value') > 27);

    }.observes('value'),
  });

  $(function () {
    GrowCalc.offlineTrigger = GrowCalc.OfflineTrigger.create().appendTo($('.offline-trigger'));
    GrowCalc.set('Volume', 50);
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


  function handle_storage() {
    $.pnotify({
      title: "Сохранено локально!",
      text: "Данные сохранены в локальном хранилище.",
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

  // sidebar swipes
  $(function () {
    $("#sidebar-first").hammer({
        tap_max_interval: 700 // seems to bee needed for IE8
    }).bind("swipe", function(e) {
      if (e.direction == "left") {
        $('#sidebar-first').hide();
        $('body').removeClass('sidebar-first');
      }
    });
    $("#sidebar-second").hammer({
        tap_max_interval: 700 // seems to bee needed for IE8
    }).bind("swipe", function(e) {
      if (e.direction == "right") {
        $('#sidebar-second').hide();
        $('body').removeClass('sidebar-second');
      }
    });

    $("#content").hammer({
        tap_max_interval: 700 // seems to bee needed for IE8
    }).bind("swipe", function(e) {
      if (e.direction == "right") {
        if ($('#sidebar-first').length !== 0) {
          $('#sidebar-first').show();
          $('body').addClass('sidebar-first');
        }
      }

      if (e.direction == "left") {
        if ($('#sidebar-second').length !== 0) {
          $('#sidebar-second').show();
          $('body').addClass('sidebar-second');
        }
      }
    });

    if ($('body').hasClass('two-sidebars')) {
      $('body').addClass('sidebar-first sidebar-second').removeClass('two-sidebars');
    }
  });
})(window.jQuery, window.Ember, window.Drupal, window, window.document);
