/*jslint browser: true, indent: 2, plusplus: false */

(function ($, Ember, GrowCalc, Drupal, window, document, undefined) {
  "use strict";

  GrowCalc.FertilizerNutrition = Ember.Object.extend({
    '_defaults': {
      Id: 0,
      Description: "",
      Name: "",
      Tag: "",
      Fertilizers: {},
    },
    Id: 0,
    Description: "",
    Name: "",
    Tag: "",
    Fertilizers: {},
    Elements: {},

    /**
     * FertilizerNutrition.Commit().
     *
     * Сохранение модели в друпале.
     * (growcalc/fertilizer_nutrition/%growcalc_fertilizer_nutrition/ajax/update)
     */
    Commit: function () {
      var that = this,
        successCallback = function (data) {
          var key, defaults, Fertilizerss;
          if (typeof data.success !== 'undefined' && data.success) {

            defaults = that.get('_defaults');

            for(var i in defaults) {
              if (i !== 'Fertilizers') {
                defaults[i] = that.get(i);
              }
            }

            var Fertilizers = that.get('Fertilizers');

            // apply removed fertilizers
            for(var fertilizer in defaults.Fertilizers) {
              if (!Fertilizers.hasOwnProperty(fertilizer)) {
                that.SetFertilizerTemporary(fertilizer);
              }
            }

            that.SaveTemporaryFertilizers();

            for(var fertilizer in Fertilizers) {
              if (defaults.Fertilizers[fertilizer] instanceof Ember.Object) {
                defaults.Fertilizers[fertilizer].set('Amount', Fertilizers[fertilizer].Amount);
              }
            }

            //that.set('_defaults', defaults);
          }
        },
        errorCallback = function (jqXHR, textStatus, errorThrown) {
          that.Rollback();
        };

      if (that.Changed()) {
        var fertilizers = [];
        var Fertilizers = that.get('Fertilizers');

        for(var i in Fertilizers) {
          if (Fertilizers[i] instanceof Ember.Object) {
            fertilizer.pushObject({
              Fertilizer: Fertilizers[i].Fertilizer.Name,
              Amount: Fertilizers[i].Amount
            });
          }
        }

        $.ajax({
          type: 'POST',
          url: Drupal.settings.basePath + "growcalc/fertilizer_nutrition/" + that.get('Id') + "/ajax/update",
          data: {
            Id: that.get('Id'),
            Description: that.get('Description'),
            Name: that.get('Name'),
            Tag: that.get('Tag'),
            Fertilizers: fertilizers,
          },
          success: successCallback,
          error: errorCallback
        });
      }
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
        k,i;
      for (k in defaults) {
        if (k !== 'Fertilizers') {
          if (defaults[k] !== this.get(k)) {
            isChanged = true;
            break;
          }
        }
      }

      var Fertilizers = this.get('Fertilizers');
      
      var count = 0;
      for(var i in Fertilizers) {
        if (Fertilizers[i] instanceof Ember.Object) {
          count++;
        }
      }
      var defaultCount = 0;
      for(var i in defaults.Fertilizers) {
        if (defaults.Fertilizers[i] instanceof Ember.Object) {
          defaultCount++;
        }
      }
      if (count == defaultCount) {
        for(var fertilizer in defaults.Fertilizers) {
          if ((typeof Fertilizers[fertilizer] === 'undefined') || (defaults.Fertilizers[fertilizer].Amount !== Fertilizers[fertilizer].Amount)) {
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
     * FertilizerNutrition.Rollback().
     *
     * Откат сделанных в модели изменений.
     * Для восстановления используется (Array)this.get('_defaults');
     */
    Rollback: function () {
      var defaults = this.get('_defaults'),
        key, i,
        Fertilizers = this.get('Fertilizers');

      // Простые поля переносятся скопом.
      for(i in defaults) {
        if (i !== 'Fertilizers') {
          this.set(i, defaults[i]);
        }
      }

      this.RemoveTemporaryFertilizers();

      for(i in defaults.Fertilizers) {
        if (defaults.Fertilizers[i] instanceof Ember.Object) {
          if (!Fertilizers.hasOwnProperty(i)) {
            this.AddFertilizer(defaults.Fertilizers[i].Fertilizer, defaults.Fertilizers[i].Amount);
          }
        }
      }

      var Fertilizers = this.get('Fertilizers');
      for(var fertilizer in defaults.Fertilizers) {
        if (Fertilizers[fertilizer] instanceof Ember.Object) {
          Fertilizers[fertilizer].set('Amount', defaults.Fertilizers[fertilizer].Amount);  
        }
      }
      this.set('Fertilizers', Fertilizers);
    },

    /**
     * FertilizerNutrition.AttachEditor(dom_element).
     *
     * Прикрепить форму редактирования питания.
     * Форма рендерится в dom_element.
     */
    AttachEditor: function (dom_element) {
      var that = this,
        k, i;

      that.editor = dom_element;

      for(var i in that.formData) {
        that.formData[i].appendTo($(that.editor));
      }

      for(var i in that.formFertilizers) {
        that.formFertilizers[i].appendTo($('ul.fertilizers', that.editor));
      }

      for(var i in that.formElements) {
        that.formElements[i].appendTo($('ul.elements', that.editor));
      }
    },
    /**
     * FertilizerNutrition.DestroyEditor().
     *
     * Удалить форму редактирования питания.
     */
    DestroyEditor: function () {
      var that = this;
      for(var i in that.formFertilizers) {
        that.formFertilizers[i].remove();
      }

      for(var i in that.formElements) {
        that.formElements[i].remove();
      }

      for(var i in that.formData) {
        that.formData[i].remove();
      }
    },
    /**
     * FertilizerNutrition.AddFertilizer(Fertilizer, Amount, temporary = false).
     *
     * Добавление удобрения в питание.
     * Fertilizer - ссылка на удобрение, например из GrowCalc.GetFertilizerById(id).
     * Для восстановления используется (Array)this.get('_defaults');
     */
    AddFertilizer: function (Fertilizer, Amount, temporary = false) {
      var that = this,
        fertilizer = Ember.Object.create({
          'Fertilizer': Fertilizer,
          'Amount': parseFloat(Amount),
          'Host': that,
          'AmountChanged': function () {
            var list = that.CalcElements();
            for(var i in list) {
              if (that.Elements[i] instanceof Ember.Object) {
                that.Elements[i].set('Amount', list[i].Amount);
              }
            }
          }.observes('Amount'),
        });
      fertilizer.controller = GrowCalc.FertilizerNutritionFertilizerController.create({ content: fertilizer });
      fertilizer.view = GrowCalc.FertilizerNutritionFertilizerView.create({ controller: fertilizer.controller });
      that.formFertilizers.FertilizerNutritionFertilizers.get('childViews').pushObject(fertilizer.view);

      var Fertilizers = that.get('Fertilizers');
      Fertilizers[Fertilizer.Name] = fertilizer;
      if (!temporary) {
        that.get('_defaults').Fertilizers[Fertilizer.Name] = Ember.Object.create({'Fertilizer': Fertilizer, 'Amount': parseFloat(Amount)});
      }

      var list = Fertilizer.ListElements();
      for(var i in list) {
        that.AddElement(list[i].Element, list[i].Amount);
      }

      fertilizer.AmountChanged();
    },
    /**
     * FertilizerNutrition.AddElement(Fertilizer, Amount).
     *
     * Добавление элемента в питание.
     * Element - ссылка на элемент, например из GrowCalc.GetElementById(id).
     */
    AddElement: function (Element, Amount) {
      var Elements = this.get('Elements'),
        element;
      if (typeof Elements[Element.Name] !== 'undefined') {
        element = Elements[Element.Name];
        element.Hosts = element.Hosts + 1;
        element.set('Amount', element.get('Amount') + parseFloat(Amount));
      } else {
        element = Ember.Object.create({'Element': Element, 'Amount': parseFloat(Amount), 'Host': this, 'Hosts': 1});
        element.controller = GrowCalc.FertilizerNutritionElementController.create({ content: element });
        element.view = GrowCalc.FertilizerNutritionElementView.create({ controller: element.controller });
        this.formElements.FertilizerNutritionElements.get('childViews').pushObject(element.view);
        Elements[Element.Name] = element;
      }
    },
    /**
     * FertilizerNutrition.RemoveElement(Element, Amount).
     *
     * Удаление элемента в питание.
     * Element - ссылка на элемент, например из GrowCalc.GetElementById(id).
     */
    RemoveElement: function (Element, Amount) {
      var Elements = this.get('Elements'),
        element,
        childViews = this.formElements.FertilizerNutritionElements.get('childViews');
      if (typeof Elements[Element.Name] !== 'undefined') {
        element = Elements[Element.Name];
        if (element.get('Hosts') > 1) {
          element.set('Hosts', element.get('Hosts') - 1);
          element.set('Amount', element.get('Amount') - Amount);
        } else {
          childViews.forEach(function (item, index, enumerable) {
          if (item === element.view) {
            childViews.splice(index, 1);
          }
        });
          element.view.remove();
          delete element.controller;
          delete element.view;
          delete Elements[Element.Name];
        }
      }
    },

    addNewFertilizerForm: function () {
      var newFertilizerNutritionFertilizerView = GrowCalc.NewFertilizerNutritionFertilizerView.create({ Host: this });
      this.formFertilizers.FertilizerNutritionFertilizers.get('childViews').pushObject(newFertilizerNutritionFertilizerView);
    },
    RemoveFertilizer: function (Fertilizer, temporary = false) {
      var Fertilizers = this.get('Fertilizers'),
        fertilizer = Fertilizers[Fertilizer.Name],
        list = fertilizer.Fertilizer.ListElements(),
        childViews = this.formFertilizers.FertilizerNutritionFertilizers.get('childViews');

      if (Fertilizers[Fertilizer.Name] instanceof Ember.Object) {
        childViews.forEach(function (item, index, enumerable) {
          if (item === fertilizer.view) {
            childViews.splice(index, 1);
          }
        });

        for(var i in list) {
          this.RemoveElement(list[i].Element, list[i].Amount);
        }
        fertilizer.view.remove();
        delete fertilizer.controller;
        delete fertilizer.view;
        delete Fertilizers[Fertilizer.Name];

        if (!temporary) {
          delete this.get('_defaults').Fertilizers[Fertilizer.Name];
        }
      }
    },
    RemoveTemporaryFertilizers: function () {
      var Fertilizers = this.get('Fertilizers'),
        defaults = this.get('_defaults');
      for(var i in Fertilizers) {
        if (Fertilizers[i] instanceof Ember.Object) {
          if (!defaults.Fertilizers.hasOwnProperty(i)) {
            this.RemoveFertilizer(Fertilizers[i].Fertilizer, true);
          }
        }
      }
    },
    SetFertilizerPermanent: function(Fertilizer) {
      if (!this.get('_defaults').Fertilizers.hasOwnProperty(Fertilizer.Fertilizer.Name)) {
        this.get('_defaults').Fertilizers[Fertilizer.Fertilizer.Name] = Ember.Object.create({'Fertilizer': Fertilizer.Fertilizer, 'Amount': parseFloat(Fertilizer.Amount)});
      }
    },
    SetFertilizerTemporary: function(fertilizer) {
      if (this.get('_defaults').Fertilizers.hasOwnProperty(fertilizer)) {
        delete this.get('_defaults').Fertilizers[fertilizer];
      } 
    },
    SaveTemporaryFertilizers: function () {
      var Fertilizers = this.get('Fertilizers'),
        defaults = this.get('_defaults');
      for(var i in Fertilizers) {
        if (Fertilizers[i] instanceof Ember.Object) {
          if (!defaults.Fertilizers.hasOwnProperty(i)) {
            this.SetFertilizerPermanent(Fertilizers[i]);
          }
        }
      }
    },
    CalcElements: function () {
      var Fertilizers = this.get('Fertilizers'),
        i,
        j,
        list,
        total = {};
      for(i in Fertilizers) {
        if (Fertilizers[i] instanceof Ember.Object) {
          list = Fertilizers[i].Fertilizer.ListElements();
          for(j in list) {
            if (total.hasOwnProperty(j)) {
              total[j].Amount = total[j].Amount + list[j].Amount * Fertilizers[i].Amount;
            } else {
              total[j] = {
                Element: list[j].Element,
                Amount: list[j].Amount * Fertilizers[i].Amount
              };
            }
          }
        }
      }

      return total;
    }
  });

  GrowCalc.FertilizerNutritionController = Ember.ObjectController.extend({
    FertilizerNutritionBinding: 'content',
    Validate: function () {
      var retValue = true;
      var fertilizerNutrition = this.content;

      //if (... ) {
      //  alert("Message");
      //  retValue = false;
      //}

      return retValue;
    },
    Commit: function () {
      // this.content -- fertilizerNutrition
      if (this.Validate()) {
        this.content.Commit();
      }
    },
    Rollback: function () {
      console.log(this.content);
      this.content.Rollback();
    }
  });

  GrowCalc.FertilizerNutritionView = Ember.View.extend({
    // the controller is the initial context for the template
    controller: null,
    template: Ember.Handlebars.compile('<li class="fertilizer-nutrition-view-{{unbound Id}}">{{Name}} {{Description}} {{Tag}}</li>'),
    /*ShowEditor: function () {
      this.controller.content.ShowEditor(); 
    }*/
  });

  GrowCalc.FertilizerNutritionFertilizerController = Ember.ObjectController.extend({
    'Delete': function () {
      this.content.Host.RemoveFertilizer(this.content.Fertilizer, true);
    }
  });

  GrowCalc.FertilizerNutritionElementController = Ember.ObjectController.extend({
    'Update': function () {
      //this.content.Host -- fertilizer nutrition
      console.log('update');
    }
  });

  GrowCalc.FertilizerNutritionFertilizers = Ember.ContainerView.extend({
    childViews: []
  });

  GrowCalc.FertilizerNutritionElements = Ember.ContainerView.extend({
    childViews: []
  });



  GrowCalc.FertilizerNutritionFertilizerView = Ember.View.extend({
    controller: null,
    template: Ember.Handlebars.compile('<li>{{controller.content.Fertilizer.Name}} {{view GrowCalc.NumberField valueBinding="view.controller.content.Amount"}}<a class="remove" {{action "Delete" target on="click"}}>Удалить</a>{{view GrowCalc.ScrollView max="30" valueBinding="view.controller.content.Amount"}}</li>'),
    Delete: function () {
      this.controller.Delete();
    }
  });

  GrowCalc.FertilizerNutritionElementView = Ember.View.extend({
    controller: null,
    template: Ember.Handlebars.compile('<li><span class="color" style="background-color: #{{unbound controller.content.Element.Color}}"></span> {{controller.content.Element.Name}} {{view GrowCalc.NumberField valueBinding="view.controller.content.Amount"}}{{view GrowCalc.ScrollView max="100" valueBinding="view.controller.content.Amount" colorBinding="view.controller.content.Element.Color"}}</li>'),
  });


  GrowCalc.NewFertilizerNutritionFertilizerView = Ember.View.extend({
    Fertilizer: undefined,
    Amount: 0,
    Host: undefined,
    template: Ember.Handlebars.compile('<li>{{view Ember.TextField valueBinding="view.Fertilizer"}}<a {{action "Create" target on="click"}}>Добавить</a></li>'),
    Create: function () {
      var isContains = false;
      for(var i in this.Host.Fertilizers) {
        if (this.Host.Fertilizers[i] instanceof Ember.Object) {
          if (this.Host.Fertilizers[i].Fertilizer.Name == this.Fertilizer) {
            isContains = true;
            alert('Удобрение уже содержится.');
          }
        }
      }
      if (!isContains) {
        var newFertilizer = GrowCalc.GetFertilizerByName(this.Fertilizer);
        if (newFertilizer) {
          this.Host.AddFertilizer(newFertilizer, this.Amount, true);
        } else {
          alert('Такого удобрения не существует');
        }
      }
    }
  });


  GrowCalc.FertilizerNutritionFields = Ember.View.extend({
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

  GrowCalc.FertilizerNutritionButtons = Ember.View.extend({
    // the controller is the initial context for the template
    controller: null,
    // {{view Ember.TextField valueBinding="view.controller.content.Name"}}
    template: Ember.Handlebars.compile('<div>' +
        '<p>' +
          '<button {{action "Commit" on="click"}}>Сохранить</button>' +
          '<button {{action "Rollback" on="click"}}>Сброс</button>' +
        '</p>' +
      '</div>'),
    Commit: function () {
      this.controller.Commit();
    },
    Rollback: function () {
      this.controller.Rollback();
    }
  });


  // Массив _всех_ питаний, загруженных на текущей странице.
  GrowCalc.FertilizerNutritions = {};

  GrowCalc.GetFertilizerNutritionById = function (id) {
    if (typeof GrowCalc.FertilizerNutritions[id] !== 'undefined') {
      return GrowCalc.FertilizerNutritions[id];
    } else {
      return false;
    }
  };

  GrowCalc.GetFertilizerNutritionByName = function (name) {
    var isContains = false;
    for(var i in GrowCalc.FertilizerNutritions) {
      if (GrowCalc.FertilizerNutritions[i] instanceof Ember.Object) {
        if (GrowCalc.FertilizerNutritions[i].Name == name) {
          isContains = true;
          return GrowCalc.FertilizerNutritions[i];
        }
      }
    }
  
//    if (!isContains) {
    return false;
//    }
  };

  GrowCalc.AddFertilizerNutrition = function(id, description, name, tag, fertilizers) {
    var fernut = GrowCalc.GetFertilizerNutritionById(id),
      k;
    if (!fernut) {
      fernut = GrowCalc.FertilizerNutritions[id] = GrowCalc.FertilizerNutrition.create();
      fernut.setProperties({
        Id: id,
        Description: description,
        Name: name,
        Tag: tag,
        Fertilizers: [],
        Elements: [],
        _defaults: {
          Id: id,
          Description: description,
          Name: name,
          Tag: tag,
          Fertilizers: [],
        },
      });

      fernut.controller = GrowCalc.FertilizerNutritionController.create({ content: fernut });
      fernut.view = GrowCalc.FertilizerNutritionView.create({ controller: fernut.controller }).appendTo('.fertilizer-nutrition-editor');

      fernut.formFertilizers = {};
      fernut.formElements = {};
      fernut.formData = {};

      fernut.formData.FertilizerNutritionFields = GrowCalc.FertilizerNutritionFields.create({ controller: fernut.controller });
      fernut.formData.FertilizerNutritionButtons = GrowCalc.FertilizerNutritionButtons.create({ controller: fernut.controller });

      fernut.formFertilizers.FertilizerNutritionFertilizers = GrowCalc.FertilizerNutritionFertilizers.create({ controller: fernut.controller });
      fernut.formElements.FertilizerNutritionElements = GrowCalc.FertilizerNutritionElements.create({ controller: fernut.controller });

      fernut.addNewFertilizerForm();
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
      if (typeof Drupal.settings.growcalc !== 'undefined') {
        if (typeof Drupal.settings.growcalc.fertilizer_nutritions !== 'undefined') {
          for(var fernut_key in Drupal.settings.growcalc.fertilizer_nutritions) {
            var fernut = Drupal.settings.growcalc.fertilizer_nutritions[fernut_key];

            GrowCalc.AddFertilizerNutrition(fernut.id, fernut.description, fernut.name, fernut.tag, fernut.fertilizers);  
          }
        }
      }

      $('.fertilizer-nutrition-editor').each(function () {
        var id = $(this).data('fertilizer-nutrition');
        var fertilizerNutrition = GrowCalc.GetFertilizerNutritionById(id);
        if (fertilizerNutrition) {
          fertilizerNutrition.AttachEditor(this);
        }
      });
    }, 100);

    $(".block-growcalc-fertilizer-nutrition .filter").listFilter($(".block-growcalc-fertilizer-nutrition .nav-fertilizer-nutritions"));
  })
})(jQuery, Ember, this.GrowCalc, Drupal, this, this.document);