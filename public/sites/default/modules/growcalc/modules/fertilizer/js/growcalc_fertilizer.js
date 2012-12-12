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

      // apply removed elements
      defaults.Elements.forEach(function (defaultElement, defaultsIndex, defaultElementsEnumerable) {
        if (that.get('Elements').find(function (element, elementsIndex, elementsEnumerable) { return element.Element === defaultElement.Element; }) === null) {
          delete defaults.Elements[i];
        }
      });

      that.SaveTemporaryElements();

      that.get('Elements').forEach(function (element, index, enumerable) {
        var defaultElement = defaults.Elements.find(function (defaultElement, defaultsIndex, defaultsEnumerable) { return element.Element === defaultElement.Element; });
        if (defaultElement !== null) {
          defaultElement.set('Amount', element.get('Amount'));
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


      if (!isChanged) {
        if ((that.get('Elements').length !== defaults.Elements.length) || (null !== defaults.Elements.find(function (defaultElement, defaultsIndex, defaultElementsEnumerable) {
            return (null !== that.get('Elements').find(function (element, elementsIndex, elementsEnumerable) {
              return (element.get('Element') === defaultElement.get('Element')) && (element.get('Amount') !== defaultElement.get('Amount'));
            }));
          }))) {
          isChanged = true;
        }
      }

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

      this.RemoveTemporaryElements();

      defaults.Elements.forEach(function (defaultElement, defaultsIndex, defaultsEnumerable) {
        if (null === that.get('Elements').find(function (element, elementsIndex, elementsEnumerable) {
          return (element.get('Element') === defaultElement.get('Element'));
        })) {
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
      element.view = GrowCalc.FertilizerElementView.create({ content: element });
      if (this.hasOwnProperty('editorView')) {
        this.editorView.get('FertilizerElementsView').get('childViews').pushObject(element.view);
      }
      this.get('Elements').pushObject(element);
      if (!temporary) {
        this.SetElementPermanent(element);
      }
    },
    RemoveElement: function (Element, temporary = false) {
      var defaults = this.get('_defaults'),
        element = this.get('Elements').find(function (element, elementsIndex, elementsEnumerable) {
          return (element.get('Element') === Element);
        });
      if (element !== null) {
        if (this.hasOwnProperty('editorView')) {
          this.editorView.get('FertilizerElementsView').get('childViews').removeObject(element.view);
        }
        this.get('Elements').removeObject(element);
        if (!temporary) {
          this.SetElementTemporary(element); // deletes element from defaults.
        }

        element.view.destroy();
        element.destroy();
      }
    },
    RemoveTemporaryElements: function () {
      var that = this,
        defaults = this.get('_defaults');
      this.get('Elements').forEach(function (element, elementsIndex, elementsEnumerable) {
        if (null === defaults.Elements.find(function (defaultElement, defaultsIndex, defaultsEnumerable) {
          return (element.get('Element') === defaultElement.get('Element'));
        })) {
          that.RemoveElement(element.Element, true);
        }
      });
    },
    SetElementPermanent: function(element) {
      var that = this,
        defaults = that.get('_defaults');
      if (null === defaults.Elements.find(function (defaultElement, defaultsIndex, defaultsEnumerable) {
        return (element.get('Element') === defaultElement.get('Element'));
      })) {
        defaults.Elements.pushObject(Ember.Object.create({
          'Element': element.Element, 
          'Amount': element.Amount,
        }));
      }
    },
    SetElementTemporary: function(element) {
      var that = this,
        defaults = that.get('_defaults'),
        defaultElement = defaults.Ions.find(function (defaultElement, defaultsIndex, defaultsEnumerable) {
          return (element.get('Element') === defaultElement.get('Element'));
        });
      if (null !== defaultElement) {
        defaults.Elements.removeObject(defaultElement);
        defaultElement.destroy();
      }
    },
    SaveTemporaryElements: function () {
      var that = this,
        defaults = this.get('_defaults');
      that.get('Elements').forEach(function (element, elementsIndex, elementsEnumerable) {
        if (null === defaults.Elements.find(function (defaultElement, defaultsIndex, defaultsEnumerable) {
          return (element.get('Element') === defaultElement.get('Element'));
        })) {
          that.SetElementPermanent(element);
        }
      });
    },
    ListElements: function () {
      var totalElements = {};

      this.get('Elements').forEach(function (element, elementsIndex, elementsEnumerable) {
        var list = element.get('Element').ListElements();
        for(var i in list) {
          if (list.hasOwnProperty(i)) {
            if (typeof totalElements[list[i].get('Element').get('Symbol')] !== 'undefined') {
              totalElements[list[i].get('Element').get('Symbol')].set('Amount', totalElements[list[i].get('Element').get('Symbol')].get('Amount') + element.get('Amount') * list[i].get('Amount'));
            } else {
              totalElements[list[i].get('Element').get('Symbol')] = {
                Element: list[i].get('Element'),
                Amount: element.get('Amount') * list[i].get('Amount'),
              };
            }
          }
        }
      });

      if (this.get('Elements').length === 0) {
        totalElements[this.Symbol] = {
          Element: this,
          Amount: 1,
        };
      }

      return totalElements;
    }
  });

  GrowCalc.FertilizersView = Ember.CollectionView.extend({
    tagName: 'ul',
    classNames: ['nav', 'nav-list', 'nav-fertilizers'],
    contentBinding: 'GrowCalc.Fertilizers',
    itemViewClass: Ember.View.extend({
      tagName: 'li',
      content: null,
      contextBinding: 'content',
      template: Ember.Handlebars.compile(
        '{{Name}} {{Description}} {{Tag}}' +
        '<button class="action action-edit" {{action "ShowEditorForm" target on="click"}} title="Редактирование"><span class="ui-icon ui-icon-wrench"></span></button>'
      ),
      doubleClick: function () {
        this.content.ShowEditorForm(); 
      },
      ShowEditorForm: function () {
        this.content.ShowEditorForm(); 
      },
      didInsertElement:function (){
        this._super();
        $("button", this.$()).button();
      },
    }),
    didInsertElement:function (){
      this._super();
      $(".block-growcalc-fertilizer .filter").listFilter(this.$());
    },
  });

  GrowCalc.FertilizerElementView = Ember.View.extend({
    content: null,
    template: Ember.Handlebars.compile('<li>{{view.content.Element.Symbol}} {{view GrowCalc.NumberField valueBinding="view.content.Amount"}}<button class="action action-delete" {{action "Delete" target on="click"}} title="Удаление"><span class="ui-icon ui-icon-close"></span></button></li>'),
    Delete: function () {
      this.content.Host.RemoveElement(this.content.Element, true);
    }
  });

  GrowCalc.NewFertilizerElementView = Ember.View.extend({
    Amount: 0,
    Host: undefined,
    ElementSymbol: "",
    template: Ember.Handlebars.compile('<li>{{view JQ.AutoComplete valueBinding="view.ElementSymbol" sourceBinding="view.ElementAutocomplete" selectBinding="view.ElementSelected"}}<a {{action "Create" target on="click"}}>Добавить</a></li>'),
    Create: function () {
      var that = this,
        Element = GrowCalc.GetElementBySymbol(that.get('ElementSymbol'));
      if (Element) {
        if (typeof this.get('Host.Elements').find(function (element, index, enumerable) {
          return (element.get('Element') === Element);
        }) === 'undefined') {
          that.get('Host').AddElement(Element, that.get('Amount'), true);
        } else {
          alert('Элемент уже содержится.');
        }
      } else {
        alert('Неправильный ввод.');
      }
    },
    ElementSelected: function (e, ui) {
      var that = this._context.content.editorView.get('FertilizerElementsView.childViews')[0];
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
    }
  });


  GrowCalc.FertilizerElementsView = Ember.ContainerView.extend({
    childViews: [],
  });

  GrowCalc.FertilizerEditorView = JQ.Dialog.extend({
    classNames: ['fertilizer-editor-dialog'],
    width: 400,
    minWidth: 400,
    content: null,
    title: "",
    FertilizerElementsView: null,
    template: Ember.Handlebars.compile(
      '<table class="table">' +
        '<tr>' +
          '<td><label>Наименование</label>{{view Ember.TextField valueBinding="view.content.Name"}}</td>' +
          '<td><label>Описание</label>{{view Ember.TextField valueBinding="view.content.Description"}}</td>' +
        '</tr>' +
      '</table>' + 
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

      that.set('FertilizerElementsView', GrowCalc.FertilizerElementsView.create());
      that.set('title', 'Удобрение "' + fertilizer.get('Name') + '"');
      that._super();
      $("button", that.$()).button();

      var newFertilizerElementView = GrowCalc.NewFertilizerElementView.create({ Host: fertilizer });
      that.get('FertilizerElementsView').get('childViews').pushObject(newFertilizerElementView);
      fertilizer.get('Elements').forEach(function (element, index, enumerable) {
        that.get('FertilizerElementsView').get('childViews').pushObject(element.view);
      });
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

    GrowCalc.fertilizersView = GrowCalc.FertilizersView.create({});
    GrowCalc.fertilizersView.appendTo($('#calc-fertilizers'));

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