// Based on Luke Melia Using Ember.js with jQuery UI
// http://www.lukemelia.com/blog/archives/2012/03/10/using-ember-js-with-jquery-ui/

/*jslint browser: true, indent: 2, plusplus: false */

(function (window, document, undefined) {
  "use strict";
  var JQ = window.JQ = {},
    $ = window.jQuery,
    Ember = window.Ember;

  JQ.Widget = Ember.Mixin.create({
    didInsertElement: function () {
      var options = this._gatherOptions(),
        element = $(this.get('element'));
      this._gatherEvents(options);
      this.set('ui', element[this.get('uiType')](options));
    },
    willDestroyElement: function () {
      var ui = this.get('ui');
      if (ui) {
        var observers = this._observers;
        for (var prop in observers) {
          if (observers.hasOwnProperty(prop)) {
            this.removeObserver(prop, observers[prop]);
          }
        }
        ui._destroy();
      }
    },
  
    _gatherOptions: function () {
      var uiOptions = this.get('uiOptions'), options = {};
      uiOptions.forEach(function (key) {
        options[key] = this.get(key);
        var observer = function () {
          var value = this.get(key);
          this.get('ui')._setOption(key, value);
        };
        this.addObserver(key, observer);
        this._observers = this._observers || {};
        this._observers[key] = observer;
      }, this);
      return options;
    },

    _gatherEvents: function (options) {
      var uiEvents = this.get('uiEvents') || [], self = this;
      uiEvents.forEach(function (event) {
        var callback = self[event];
        if (callback) {
          options[event] = function (event, ui) {
            callback.call(self, event, ui);
          };
        }
      });
    }
  });

  // Create a new Ember view for the jQuery UI Button widget
  JQ.Button = Ember.View.extend(JQ.Widget, {
    uiType: 'button',
    uiOptions: ['label', 'disabled'],
    tagName: 'button'
  });

  // Create a new Ember view for the jQuery UI Menu widget (new
  // in jQuery UI 1.9). Because it wraps a collection, we extend from
  // Ember's CollectionView rather than a normal view.
  //
  // This means that you should use `#collection` in your template to
  // create this view.
  //
  // Template:
  //  {{#collection JQ.Menu contentBinding="people" disabledBinding="menuDisabled"}}
  //    <a href="#">{{name}}</a>
  //  {{else}}
  //    <a href="#">LIST NOT LOADED</a>
  //  {{/collection}}
  
  JQ.Menu = Ember.CollectionView.extend(JQ.Widget, {
    uiType: 'menu',
    uiOptions: ['disabled'],
    uiEvents: ['select'],
  
    tagName: 'ul',

    // Whenever the underlying Array for this `CollectionView` changes,
    // refresh the jQuery UI widget.
    arrayDidChange: function (content, start, removed, added) {
      this._super(content, start, removed, added);
  
      var ui = this.get('ui');
      if (ui) {
        // Schedule the refresh for after Ember has completed it's
        // render cycle
        Ember.run.schedule('render', function () {
          ui.refresh();
        });
      }
    },
    itemViewClass: Ember.View.extend({
      // Make it so that the default context for evaluating handlebars
      // bindings is the content of this child view. In a near-future
      // version of Ember, the leading underscore will be unnecessary.
      _context: function () {
        return this.get('content');
      }.property('content')
    })
  });
  
  // Create a new Ember view for the jQuery UI Progress Bar widget
  JQ.ProgressBar = Ember.View.extend(JQ.Widget, {
    uiType: 'progressbar',
    uiOptions: ['value', 'max'],
    uiEvents: ['change', 'complete']
  });

  JQ.AutoComplete = Ember.TextField.extend(JQ.Widget, {
    uiType: 'autocomplete',
    uiOptions: ['disabled', 'autoFocus', 'delay', 'minLength', 'position', 'source'],
    uiEvents: ['select']
  });
  
  JQ.Dialog = Ember.View.extend(JQ.Widget, {
    uiType: 'dialog',
    uiOptions: ['autoOpen', 'height', 'width', 'buttons', 'open', 'close'],
    attributeBindings: ['title'],
    title: "",
    autoOpen: false,
    buttons: [],
    OpenDialog: function () {
      this.get('ui').dialog('open');
    },
    CloseDialog: function () {
      this.get('ui').dialog('close');
    }
  });
  
  JQ.DatePicker = Ember.View.extend(JQ.Widget, {
    uiType: 'datepicker',
    uiOptions: ['format', 'onSelect'],
    classNames: ['date-picker'],
    tagName: "input",
    attributeBindings: ['data', 'value', 'format', 'readonly', 'type', 'size'],
    size: "10",
    type: "text",
    format: 'mm/dd/yyyy',
    onSelect: function (dateTxt, inst) {
      $(this).data('view').set('data', new Date(dateTxt));
    },
    value: function () {
      var date = this.get('data');
      return (date) ? date.format(this.get('format')) : "";
    }.property('data'),
    data: null,
    didInsertElement: function () {
      this._super();
      this.$().data('view', this);
    }
  });

  JQ.Combobox = Ember.Select.extend(JQ.Widget, {
    uiType: 'autocomplete',
    uiOptions: ['appendTo','autoFocus','delay', 'disabled', 'minLength','position','source'],
    uiEvents: ['change', 'close', 'create', 'focus', 'open', 'response', 'search', 'select'],
    didInsertElement: function () {
      //this._super();
    },
    willDestroyElement: function () {
      this._super();
    }
  });

})(window, window.document);
