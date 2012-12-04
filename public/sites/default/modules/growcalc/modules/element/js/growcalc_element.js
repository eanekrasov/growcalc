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
      Ions: {}
    },
    Id: 0,
    Description: "",
    Symbol: "",
    AtomicMass: 0,
    Tag: "",
    Oxidation: 0,
    Color: '000000',
    Ions: {},
    /**
     * Element.UpdateDefaults().
     *
     * Обновление значений по-умолчанию.
     */
    UpdateDefaults: function () {
      var that = this,
        i,
        defaults = that.get('_defaults'),
        Ions = that.get('Ions');

      for(i in defaults) {
        if (i !== 'Ions') {
          defaults[i] = that.get(i);
        }
      }

      // apply removed ions
      for(i in defaults.Ions) {
        if (!Ions.hasOwnProperty(i)) {
          delete defaults.Ions[i];
        }
      }

      that.SaveTemporaryIons();

      for(i in Ions) {
        if (defaults.Ions[i] instanceof Ember.Object) {
          defaults.Ions[i].set('Count', Ions[i].Count);
        }
      }
      //that.set('_defaults', defaults);
    },
    /**
     * Element.PrepareData().
     *
     * Prepares data for ajax sending.
     */
    PrepareData: function () {
      var that = this,
        Ions = that.get('Ions'),
        data = {
          Id: that.get('Id'),
          Symbol: that.get('Symbol'),
          Description: that.get('Description'),
          AtomicMass: that.get('AtomicMass'),
          Tag: that.get('Tag'),
          Oxidation: that.get('Oxidation'),
          Color: that.get('Color'),
          Ions: [],
        };
        
      for(var i in Ions) {
        if (Ions[i] instanceof Ember.Object) {
          data.Ions.pushObject({
            Element: Ions[i].Element.Symbol,
            Count: Ions[i].Count
          });
        }
      }
      
      return data;
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
        defaults = this.get('_defaults'),
        k,i;
      for (k in defaults) {
        if (k !== 'Ions') {
          if (defaults[k] !== this.get(k)) {
            isChanged = true;
            break;
          }
        }
      }

      var Ions = this.get('Ions');
      
      var count = 0;
      for(var i in Ions) {
        if (Ions[i] instanceof Ember.Object) {
          count++;
        }
      }
      var defaultCount = 0;
      for(var i in defaults.Ions) {
        if (defaults.Ions[i] instanceof Ember.Object) {
          defaultCount++;
        }
      }
      if (count == defaultCount) {
        for(var ion in defaults.Ions) {
          if ((typeof Ions[ion] === 'undefined') || (defaults.Ions[ion].Count !== Ions[ion].Count)) {
            isChanged = true;
            break;
          }
        }
      } else {
        isChanged = true;
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
              that.UpdateDefaults();
            }
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
      var that = this;

      that.CloseDialogs();
      that.view.remove();
      that.view.destroy();
      that.controller.destroy();
      delete that.view;
      delete that.controller;
      that = undefined;
    },
    /**
     * Element.Rollback().
     *
     * Откат сделанных в модели изменений.
     * Для восстановления используется (Array)this.get('_defaults');
     */
    Rollback: function () {
      var defaults = this.get('_defaults'),
        key, i,
        Ions = this.get('Ions');

      // Простые поля переносятся скопом.
      for(i in defaults) {
        if (i !== 'Ions') {
          this.set(i, defaults[i]);
        }
      }

      this.RemoveTemporaryIons();

      for(i in defaults.Ions) {
        if (defaults.Ions[i] instanceof Ember.Object) {
          if (!Ions.hasOwnProperty(i)) {
            this.AddIon(defaults.Ions[i].Element, defaults.Ions[i].Count);
          }
        }
      }

      var Ions = this.get('Ions');
      for(var ion in defaults.Ions) {
        if (Ions[ion] instanceof Ember.Object) {
          Ions[ion].set('Count', defaults.Ions[ion].Count);  
        }
      }
      this.set('Ions', Ions);

      $('.element-view-' + this.get('Id') + ' .color').css({'background-color' : '#' + this.get('Color')});
    },

    /**
     * Element.ShowEditorForm().
     *
     * Открыть форму редактирования товара.
     * Форма рендерится в JQuery UI Dialog.
     */
    ShowEditorForm: function () {
      var that = this,
        k, i;

      if (typeof that.editorForm === 'undefined') {
        that.editorForm = $('<div />').attr('title', ((that.get('Id') !== 0) ? "Редактирование \"" + that.get("Symbol") + "\"" : "Создание нового элемента"));

        that.editorView = GrowCalc.ElementEditorView.create({ controller: that.controller }).appendTo(that.editorForm);

        that.editorForm.dialog({
          width: 390,
          minWidth: 390,
          close: function(event, ui) {
            if (typeof event.cancelable !== 'undefined' && event.cancelable ) {
              that.Rollback();

              that.DestroyEditorForm();
            }
          }
        });
      } else {
        //that.editorForm.dialog('show');
      }
    },
    DestroyEditorForm: function () {
      var that = this;
      if (typeof that.editorForm !== 'undefined') {
        that.editorForm.dialog('close');
        that.editorView.remove();
        delete that.editorView;
        delete that.editorForm;
      }
    },
    /**
     * Element.ShowDeleteForm().
     *
     * Открыть форму подтверждения удаления.
     * Форма рендерится в JQuery UI Dialog.
     */
    ShowDeleteForm: function () {
      var that = this,
        k, i;

      if (typeof that.deleteForm === 'undefined') {
        that.deleteForm = $('<div />').attr('title', "Удалить " + that.get("Symbol") + "?");

        that.deleteView = GrowCalc.ElementDeleteView.create({ controller: that.controller }).appendTo(that.deleteForm);

        that.deleteForm.dialog({
          width: 300,
          minWidth: 300,
          close: function(event, ui) {
            if (typeof event.cancelable !== 'undefined' && event.cancelable ) {
              that.Rollback();
              that.DestroyDeleteForm();
            }
          }
        });
      } else {
        //that.deleteForm.dialog('show');
      }
    },
    DestroyDeleteForm: function () {
      var that = this;
      if (typeof that.deleteForm !== 'undefined') {
        that.deleteForm.dialog("close");
        delete that.deleteForm;
      }
    },
    CloseDialogs: function () {
    var that = this;
      if (that.editorForm) {
        that.DestroyEditorForm();
      }
      if (that.deleteForm) {
        that.DestroyDeleteForm();
      }
    },
    AddIon: function (Element, Count, temporary = false) {
      //var ion = Ember.Object.create({'Element': Element, 'Count': parseInt(Count), 'Host': this});
      //ion.controller = Ember.ObjectController.create({ content: ion });
      //ion.view = GrowCalc.IonView.create({ controller: ion.controller });
      //if (this.editorView) {
      //  this.editorView.ElementIonsView.get('childViews').pushObject(ion.view);
      //}
      //var Ions = this.get('Ions');
      //Ions[Element.Symbol] = ion;
      //if (!temporary) {
      //  this.get('_defaults').Ions[Element.Symbol] = Ember.Object.create({'Element': Element, 'Count': parseInt(Count)});
      //}
    },
    RemoveIon: function (Element, temporary = false) {
      //var Ions = this.get('Ions');
      //if (Ions[Element.Symbol] instanceof Ember.Object) {
      //  var ion = Ions[Element.Symbol];
      //  this.editorView.ElementIonsView.get('childViews').removeObject(ion.view);
      //  delete ion.controller;
      //  delete ion.view;
      //  delete Ions[Element.Symbol];
      //  if (!temporary) {
      //    delete this.get('_defaults').Ions[Element.Symbol];
      //  }
      //}
    },
    RemoveTemporaryIons: function () {
      //var Ions = this.get('Ions'),
      //  defaults = this.get('_defaults');
      //for(var i in Ions) {
      //  if (Ions[i] instanceof Ember.Object) {
      //    if (!defaults.Ions.hasOwnProperty(i)) {
      //      this.RemoveIon(Ions[i].Element, true);
      //    }
      //  }
      //}
    },
    SetIonPermanent: function(Ion) {
      //if (!this.get('_defaults').Ions.hasOwnProperty(Ion.Element.Symbol)) {
      //  this.get('_defaults').Ions[Ion.Element.Symbol] = Ember.Object.create({'Element': Ion.Element, 'Count': parseInt(Ion.Count)});
      //}
    },
    SetIonTemporary: function(ion) {
      //if (this.get('_defaults').Ions.hasOwnProperty(ion)) {
      //  delete this.get('_defaults').Ions[ion];
      //} 
    },
    SaveTemporaryIons: function () {
      //var Ions = this.get('Ions'),
      //  defaults = this.get('_defaults');
      //for(var i in Ions) {
      //  if (Ions[i] instanceof Ember.Object) {
      //    if (!defaults.Ions.hasOwnProperty(i)) {
      //      this.SetIonPermanent(Ions[i]);
      //    }
      //  }
      //}
    },
    ListElements: function () {
      var Ions = this.get('Ions'),
        totalIons = {},
        ion,
        ionsCount = 0;

      for (ion in Ions) if (Ions.hasOwnProperty(ion)) {
        ionsCount = ionsCount + 1;
        var list = Ions[ion].Element.ListElements();
        for(var i in list) {
          if (typeof totalIons[list[i].Element.Symbol] !== 'undefined') {
            totalIons[list[i].Element.Symbol].set('Amount', totalIons[list[i].Element.Symbol].get('Amount') + Ions[ion].Count * list[i].Amount);
          } else {
            totalIons[list[i].Element.Symbol] = {
              Element: list[i].Element,
              Amount: Ions[ion].Count * list[i].Amount
            };
          }
        }
      }

      if (ionsCount === 0) {
        if (typeof totalIons[this.Symbol] !== 'undefined') {
          totalIons[this.Symbol].set('Amount', totalIons[this.Symbol].get('Amount'));
        } else {
          totalIons[this.Symbol] = {
            Element: this,
            Amount: 1
          };
        }
      }

      return totalIons;
    },
    SymbolChanged: function () {
      GrowCalc.Elements[this.get('Symbol')] = this;
    }.observes('Symbol'),
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
    template: Ember.Handlebars.compile('<li class="element-view-{{unbound Id}}"><span class="color" style="background-color: #{{unbound Color}}"></span> {{Symbol}} {{Description}} {{Tag}} <a {{action "ShowEditorForm" target on="click"}}>Редактировать</a></li>'),
    ShowEditorForm: function () {
      this.controller.content.ShowEditorForm(); 
    },
    ColorChanged: function () {
      $(' .color', this.$()).css({'background-color' : '#' + this.controller.content.get('Color')});
    }.observes('controller.content.Color')
  });


  //GrowCalc.IonView = Ember.View.extend({
  //  controller: null,
  //  template: Ember.Handlebars.compile('<li>{{view.controller.content.Element.Symbol}} {{view GrowCalc.NumberField valueBinding="view.controller.content.Count"}}<a {{action "Delete" target on="click"}}>Удалить</a></li>'),
  //  Delete: function () {
  //    this.controller.content.Host.RemoveIon(this.controller.content.Element, true);
  //  }
  //});

  //GrowCalc.NewIonView = Ember.View.extend({
  //  Element: undefined,
  //  Count: 0,
  //  Host: undefined,
  //  template: Ember.Handlebars.compile('<li>{{view JQ.AutoComplete valueBinding="view.ElementSymbol" sourceBinding="view.ElementAutocomplete" selectBinding="view.ElementSelected"}}<a {{action "Create" target on="click"}}>Добавить</a></li>'),
  //  Create: function () {
  //    var isContains = false;
  //    for(var i in this.Host.Ions) {
  //      isContains = isContains || ((this.Host.Ions[i] instanceof Ember.Object) && (this.Host.Ions[i].Element === this.Element));
  //    }
  //    if (!isContains) {
  //      if (this.get('Element')) {
  //        this.Host.AddIon(this.get('Element'), this.get('Count'), true);
  //      } else {
  //        alert('Такого элемента не существует');
  //      }
  //    } else {
  //      alert('Элемент уже содержится.');
  //    }
  //  },
  //  ElementSymbol: "",
  //  ElementSelected: function (e, ui) {
  //    var element = GrowCalc.GetElementBySymbol(ui.item.label);
  //    if (element) {
  //      this._context.content.editorView.ElementIonsView.get('childViews')[0].set('Element', element);
  //    }
  //  },
  //  ElementAutocomplete: function(request, response) {
  //    var value,
  //      ret = [];
  //    for(value in GrowCalc.Elements) {
  //      if (GrowCalc.Elements.hasOwnProperty(value)) {
  //        if ((request.term.length == 0) || (GrowCalc.Elements[value].get('Symbol').indexOf(request.term) !== -1) || (GrowCalc.Elements[value].get('Description').indexOf(request.term) !== -1)) {
  //          //ret.push({
  //          //  label: AutocompleteObjects[value].title,
  //          //  value: AutocompleteObjects[value].id
  //          //});
  //          ret.push(GrowCalc.Elements[value].Symbol);
  //        }
  //      }
  //    }
  //    response(ret);
  //  },
  //});

  //GrowCalc.ElementIonsView = Ember.ContainerView.extend({
  //  childViews: [],
  //});

  GrowCalc.ElementEditorView = Ember.View.extend({
    // the controller is the initial context for the template
    controller: null,
    //ElementIonsView: GrowCalc.ElementIonsView.create(),
    template: Ember.Handlebars.compile(
      //'{{view Ember.ContainerView currentViewBinding="view.ElementIonsView"}}' +
      '<div>' +
        '<table><tr>' +
          '<td><label>Символ</label></td>' +
          '<td>{{view Ember.TextField valueBinding="view.controller.content.Symbol"}}</td>' +
        '</tr>' +
        '<tr>' +
          '<td><label>Описание</label></td>' +
          '<td>{{view Ember.TextArea valueBinding="view.controller.content.Description"}}</td>' +
        '</tr>' +
        '<tr>' +
          '<td><label>Атомарная масса</label></td>' +
          '<td>{{view GrowCalc.NumberField valueBinding="view.controller.content.AtomicMass"}}</td>' +
        '</tr>' +
        '<tr>' +
          '<td><label>Степень окисления</label></td>' +
          '<td>{{view GrowCalc.NumberField valueBinding="view.controller.content.Oxidation"}}</td>' +
        '</tr>' +
        '<tr>' +
          '<td colspan="2"><label>Цвет</label>' +
          '<br />' +
          '{{view GrowCalc.ColorPicker valueBinding="view.controller.content.Color"}}</td>' +
        '</tr>' +
        '</table>' +
      '</div>' +
      '<div>' +
        '<p>' +
          '<button {{action "Commit" on="click"}}>Сохранить</button>' +
          '<button {{action "Rollback" on="click"}}>Отмена</button>' +
          '<button {{action "Delete" on="click"}}>Удалить</button>' +
        '</p>' +
      '</div>'
    ),
    didInsertElement: function() {
      // autocomplete staff
      //var value = this.controller.content.get('AutocompleteField');
      //if (value !== 0) {
      //  var valueTitle = AutocompleteObjects[value].title;
      //  this.set('AutocompleteTitle', valueTitle);
      //}

      //var newIonView = GrowCalc.NewIonView.create({ Host: this.controller.content });
      //this.ElementIonsView.get('childViews').pushObject(newIonView);
      var ions = this.controller.content.get('Ions');
      for(var i in ions) {
        if (ions[i] instanceof Ember.Object) {
          var ion = ions[i];
          //this.ElementIonsView.get('childViews').pushObject(ion.view);
        }
      }
    },
    //IonsChanged: function () { 
    //  alert('ions changed');
    //}.observes('controller.content.Ions'),
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
    Commit: function () {
      var element = this.controller.content;
      if (this.Validate()) {
        element.DestroyEditorForm();
        element.Commit();
      }
    },
    Delete: function () {
      this.controller.content.ShowDeleteForm();
    },
    Rollback: function () {
      var element = this.controller.content;
      element.DestroyEditorForm();
      element.Rollback();
    }
  });

  GrowCalc.ElementDeleteView = Ember.View.extend({
    // the controller is the initial context for the template
    controller: null,
    template: Ember.Handlebars.compile('<div>' +
        '<p>Вы действительно хотите удалить "{{Symbol}}"?</p>' +
        '<button {{action "Delete" on="click"}}>Удалить</button>' +
        '<button {{action "Close" on="click"}}>Отмена</button>' +
      '</div>'),
    Delete: function () {
      var element = this.controller.content;
      element.DestroyDeleteForm();
      element.Delete();
    },
    Close: function () {
      var element = this.controller.content;
      element.DestroyDeleteForm();
    }
  });

  // Массив _всех_ элементов, загруженных на текущей странице.
  GrowCalc.Elements = {};

  GrowCalc.GetElementBySymbol = function (symbol) {
    if (typeof GrowCalc.Elements[symbol] !== 'undefined') {
      return GrowCalc.Elements[symbol];
    } else {
      return false;
    }
  };

  GrowCalc.GetElementById = function (id) {
    var isContains = false;
    for(var i in GrowCalc.Elements) {
      if (GrowCalc.Elements[i] instanceof Ember.Object) {
        if (GrowCalc.Elements[i].Id == id) {
          isContains = true;
          return GrowCalc.Elements[i];
        }
      }
    }
  
    return false;
  };

  GrowCalc.AddElement = function(values) {
    var el = GrowCalc.GetElementBySymbol(values['Symbol']);
    if (!el) {
      values['_defaults'] = $.extend({}, values);
      el = GrowCalc.Elements[values['Symbol']] = GrowCalc.Element.create(values);

      el.controller = GrowCalc.ElementController.create({ content: el });
      el.view = GrowCalc.ElementView.create({ controller: el.controller });
      
      if ($('#calc-elements .nav-elements').length > 0) {
        el.view.appendTo($('#calc-elements .nav-elements'));
      }

      if (typeof values.Ions !== 'undefined') {
        values.Ions.forEach( function (item, index, enumerable) {
          el.AddIon(GrowCalc.GetElementBySymbol(item.element), item.count);
        });
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