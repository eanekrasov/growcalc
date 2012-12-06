/*jslint browser: true, indent: 2, plusplus: false */

(function ($, Ember, GrowCalc, Drupal, window, document, undefined) {
  "use strict";

  GrowCalc.ColorPicker = Ember.View.extend({
    classNames: ['colorpicker'],
    value: null,
    didInsertElement:function () {
      var that = this;
      that.$().ColorPicker({
        flat: true,
        color: that.get('value'),
        onChange: function (hsb, hex, rgb) {
          that.set('value', hex);
        }
      })
      .css({
        'position': 'relative',
        'display': 'block',
      });
    }
  });

  JQ.ColorPicker = Ember.View.extend(JQ.Widget, {
    uiType: 'ColorPicker',
    uiOptions: ['color', 'flat', 'onChange'],
    attributeBindings: ['color'],
    color: '000000',
    classNames: ['color-picker'],
    onChange: function (hsb, hex, rgb) {
      $(this).data('view').set('color', hex);
    },
    didInsertElement: function () {
      this._super();
      this.$().css({
        'position': 'relative',
        'display': 'block',
      });
      this.$().data('view', this);
    }
  });

  GrowCalc.Element = Ember.Object.extend(GrowCalc.DrupalSavable, {
    Type: 'element',

    '_defaults': {
      Id: 0,
      Symbol: "",
      Description: "",
      AtomicMass: 0,
      Tag: "",
      Oxidation: 0,
      Color: '000000',
      Ions: []
    },
    Id: 0,
    Description: "",
    Symbol: "",
    AtomicMass: 0,
    Tag: "",
    Oxidation: 0,
    Color: '000000',
    Ions: [],
    /**
     * Element.UpdateDefaults().
     *
     * Обновление значений по-умолчанию.
     */
    UpdateDefaults: function () {
      var that = this,
        defaults = that.get('_defaults'),
        i;

      for(i in defaults) {
        if (i !== 'Ions') {
          defaults[i] = that.get(i);
        }
      }

      // apply removed ions
      defaults.Ions.forEach(function (defaultIon, defaultsIndex, defaultIonsEnumerable) {
        if (that.get('Ions').find(function (ion, ionsIndex, ionsEnumerable) { return ion.Element === defaultIon.Element; }) === null) {
          delete defaults.Ions[i];
        }
      });

      that.SaveTemporaryIons();

      that.get('Ions').forEach(function (ion, index, enumerable) {
        var defaultIon = defaults.Ions.find(function (defaultIon, defaultsIndex, defaultsEnumerable) { return ion.Element === defaultIon.Element; });
        if (defaultIon !== null) {
          defaultIon.set('Count', ion.get('Count'));
        }
      });
      //that.set('_defaults', defaults);
    },
    /**
     * Element.PrepareData().
     *
     * Prepares data for ajax sending.
     */
    PrepareData: function () {
      var that = this;
      return {
        id: that.get('Id'),
        symbol: that.get('Symbol'),
        description: that.get('Description'),
        atomic_mass: that.get('AtomicMass'),
        tag: that.get('Tag'),
        oxidation: that.get('Oxidation'),
        color: that.get('Color'),
        ions: that.get('Ions').map(function (ion, index, enumerable) {
          return {
            element: ion.Element.Symbol,
            count: ion.Count
          };
        }),
      };
    },
    /**
     * Element.Commit().
     *
     * Сохранение изменений в модели.
     */
    Commit: function () {
      this.UpdateDefaults();
      this.SaveToServer();
    },
    /**
     * Element.Changed().
     *
     * Возвращает Boolean значение.
     * TRUE - поля модели были изменены, модель не сохранена.
     * FALSE - иначе.
     */
    Changed: function () {
      var isChanged = false,
        that = this,
        defaults = that.get('_defaults'),
        k;
      for (k in defaults) {
        if (k !== 'Ions') {
          if (defaults[k] !== that.get(k)) {
            isChanged = true;
            break;
          }
        }
      }

      if (!isChanged) {
        if ((that.get('Ions').length !== defaults.Ions.length) || (null !== defaults.Ions.find(function (defaultIon, defaultsIndex, defaultIonsEnumerable) {
            return (null !== that.get('Ions').find(function (ion, ionsIndex, ionsEnumerable) {
              return (ion.get('Element') === defaultIon.get('Element')) && (ion.get('Count') !== defaultIon.get('Count'));
            }));
          }))) {
          isChanged == true;
        }
      }

      return isChanged;
    },
    /**
     * Element.SaveToServer().
     *
     * Сохранение модели в друпале.
     * (growcalc/ajax/element/%node/update)
     */
    SaveToServer: function () {
      var that = this;

      GrowCalc.Drupal().Save({
        object: that,
        success: function (data) {
          if (typeof data.success !== 'undefined' && data.success) {
            if (that.IsNew()) {
              that.set('Id', data.id);
            }
            that.UpdateDefaults();
          }
        },
        failure: function (jqXHR, textStatus, errorThrown) {
          that.Rollback();
        }
      });
    },
    /**
     * Element.Delete().
     *
     * Удаление элемента из базы данных.
     */
     Delete: function () {
      var that = this;
      if (!that.IsNew()) {
        GrowCalc.Drupal().Delete({
          object: that,
          success: function (data) {
            var key, defaults;
            if (typeof data.success !== 'undefined' && data.success) {
              that.Destroy();
            }
          }
        });
      } else {
        that.Destroy();
      }
    },
    /**
     * Element.Destroy().
     *
     * Удаление элемента из фронтенда.
     * Почистить за собой.. ^_^
     */
    Destroy: function () {
      this.CloseDialogs();
      this.view.remove();
      delete this.view;
      delete this.controller;
    },
    /**
     * Element.Rollback().
     *
     * Откат сделанных в модели изменений.
     * Для восстановления используется (Array)this.get('_defaults');
     */
    Rollback: function () {
      var that = this,
        defaults = that.get('_defaults'),
        i;
      // Простые поля переносятся скопом.
      for(i in defaults) {
        if (i !== 'Ions') {
          that.set(i, defaults[i]);
        }
      }

      that.RemoveTemporaryIons();

      defaults.Ions.forEach(function (defaultIon, defaultsIndex, defaultsEnumerable) {
        if (null === that.get('Ions').find(function (ion, ionsIndex, ionsEnumerable) {
          return (ion.get('Element') === defaultIon.get('Element'));
        })) {
          that.AddIon(defaultIon.Element, defaultIon.Count);
        }
      });

      defaults.Ions.forEach(function (defaultIon, defaultsIndex, defaultsEnumerable) {
        that.get('Ions').forEach(function (ion, ionsIndex, ionsEnumerable) {
          if (ion.get('Element') === defaultIon.get('Element')) {
            ion.set('Count', defaultIon.get('Count'));  
          }
        });
      });
      //this.set('Ions', Ions);
    },

    /**
     * Element.ShowEditorForm().
     *
     * Открыть форму редактирования товара.
     * Форма рендерится в JQuery UI Dialog.
     */
    ShowEditorForm: function () {
      var that = this;
      if (typeof that.editorView === 'undefined') {
        that.editorView = GrowCalc.ElementEditorView.create({ controller: that.controller, autoOpen: true });
        that.editorView.appendTo(document);
      } else {
        that.editorView.OpenDialog();
      }
    },
    /**
     * Element.ShowDeleteForm().
     *
     * Открыть форму подтверждения удаления.
     * Форма рендерится в JQuery UI Dialog.
     */
    ShowDeleteForm: function () {
      var that = this;
      if (typeof that.deleteView === 'undefined') {
        that.deleteView = GrowCalc.ElementDeleteView.create({ controller: that.controller, autoOpen: true });
        that.deleteView.appendTo(document);
      } else {
        that.deleteView.OpenDialog();  
      }
    },
    DestroyEditorForm: function () {
      var that = this;
      if (typeof that.editorView !== 'undefined') {
        that.editorView.CloseDialog();
        delete that.editorView;
      }
    },
    DestroyDeleteForm: function () {
      var that = this;
      if (typeof that.deleteView !== 'undefined') {
        that.deleteView.CloseDialog();
        delete that.deleteView;
      }
    },
    CloseDialogs: function () {
      this.DestroyEditorForm();
      this.DestroyDeleteForm();
    },
    AddIon: function (Element, Count, temporary = false) {
      var ion = Ember.Object.create({'Element': Element, 'Count': parseInt(Count), 'Host': this});
      ion.controller = Ember.ObjectController.create({ content: ion });
      ion.view = GrowCalc.IonView.create({ controller: ion.controller });
      if (this.hasOwnProperty('editorView')) {
        this.editorView.get('ElementIonsView').get('childViews').pushObject(ion.view);
      }
      this.get('Ions').pushObject(ion);
      if (!temporary) {
        this.SetIonPermanent(ion);
      }
    },
    RemoveIon: function (Element, temporary = false) {
      var defaults = this.get('_defaults'),
        ion = this.get('Ions').find(function (ion, ionsIndex, ionsEnumerable) {
          return (ion.get('Element') === Element);
        });
      if (ion !== null) {
        if (this.hasOwnProperty('editorView')) {
          this.editorView.get('ElementIonsView').get('childViews').removeObject(ion.view);
        }
        this.get('Ions').removeObject(ion);
        if (!temporary) {
          this.SetIonTemporary(ion); // deletes ion from defaults.
        }

        ion.controller.destroy();
        ion.view.destroy();
        ion.destroy();
      }
    },
    RemoveTemporaryIons: function () {
      var that = this,
        defaults = this.get('_defaults');
      this.get('Ions').forEach(function (ion, ionsIndex, ionsEnumerable) {
        if (null === defaults.Ions.find(function (defaultIon, defaultsIndex, defaultsEnumerable) {
          return (ion.get('Element') === defaultIon.get('Element'));
        })) {
          that.RemoveIon(ion.Element, true);
        }
      });
    },
    SetIonPermanent: function(ion) {
      var that = this,
        defaults = that.get('_defaults');
      if (null === defaults.Ions.find(function (defaultIon, defaultsIndex, defaultsEnumerable) {
        return (ion.get('Element') === defaultIon.get('Element'));
      })) {
        defaults.Ions.pushObject(Ember.Object.create({
          'Element': ion.Element, 
          'Count': ion.Count,
        }));
      }
    },
    SetIonTemporary: function(ion) {
      var that = this,
        defaults = that.get('_defaults'),
        defaultIon = defaults.Ions.find(function (defaultIon, defaultsIndex, defaultsEnumerable) {
          return (ion.get('Element') === defaultIon.get('Element'));
        });
      if (null !== defaultIon) {
        defaults.Ions.removeObject(defaultIon);
        defaultIon.destroy();
      }
    },
    SaveTemporaryIons: function () {
      var that = this,
        defaults = this.get('_defaults');
      that.get('Ions').forEach(function (ion, ionsIndex, ionsEnumerable) {
        if (null === defaults.Ions.find(function (defaultIon, defaultsIndex, defaultsEnumerable) {
          return (ion.get('Element') === defaultIon.get('Element'));
        })) {
          that.SetIonPermanent(ion);
        }
      });
    },
    ListElements: function () {
      var totalIons = {};

      this.get('Ions').forEach(function (ion, ionsIndex, ionsEnumerable) {
        var list = ion.get('Element').ListElements();
        for(var i in list) {
          if (list.hasOwnProperty(i)) {
            if (typeof totalIons[list[i].get('Element').get('Symbol')] !== 'undefined') {
              totalIons[list[i].get('Element').get('Symbol')].set('Amount', totalIons[list[i].get('Element').get('Symbol')].get('Amount') + ion.get('Count') * list[i].get('Amount'));
            } else {
              totalIons[list[i].get('Element').get('Symbol')] = {
                Element: list[i].get('Element'),
                Amount: ion.get('Count') * list[i].get('Amount'),
              };
            }
          }
        }
      });

      if (this.get('Ions').length === 0) {
        totalIons[this.Symbol] = {
          Element: this,
          Amount: 1,
        };
      }

      return totalIons;
    },
  });

  GrowCalc.ElementController = Ember.ObjectController.extend({
    MolarMass: function() {
      return this.get('AtomicMass');
    }.property('AtomicMass'),
    ElementBinding: 'content'
  });

  GrowCalc.ElementView = Ember.View.extend({
    // the controller is the initial context for the template
    controller: null,
    template: Ember.Handlebars.compile(
      '<li class="element-view-{{unbound Id}}">' +
      '{{Description}} {{Tag}}' +
      '<span class="symbol color" style="color: #{{unbound Color}}">{{Symbol}}</span>' +
      '<button class="action action-edit" {{action "ShowEditorForm" target on="click"}} title="Редактирование"><span class="ui-icon ui-icon-wrench"></span></button>' +
      '</li>'),
    ShowEditorForm: function () {
      this.controller.content.ShowEditorForm(); 
    },
    ColorBinding: 'controller.content.Color',
    ColorChanged: function () {
      $('.color', this.$()).css({'color' : '#' + this.get('Color')});
    }.observes('Color'),
  });


  GrowCalc.IonView = Ember.View.extend({
    controller: null,
    template: Ember.Handlebars.compile('<li>{{view.controller.content.Element.Symbol}} {{view GrowCalc.NumberField valueBinding="view.controller.content.Count"}}<button class="action action-delete" {{action "Delete" target on="click"}} title="Удаление"><span class="ui-icon ui-icon-close"></span></button></li>'),
    Delete: function () {
      this.controller.content.Host.RemoveIon(this.controller.content.Element, true);
    }
  });

  GrowCalc.NewIonView = Ember.View.extend({
    Count: 1,
    Host: undefined,
    ElementSymbol: "",
    template: Ember.Handlebars.compile('<li>{{view JQ.AutoComplete valueBinding="view.ElementSymbol" sourceBinding="view.ElementAutocomplete" selectBinding="view.ElementSelected"}}<a {{action "Create" target on="click"}}>Добавить</a></li>'),
    Create: function () {
      var that = this,
        element = GrowCalc.GetElementBySymbol(that.get('ElementSymbol'));
      if (element) {
        if (typeof this.get('Host.Ions').find(function (ion, index, enumerable) {
          return (ion.get('Element') === element);
        }) === 'undefined') {
          that.get('Host').AddIon(element, that.get('Count'), true);
        } else {
          alert('Элемент уже содержится.');
        }
      } else {
        alert('Неправильный ввод.');
      }
    },
    ElementSelected: function (e, ui) {
      var that = this._context.content.editorView.get('ElementIonsView.childViews')[0];
      that.set('ElementSymbol', ui.item.value);
    },
    ElementAutocomplete: function(request, response) {
      var ret = [];
      GrowCalc.Elements.forEach(function (element, index) {
        if ((request.term.length == 0) || (element.get('Symbol').indexOf(request.term) !== -1) || (element.get('Description').indexOf(request.term) !== -1)) {
          ret.pushObject({
            label: element.get('Description'),
            value: element.get('Symbol'),
          });
        }
      });

      response(ret);
    }
  });

  GrowCalc.ElementIonsView = Ember.ContainerView.extend({
    childViews: [],
  });

  GrowCalc.ElementEditorView = JQ.Dialog.extend({
    classNames: ['element-editor-dialog'],
    width: 400,
    minWidth: 400,
    controller: null,
    title: "",
    ElementIonsView: null,
    template: Ember.Handlebars.compile(
      '<table class="table">' +
        '<tr>' +
          '<td><label>Символ</label>{{view Ember.TextField valueBinding="view.controller.content.Symbol"}}</td>' +
          '<td><label>Описание</label>{{view Ember.TextField valueBinding="view.controller.content.Description"}}</td>' +
        '</tr>' +
        '<tr>' +
          '<td><label>Атомарная масса</label>{{view GrowCalc.NumberField valueBinding="view.controller.content.AtomicMass"}}</td>' +
          '<td><label>Степень окисления</label>{{view GrowCalc.NumberField valueBinding="view.controller.content.Oxidation"}}</td>' +
        '</tr>' +
      '</table>' +
      '<div>{{view GrowCalc.ColorPicker valueBinding="view.controller.content.Color"}}</div>' +
      '{{view Ember.ContainerView currentViewBinding="view.ElementIonsView"}}'
    ),
    buttons: {
      'Сохранить': function () {
        var that = Ember.View.views[$(this).attr('id')];
        that.CommitAndClose();
      },
      'Отмена': function () {
        var that = Ember.View.views[$(this).attr('id')];
        that.RollbackAndClose();
      },
      'Удалить': function () {
        var that = Ember.View.views[$(this).attr('id')];
        that.controller.content.ShowDeleteForm();
      },
    },
    didInsertElement: function() {
      var that = this,
        element = that.controller.content;

      that.set('ElementIonsView', GrowCalc.ElementIonsView.create());
      that.set('title', 'Элемент "' + element.get('Symbol') + '"');
      that._super();
      $("button", that.$()).button();

      // autocomplete staff
      //var value = this.controller.content.get('AutocompleteField');
      //if (value !== 0) {
      //  var valueTitle = AutocompleteObjects[value].title;
      //  this.set('AutocompleteTitle', valueTitle);
      //}

      var newIonView = GrowCalc.NewIonView.create({ Host: element });
      that.get('ElementIonsView').get('childViews').pushObject(newIonView);
      element.get('Ions').forEach(function (ion, index, enumerable) {
        that.get('ElementIonsView').get('childViews').pushObject(ion.view);
      });
    },
    Validate: function () {
      var retValue = true;
      var element = this.controller.content;
      var AtomicMass = parseFloat(element.get('AtomicMass'));

      if (AtomicMass < 0) {
        alert("Атомная масса должна быть больше нуля");
        retValue = false;
      }

      return retValue;
    },
    CommitAndClose: function () {
      var node = this.controller.content;
      if (this.Validate()) {
        node.DestroyEditorForm();
        node.Commit();
      }
    },
    RollbackAndClose: function () {
      var element = this.controller.content;
      element.DestroyEditorForm();
      element.Rollback();
    },
    close: function(event, ui) {
      var that = Ember.View.views[$(this).attr('id')],
        node;
      if ((typeof event !== 'undefined') && (typeof event.cancelable !== 'undefined') && (event.cancelable)) {
        that.RollbackAndClose();
      }
    }
  });

  GrowCalc.ElementDeleteView = JQ.Dialog.extend({
    classNames: ['element-delete-dialog'],
    width: 300,
    minWidth: 300,
    controller: null,
    title: "Удалить элемент?",
    template: Ember.Handlebars.compile('<p>Вы действительно хотите удалить "{{Symbol}}"?</p>'),
    buttons: {
      'Удалить': function () {
        var that = Ember.View.views[$(this).attr('id')];
        that.controller.content.DestroyDeleteForm();
        that.controller.content.Delete();
      },
      'Отмена': function () {
        var that = Ember.View.views[$(this).attr('id')];
        that.controller.content.DestroyDeleteForm();
      }
    },
    close: function(event, ui) {
      var that = Ember.View.views[$(this).attr('id')];
      if ((typeof event !== 'undefined') && (typeof event.cancelable !== 'undefined') && (event.cancelable)) {
        that.controller.content.DestroyDeleteForm();
      }
    }
  });

  // Массив _всех_ элементов, загруженных на текущей странице.
  GrowCalc.Elements = [];

  GrowCalc.GetElementsBy = function (field, value, regexp) {
    if (typeof regexp === 'undefined') regexp = false;
    regexp = regexp && new RegExp(value);

    return GrowCalc.Elements.filter(function(item, index, self) {
      if (regexp) {
        return regexp.test(item.get(field));
      } else {
        return (item.get(field) == value);
      }
    });
  };

  GrowCalc.GetElementById = function (id) {
    return GrowCalc.GetElementsBy('Id', id)[0];
  };

  GrowCalc.GetElementBySymbol = function (symbol) {
    var val = GrowCalc.GetElementsBy('Symbol', symbol)[0];
    return val;
  };


  GrowCalc.AddElement = function(values) {
    var el = GrowCalc.GetElementBySymbol(values['Symbol']);
    if (!el) {
      var ions = values.Ions;
      values.Ions = [];
      values['_defaults'] = $.extend({}, values);
      el = GrowCalc.Element.create(values);
      GrowCalc.Elements.pushObject(el);

      if (typeof ions !== 'undefined') {
        ions.forEach( function (item, index, enumerable) {
          el.AddIon(GrowCalc.GetElementBySymbol(item.element), item.count);
        });
      }

      el.controller = GrowCalc.ElementController.create({ content: el });
      el.view = GrowCalc.ElementView.create({ controller: el.controller });
      
      if ($('#calc-elements .nav-elements').length > 0) {
        el.view.appendTo($('#calc-elements .nav-elements'));
      }
    }

    return el;
  };

  $(function() {
    if (typeof Drupal.settings.growcalc !== 'undefined') {
      if (typeof Drupal.settings.growcalc.elements !== 'undefined') {
        for(var el_key in Drupal.settings.growcalc.elements) {
          if (Drupal.settings.growcalc.elements.hasOwnProperty(el_key)) {
            var el = Drupal.settings.growcalc.elements[el_key];
            GrowCalc.AddElement({
              Id: el.id,
              Symbol: el.symbol,
              Description: el.description,
              Tag: el.tag,
              AtomicMass: el.atomic_mass,
              Oxidation: el.oxidation,
              Color: el.color,
              Ions: el.ions,
            });
          }
        }
      }
    }

    setTimeout(function () {
      $(".block-growcalc-element .filter").listFilter($(".block-growcalc-element .nav-elements"));
    }, 1);
  });
})(jQuery, Ember, this.GrowCalc, Drupal, this, this.document);