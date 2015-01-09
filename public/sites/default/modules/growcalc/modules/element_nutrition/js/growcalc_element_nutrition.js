/*jslint browser: true, indent: 2, plusplus: false */

(function ($, Ember, GrowCalc, Drupal, window, document, undefined) {
  "use strict";

  GrowCalc.ElementNutrition = Ember.Object.extend(GrowCalc.DrupalSavable, {
    Type: 'element_nutrition',

    '_defaults': {
      Id: 0,
      Name: "",
      Tag: "",
      Elements: []
    },
    Id: 0,
    Name: "",
    Tag: "",
    Elements: [],

    editorDialog: 'false ;)',
    /**
     * ElementNutrition.UpdateDefaults().
     *
     * Обновление значений по-умолчанию.
     */
    UpdateDefaults: function () {
      var that = this,
        defaults = that.get('_defaults'),
        i;

      for(i in defaults) {
        if (i !== 'Elements') {
          defaults[i] = that.get(i);
        }
      }

      // apply removed elements
      defaults.Elements.forEach(function (defaultElement, defaultsIndex, defaultElementsEnumerable) {
        var element = that.get('Elements').findProperty('Element', defaultElement.Element);
        if (typeof element === 'undefined') {
          defaults.Elements.removeObject(element);
        }
      });

      that.SaveTemporaryElements();

      that.get('Elements').forEach(function (element, index, enumerable) {
        var defaultElement = defaults.Elements.findProperty('Element', element.Element);
        if (typeof defaultElement !== 'undefined') {
          defaultElement.set('Amount', element.get('Amount'));
        }
      });
    },
    /**
     * ElementNutrition.PrepareData().
     *
     * Prepares data for saving.
     */
    PrepareData: function () {
      var that = this;
      return {
        id: that.get('Id'),
        name: that.get('Name'),
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
     * ElementNutrition.Commit().
     *
     * Сохранение изменений в модели.
     */
    Commit: function () {
      this.UpdateDefaults();
      this.SaveToServer();
    },
    /**
     * ElementNutrition.Changed().
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
        if (k !== 'Elements') {
          if (defaults[k] !== that.get(k)) {
            isChanged = true;
            break;
          }
        }
      }

      if (!isChanged) {
        if ((that.get('Elements').length !== defaults.Elements.length) || (null !== defaults.Elements.find(function (defaultElement, defaultsIndex, defaultElementsEnumerable) {
            return (undefined != that.get('Elements').find(function (element, elementsIndex, elementsEnumerable) {
              return (element.get('Element') === defaultElement.get('Element')) && (element.get('Amount') !== defaultElement.get('Amount'));
            }));
          }))) {
          isChanged = true;
        }
      }

      return isChanged;
    },
    /**
     * ElementNutrition.SaveToServer().
     *
     * Сохранение модели в друпале.
     * (growcalc/ajax/element_nutrition/%growcalc_element_nutrition/update)
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
     * ElementNutrition.Delete().
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
     * ElementNutrition.Destroy().
     *
     * Удаление из фронтенда.
     * Почистить за собой.. ^_^
     */
    Destroy: function () {
      this.CloseDialogs();
      GrowCalc.ElementNutritions.removeObject(this);
    },
    /**
     * ElementNutrition.Rollback().
     *
     * Откат сделанных в модели изменений.
     * Для восстановления используется (Array)this.get('_defaults');
     */
    Rollback: function () {
      var that = this,
        defaults = this.get('_defaults'),
        i;
      // Простые поля переносятся скопом.
      for(i in defaults) {
        if (i !== 'Elements') {
          this.set(i, defaults[i]);
        }
      }

      this.RemoveTemporaryElements();

      defaults.Elements.forEach(function (defaultElement, defaultsIndex, defaultsEnumerable) {
        if (undefined == that.get('Elements').findProperty('Element', defaultElement.get('Element'))) {
          that.AddElement(defaultElement.Element, defaultElement.Amount);
        }
      });

      defaults.Elements.forEach(function (defaultElement, defaultsIndex, defaultsEnumerable) {
        that.get('Elements').forEach(function (element, elementsIndex, elementsEnumerable) {
          if (element.get('Element') === defaultElement.get('Element')) {
            element.set('Amount', defaultElement.get('Amount'));  
          }
        });
      });
    },
    /**
     * ElementNutrition.ShowEditorForm().
     *
     * Открыть форму редактирования питания.
     * Форма рендерится в JQuery UI Dialog.
     */
    ShowEditorForm: function () {
      var that = this;
      if (typeof that.editorDialog === 'undefined') {
        that.editorDialog = GrowCalc.ElementNutritionEditorDialog.create({ content: that, autoOpen: true });
        that.editorDialog.appendTo(document);
      } else {
        that.editorDialog.OpenDialog();
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
        that.deleteView = GrowCalc.ElementNutritionDeleteView.create({ content: that, autoOpen: true });
        that.deleteView.appendTo(document);
      } else {
        that.deleteView.OpenDialog();  
      }
    },
    DestroyEditorForm: function () {
      var that = this;
      if (typeof that.editorDialog !== 'undefined') {
        that.editorDialog.CloseDialog();
        delete that.editorDialog;
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
      if (typeof element !== 'undefined') {
        this.get('Elements').removeObject(element);

        if (!temporary) {
          this.SetElementTemporary(element);
        }

        element.destroy();
      }
    },
    RemoveTemporaryElements: function () {
      var that = this,
        defaults = this.get('_defaults');
      this.get('Elements').forEach(function (element, elementsIndex, elementsEnumerable) {
        if (null === defaults.Elements.findProperty('Element', element.get('Element'))) {
          that.RemoveElement(element.Element, true);
        }
      });
    },
    SetElementPermanent: function(element) {
      var that = this,
        defaults = that.get('_defaults'),
        el = defaults.Elements.findProperty('Element', element.get('Element'));
      if (null !== el) {
        defaults.Elements.pushObject(Ember.Object.create({
          'Element': element.Element, 
          'Amount': element.Amount,
        }));
      }
    },
    SetElementTemporary: function(element) {
      var that = this,
        defaults = that.get('_defaults'),
        defaultElement = defaults.Elements.findProperty('Element', element.get('Element'));
      if (null !== defaultElement) {
        defaults.Elements.removeObject(defaultElement);
        defaultElement.destroy();
      }
    },
    SaveTemporaryElements: function () {
      var that = this,
        defaults = this.get('_defaults');
      that.get('Elements').forEach(function (element, elementsIndex, elementsEnumerable) {
        if (null === defaults.Elements.findProperty('Element', element.get('Element'))) {
          that.SetElementPermanent(element);
        }
      });
    },
    MaxElementAmount: function () {
      var max = this.get('MaxElementValue');
      this.get('Elements').forEach(function (f) {
        max = (max > f.get('Amount')) ? max : f.get('Amount');
      });
      return Math.floor(max + 1);
    }.property('MaxElementValue'),
    MaxElementValue: 200,
    ElementAmountChanged: function (element) {
      var value = element.get('Amount'),
        max = this.get('MaxElementValue');
      if (max < value) {
        this.set('MaxElementValue', value);
      }
    },
  });

  GrowCalc.ElementNutritionsView = Ember.CollectionView.extend({
    tagName: 'ul',
    classNames: [ 'list', 'list-element-nutritions'],
    contentBinding: 'GrowCalc.ElementNutritions',
    itemViewClass: Ember.View.extend({
      tagName: 'li',
      content: null,
      contextBinding: 'content',
      template: Ember.Handlebars.compile(
        '{{Name}} {{Tag}}' +
        '<ul class="elements">' +
        '{{#each view.content.Elements}}' +
        '<li>{{Element.Symbol}} - {{Amount}}</li>' +
        '{{/each}}' +
        '</ul>' +
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
      this._super();
      $(".block-growcalc-element-nutrition .filter").listFilter(this.$());
    },
  });
  
  GrowCalc.ElementNutritionElementsView = Ember.CollectionView.extend({
    classNames: ['element-nutrition-elements', 'clearfix', 'data'],
    tagName: 'ul',
    itemViewClass: Ember.View.extend({
      tagName: 'li',
      content: null,
      contextBinding: 'content',
      template: Ember.Handlebars.compile(
        '<div class="symbol">{{Element.Symbol}}</div>' +
        '{{view GrowCalc.ScrollView' +
        ' maxBinding="view.content.Host.MaxElementAmount"' +
        ' valueBinding="view.content.Amount"' +
        ' colorBinding="view.content.Element.Color"' +
        ' backgroundValueVisible="false"' +
        ' orientation="vertical"' +
        ' precision="0"' +
        ' reversed="true"' +
        '}}'
      ),
    }),
  });

  GrowCalc.ElementNutritionLegendView = Ember.CollectionView.extend({
    classNames: ['element-nutrition-legend'],
    tagName: 'ul',
    itemViewClass: Ember.View.extend({
      tagName: 'li',
      content: null,
      contextBinding: 'content',
      template: Ember.Handlebars.compile(
        '<div class="symbol">{{Element.Symbol}}</div>' +
        '{{view GrowCalc.NumberField valueBinding="view.content.Amount" size="2" classNames="with-button"}}' +
        '<button class="btn action action-delete" {{action "Delete" target on="click"}} title="Удаление"><i class="icon-remove"></i></button>'
      ),
      Delete: function () {
        this.content.Host.RemoveElement(this.content.Element, true);
      }
    }),
  });

  GrowCalc.NewElementNutritionElementView = Ember.View.extend({
    Amount: 1,
    Host: undefined,
    ElementSymbol: "",
    //tagName: 'li',
    template: Ember.Handlebars.compile('{{view JQ.AutoComplete minLength="0" valueBinding="view.ElementSymbol" sourceBinding="view.ElementAutocomplete" selectBinding="view.ElementSelected" classNames="with-button"}}' +
      '<button class="btn action action-clear with-button" {{action "Clear" target on="click"}} title="Очистить"><span class="ui-icon ui-icon-close"></span></button>' +
      '<button class="btn action action-dropdown with-button" {{action "Dropdown" target on="click"}} title="Выберите..."><span class="ui-icon ui-icon-triangle-1-s"></span></button>' +
      '<button class="btn action action-create" {{action "Create" target on="click"}}><span class="ui-icon ui-icon-plus"></span></button>'),
    Dropdown: function () {
      this.get('childViews')[0].Search(this.get('ElementSymbol'));
    },
    Clear: function () {
      this.set('ElementSymbol', '');
    },
    Create: function () {
      var that = this,
        Element = GrowCalc.GetElementBySymbol(that.get('ElementSymbol'));
      if (Element) {
        if (typeof this.get('Host.Elements').findProperty('Element', Element) === 'undefined') {
          that.get('Host').AddElement(Element, that.get('Amount'), true);
        } else {
          alert('Элемент уже содержится.');
        }
      } else {
        alert('Неправильный ввод.');
      }
    },
    ElementSelected: function (e, ui) {
      var that = this._context.content.editorDialog.get('childViews')[0];
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

  GrowCalc.ElementNutritionEditorDialog = JQ.Dialog.extend({
    classNames: ['element-nutrition-editor-dialog'],
    width: 560,
    minWidth: 350,
    content: null,
    title: "",
    template: Ember.Handlebars.compile(
      '<div><label>Наименование</label>{{view Ember.TextField valueBinding="view.content.Name"}}</div>' +
      '{{view GrowCalc.NewElementNutritionElementView HostBinding="view.content"}}' +
      '<div class="graph">' +
        '{{view GrowCalc.ElementNutritionElementsView contentBinding="view.content.Elements"}}' +
        '<div class="legend">' +
          '{{view GrowCalc.ElementNutritionLegendView contentBinding="view.content.Elements"}}' +
        '</div>' +
      '</div>'
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
      this.set('title', 'Питание "' + this.content.get('Name') + '"');
      this._super();
    },
    Validate: function () {
      var retValue = true;
      var node = this.content;

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
      var node = this.content;
      node.DestroyEditorForm();
      node.Rollback();
    },
    close: function(event, ui) {
      var that = Ember.View.views[$(this).attr('id')],
        node;
      if ((typeof event !== 'undefined') && (typeof event.cancelable !== 'undefined') && (event.cancelable)) {
        that.RollbackAndClose();
      }
    }
  });

  GrowCalc.ElementNutritionDeleteView = JQ.Dialog.extend({
    classNames: ['element-nutrition-delete-dialog'],
    width: 300,
    minWidth: 300,
    content: null,
    title: "Удалить питание?",
    template: Ember.Handlebars.compile('<p>Вы действительно хотите удалить питание "{{Name}}"?</p>'),
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

  GrowCalc.ElementNutritionEditorView = Ember.View.extend({
    classNames: ['element-nutrition-editor-view'],
    content: null,
    template: Ember.Handlebars.compile(
      '<div><label>Наименование</label>{{view Ember.TextField valueBinding="view.content.Name"}}</div>' +
      '{{view GrowCalc.NewElementNutritionElementView HostBinding="view.content"}}' +
      '<div class="graph">' +
        '{{view GrowCalc.ElementNutritionElementsView contentBinding="view.content.Elements"}}' +
        '<div class="legend">' +
          '{{view GrowCalc.ElementNutritionLegendView contentBinding="view.content.Elements"}}' +
        '</div>' +
      '</div>'),
  });


  GrowCalc.ElementNutritionEditorDialog = JQ.Dialog.extend({
    width: 600,
    minWidth: 400,
    title: "",

    classNames: ['element-nutrition-editor-dialog'],
    content: null,
    template: Ember.Handlebars.compile(
      '{{view Ember.ContainerView currentViewBinding="view.content.editorView"}}'
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
        elnut = that.content;
      that.set('title', 'Программа питания (элементы) "' + elnut.get('Name') + '"');
      that._super();
    },
    Validate: function () {
      var retValue = true;
      var elnut = this.content;

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

  // Массив _всех_ программ питания, доступных пользователю.
  GrowCalc.ElementNutritions = [];

  GrowCalc.GetElementNutritionsBy = function (field, value, regexp) {
    if (typeof regexp === 'undefined') regexp = false;
    regexp = regexp && new RegExp(value);

    return GrowCalc.ElementNutritions.filter(function(item, index, self) {
      if (regexp) {
        return regexp.test(item.get(field));
      } else {
        return (item.get(field) == value);
      }
    });
  };

  GrowCalc.GetElementNutritionById = function (value) {
    return GrowCalc.GetElementNutritionsBy('Id', value)[0];
  };

  GrowCalc.GetElementNutritionByName = function (value) {
    return GrowCalc.GetElementNutritionsBy('Name', value)[0];
  };


  GrowCalc.AddElementNutrition = function(values) {
    var elnut = GrowCalc.GetElementNutritionById(values['Id']);
    if (!elnut) {
      var elements = values.Elements;
      values.Elements = [];
      values['_defaults'] = $.extend({}, values);
      values['_defaults'].Elements = [];

      elnut = GrowCalc.ElementNutrition.create(values);
      elnut.set('editorView', GrowCalc.ElementNutritionEditorView.create({ content: elnut }));

      var editorDialog = GrowCalc.ElementNutritionEditorDialog.create({ content: elnut })
      elnut.set('editorDialog', editorDialog);
      editorDialog.appendTo($('.element-nutrition-editor[data-element-nutrition="' + elnut.get('Id') + '"]'));

      GrowCalc.ElementNutritions.pushObject(elnut);

      if (typeof elements !== 'undefined') {
        elements.forEach( function (item, index, enumerable) {
          elnut.AddElement(GrowCalc.GetElementBySymbol(item.element), item.amount);
        });
      }
    }

    return elnut;
  };

  $(function() {
    var i,
      l,
      entity,
      entity_key;

    GrowCalc.elementNutritionsView = GrowCalc.ElementNutritionsView.create({}).appendTo('#calc-element-nutritions');
    if (GrowCalc.Drupal().supportLocalStorage) {
      for(i =0, l = localStorage.length; i < l; i++) {
        entity_key = localStorage.key(i);
        if (entity_key.indexOf('ElementNutrition') !== -1) {
          entity = JSON.parse(localStorage[entity_key]);
          GrowCalc.AddElementNutrition({
            Id: entity.id,
            Name: entity.name,
            Tag: entity.tag,
            Elements: entity.elements,
          });
        }
      }
    }

    if (typeof Drupal.settings.growcalc !== 'undefined') {
      if (typeof Drupal.settings.growcalc.element_nutritions !== 'undefined') {
        for(entity_key in Drupal.settings.growcalc.element_nutritions) {
          if (Drupal.settings.growcalc.element_nutritions.hasOwnProperty(entity_key)) {
            entity = Drupal.settings.growcalc.element_nutritions[entity_key];
            GrowCalc.AddElementNutrition({
              Id: entity.id,
              Name: entity.name,
              Tag: entity.tag,
              Elements: entity.elements,
            });
          }
        }
      }
    }
  });
})(jQuery, Ember, this.GrowCalc, Drupal, this, this.document);