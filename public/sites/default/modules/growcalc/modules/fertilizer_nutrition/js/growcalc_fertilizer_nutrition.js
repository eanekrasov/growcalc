/*jslint browser: true, indent: 2, plusplus: false */

(function ($, Ember, GrowCalc, Drupal, window, document, undefined) {
  "use strict";

  GrowCalc.FertilizerNutrition = Ember.Object.extend(GrowCalc.DrupalSavable, {
    Type: 'fertilizer_nutrition',

    '_defaults': {
      Id: 0,
      Name: "",
      Tag: "",
      Fertilizers: [],
      Elements: [],
    },
    Id: 0,
    Name: "",
    Tag: "",
    Fertilizers: [],
    Elements: [],
    /**
     * FertilizerNutrition.UpdateDefaults().
     *
     * Обновление значений по-умолчанию.
     */
    UpdateDefaults: function () {
      var that = this,
        defaults = that.get('_defaults'),
        i;

      for(i in defaults) {
        if ((i !== 'Fertilizers') && (i !== 'Elements')) {
          defaults[i] = that.get(i);
        }
      }

      // apply removed fertilizers
      defaults.Fertilizers.forEach(function (defaultFertilizer, defaultsIndex, defaultFertilizersEnumerable) {
        var fertilier = that.get('Fertilizers').findProperty('Fertilizer', defaultFertilizer.Fertilizer);
        if (typeof fertilizer === 'undefined') {
          defaults.Fertilizers.removeObject(fertilier);
        }
      });

      that.SaveTemporaryFertilizers();

      that.get('Fertilizers').forEach(function (fertilizer, index, enumerable) {
        var defaultFertilizer = defaults.Fertilizers.findProperty('Fertilizer', fertilizer.get('Fertilizer'));
        if (typeof defaultFertilizer !== 'undefined') {
          defaultFertilizer.set('Amount', fertilizer.get('Amount'));
        }
      });

      // apply removed elements
      defaults.Elements.forEach(function (defaultElement, defaultsIndex, defaultElementsEnumerable) {
        var element = that.get('Elements').findProperty('Element', defaultElement.Element);
        if (typeof element === 'undefined') {
          defaults.Elements.removeObject(element);
        }
      });

      that.SaveTemporaryFertilizers();

      that.get('Elements').forEach(function (element, index, enumerable) {
        var defaultElement = defaults.Elements.findProperty('Element', element.get('Element'));
        if (typeof defaultElement !== 'undefined') {
          defaultElement.set('Amount', element.get('Amount'));
          defaultElement.set('backgroundAmount', element.get('backgroundAmount'));
        }
      });

    },
    /**
     * FertilizerNutrition.PrepareData().
     *
     * Prepares data for saving.
     */
    PrepareData: function () {
      var that = this;
      return {
        id: that.get('Id'),
        name: that.get('Name'),
        tag: that.get('Tag'),
        fertilizers: that.get('Fertilizers').map(function (fertilizer) {
          return {
            fertilizer: fertilizer.Fertilizer.Name,
            amount: fertilizer.Amount
          };
        }),
        elements: that.get('Elements').map(function (element) {
          if (element.backgroundAmount != 0) {
            return {
              element: element.Element.Symbol,
              amount: element.backgroundAmount
            };
          }
        }),
      };
    },
    /**
     * FertilizerNutrition.Commit().
     *
     * Сохранение изменений в модели.
     */
    Commit: function () {
      this.UpdateDefaults();
      this.SaveToServer();
    },

    /**
     * FertilizerNutrition.Changed().
     *
     * Возвращает Boolean значение.
     * TRUE - поля модели были изменены, модель не сохранена.
     * FALSE - иначе.
     */
    Changed: function () {
      var isChanged = false,
        defaults = this.get('_defaults'),
        that = this,
        k;
      for (k in defaults) {
        if ((k !== 'Fertilizers') && (k !== 'Elements')) {
          if (defaults[k] !== this.get(k)) {
            isChanged = true;
            break;
          }
        }
      }

      if (!isChanged) {
        if ((that.get('Fertilizers').length !== defaults.Fertilizers.length) || (typeof defaults.Fertilizers.find(function (defaultFertilizer, defaultsIndex, defaultFertilizersEnumerable) {
          var fertilizer = that.get('Fertilizers').findProperty('Fertilizer', defaultFertilizer.get('Fertilizer'));
          return (typeof fertilizer !== 'undefined') && (fertilizer.get('Amount') !== defaultFertilizer.get('Amount'));
        }) !=='undefined')) {
          isChanged = true;
        }
      }

      if (!isChanged) {
        if ((that.get('Elements').length !== defaults.Elements.length) || (typeof defaults.Elements.find(function (defaultElement, defaultsIndex, defaultElementsEnumerable) {
          var element = that.get('Elements').findProperty('Element', defaultElement.get('Element'));
          return (typeof element !== 'undefined') && (element.get('backgroundAmount') !== defaultElement.get('backgroundAmount'));
        }) !=='undefined')) {
          isChanged = true;
        }
      }

      return isChanged;
    },
    /**
     * FertilizerNutrition.SaveToServer().
     *
     * Сохранение модели в друпале.
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
     * FertilizerNutrition.Delete().
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
     * FertilizerNutrition.Destroy().
     *
     * Удаление из фронтенда.
     */
    Destroy: function () {
      this.CloseDialogs();
      GrowCalc.FertilizerNutritions.removeObject(this);
    },
    /**
     * FertilizerNutrition.Rollback().
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
        if ((i !== 'Fertilizers') && (i !== 'Elements')) {
          this.set(i, defaults[i]);
        }
      }

      this.RemoveTemporaryElements();

      defaults.Elements.forEach(function (defaultElement, defaultsIndex, defaultsEnumerable) {
        var element = that.get('Elements').findProperty('Element', defaultElement.get('Element'))
        if (typeof element === 'undefined') {
          that.AddElement(defaultElement.Element, defaultElement.Amount, defaultElement.backgroundAmount);
        }
      });

      defaults.Elements.forEach(function (defaultElement, defaultsIndex, defaultsEnumerable) {
        var element = that.get('Elements').findProperty('Element', defaultElement.get('Element'));
        if (typeof element !== 'undefined') {
          element.set('backgroundAmount', defaultElement.get('backgroundAmount'));  
        }
      });

      this.RemoveTemporaryFertilizers();

      defaults.Fertilizers.forEach(function (defaultFertilizer, defaultsIndex, defaultsEnumerable) {
        var fertilizer = that.get('Fertilizers').findProperty('Fertilizer', defaultFertilizer.get('Fertilizer'));
        if (typeof fertilizer === 'undefined') {
          that.AddFertilizer(defaultFertilizer.Fertilizer, defaultFertilizer.Amount);
        }
      });

      defaults.Fertilizers.forEach(function (defaultFertilizer, defaultsIndex, defaultsEnumerable) {
        var fertilizer = that.get('Fertilizers').findProperty('Fertilizer', defaultFertilizer.get('Fertilizer'));
        if (typeof fertilizer !== 'undefined') {
          fertilizer.set('Amount', defaultFertilizer.get('Amount'));  
        }
      });
    },
    /**
     * FertilizerNutrition.DestroyEditor().
     *
     * Удалить форму редактирования питания.
     */
    DestroyEditor: function () {
      var that = this;
      if (typeof that.editorView !== 'undefined') {
        that.editorView.remove();
        that.editorView.destroy();
      }
    },
    /**
     * FertilizerNutrition.AddFertilizer(Fertilizer, Amount, temporary = false).
     *
     * Добавление удобрения в питание.
     * Fertilizer - ссылка на удобрение, например из GrowCalc.GetFertilizerById(id).
     * Для восстановления используется (Array)this.get('_defaults');
     */
    AddFertilizer: function (Fertilizer, Amount, temporary) {
      temporary = temporary || false;
      var that = this,
        fertilizer = Ember.Object.create({
          'Fertilizer': Fertilizer,
          'Amount': parseFloat(Amount),
          'Host': that,
          'AmountChanged': function () {
            var list = that.CalcElements();
            list.forEach(function (el_key) {
              var el = that.Elements.findProperty('Element', el_key.Element);
              if (el) {
                el.set('Amount', parseFloat(el_key.Amount.toFixed(2)));
              }
            });
            that.FertilizerAmountChanged(this);
          }.observes('Amount'),
        });
      that.get('Fertilizers').pushObject(fertilizer);
      if (!temporary) {
        that.SetFertilizerPermanent(fertilizer);
      }

      var list = Fertilizer.ListElements();
      list.forEach(function (el_key) {
        that.AddElement(el_key.Element, el_key.Amount, 0);
      });

      fertilizer.AmountChanged();
    },
    /**
     * FertilizerNutrition.RemoveFertilizer(Fertilizer, temporary = false).
     *
     * Fertilizer - ссылка на удобрение, например из GrowCalc.GetFertilizerById(id).
     */
    RemoveFertilizer: function (Fertilizer, temporary) {
      temporary = temporary || false;
      var that = this,
        defaults = that.get('_defaults'),
        fertilizer =  that.get('Fertilizers').findProperty('Fertilizer', Fertilizer),
        list;
      if (typeof fertilizer !== 'undefined') {
        list = fertilizer.Fertilizer.ListElements()
        list.forEach(function (el_key) {
          that.RemoveElement(el_key.Element, el_key.Amount);
        });
        if (!temporary) {
          that.SetFertilizerTemporary(fertilizer);
        }
        fertilizer.destroy();
        that.get('Fertilizers').removeObject(fertilizer);
      }
    },
    RemoveTemporaryFertilizers: function () {
      var that = this,
        defaults = this.get('_defaults');
      this.get('Fertilizers').forEach(function (fertilizer, fertilizersIndex, fertilizersEnumerable) {
        if ('undefined' === typeof defaults.Fertilizers.findProperty('Fertilizer', fertilizer.get('Fertilizer'))) {
          that.RemoveFertilizer(fertilizer.Fertilizer, true);
        }
      });
    },
    SetFertilizerPermanent: function(fertilizer) {
      var that = this,
        defaults = that.get('_defaults');
      if ('undefined' === typeof defaults.Fertilizers.findProperty('Fertilizer', fertilizer.get('Fertilizer'))) {
        defaults.Fertilizers.pushObject(Ember.Object.create({
          'Fertilizer': fertilizer.get('Fertilizer'), 
          'Amount': fertilizer.get('Amount'),
        }));
      }
    },
    SetFertilizerTemporary: function(fertilizer) {
      var that = this,
        defaults = that.get('_defaults'),
        defaultFertilizer = defaults.Fertilizers.findProperty('Fertilizer', fertilizer.get('Fertilizer'));
      if (null !== defaultFertilizer) {
        defaults.Fertilizers.removeObject(defaultFertilizer);
        defaultFertilizer.destroy();
      }
    },
    SaveTemporaryFertilizers: function () {
      var that = this,
        defaults = this.get('_defaults');
      that.get('Fertilizers').forEach(function (fertilizer, fertilizersIndex, fertilizersEnumerable) {
        if ('undefined' === typeof defaults.Fertilizers.findProperty('Fertilizer', fertilizer.get('Fertilizer'))) {
          that.SetFertilizerPermanent(fertilizer);
        }
      });
    },
    /**
     * FertilizerNutrition.AddElement(Fertilizer, Amount).
     *
     * Добавление элемента в питание.
     * Element - ссылка на элемент, например из GrowCalc.GetElementById(id).
     */
    AddElement: function (Element, Amount, backgroundAmount, temporary) {
      temporary = temporary || false;
      var backgroundValue = arguments.length < 3 ? 0 : parseFloat(backgroundAmount);
      Element = (typeof Element === "string") ? GrowCalc.GetElementBySymbol(Element) : Element;
      var that = this,
        element = this.get('Elements').findProperty('Element', Element);
      if (Element.get('Visible')) {
        if (element) {
          element.set('Hosts', element.get('Hosts') + 1);
          element.set('Amount', parseFloat(element.get('Amount')) + parseFloat(Amount));
          if (backgroundValue !== 0) {
            element.set('backgroundAmount', parseFloat(element.get('backgroundAmount')) + backgroundValue);
          }
        } else {
          element = Ember.Object.create({
            'Element': Element,
            'Amount': parseFloat(Amount),
            'backgroundAmount': backgroundValue,
            'Host': that,
            'Hosts': 1,
            'AmountChanged': function () {
              that.ElementAmountChanged(this);
            }.observes('Amount'),
            'backgroundAmountChanged': function () {
              that.ElementBackgroundAmountChanged(this);
            }.observes('backgroundAmount'),
          });
          that.get('Elements').pushObject(element);
          if (!temporary) {
            that.SetElementPermanent(element);
          }
        }
      }
    },
    /**
     * FertilizerNutrition.RemoveElement(Element, Amount).
     *
     * Удаление элемента в питание.
     * Element - ссылка на элемент, например из GrowCalc.GetElementById(id).
     */
    RemoveElement: function (Element, Amount, backgroundAmount) {
      var backgroundValue = arguments.length < 3 ? 0 : parseFloat(backgroundAmount);
      var that = this,
        element = this.get('Elements').findProperty('Element', Element);
      if (typeof element !== 'undefined') {
        if ((element.get('Hosts') > 1) || (element.get('backgroundAmount') > 0)) {
          if ((element.get('Hosts') > 1)) {
            element.set('Hosts', element.get('Hosts') - 1);
          }
          element.set('Amount', element.get('Amount') - parseFloat(Amount));
          if (backgroundValue !== 0) {
            element.set('backgroundAmount', element.get('backgroundAmount') - backgroundValue);
          }
        } else {
          this.get('Elements').removeObject(element);
          element.destroy();
        }
      }
    },
    RemoveTemporaryElements: function () {
      var that = this,
        defaults = this.get('_defaults');
      this.get('Elements').forEach(function (element, elementsIndex, elementsEnumerable) {
        if ('undefined' === typeof defaults.Elements.findProperty('Element', element.get('Element'))) {
          that.RemoveElement(element.Element, true);
        }
      });
    },
    SetElementPermanent: function(element) {
      var that = this,
        defaults = that.get('_defaults');
      if ('undefined' === typeof defaults.Elements.findProperty('Element', element.get('Element'))) {
        defaults.Elements.pushObject(Ember.Object.create({
          'Element': element.get('Element'), 
          'Amount': element.get('Amount'),
          'backgroundAmount': element.get('backgroundAmount'),
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
        if ('undefined' === typeof defaults.Elements.findProperty('Element', element.get('Element'))) {
          that.SetElementPermanent(element);
        }
      });
    },
    CalcElements: function () {
      var Fertilizers = this.get('Fertilizers'),
        j,
        list,
        total = [];

      this.get('Fertilizers').forEach(function (fertilizer, fertilizersIndex, fertilizersEnumerable) {
        list = fertilizer.Fertilizer.ListElements();
        list.forEach(function (el_key) {
          var el = total.findProperty('Element', el_key.Element);
          if (el != undefined) {
            el.Amount += el_key.Amount * fertilizer.Amount;
          } else {
            total.pushObject({
              Element: el_key.Element,
              Amount: el_key.Amount * fertilizer.Amount,
            });
          }
        });
      });
      return total;
    },
    Calc: function () {
      var elements = this.get('Elements').filter(function (item) {
          return item.get('backgroundAmount') !== 0;
        }).mapProperty('Element.Symbol'),
        A = $M(this.get('Fertilizers').map(function (f) {
          var list = f.Fertilizer.ListElements();
          return elements.map(function (symbol) {
            var el = list.findProperty('Element.Symbol', symbol);
            return (el != undefined) ? el.Amount : 0;
          });
        })).transpose(),
        At = A.transpose(),
        b = $V(this.get('Elements').filter(function (item) {
          return item.get('backgroundAmount') !== 0;
        }).mapProperty('backgroundAmount')),
        x = At.x(A).inv().x(At).x(b),
        i = 1;
      this.get('Fertilizers').forEach(function (f) {
        var value = parseFloat(x.e(i, 1).toFixed(2));
        if (value < 0) {
          value = 0;
        }
        f.set('Amount', value);
        i = i + 1;
      });
    },
    MaxFertilizerAmount: function () {
      var max = this.get('MaxFertilizerValue');
      return Math.floor(max + 1);
    }.property('MaxFertilizerValue'),
    MaxFertilizerValue: 200,
    FertilizerAmountChanged: function (fertilizer) {
      var value = fertilizer.get('Amount'),
        max = this.get('MaxFertilizerValue');
      if (max < value) {
        this.set('MaxFertilizerValue', value);
      }
    },
    MaxElementAmount: function () {
      var max = this.get('MaxElementValue');
      this.get('Elements').forEach(function (f) {
        max = (max > f.get('Amount')) ? max : f.get('Amount');
        max = (max > f.get('backgroundAmount')) ? max : f.get('backgroundAmount');
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
    ElementBackgroundAmountChanged: function (element) {
      var value = element.get('BackgroundAmount'),
        max = this.get('MaxElementValue');
      if (max < value) {
        this.set('MaxElementValue', value);
      }
    },
  });

  GrowCalc.FertilizerNutritionFertilizersView = Ember.CollectionView.extend({
    classNames: ['fertilizer-nutrition-fertilizers'],
    tagName: 'ul',
    itemViewClass: Ember.View.extend({
      tagName: 'li',
      content: null,
      contextBinding: 'content',
      FertilizerNameBinding: 'content.Fertilizer.Name',
      template: Ember.Handlebars.compile(
        '{{view GrowCalc.ScrollView titleBinding="view.FertilizerName" maxBinding="view.content.Host.MaxFertilizerAmount" valueBinding="view.content.Amount" backgroundValueVisible="false" classNames="with-button"}}' +
        '{{view GrowCalc.NumberField valueBinding="view.content.Amount" classNames="with-button with-suffix"}}' +
        '<button class="btn action action-delete with-button" {{action "Delete" target on="click"}} title="Удаление"><i class="icon-remove"></i></button>{{view GrowCalc.NumberField valueBinding="view.VolumeAmount"}} мг/объём'
      ),
      VolumeAmount: function () {
        var amount = parseFloat(this.get('content.Amount')),
          volume = GrowCalc.get('Volume');
        return (amount * volume).toFixed(0);
      }.property('content.Amount', 'GrowCalc.Volume'),
      Delete: function () {
        this.content.Host.RemoveFertilizer(this.content.Fertilizer, true);
      },

    }),
  });

  GrowCalc.FertilizerNutritionElementsView = Ember.CollectionView.extend({
    classNames: ['fertilizer-nutrition-elements', 'clearfix', 'data'],
    tagName: 'ul',
    itemViewClass: Ember.View.extend({
      tagName: 'li',
      content: null,
      contextBinding: 'content',
      template: Ember.Handlebars.compile(
        '<div class="symbol">{{Element.Symbol}}</div>' +
        //'{{view GrowCalc.NumberField valueBinding="view.content.Amount"}} мг/л' +
        '{{view GrowCalc.ScrollView' +
          ' maxBinding="view.content.Host.MaxElementAmount"' +
          ' valueBinding="view.content.Amount"' +
          ' colorBinding="view.content.Element.Color"' +
          ' backgroundValueBinding="view.content.backgroundAmount"' +
          ' backgroundValueVisible="true"' +
          ' orientation="vertical"' +
          ' precision="0"' +
          ' reversed="true"' +
          ' enabled="false"' +
        '}}'
      ),
    }),
  });

  GrowCalc.FertilizerNutritionLegendView = Ember.CollectionView.extend({
    classNames: ['fertilizer-nutrition-legend'],
    tagName: 'ul',
    itemViewClass: Ember.View.extend({
      tagName: 'li',
      content: null,
      contextBinding: 'content',
      template: Ember.Handlebars.compile(
        '<div class="symbol">{{Element.Symbol}}</div>' +
        '{{view GrowCalc.NumberField valueBinding="view.content.Amount" size="2" classNames="with-button"}}' +
        '{{view GrowCalc.NumberField valueBinding="view.content.backgroundAmount" size="2"}}'
      ),
    }),
  });

  GrowCalc.FertilizerNutritionNutritionView = Ember.CollectionView.extend({
    classNames: ['fertilizer-nutrition-elements', 'clearfix'],
    tagName: 'ul',
    itemViewClass: Ember.View.extend({
      tagName: 'li',
      content: null,
      ElementSymbolBinding: 'content.Element.Symbol',
      contextBinding: 'content',
      template: Ember.Handlebars.compile(
        '<!--div class="symbol">{{Element.Symbol}} (мг/л)</div-->' +
        '{{view' +
          ' GrowCalc.ScrollView maxBinding="view.content.Host.MaxElementAmount"' +
          ' valueBinding="view.content.backgroundAmount"' +
          ' colorBinding="view.content.Element.Color"' +
          ' backgroundValueVisible="false"' +
          ' precision="0"' +
          ' classNames="with-button"' +
          ' titleBinding="view.ElementSymbol"' +
        '}}' +
        '{{view GrowCalc.NumberField valueBinding="view.content.backgroundAmount"}}'
      ),
    }),
  });

  GrowCalc.FertilizerNutritionNewElementView = Ember.View.extend({
    Amount: 1,
    Host: undefined,
    ElementSymbol: "",
    //tagName: 'li',
    template: Ember.Handlebars.compile('{{view JQ.AutoComplete minLength="0" valueBinding="view.ElementSymbol" sourceBinding="view.ElementAutocomplete" selectBinding="view.ElementSelected" classNames="with-button"}}' +
      '<button class="btn action action-clear with-button" {{action "Clear" target on="click"}} title="Очистить"><i class="icon-remove"></i></button>' +
      '<button class="btn action action-dropdown with-button" {{action "Dropdown" target on="click"}} title="Выберите..."><i class="icon-chevron-down"></i></button>' +
      '<button class="btn action action-create" {{action "Create" target on="click"}}><i class="icon-plus"></i></button>'),
    
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
          that.get('Host').AddElement(Element, 0, that.get('Amount'), true);
        } else {
          alert('Элемент уже содержится.');
        }
      } else {
        alert('Неправильный ввод.');
      }
    },
    ElementSelected: function (e, ui) {
      var that = this._context.content.editorView.get('FertilizerNutritionSettingsDialog.FertilizerNutritionNewElementView');
      that.set('ElementSymbol', ui.item.value);
    },
    ElementAutocomplete: function(request, response) {
      var ret = [];
      GrowCalc.Elements.forEach(function (element, index) {
        if ((request.term.length == 0) || (element.get('Symbol').indexOf(request.term) !== -1) || (element.get('Description').indexOf(request.term) !== -1)) {
          if (element.get('Visible')) {
            ret.pushObject({
              label: element.get('Description'),
              value: element.get('Symbol'),
            });
          }
        }
      });

      response(ret);
    },
  });

  GrowCalc.FertilizerNutritionSettingsDialog = JQ.Dialog.extend({
    classNames: ['fertilizer-nutrition-settings-dialog'],
    width: 435,
    minWidth: 435,
    content: null,
    title: "",
    FertilizerNutritionNewElementView: null,
    FertilizerNutritionNutritionView: null,
    template: Ember.Handlebars.compile(
      '<label>Максимум шкалы удобрений:</label>' +
      '{{view GrowCalc.NumberField valueBinding="view.content.MaxFertilizerValue"}}' +
      '<label>Максимум шкалы элементов:</label>' +
      '{{view GrowCalc.NumberField valueBinding="view.content.MaxElementValue"}}' +
      '<label>Программа питания:</label>' +
      '{{view Ember.ContainerView currentViewBinding="view.FertilizerNutritionNewElementView"}}' +
      '{{view Ember.ContainerView currentViewBinding="view.FertilizerNutritionNutritionView"}}'
    ),
    buttons: {
      'Закрыть': function () {
        var that = Ember.View.views[$(this).attr('id')];
        that.CloseDialog();
      },
    },
    didInsertElement: function() {
      var that = this;
      that.set('title', 'TODO: Дополнительные штуки');
      that._super();
      that.set('FertilizerNutritionNutritionView', GrowCalc.FertilizerNutritionNutritionView.create({content: that.content.get('Elements')}));
      that.set('FertilizerNutritionNewElementView', GrowCalc.FertilizerNutritionNewElementView.create({Host: that.content}));
    },
    Validate: function () {
      var retValue = true;
      //if ( something ) {
      //  alert("problem");
      //  retValue = false;
      //}
      return retValue;
    },
  });

  GrowCalc.NewFertilizerNutritionFertilizerView = Ember.View.extend({
    Amount: 1,
    FertilizerName: "",
    Host: undefined,
    //tagName: 'li',
    template: Ember.Handlebars.compile('{{view JQ.AutoComplete minLength="0" valueBinding="view.FertilizerName" sourceBinding="view.FertilizerAutocomplete" selectBinding="view.FertilizerSelected" classNames="with-button"}}' +
      '<button class="btn action action-clear with-button" {{action "Clear" target on="click"}} title="Очистить"><i class="icon-remove"></i></button>' +
      '<button class="btn action action-dropdown with-button" {{action "Dropdown" target on="click"}} title="Выберите..."><i class="icon-chevron-down"></i></button>' +
      '<button class="btn action action-add" {{action "Create" target on="click"}} title="Добавить"><i class="icon-plus"></i></button>'),
    Dropdown: function () {
      this.get('childViews')[0].Search(this.get('FertilizerName'));
    },
    Clear: function () {
      this.set('FertilizerName', '');
    },
    Create: function () {
      var that = this,
        Fertilizer = GrowCalc.GetFertilizerByName(that.get('FertilizerName'));
      if (Fertilizer) {
        if (typeof this.get('Host.Fertilizers').find(function (fertilizer, index, enumerable) {
          return (fertilizer.get('Fertilizer') === Fertilizer);
        }) === 'undefined') {
          that.get('Host').AddFertilizer(Fertilizer, that.get('Amount'), true);
        } else {
          alert('Удобрение уже содержится.');
        }
      } else {
        alert('Неправильный ввод.');
      }
    },
    FertilizerSelected: function (e, ui) {
      var that = this._context.content.editorView.get('childViews')[1];
      that.set('FertilizerName', ui.item.value);
    },
    FertilizerAutocomplete: function(request, response) {
      var ret = [];
      GrowCalc.Fertilizers.forEach(function (fertilizer, index) {
        if (
          (request.term.length == 0) ||
          ((fertilizer.get('Name') != undefined) && (fertilizer.get('Name').indexOf(request.term) !== -1)) ||
          ((fertilizer.get('Description') != undefined) && (fertilizer.get('Description').indexOf(request.term) !== -1))
        ) {
          ret.pushObject({
            label: fertilizer.get('Description'),
            value: fertilizer.get('Name'),
          });
        }
      });

      response(ret);
    }
  });

  GrowCalc.FertilizerNutritionEditorView = Ember.View.extend({
    classNames: ['fertilizer-nutrition-editor-dialog'],
    content: null,
    FertilizerNutritionSettingsDialog: null,
    template: Ember.Handlebars.compile(
      //'<div><label>Наименование</label>{{view Ember.TextField valueBinding="view.content.Name"}}</div>' +
      '<label>Объём</label>' +
      '<div class="volume">{{view GrowCalc.ScrollView max="100" valueBinding="GrowCalc.Volume" min="0" precision="0" backgroundValueVisible="false" classNames="with-button"}}' +
      '{{view GrowCalc.NumberField valueBinding="GrowCalc.Volume"}}</div>' +

      '<div><label>Элементы</label></div>' +
      '<div class="graph">' +
        '{{view GrowCalc.FertilizerNutritionElementsView contentBinding="view.content.Elements"}}' +
        '<div class="legend">' +
          '<div>Расчёт / Питание (мг/л)</div>'+ 
          '{{view GrowCalc.FertilizerNutritionLegendView contentBinding="view.content.Elements"}}' +
        '</div>' +
      '</div>' +
      '<div><label>Удобрения</label></div>' +
      '{{view GrowCalc.NewFertilizerNutritionFertilizerView HostBinding="view.content"}}' +
      '{{view GrowCalc.FertilizerNutritionFertilizersView contentBinding="view.content.Fertilizers"}}' +
      '<button class="btn action action-commit" {{action "Commit" target on="click"}} title="Сохранить">Сохранить</button>' +
      '<button class="btn action action-calc" {{action "Calc" target on="click"}} title="Расчитать">Расчёт</button>' +
      '<button class="btn action action-rollback" {{action "Rollback" target on="click"}} title="Отменить">Отменить</button>' +
      '<button class="btn action action-settings" {{action "Settings" target on="click"}} title="Дополнительные штуки">Дополнительные штуки</button>' 
    ),
    Validate: function () {
      var retValue = true;
      var node = this.content;

      return retValue;
    },
    Commit: function () {
      this.content.Commit();
    },
    Rollback: function () {
      this.content.Rollback();
    },
    Calc: function () {
      this.content.Calc();
    },
    Settings: function () {
      var dialog = this.get('FertilizerNutritionSettingsDialog');
      if (dialog == null) {
        this.set('FertilizerNutritionSettingsDialog', GrowCalc.FertilizerNutritionSettingsDialog.create({content: this.content, autoOpen: true}).appendTo(document));
      } else {
        dialog.OpenDialog();
      }
    },
  });

    // Массив _всех_ питаний, загруженных на текущей странице.
  GrowCalc.FertilizerNutritions = [];

GrowCalc.GetFertilizerNutritionsBy = function (field, value, regexp) {
    if (typeof regexp === 'undefined') regexp = false;
    regexp = regexp && new RegExp(value);

    return GrowCalc.FertilizerNutritions.filter(function(item, index, self) {
      if (regexp) {
        return regexp.test(item.get(field));
      } else {
        return (item.get(field) == value);
      }
    });
  };

  GrowCalc.GetFertilizerNutritionById = function (value) {
    return GrowCalc.GetFertilizerNutritionsBy('Id', value)[0];
  };

  GrowCalc.GetFertilizerNutritionByName = function (value) {
    return GrowCalc.GetFertilizerNutritionsBy('Name', value)[0];
  };

  GrowCalc.AddFertilizerNutrition = function(values) {
    var fernut = GrowCalc.GetFertilizerNutritionById(values['Id']);

    if (!fernut) {
      var fertilizers = values.Fertilizers,
        elements = values.Elements;
      values.Fertilizers = [];
      values.Elements = [];
      values['_defaults'] = $.extend({}, values);
      values['_defaults'].Fertilizers = [];
      values['_defaults'].Elements = [];

      fernut = GrowCalc.FertilizerNutrition.create(values);

      fernut.editorView = GrowCalc.FertilizerNutritionEditorView.create({ content: fernut });
      fernut.editorView.appendTo($('.fertilizer-nutrition-editor[data-fertilizer-nutrition="' + fernut.get('Id') + '"]'));

      GrowCalc.FertilizerNutritions.pushObject(fernut);
      if (typeof elements !== 'undefined') {
        elements.forEach( function (item, index, enumerable) {
          fernut.AddElement(item.element, 0, item.amount); // background value
        });
      }

      if (typeof fertilizers !== 'undefined') {
        fertilizers.forEach( function (item, index, enumerable) {
          fernut.AddFertilizer(GrowCalc.GetFertilizerByName(item.fertilizer), item.amount);
        });
      }

    }

    return fernut;
  };

  $(function() {
    setTimeout(function () {
      var i,
        l,
        entity,
        entity_key;

      if (GrowCalc.Drupal().supportLocalStorage) {
        for(i =0, l = localStorage.length; i < l; i++) {
          entity_key = localStorage.key(i);
          if (entity_key.indexOf('FertilizerNutrition') !== -1) {
            entity = JSON.parse(localStorage[entity_key]);
            GrowCalc.AddFertilizerNutrition({
              Id: entity.id,
              Name: entity.name,
              Tag: entity.tag,
              Fertilizers: entity.fertilizers,
              Elements: entity.elements,
            });
          }
        }
      }

      if (typeof Drupal.settings.growcalc !== 'undefined') {
        if (typeof Drupal.settings.growcalc.fertilizer_nutritions !== 'undefined') {
          for(entity_key in Drupal.settings.growcalc.fertilizer_nutritions) {
            if (Drupal.settings.growcalc.fertilizer_nutritions.hasOwnProperty(entity_key)) {
              entity = Drupal.settings.growcalc.fertilizer_nutritions[entity_key];
              GrowCalc.AddFertilizerNutrition({
                Id: entity.id,
                Name: entity.name,
                Tag: entity.tag,
                Fertilizers: entity.fertilizers,
                Elements: entity.elements,
              });
            }
          }
        }
      }
    }, 500);
  })
})(jQuery, Ember, this.GrowCalc, Drupal, this, this.document);