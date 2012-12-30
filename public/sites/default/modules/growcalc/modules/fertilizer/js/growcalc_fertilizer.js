/*jslint browser: true, indent: 2, plusplus: false */

(function ($, Ember, GrowCalc, Drupal, window, document, undefined) {
  "use strict";

  GrowCalc.Fertilizer = Ember.Object.extend(GrowCalc.DrupalSavable, {
    Type: 'fertilizer',

    '_defaults': {
      Id: 0,
      Name: "",
      Description: "",
      Tag: "",
      Elements: []
    },
    Id: 0,
    Name: "",
    Description: "",
    Tag: "",
    Elements: [],
    /**
     * Fertilizer.UpdateDefaults().
     *
     * Обновление значений по-умолчанию.
     */
    UpdateDefaults: function () {
      var that = this,
        defaults = that.get('_defaults'),
        i;

      for (i in defaults) {
        if (i !== 'Elements') {
          defaults[i] = that.get(i);
        }
      }

      // clean removed elements
      defaults.Elements.forEach(function (el) {
        if (undefined == that.get('Elements').findProperty('Element', el.Element)) {
          defaults.Elements.removeObject(el);
        }
      });


      that.get('Elements').forEach(function (el) {
        i = defaults.Elements.findProperty('Element', el.Element);
        if (i != undefined) {
          i.set('Amount', el.get('Amount'));
        }
      });

      that.get('Elements').forEach(function (el) {
        if (undefined == defaults.Elements.findProperty('Element', el.get('Element'))) {
          that.SetElementPermanent(el);
        }
      });
    },
    /**
     * Fertilizer.PrepareData().
     *
     * Prepares data for saving.
     */
    PrepareData: function () {
      var that = this;
      return {
        id: that.get('Id'),
        name: that.get('Name'),
        description: that.get('Description'),
        tag: that.get('Tag'),
        elements: that.get('Elements').map(function (element, index, enumerable) {
          return {
            element: element.Element.Symbol,
            amount: element.Amount
          };
        }),
      };
    },
    /**
     * Fertilizer.Commit().
     *
     * Сохранение изменений в модели.
     */
    Commit: function () {
      this.UpdateDefaults();
      this.SaveToServer();
    },
    /**
     * Fertilizer.Changed().
     *
     * Возвращает Boolean значение.
     * TRUE - поля модели были изменены, модель не сохранена.
     * FALSE - иначе.
     */
    Changed: function () {
      var isChanged = false,
        that = this,
        defaults = this.get('_defaults'),
        k;
      for (k in defaults) {
        if (k !== 'Elements') {
          if (defaults[k] !== that.get(k)) {
            isChanged = true;
            break;
          }
        }
      }


      isChanged = isChanged
        || (that.get('Elements').length !== defaults.Elements.length)
        || (undefined != defaults.Elements.find(function (el) {
          return !that.get('Elements')
            .filterProperty('Element', el.get('Element'))
            .everyProperty('Amount', el.get('Amount'));
        }));

      return isChanged;
    },
    /**
     * Fertilizer.SaveToServer().
     *
     * Сохранение модели в друпале.
     * (growcalc/ajax/fertilizer/%node/update)
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
     * Fertilizer.Delete().
     *
     * Удаление удобрения из базы данных.
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
     * Fertilizer.Destroy().
     *
     * Удаление удобрения из фронтенда.
     * Почистить за собой.. ^_^
     */
    Destroy: function () {
      this.CloseDialogs();
      GrowCalc.Fertilizers.removeObject(this);
    },
    /**
     * Fertilizer.Rollback().
     *
     * Откат сделанных в модели изменений.
     * Для восстановления используется (Array)this.get('_defaults');
     */
    Rollback: function () {
      var that = this,
        defaults = this.get('_defaults'),
        i;
      // Простые поля переносятся скопом.
      for (i in defaults) {
        if (i !== 'Elements') {
          this.set(i, defaults[i]);
        }
      }

      this.get('Elements').forEach(function (el) {
        if (undefined == defaults.Elements.findProperty('Element', el.get('Element'))) {
          that.RemoveElement(el.Element, true);
        }
      });

      defaults.Elements.forEach(function (el) {
        i = that.get('Elements').findProperty('Element', el.get('Element'));
        if (i != undefined) {
          i.set('Amount', el.get('Amount'));
        }
      });

      defaults.Elements.forEach(function (el) {
        if (undefined == that.get('Elements').findProperty('Element', el.get('Element'))) {
          that.AddElement(el.Element, el.Amount);
        }
      });
    },
    /**
     * Fertilizer.ShowEditorForm().
     *
     * Открыть форму редактирования удобрения.
     * Форма рендерится в JQuery UI Dialog.
     */
    ShowEditorForm: function () {
      var that = this;
      if (typeof that.editorView === 'undefined') {
        that.editorView = GrowCalc.FertilizerEditorView.create({ content: that, autoOpen: true });
        that.editorView.appendTo(document);
      } else {
        that.editorView.OpenDialog();
      }
    },
    /**
     * Fertilizer.ShowDeleteForm().
     *
     * Открыть форму подтверждения удаления.
     * Форма рендерится в JQuery UI Dialog.
     */
    ShowDeleteForm: function () {
      var that = this;
      if (typeof that.deleteView === 'undefined') {
        that.deleteView = GrowCalc.FertilizerDeleteView.create({ content: that, autoOpen: true });
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
    AddElement: function (Element, Amount, temporary) {
      temporary = temporary || false;
      var element = Ember.Object.create({'Element': Element, 'Amount': parseFloat(Amount), 'Host': this});

      this.get('Elements').pushObject(element);

      if (!temporary) {
        this.SetElementPermanent(element);
      }
    },
    RemoveElement: function (Element, temporary) {
      temporary = temporary || false;
      var defaults = this.get('_defaults'),
        element = this.get('Elements').findProperty('Element', Element);
      if (element != undefined) {
        this.get('Elements').removeObject(element);
        if (!temporary) {
          this.SetElementTemporary(element); // deletes element from defaults.
        }
        element.destroy();
      }
    },
    SetElementPermanent: function(element) {
      var that = this,
        defaults = that.get('_defaults');
      if (undefined == defaults.Elements.findProperty('Element', element.get('Element'))) {
        defaults.Elements.pushObject(Ember.Object.create({
          'Element': element.Element, 
          'Amount': element.Amount,
        }));
      }
    },
    SetElementTemporary: function(element) {
      var that = this,
        defaults = that.get('_defaults'),
        defaultElement = defaults.Ions.findProperty('Element', element.get('Element'));
      if (undefined != defaultElement) {
        defaults.Elements.removeObject(defaultElement);
        defaultElement.destroy();
      }
    },
    ListElements: function () {
      var elements = [];

      this.get('Elements').forEach(function (element) {
        element.get('Element').ListElements().forEach(function (el_key) {
          var el = elements.findProperty('Element', el_key.Element);
          if (el) {
            el.Amount += element.get('Amount') * el_key.Amount;
          } else {
            elements.pushObject({
              Element: el_key.Element,
              Amount: parseFloat(element.get('Amount')) * el_key.Amount * el_key.Element.get('MolarMass') / element.get('Element.MolarMass'),
            });
          }
        });
      });

      return elements;
    }
  });

  GrowCalc.FertilizersView = Ember.CollectionView.extend({
    tagName: 'ul',
    classNames: ['list', 'list-fertilizers'],
    contentBinding: 'GrowCalc.Fertilizers',
    itemViewClass: Ember.View.extend({
      tagName: 'li',
      content: null,
      contextBinding: 'content',
      template: Ember.Handlebars.compile(
        '{{Name}} {{Description}} {{Tag}}' +
        '<button class="btn btn-mini action action-edit" {{action "ShowEditorForm" target on="click"}} title="Редактирование"><i class="icon-edit"></i></button>'
      ),
      doubleClick: function () {
        this.content.ShowEditorForm(); 
      },
      ShowEditorForm: function () {
        this.content.ShowEditorForm(); 
      },
    }),
    didInsertElement:function(){
      var hover = 0;
      this._super();
      $(".block-growcalc-fertilizer .filter")
        .listFilter(this.$())
        .focus(function () {
          if (hover == 0) {
            $('#calc-fertilizers').stop(true, true).slideDown();
            $('#block-growcalc_fertilizer-growcalc_fertilizers').addClass('expanded');
          }
          hover++;
        })
        .blur(function () {
          hover--;
          if (hover == 0) {
            $('#calc-fertilizers').stop(true, true).slideUp();
            $('#block-growcalc_fertilizer-growcalc_fertilizers').removeClass('expanded');
          }
        })

      $(".block-growcalc-fertilizer")
        .mouseenter(function () {
          if (hover == 0) {
            $('#calc-fertilizers').stop(true, true).slideDown();
            $('#block-growcalc_fertilizer-growcalc_fertilizers').addClass('expanded');
          }
          hover++;
        })
        .mouseleave(function () {
          hover--;
          if (hover == 0) {
            $('#calc-fertilizers').stop(true, true).slideUp();
            $('#block-growcalc_fertilizer-growcalc_fertilizers').removeClass('expanded');
          }
        });
      $('#calc-fertilizers').hide();
    }
  });

  GrowCalc.FertilizerElementsView = Ember.CollectionView.extend({
    tagName: 'ul',
    classNames: ['list', 'list-fertilizer-elements'],
    itemViewClass:  Ember.View.extend({
      tagName: 'li',
      content: null,
      contextBinding: 'content',
      template: Ember.Handlebars.compile('{{Element.Symbol}} {{view GrowCalc.NumberField valueBinding="view.PercentAmount" classNames="with-button"}}<button class="btn action action-delete" {{action "Delete" target on="click"}} title="Удаление"><span class="ui-icon ui-icon-close"></span></button> %<br/>{{view GrowCalc.ScrollView max="100" valueBinding="view.PercentAmount" colorBinding="view.content.Element.Color" backgroundValueVisible="false"}}'),
      PercentAmount: function (key, value) {
        // getter
        if (arguments.length === 1) {
          var newValue = 100.0 * this.get('content.Amount');
          if (newValue > 100) newValue = 100;
          if (newValue < 0) newValue = 0;
          return newValue;
        // setter
        } else {
          if (value > 100) value = 100;
          if (value < 0) value = 0;
          this.set('content.Amount', value / 100);
          return value;
        }
      }.property('content.Amount'),
      Delete: function () {
        this.content.Host.RemoveElement(this.content.Element, true);
      },
    }),
  });

  GrowCalc.FertilizerNewElementView = Ember.View.extend({
    Amount: 0,
    Host: undefined,
    ElementSymbol: "",
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
        Element = GrowCalc.GetElementBySymbol(that.get('ElementSymbol'));
      if (Element) {
        if (undefined == this.get('Host.Elements').findProperty('Element', Element)) {
          that.get('Host').AddElement(Element, that.get('Amount'), true);
        } else {
          alert('Элемент уже содержится.');
        }
      } else {
        alert('Неправильный ввод.');
      }
    },
    ElementSelected: function (e, ui) {
      var that = this._context.content.editorView.get('FertilizerNewElementView');
      that.set('ElementSymbol', ui.item.value);
    },
    ElementAutocomplete: function (request, response) {
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

  GrowCalc.FertilizersNewFertilizerView = Ember.View.extend({
    template: Ember.Handlebars.compile('<button class="btn action action-new" {{action "ShowNewEditorForm" target on="click"}} title="Создание нового элемента"><span class="ui-icon ui-icon-plus"></span></button>'),
    ShowNewEditorForm: function () {
      var that = this;
      var el = GrowCalc.AddFertilizer({ });
      el.ShowEditorForm();
    },
    ElementSelected: function (e, ui) {
      var that = this._context.content.editorView.get('FertilizerNewElementView');
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

  GrowCalc.FertilizerEditorView = JQ.Dialog.extend({
    classNames: ['fertilizer-editor-dialog'],
    width: 400,
    minWidth: 400,
    content: null,
    title: "",
    FertilizerElementsView: null,
    template: Ember.Handlebars.compile(
      '<label>Наименование</label>{{view Ember.TextField valueBinding="view.content.Name"}}' +
      '<label>Описание</label>{{view Ember.TextField valueBinding="view.content.Description"}}' +
      '<label>Элементы:</label>{{view Ember.ContainerView currentViewBinding="view.FertilizerNewElementView"}}' +
      '{{view Ember.ContainerView currentViewBinding="view.FertilizerElementsView"}}'
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
    didInsertElement: function () {
      var that = this,
        fertilizer = that.content;

      that.set('title', 'Удобрение "' + fertilizer.get('Name') + '"');
      that._super();
      that.set('FertilizerNewElementView', GrowCalc.FertilizerNewElementView.create({ Host: fertilizer }));
      that.set('FertilizerElementsView', GrowCalc.FertilizerElementsView.create({content: fertilizer.get('Elements')}));
    },
    Validate: function () {
      var retValue = true;
      var fertilizer = this.content;

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

  GrowCalc.FertilizerDeleteView = JQ.Dialog.extend({
    classNames: ['fertilizer-delete-dialog'],
    width: 300,
    minWidth: 300,
    content: null,
    title: "Удалить удобрение?",
    template: Ember.Handlebars.compile('<p>Вы действительно хотите удалить "{{Name}}"?</p>'),
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

  // Массив _всех_ удобрений, загруженных на текущей странице.
  GrowCalc.Fertilizers = [];

  GrowCalc.GetFertilizersBy = function (field, value, regexp) {
    if (typeof regexp === 'undefined') regexp = false;
    regexp = regexp && new RegExp(value);

    return GrowCalc.Fertilizers.filter(function(item, index, self) {
      if (regexp) {
        return regexp.test(item.get(field));
      } else {
        return (item.get(field) == value);
      }
    });
  };

  GrowCalc.GetFertilizerById = function (id) {
    return GrowCalc.GetFertilizersBy('Id', id)[0];
  };

  GrowCalc.GetFertilizerByName = function (name) {
    var val = GrowCalc.GetFertilizersBy('Name', name)[0];
    return val;
  };

  GrowCalc.AddFertilizer = function (values) {
    var fer = GrowCalc.GetFertilizerByName(values['Name']);
    if (!fer) {
      var elements = values.Elements;
      values.Elements = [];
      values['_defaults'] = $.extend({}, values);
      values['_defaults']['Elements'] = [];
      fer = GrowCalc.Fertilizer.create(values);
      GrowCalc.Fertilizers.pushObject(fer);

      if (typeof elements !== 'undefined') {
        elements.forEach(function (item, index, enumerable) {
          fer.AddElement(GrowCalc.GetElementBySymbol(item.element), item.amount);
        });
      }
    }

    return fer;
  };

  $(function () {
    var i,
      l,
      fer,
      fer_key;

    GrowCalc.fertilizersNewFertilizerView = GrowCalc.FertilizersNewFertilizerView.create({}).appendTo('#calc-fertilizers');
    GrowCalc.fertilizersView = GrowCalc.FertilizersView.create({}).appendTo($('#calc-fertilizers'));

    if (GrowCalc.Drupal().supportLocalStorage) {
      for(i =0, l = localStorage.length; i < l; i++) {
        fer_key = localStorage.key(i);
        if (fer_key.indexOf('Fertilizer') !== -1) {
          fer = JSON.parse(localStorage[fer_key]);
          GrowCalc.AddFertilizer({
            Id: fer.id,
            Name: fer.name,
            Description: fer.description,
            //Tag: fer.tag,
            Elements: fer.elements,
          });
        }
      }
    }
    if (typeof Drupal.settings.growcalc !== 'undefined') {
      if (typeof Drupal.settings.growcalc.fertilizers !== 'undefined') {
        for (fer_key in Drupal.settings.growcalc.fertilizers) {
          if (Drupal.settings.growcalc.fertilizers.hasOwnProperty(fer_key)) {
            fer = Drupal.settings.growcalc.fertilizers[fer_key];
            GrowCalc.AddFertilizer({
              Id: fer.id,
              Name: fer.name,
              Description: fer.description,
              Tag: "",
              Elements: fer.elements
            });
          }
        }
      }
    }
  });
})(jQuery, Ember, this.GrowCalc, Drupal, this, this.document);