/*jslint browser: true, indent: 2, plusplus: false */

(function ($, Ember, GrowCalc, Drupal, window, document, undefined) {
  "use strict";

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
      Ions: [],
      Visible: true,
    },
    Id: 0,
    Description: "",
    Symbol: "",
    AtomicMass: 0,
    Tag: "",
    Oxidation: 0,
    Color: '000000',
    Ions: [],

    Visible: true,
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

      // clean removed ions
      defaults.Ions.forEach(function (ion) {
        if (undefined == that.get('Ions').findProperty('Element', ion.Element)) {
          defaults.Ions.removeObject(ion);
        }
      });

      // modify existing
      that.get('Ions').forEach(function (ion) {
        i = defaults.Ions.findProperty('Element', ion.Element);
        if (i != undefined) {
          i.set('Count', ion.get('Count'));
        }
      });

      // and insert new
      that.get('Ions').forEach(function (ion) {
        if (undefined == defaults.Ions.findProperty('Element', ion.get('Element'))) {
          that.SetIonPermanent(ion);
        }
      });
    },
    /**
     * Element.PrepareData().
     *
     * Prepares data for saving.
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
        ions: that.get('Ions').map(function (ion) {
          return {
            element: ion.Element.Symbol,
            count: ion.Count
          };
        }),
        visible: that.get('Visible'),
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

      isChanged = isChanged
        || (that.get('Ions').length !== defaults.Ions.length)
        || (undefined != defaults.Ions.find(function (ion) {
          return !that.get('Ions')
            .filterProperty('Element', ion.get('Element'))
            .everyProperty('Count', ion.get('Count'));
        }));

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
            if (that.IsTemporary()) {
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
      if (!that.IsTemporary()) {
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
      GrowCalc.Elements.removeObject(this);
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

      this.get('Ions').forEach(function (ion) {
        if (undefined == defaults.Ions.findProperty('Element', ion.get('Element'))) {
          that.RemoveIon(ion.Element, true);
        }
      });

      defaults.Ions.forEach(function (ion) {
        i = that.get('Ions').findProperty('Element', ion.get('Element'));
        if (i != undefined) {
          i.set('Count', ion.get('Count'));
        }
      });

      defaults.Ions.forEach(function (ion) {
        if (undefined == that.get('Ions').findProperty('Element', ion.get('Element'))) {
          that.AddIon(ion.Element, ion.Count);
        }
      });

    },
    /**
     * Element.ShowEditorForm().
     *
     * Открыть форму редактирования элемента.
     * Форма рендерится в JQuery UI Dialog.
     */
    ShowEditorForm: function () {
      var that = this;
      if (typeof that.editorView === 'undefined') {
        that.editorView = GrowCalc.ElementEditorView.create({ content: that, autoOpen: true });
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
        that.deleteView = GrowCalc.ElementDeleteView.create({ content: that, autoOpen: true });
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
    AddIon: function (Element, Count, temporary) {
      temporary = temporary || false;
      var ion = Ember.Object.create({'Element': Element, 'Count': parseInt(Count), 'Host': this});

      this.get('Ions').pushObject(ion);

      if (!temporary) {
        this.SetIonPermanent(ion);
      }
    },
    RemoveIon: function (Element, temporary) {
      temporary = temporary || false;
      var defaults = this.get('_defaults'),
        ion = this.get('Ions').findProperty('Element', Element);
      if (ion != undefined) {
        this.get('Ions').removeObject(ion);
        if (!temporary) {
          this.SetIonTemporary(ion); // deletes ion from defaults.
        }
        ion.destroy();
      }
    },
    SetIonPermanent: function(ion) {
      var that = this,
        defaults = that.get('_defaults');
      if (undefined == defaults.Ions.findProperty('Element', ion.get('Element'))) {
        defaults.Ions.pushObject(Ember.Object.create({
          'Element': ion.Element, 
          'Count': ion.Count,
        }));
      }
    },
    SetIonTemporary: function(ion) {
      var that = this,
        defaults = that.get('_defaults'),
        defaultIon = defaults.Ions.findProperty('Element', ion.get('Element'));
      if (undefined != defaultIon) {
        defaults.Ions.removeObject(defaultIon);
        defaultIon.destroy();
      }
    },
    ListElements: function () {
      var elements = [];

      this.get('Ions').forEach(function (ion) {
        ion.get('Element').ListElements().forEach(function (el_key) {
          var el = elements.findProperty('Element', el_key.Element);
          if (el) {
            el.Amount += ion.get('Count') * el_key.Amount;
          } else {
            elements.pushObject({
              Element: el_key.Element,
              Amount: ion.get('Count') * el_key.Amount,
            });
          }
        })
      });

      if (elements.length === 0) {
        elements.pushObject({
          Element: this,
          Amount: 1,
        });
      }

      return elements;
    },
    MolarMass: function () {
      var mass = 0;

      this.get('Ions').forEach(function (ion) {
        mass += ion.Count * ion.Element.get('MolarMass');
      });
      
      if (mass == 0) {
        mass = this.get('AtomicMass');
      }
      return mass;
    }.property('AtomicMass', 'Ions'),
  }); 

  GrowCalc.ElementsView = Ember.CollectionView.extend({
    tagName: 'ul',
    classNames: ['list', 'list-elements'],
    contentBinding: 'GrowCalc.Elements',
    itemViewClass: Ember.View.extend({
      tagName: 'li',
      content: null,
      contextBinding: 'content',
      
      template: Ember.Handlebars.compile(
        '<span class="symbol color" style="color: #{{unbound Color}}">{{Symbol}}</span>' +
        '<br /><span class="description color" style="color: #{{unbound Color}}">{{Description}}</span>' +
        
        '<button class="btn btn-mini action action-edit" {{action "ShowEditorForm" target on="click"}} title="Редактирование"><i class="icon-edit"></i></button>'
      ),
      doubleClick: function () {
        this.content.ShowEditorForm(); 
      },
      ShowEditorForm: function () {
        this.content.ShowEditorForm(); 
      },
      ColorBinding: 'content.Color',
      ColorChanged: function () {
        $('.color', this.$()).css({'color' : '#' + this.get('Color')});
      }.observes('Color'),
    }),
    didInsertElement:function(){
      var hover = 0;
      this._super();
      $(".block-growcalc-element .filter")
        .listFilter(this.$())
        .focus(function () {
          if (hover == 0) {
            $('#calc-elements').stop(true, true).slideDown();
            $('#block-growcalc_element-growcalc_elements').addClass('expanded');
          }
          hover++;
        })
        .blur(function () {
          hover--;
          if (hover == 0) {
            $('#calc-elements').stop(true, true).slideUp();
            $('#block-growcalc_element-growcalc_elements').removeClass('expanded');
          }
        })

      $(".block-growcalc-element")
        .mouseenter(function () {
          if (hover == 0) {
            $('#calc-elements').stop(true, true).slideDown();
            $('#block-growcalc_element-growcalc_elements').addClass('expanded');
          }
          hover++;
        })
        .mouseleave(function () {
          hover--;
          if (hover == 0) {
            $('#calc-elements').stop(true, true).slideUp();
            $('#block-growcalc_element-growcalc_elements').removeClass('expanded');
          }
        });
      $('#calc-elements').hide();
    },
  });

  GrowCalc.ElementIonsView = Ember.CollectionView.extend({
    tagName: 'ul',
    classNames: ['list', 'list-ions'],
    itemViewClass: Ember.View.extend({
      tagName: 'li',
      content: null,
      contextBinding: 'content',
      template: Ember.Handlebars.compile('{{Element.Symbol}} {{view GrowCalc.NumberField valueBinding="view.ValidatedCount"}}<button class="btn action action-delete" {{action "Delete" target on="click"}} title="Удаление"><span class="ui-icon ui-icon-close"></span></button><br />{{view GrowCalc.ScrollView max="20" valueBinding="view.ValidatedCount" colorBinding="view.content.Element.Color" precision="0" backgroundValueVisible="false"}}'),
      ValidatedCount: function (key, value) {
        if (arguments.length === 1) {
          var value = this.content.get('Count');
          if (value < 0) value = 0;
          return value;
        } else {
          if (value < 0) value = 0;
          this.content.set('Count', value);
          return value;
        }
      }.property('content.Count'),
      Delete: function () {
        this.content.Host.RemoveIon(this.content.Element, true);
      },
    }),
  });

  GrowCalc.ElementNewIonView = Ember.View.extend({
    Count: 1,
    Host: undefined,
    ElementSymbol: "",
    classNames: ['new-ion'],
    template: Ember.Handlebars.compile('{{view JQ.AutoComplete valueBinding="view.ElementSymbol" minLength="0" sourceBinding="view.ElementAutocomplete" selectBinding="view.ElementSelected" classNames="with-button"}}' +
      '<button class="btn action action-clear with-button" {{action "Clear" target on="click"}} title="Очистить"><span class="ui-icon ui-icon-close"></span></button>' +
      '<button class="btn action action-dropdown with-button" {{action "Dropdown" target on="click"}} title="Выберите..."><span class="ui-icon ui-icon-triangle-1-s"></span></button>' +
      '<button class="btn action action-addelement" {{action "AddElement" target on="click"}} title="Добавить"><span class="ui-icon ui-icon-arrowthick-1-e"></span></button>'),
    Dropdown: function () {
      this.get('childViews')[0].Search(this.get('ElementSymbol'));
    },
    Clear: function () {
      this.set('ElementSymbol', '');
    },
    AddElement: function () {
      var that = this,
        element = GrowCalc.GetElementBySymbol(that.get('ElementSymbol'));
      if (element) {
        if (undefined == this.get('Host.Ions').findProperty('Element', element)) {
          that.get('Host').AddIon(element, that.get('Count'), true);
          that.set('ElementSymbol', '');
        } else {
          alert('Элемент уже содержится.');
        }
      } else {
        alert('Неправильный ввод.');
      }
    },
    ElementSelected: function (e, ui) {
      var that = this._context.content.editorView.get('ElementNewIonView');
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
    },
  });

  GrowCalc.ElementsNewElementView = Ember.View.extend({
    template: Ember.Handlebars.compile('<button class="btn action action-new" {{action "ShowNewEditorForm" target on="click"}} title="Создание нового элемента"><span class="ui-icon ui-icon-plus"></span></button>'),
    ShowNewEditorForm: function () {
      var that = this;
      var el = GrowCalc.AddElement({ });
      el.ShowEditorForm();
    },
    ElementSelected: function (e, ui) {
      var that = this._context.content.editorView.get('ElementNewIonView');
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
    },
  });

  GrowCalc.ElementEditorView = JQ.Dialog.extend({
    classNames: ['element-editor-dialog'],
    width: 435,
    minWidth: 435,
    content: null,
    title: "",
    ElementIonsView: null,
    template: Ember.Handlebars.compile(
      '<div class="row-fluid">' +
        '<div class="span6">' +
          '<label>Символ</label>{{view Ember.TextField valueBinding="view.content.Symbol"}}' +
          '<label>Описание</label>{{view Ember.TextField valueBinding="view.content.Description"}}' +
          '<label>Атомарная масса</label>{{view GrowCalc.NumberField valueBinding="view.content.AtomicMass"}}' +
          '<label>Степень окисления</label>{{view GrowCalc.NumberField valueBinding="view.content.Oxidation"}}' +
          '<label>Видимый</label>{{view Ember.Checkbox checkedBinding="view.content.Visible"}}' +
        '</div>' +
        '<div class="span6">' +
          '{{view JQ.Farbtastic valueBinding="view.content.Color"}}' +
        '</div>' +
      '</div>' +
      '<label>Ионы:</label>' +
      '{{view Ember.ContainerView currentViewBinding="view.ElementNewIonView"}}' +
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
        that.content.ShowDeleteForm();
      },
    },
    didInsertElement: function() {
      var that = this,
        element = that.content;
      that.set('title', 'Элемент "' + element.get('Symbol') + '"');
      that._super();
      that.set('ElementNewIonView', GrowCalc.ElementNewIonView.create({ Host: element }));
      that.set('ElementIonsView', GrowCalc.ElementIonsView.create({content: element.get('Ions')}));
    },
    Validate: function () {
      var retValue = true;
      var element = this.content;
      var AtomicMass = parseFloat(element.get('AtomicMass'));

      if (AtomicMass < 0) {
        alert("Атомная масса должна быть больше нуля");
        retValue = false;
      }

      return retValue;
    },
    CommitAndClose: function () {
      var node = this.content;
      if (this.Validate()) {
        node.DestroyEditorForm();
        node.Commit();
      }
    },
    RollbackAndClose: function () {
      var element = this.content;
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
    content: null,
    title: "Удалить элемент?",
    template: Ember.Handlebars.compile('<p>Вы действительно хотите удалить "{{Symbol}}"?</p>'),
    buttons: {
      'Удалить': function () {
        var that = Ember.View.views[$(this).attr('id')];
        that.content.DestroyDeleteForm();
        that.content.Delete();
      },
      'Отмена': function () {
        var that = Ember.View.views[$(this).attr('id')];
        that.content.DestroyDeleteForm();
      }
    },
    close: function(event, ui) {
      var that = Ember.View.views[$(this).attr('id')];
      if ((typeof event !== 'undefined') && (typeof event.cancelable !== 'undefined') && (event.cancelable)) {
        that.content.DestroyDeleteForm();
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

  GrowCalc.GetElementById = function (value) {
    return GrowCalc.GetElementsBy('Id', value)[0];
  };

  GrowCalc.GetElementBySymbol = function (value) {
    return GrowCalc.GetElementsBy('Symbol', value)[0];
  };


  GrowCalc.AddElement = function(values) {
    var el = GrowCalc.GetElementBySymbol(values['Symbol']);
    if (!el) {
      var ions = values.Ions;
      values.Ions = [];
      values['_defaults'] = $.extend({}, values);
      values['_defaults']['Ions'] = [];
      el = GrowCalc.Element.create(values);
      GrowCalc.Elements.pushObject(el);

      if (typeof ions !== 'undefined') {
        ions.forEach( function (item, index, enumerable) {
          el.AddIon(GrowCalc.GetElementBySymbol(item.element), item.count);
        });
      }
    }

    return el;
  };

  $(function() {
    var i,
      l,
      el,
      el_key;

    GrowCalc.elementsNewElementView = GrowCalc.ElementsNewElementView.create({}).appendTo('#calc-elements');
    GrowCalc.elementsView = GrowCalc.ElementsView.create({}).appendTo('#calc-elements');

    if (GrowCalc.Drupal().supportLocalStorage) {
      for(i =0, l = localStorage.length; i < l; i++) {
        el_key = localStorage.key(i);
        if (el_key.indexOf('Element') !== -1) {
          el = JSON.parse(localStorage[el_key]);
          GrowCalc.AddElement({
            Id: el.id,
            Symbol: el.symbol,
            Description: el.description,
            Tag: el.tag,
            AtomicMass: el.atomic_mass,
            Oxidation: el.oxidation,
            Color: el.color,
            Ions: el.ions,
            Visible: el.visible,
          });
        }
      }
    }

    if (typeof Drupal.settings.growcalc !== 'undefined') {
      if (typeof Drupal.settings.growcalc.elements !== 'undefined') {
        for(el_key in Drupal.settings.growcalc.elements) {
          if (Drupal.settings.growcalc.elements.hasOwnProperty(el_key)) {
            el = Drupal.settings.growcalc.elements[el_key];
            GrowCalc.AddElement({
              Id: el.id,
              Symbol: el.symbol,
              Description: el.description,
              Tag: el.tag,
              AtomicMass: el.atomic_mass,
              Oxidation: el.oxidation,
              Color: el.color,
              Ions: el.ions,
              Visible: el.visible,
            });
          }
        }
      }
    }
  });
})(jQuery, Ember, this.GrowCalc, Drupal, this, this.document);