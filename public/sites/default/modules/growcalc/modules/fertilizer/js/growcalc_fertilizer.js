/*jslint browser: true, indent: 2, plusplus: false */

(function ($, Ember, GrowCalc, Drupal, window, document, undefined) {
  "use strict";

  GrowCalc.Fertilizer = Ember.Object.extend({
    'defaults': {
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
     * Fertilizer.Commit().
     *
     * Сохранение модели в друпале.
     * (growcalc/fertilizer/%growcalc_fertilizer/ajax/update)
     */
    Commit: function () {
      var that = this,
        Elements = that.get('Elements'),
        elements = [],
        i,
        successCallback = function (data) {
          var key, defaults, Elements, i;
          if (typeof data.success !== 'undefined' && data.success) {

            defaults = that.get('defaults');

            for (i in defaults) {
              if (i !== 'Elements') {
                defaults[i] = that.get(i);
              }
            }

            Elements = that.get('Elements');

            // apply removed elements
            for (i in defaults.Elements) {
              if (!Elements.hasOwnProperty(i)) {
                // completely remove element by removing it from defaults.
                that.SetElementTemporary(i);
              }
            }

            that.SaveTemporaryElements();

            for (i in Elements) {
              if (defaults.Elements[i] instanceof Ember.Object) {
                defaults.Elements[i].set('Amount', Elements[i].Amount);
              }
            }

            //that.set('defaults', defaults);
          }
        },
        errorCallback = function (jqXHR, textStatus, errorThrown) {
          that.Rollback();
        };

      if (that.Changed()) {
        for (i in Elements) {
          if (Elements[i] instanceof Ember.Object) {
            elements.pushObject({
              Element: Elements[i].Element.Name,
              Amount: Elements[i].Amount
            });
          }
        }

        $.ajax({
          type: 'POST',
          url: Drupal.settings.basePath + "growcalc/fertilizer/" + that.get('Id') + "/ajax/update",
          data: {
            Id: that.get('Id'),
            Description: that.get('Description'),
            Name: that.get('Name'),
            Tag: that.get('Tag'),
            Elements: elements
          },
          success: successCallback,
          error: errorCallback
        });
      }
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
        defaults = this.get('defaults'),
        Elements = this.get('Elements'),
        k,
        i,
        count = 0,
        defaultCount = 0;
      for (k in defaults) {
        if (k !== 'Elements') {
          if (defaults[k] !== this.get(k)) {
            isChanged = true;
            break;
          }
        }
      }

      for (i in Elements) {
        if (Elements[i] instanceof Ember.Object) {
          count = count + 1;
        }
      }

      for (i in defaults.Elements) {
        if (defaults.Elements[i] instanceof Ember.Object) {
          defaultCount = defaultCount + 1;
        }
      }
      if (count === defaultCount) {
        for (i in defaults.Elements) {
          if ((typeof Elements[i] === 'undefined') || (defaults.Elements[i].Amount !== Elements[i].Amount)) {
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
     * Fertilizer.Rollback().
     *
     * Откат сделанных в модели изменений.
     * Для восстановления используется (Array)this.get('defaults');
     */
    Rollback: function () {
      var defaults = this.get('defaults'),
        i,
        Elements = this.get('Elements');

      // Простые поля переносятся скопом.
      for (i in defaults) {
        if (i !== 'Elements') {
          this.set(i, defaults[i]);
        }
      }

      this.RemoveTemporaryElements();

      for (i in defaults.Elements) {
        if (defaults.Elements[i] instanceof Ember.Object) {
          if (!Elements.hasOwnProperty(i)) {
            this.AddElement(defaults.Elements[i].Element, defaults.Elements[i].Amount);
          }
        }
      }

      for (i in defaults.Elements) {
        if (Elements[i] instanceof Ember.Object) {
          Elements[i].set('Count', defaults.Elements[i].Amount);
        }
      }
      this.set('Elements', Elements);
    },

    /**
     * Fertilizer.ShowEditor().
     *
     * Открыть форму редактирования удобрения.
     * Форма рендерится в JQuery UI Dialog.
     * Used jquery.colorpicker.
     */
    ShowEditor: function () {
      var that = this,
        k,
        i;

      that.editor = $('<div />').attr('title', "Редактирование " + that.get("Name"));

      for (i in that.formElements) {
        that.formElements[i].appendTo(that.editor);
      }

      that.editor.dialog({
        width: 390,
        minWidth: 390,
        close: function (event, ui) {
          if (typeof event.cancelable !== 'undefined' && event.cancelable) {
            that.Rollback();
          }
          that.DestroyEditor();
        }
      });
    },
    DestroyEditor: function () {
      var that = this,
        i;
      for (i in that.formElements) {
        that.formElements[i].remove();
      }
    },
    AddElement: function (Element, Amount, temporary) {
      var Elements = this.get('Elements'),
        element = Ember.Object.create({'Element': Element, 'Amount': parseFloat(Amount), 'Host': this});

      temporary = temporary || false;

      element.controller = GrowCalc.FertilizerElementController.create({ content: element });
      element.view = GrowCalc.FertilizerElementView.create({ controller: element.controller });
      this.formElements.FertilizerElements.get('childViews').pushObject(element.view);
      Elements[Element.Name] = element;
      if (!temporary) {
        this.get('defaults').Elements[Element.Name] = Ember.Object.create({'Element': Element, 'Amount': parseFloat(Amount)});
      }
    },
    addNewElementForm: function () {
      var newFertilizerElementView = GrowCalc.NewFertilizerElementView.create({ Host: this });
      this.formElements.FertilizerElements.get('childViews').pushObject(newFertilizerElementView);
    },
    RemoveElement: function (Element, temporary) {
      var Elements = this.get('Elements'),
        childElement,
        childViews;

      temporary = temporary || false;

      if (Elements[Element.Name] instanceof Ember.Object) {
        childElement = Elements[Element.Name];
        childViews = this.formElements.FertilizerElements.get('childViews');
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
          delete this.get('defaults').Elements[Element.Name];
        }
      }
    },
    RemoveTemporaryElements: function () {
      var Elements = this.get('Elements'),
        defaults = this.get('defaults'),
        i;
      for (i in Elements) {
        if (Elements[i] instanceof Ember.Object) {
          if (!defaults.Elements.hasOwnProperty(i)) {
            this.RemoveElement(Elements[i].Element, true);
          }
        }
      }
    },
    SetElementPermanent: function (Element) {
      if (!this.get('defaults').Elements.hasOwnProperty(Element.Element.Name)) {
        this.get('defaults').Elements[Element.Element.Name] = Ember.Object.create({'Element': Element.Element, 'Amount': parseFloat(Element.Amount)});
      }
    },
    SetElementTemporary: function (element) {
      if (this.get('defaults').Elements.hasOwnProperty(element)) {
        delete this.get('defaults').Elements[element];
      }
    },
    SaveTemporaryElements: function () {
      var Elements = this.get('Elements'),
        defaults = this.get('defaults'),
        i;
      for (i in Elements) {
        if (Elements[i] instanceof Ember.Object) {
          if (!defaults.Elements.hasOwnProperty(i)) {
            this.SetElementPermanent(Elements[i]);
          }
        }
      }
    },
    ListElements: function () {
      var Elements = this.get('Elements'),
        totalElements = {},
        element;
      for (element in Elements) if (Elements.hasOwnProperty(element)) {
        var list = Elements[element].Element.ListElements();
        for(var i in list) {
          if (typeof totalElements[list[i].Element.Name] !== 'undefined') {
            totalElements[list[i].Element.Name].set('Amount', totalElements[list[i].Element.Name].get('Amount') + Elements[element].Amount * list[i].Amount);
          } else {
            totalElements[list[i].Element.Name] = {
              Element: list[i].Element,
              Amount: Elements[element].Amount * list[i].Amount
            };
          }
        }
      }
    
      return totalElements;
    }
  });

  GrowCalc.FertilizerController = Ember.ObjectController.extend({
    FertilizerBinding: 'content'
  });

  GrowCalc.FertilizerView = Ember.View.extend({
    // the controller is the initial context for the template
    controller: null,
    template: Ember.Handlebars.compile('<li class="fertilizer-view-{{unbound Id}}">{{Name}} {{Description}} {{Tag}} <a {{action "ShowEditor" target on="click"}}>Редактировать</a></li>'),
    ShowEditor: function () {
      this.controller.content.ShowEditor();
    }
  });

  GrowCalc.FertilizerElementController = Ember.ObjectController.extend({
    'Delete': function () {
      this.content.Host.RemoveElement(this.content.Element, true);
    }
  });

  GrowCalc.FertilizerElements = Ember.ContainerView.extend({
    childViews: []
  });

  GrowCalc.FertilizerElementView = Ember.View.extend({
    controller: null,
    template: Ember.Handlebars.compile('<li>{{controller.content.Element.Name}} {{view GrowCalc.NumberField valueBinding="view.controller.content.Amount"}}<a {{action "Delete" target on="click"}}>Удалить</a></li>'),
    Delete: function () {
      this.controller.Delete();
    }
  });

  GrowCalc.NewFertilizerElementView = Ember.View.extend({
    Element: undefined,
    Amount: 0,
    Host: undefined,
    template: Ember.Handlebars.compile('<li>{{view Ember.TextField valueBinding="view.Element"}}<a {{action "Create" target on="click"}}>Добавить</a></li>'),
    Create: function () {
      var isContains = false,
        i;
      for (i in this.Host.Elements) {
        if (this.Host.Elements[i] instanceof Ember.Object) {
          if (this.Host.Elements[i].Element.Name === this.Element) {
            isContains = true;
            alert('Элемент уже содержится.');
          }
        }
      }
      if (!isContains) {
        if (!GrowCalc.Elements.hasOwnProperty(this.Element)) {
          alert('Такого элемента не существует');
        } else {
          this.Host.AddElement(GrowCalc.Elements[this.Element], this.Amount, true);
        }
      }
    }
  });


  GrowCalc.FertilizerFields = Ember.View.extend({
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
      '</div>')
  });

  GrowCalc.FertilizerButtons = Ember.View.extend({
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
      var retValue = true,
        fertilizer = this.controller.content;

      //if (... ) {
      //  alert("Message");
      //  retValue = false;
      //}

      return retValue;
    },
    Commit: function () {
      var fertilizer = this.controller.content;
      if (this.Validate()) {
        fertilizer.editor.dialog("close");
        fertilizer.Commit();
      }
    },
    Rollback: function () {
      var fertilizer = this.controller.content;

      fertilizer.editor.dialog("close");
      fertilizer.Rollback();
    }
  });


  // Массив _всех_ удобрений, загруженных на текущей странице.
  GrowCalc.Fertilizers = {};

  GrowCalc.GetFertilizerByName = function (name) {
    if (typeof GrowCalc.Fertilizers[name] !== 'undefined') {
      return GrowCalc.Fertilizers[name];
    } else {
      return false;
    }
  };

  GrowCalc.GetFertilizerById = function (id) {
    var isContains = false,
      i;
    for (i in GrowCalc.Fertilizers) {
      if (GrowCalc.Fertilizers[i] instanceof Ember.Object) {
        if (GrowCalc.Fertilizers[i].Id === id) {
          isContains = true;
          return GrowCalc.Fertilizers[i];
        }
      }
    }
//    if (!isContains) {
    return false;
//    }
  };


  GrowCalc.AddFertilizer = function (id, description, name, tag, elements) {
    var fer = GrowCalc.GetFertilizerByName(name),
      k;
    if (!fer) {
      fer = GrowCalc.Fertilizers[name] = GrowCalc.Fertilizer.create();
      fer.setProperties({
        Id: id,
        Description: description,
        Name: name,
        Tag: tag,
        Elements: [],
        defaults: {
          Id: id,
          Description: description,
          Name: name,
          Tag: tag,
          Elements: []
        }
      });

      fer.controller = GrowCalc.FertilizerController.create({ content: fer });
      fer.view = GrowCalc.FertilizerView.create({ controller: fer.controller }).appendTo('#calc-fertilizers .nav-fertilizers');

      fer.formElements = {};

      fer.formElements.FertilizerFields = GrowCalc.FertilizerFields.create({ controller: fer.controller });
      fer.formElements.FertilizerElements = GrowCalc.FertilizerElements.create({ controller: fer.controller });
      fer.formElements.FertilizerButtons = GrowCalc.FertilizerButtons.create({ controller: fer.controller });

      fer.addNewElementForm();
      if (typeof elements !== 'undefined') {
        elements.forEach(function (item, index, enumerable) {
          fer.AddElement(GrowCalc.GetElementByName(item.element), item.amount);
        });
      }

    }

    return fer;
  };

  $(function () {
    setTimeout(function () {
      var fer_key,
        fer;
      if (typeof Drupal.settings.growcalc !== 'undefined') {
        if (typeof Drupal.settings.growcalc.fertilizers !== 'undefined') {
          for (fer_key in Drupal.settings.growcalc.fertilizers) {
            fer = Drupal.settings.growcalc.fertilizers[fer_key];

            GrowCalc.AddFertilizer(fer.id, fer.description, fer.name, fer.tag, fer.elements);
          }
        }
      }
    }, 100);

    $(".block-growcalc-fertilizer .filter").listFilter($(".block-growcalc-fertilizer .nav-fertilizers"));
  });
})(jQuery, Ember, this.GrowCalc, Drupal, this, this.document);