/*jslint browser: true, indent: 2, plusplus: false */

(function ($, Ember, GrowCalc, Drupal, window, document, undefined) {
  "use strict";

  GrowCalc.ElementNutrition = Ember.Object.extend({
    '_defaults': {
      Id: undefined,
      Description: undefined,
      Name: undefined,
      Tag: undefined,
      Elements: undefined
    },
    Id: undefined,
    Description: undefined,
    Name: undefined,
    Tag: undefined,
    Elements: undefined,

    /**
     * ElementNutrition.Commit().
     *
     * Сохранение модели в друпале.
     * (growcalc/element_nutrition/%growcalc_element_nutrition/ajax/update)
     */
    Commit: function () {
      var that = this,
        successCallback = function (data) {
          var key, defaults, Elements;
          if (typeof data.success !== 'undefined' && data.success) {

            defaults = that.get('_defaults');

            for(var i in defaults) {
              if (i !== 'Elements') {
                defaults[i] = that.get(i);
              }
            }

            var Elements = that.get('Elements');

            // apply removed elements
            for(var element in defaults.Elements) {
              if (!Elements.hasOwnProperty(element)) {
                that.SetElementTemporary(element);
              }
            }

            that.SaveTemporaryElements();

            for(var element in Elements) {
              if (defaults.Elements[element] instanceof Ember.Object) {
                defaults.Elements[element].set('Amount', Elements[element].Amount);
              }
            }

            //that.set('_defaults', defaults);
          }
        },
        errorCallback = function (jqXHR, textStatus, errorThrown) {
          that.Rollback();
        };

      if (that.Changed()) {
        var elements = [];
        var Elements = that.get('Elements');

        for(var i in Elements) {
          if (Elements[i] instanceof Ember.Object) {
            elements.pushObject({
              Element: Elements[i].Element.Name,
              Amount: Elements[i].Amount
            });
          }
        }

        $.ajax({
          type: 'POST',
          url: Drupal.settings.basePath + "growcalc/element_nutrition/" + that.get('Id') + "/ajax/update",
          data: {
            Id: that.get('Id'),
            Description: that.get('Description'),
            Name: that.get('Name'),
            Tag: that.get('Tag'),
            Elements: elements,
          },
          success: successCallback,
          error: errorCallback
        });
      }
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
        defaults = this.get('_defaults'),
        k,i;
      for (k in defaults) {
        if (k !== 'Elements') {
          if (defaults[k] !== this.get(k)) {
            isChanged = true;
            break;
          }
        }
      }

      var Elements = this.get('Elements');
      
      var count = 0;
      for(var i in Elements) {
        if (Elements[i] instanceof Ember.Object) {
          count++;
        }
      }
      var defaultCount = 0;
      for(var i in defaults.Elements) {
        if (defaults.Elements[i] instanceof Ember.Object) {
          defaultCount++;
        }
      }
      if (count == defaultCount) {
        for(var element in defaults.Elements) {
          if ((typeof Elements[element] === 'undefined') || (defaults.Elements[element].Amount !== Elements[element].Amount)) {
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
     * ElementNutrition.Rollback().
     *
     * Откат сделанных в модели изменений.
     * Для восстановления используется (Array)this.get('_defaults');
     */
    Rollback: function () {
      var defaults = this.get('_defaults'),
        key, i,
        Elements = this.get('Elements');

      // Простые поля переносятся скопом.
      for(i in defaults) {
        if (i !== 'Elements') {
          this.set(i, defaults[i]);
        }
      }

      this.RemoveTemporaryElements();

      for(i in defaults.Elements) {
        if (defaults.Elements[i] instanceof Ember.Object) {
          if (!Elements.hasOwnProperty(i)) {
            this.AddElement(defaults.Elements[i].Element, defaults.Elements[i].Amount);
          }
        }
      }

      var Elements = this.get('Elements');
      for(var element in defaults.Elements) {
        if (Elements[element] instanceof Ember.Object) {
          Elements[element].set('Count', defaults.Elements[element].Amount);  
        }
      }
      this.set('Elements', Elements);
    },

    /**
     * ElementNutrition.ShowEditor().
     *
     * Открыть форму редактирования программы питания.
     * Форма рендерится в JQuery UI Dialog.
     */
    ShowEditor: function () {
      var that = this,
        k, i;

      that.editor = $('<div />').attr('title', "Редактирование " + that.get("Name"));

      for(var i in that.formElements) {
        that.formElements[i].appendTo(that.editor);
      }

      that.editor.dialog({
        width: 390,
        minWidth: 390,
        close: function(event, ui) {
          if (typeof event.cancelable !== 'undefined' && event.cancelable ) {
            that.Rollback();
          }
          that.DestroyEditor();
        }
      });
    },
    DestroyEditor: function () {
      var that = this;
      for(var i in that.formElements) {
        that.formElements[i].remove();
      }
    },
    AddElement: function (Element, Amount, temporary = false) {
      var element = Ember.Object.create({'Element': Element, 'Amount': parseFloat(Amount), 'Host': this});
      element.controller = GrowCalc.ElementNutritionElementController.create({ content: element });
      element.view = GrowCalc.ElementNutritionElementView.create({ controller: element.controller });
      this.formElements.ElementNutritionElements.get('childViews').pushObject(element.view);
      var Elements = this.get('Elements');
      Elements[Element.Name] = element;
      if (!temporary) {
        this.get('_defaults').Elements[Element.Name] = Ember.Object.create({'Element': Element, 'Amount': parseFloat(Amount)});
      }
    },
    addNewElementForm: function () {
      var newElementNutritionElementView = GrowCalc.NewElementNutritionElementView.create({ Host: this });
      this.formElements.ElementNutritionElements.get('childViews').pushObject(newElementNutritionElementView);
    },
    RemoveElement: function (Element, temporary = false) {
      var Elements = this.get('Elements');

      if (Elements[Element.Name] instanceof Ember.Object) {
        var childElement = Elements[Element.Name];
        var childViews = this.formElements.ElementNutritionElements.get('childViews');
        childViews.forEach(function (item, index, enumerable) {
          if (item === childElement.view) {
            childViews.splice(index, 1);
          }
        });
        
        childElement.view.remove();
        delete childElement.controller;
        delete childElement.view;
        delete Elements[Element.Name];

        if (!temporary) {
          delete this.get('_defaults').Elements[Element.Name];
        }
      }
    },
    RemoveTemporaryElements: function () {
      var Elements = this.get('Elements'),
        defaults = this.get('_defaults');
      for(var i in Elements) {
        if (Elements[i] instanceof Ember.Object) {
          if (!defaults.Elements.hasOwnProperty(i)) {
            this.RemoveElement(Elements[i].Element, true);
          }
        }
      }
    },
    SetElementPermanent: function(Element) {
      if (!this.get('_defaults').Elements.hasOwnProperty(Element.Element.Name)) {
        this.get('_defaults').Elements[Element.Element.Name] = Ember.Object.create({'Element': Element.Element, 'Amount': parseFloat(Element.Amount)});
      }
    },
    SetElementTemporary: function(element) {
      if (this.get('_defaults').Elements.hasOwnProperty(element)) {
        delete this.get('_defaults').Elements[element];
      } 
    },
    SaveTemporaryElements: function () {
      var Elements = this.get('Elements'),
        defaults = this.get('_defaults');
      for(var i in Elements) {
        if (Elements[i] instanceof Ember.Object) {
          if (!defaults.Elements.hasOwnProperty(i)) {
            this.SetElementPermanent(Elements[i]);
          }
        }
      }
    }
  });

  GrowCalc.ElementNutritionController = Ember.ObjectController.extend({
    ElementNutritionBinding: 'content'
  });

  GrowCalc.ElementNutritionView = Ember.View.extend({
    // the controller is the initial context for the template
    controller: null,
    template: Ember.Handlebars.compile('<li class="element-nutrition-view-{{unbound Id}}">{{Name}} {{Description}} {{Tag}} <a {{action "ShowEditor" target on="click"}}>Редактировать</a></li>'),
    ShowEditor: function () {
      this.controller.content.ShowEditor(); 
    }
  });

  GrowCalc.ElementNutritionElementController = Ember.ObjectController.extend({
    'Delete': function () {
      this.content.Host.RemoveElement(this.content.Element, true);
    }
  });

  GrowCalc.ElementNutritionElements = Ember.ContainerView.extend({
    childViews: []
  });

  GrowCalc.ElementNutritionElementView = Ember.View.extend({
    controller: null,
    template: Ember.Handlebars.compile('<li>{{controller.content.Element.Name}} {{view GrowCalc.NumberField valueBinding="view.controller.content.Amount"}}<a {{action "Delete" target on="click"}}>Удалить</a><br/>{{view GrowCalc.ScrollView max="200" valueBinding="view.controller.content.Amount"}}</li>'),
    Delete: function () {
      this.controller.Delete();
    }
  });

  GrowCalc.NewElementNutritionElementView = Ember.View.extend({
    Element: undefined,
    Amount: 0,
    Host: undefined,
    template: Ember.Handlebars.compile('<li>{{view Ember.TextField valueBinding="view.Element"}}<a {{action "Create" target on="click"}}>Добавить</a></li>'),
    Create: function () {
      var isContains = false;
      for(var i in this.Host.Elements) {
        if (this.Host.Elements[i] instanceof Ember.Object) {
          if (this.Host.Elements[i].Element.Name == this.Element) {
            isContains = true;
            alert('Элемент уже содержится.');
          }
        }
      }
      if (!isContains) {
        var element = GrowCalc.GetElementByName(this.Element);
        if (!element) {
          alert('Такого элемента не существует');
        } else {
          this.Host.AddElement(element, this.Amount, true);
        }
      }
    }
  });


  GrowCalc.ElementNutritionFields = Ember.View.extend({
    // the controller is the initial context for the template
    controller: null,
    // {{view Ember.TextField valueBinding="view.controller.content.Name"}}
    template: Ember.Handlebars.compile('<div>' +
        '<table><tr>' +
          '<td><label>Name</label></td>' +
          '<td>{{view Ember.TextField valueBinding="view.controller.content.Name"}}</td>' +
        '</tr>' +
        '<tr>' +
          '<td><label>Description</label></td>' + 
          '<td>{{view Ember.TextField valueBinding="view.controller.content.Description"}}</td>' +
        '</tr>' +
        '<tr>' +
          '<td><label>Tag</label></td>' + 
          '<td>{{view Ember.TextField valueBinding="view.controller.content.Tag"}}</td>' +
        '</tr></table>' +
      '</div>'),
  });

  GrowCalc.ElementNutritionButtons = Ember.View.extend({
    // the controller is the initial context for the template
    controller: null,
    // {{view Ember.TextField valueBinding="view.controller.content.Name"}}
    template: Ember.Handlebars.compile('<div>' +
        '<p>' +
          '<button {{action "Commit" on="click"}}>Сохранить</button>' +
          '<button {{action "Rollback" on="click"}}>Отмена</button>' +
        '</p>' +
      '</div>'),
    Validate: function () {
      var retValue = true;
      var elementNutrition = this.controller.content;

      //if (... ) {
      //  alert("Message");
      //  retValue = false;
      //}

      return retValue;
    },
    Commit: function () {
      var elementNutrition = this.controller.content;
      if (this.Validate()) {
        elementNutrition.editor.dialog("close");
        elementNutrition.Commit();
      }
    },
    Rollback: function () {
      var elementNutrition = this.controller.content;

      elementNutrition.editor.dialog("close"); 
      elementNutrition.Rollback();
    }
  });


  // Массив _всех_ программ питания, доступных пользователю.
  GrowCalc.ElementNutritions = {};

  GrowCalc.GetElementNutritionById = function (id) {
    if (typeof GrowCalc.ElementNutritions[id] !== 'undefined') {
      return GrowCalc.ElementNutritions[id];
    } else {
      return false;
    }
  };

  GrowCalc.GetElementNutritionByName = function (name) {
    var isContains = false;
    for(var i in GrowCalc.ElementNutritions) {
      if (GrowCalc.ElementNutritions[i] instanceof Ember.Object) {
        if (GrowCalc.ElementNutritions[i].Name == name) {
          isContains = true;
          return GrowCalc.ElementNutritions[i];
        }
      }
    }
  
//    if (!isContains) {
    return false;
//    }
  };

  GrowCalc.AddElementNutrition = function(id, description, name, tag, elements) {
    var elnut = GrowCalc.GetElementNutritionById(id),
      k;
    if (!elnut) {
      elnut = GrowCalc.ElementNutritions[id] = GrowCalc.ElementNutrition.create();
      elnut.setProperties({
        Id: id,
        Description: description,
        Name: name,
        Tag: tag,
        Elements: [],
        _defaults: {
          Id: id,
          Description: description,
          Name: name,
          Tag: tag,
          Elements: [],
        },
      });

      elnut.controller = GrowCalc.ElementNutritionController.create({ content: elnut });
      elnut.view = GrowCalc.ElementNutritionView.create({ controller: elnut.controller }).appendTo('#calc-element-nutritions .nav-element-nutritions');

      elnut.formElements = {};

      elnut.formElements.ElementNutritionFields = GrowCalc.ElementNutritionFields.create({ controller: elnut.controller });
      elnut.formElements.ElementNutritionElements = GrowCalc.ElementNutritionElements.create({ controller: elnut.controller });
      elnut.formElements.ElementNutritionButtons = GrowCalc.ElementNutritionButtons.create({ controller: elnut.controller });

      elnut.addNewElementForm();
      if (typeof elements !== 'undefined') {
        elements.forEach( function (item, index, enumerable) {
          elnut.AddElement(GrowCalc.Elements[item.element], item.amount);
        });
      }

    }

    return elnut;
  };

  $(function() {
    setTimeout(function () {
      if (typeof Drupal.settings.growcalc !== 'undefined') {
        if (typeof Drupal.settings.growcalc.element_nutritions !== 'undefined') {
          for(var elnut_key in Drupal.settings.growcalc.element_nutritions) {
            var elnut = Drupal.settings.growcalc.element_nutritions[elnut_key];

            GrowCalc.AddElementNutrition(elnut.id, elnut.description, elnut.name, elnut.tag, elnut.elements);  
          }
        }
      }
    }, 100);

    $(".block-growcalc-element-nutrition .filter").listFilter($(".block-growcalc-element-nutrition .nav-element-nutritions"));
  })
})(jQuery, Ember, this.GrowCalc, Drupal, this, this.document);