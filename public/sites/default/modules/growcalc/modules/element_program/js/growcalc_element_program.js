/*jslint browser: true, indent: 2, plusplus: false */

(function ($, Ember, GrowCalc, Drupal, window, document, undefined) {
  "use strict";

  GrowCalc.ElementProgram = Ember.Object.extend(GrowCalc.DrupalSavable, {
    Type: 'element_program',

    '_defaults': {
      Id: 0,
      Title: "",
      ElementNutritions: []
    },
    Id: 0,
    Title: "",
    ElementNutritions: [],
    /**
     * ElementProgram.UpdateDefaults().
     *
     * Обновление значений по-умолчанию.
     */
    UpdateDefaults: function () {
      var that = this,
        defaults = that.get('_defaults'),
        i;

      for(i in defaults) {
        if (i !== 'ElementPrograms') {
          defaults[i] = that.get(i);
        }
      }

      this.get('ElementNutritions').map(function (item) {
        item.UpdateDefaults();
      });
    },
    /**
     * ElementProgram.PrepareData().
     *
     * Prepares data for saving.
     */
    PrepareData: function () {
      var that = this;
      return {
        id: that.get('Id'),
        title: that.get('Title'),
        element_nutritions: that.get('ElementNutritions').map(function (item) {
          return item.PrepareData();
        }),
      };
    },
    /**
     * ElementProgram.Commit().
     *
     * Сохранение изменений в модели.
     */
    Commit: function () {
      this.UpdateDefaults();
      this.SaveToServer();
    },
    /**
     * ElementProgram.Changed().
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
        if (k !== 'ElementNutritions') {
          if (defaults[k] !== that.get(k)) {
            isChanged = true;
            break;
          }
        } else {
          if (that.get(k).length !== defaults[k].length) {
            isChanged = true;
            break;
          }
        }
      }

      if (!isChanged) {
        if (undefined != that.get('ElementNutritions').find(function (item) { return item.Changed(); }) ) {
          isChanged = true;
        }
      }

      return isChanged;
    },
    /**
     * ElementProgram.SaveToServer().
     *
     * Сохранение модели в друпале.
     * (growcalc/ajax/element_program/%node/update)
     */
    SaveToServer: function () {
      var that = this;
      GrowCalc.Drupal().Save({
        object: that,
        success: function (data) {
          if (typeof data.success !== 'undefined' && data.success) {
            if (that.IsTemporary()) {
              that.set(that.get('PrimaryKey'), data.id);
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
     * ElementProgram.Delete().
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
     * ElementProgram.Destroy().
     *
     * Удаление из фронтенда.
     * Почистить за собой.. ^_^
     */
    Destroy: function () {
      this.CloseDialogs();
      GrowCalc.ElementPrograms.removeObject(this);
    },
    /**
     * ElementProgram.Rollback().
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
        if (i !== 'ElementNutritions') {
          this.set(i, defaults[i]);
        }
      }

      this.RemoveTemporaryElementNutritions();

      defaults.ElementNutritions.forEach(function (def) {
        if (!that.get('ElementNutritions').contains(def)) {
          that.get('ElementNutritions').pushObject(def);
        }
      });

      this.get('ElementNutritions').forEach(function (item) {
        item.Rollback();
      });
    },
    /**
     * ElementProgram.ShowEditorForm().
     *
     * Открыть форму редактирования.
     * Форма рендерится в JQuery UI Dialog.
     */
    ShowEditorForm: function () {
      var that = this;
      if (typeof that.editorDialog === 'undefined') {
        that.editorDialog = GrowCalc.ElementProgramEditorDialog.create({ content: that, autoOpen: true });
        that.editorDialog.appendTo(document);
      } else {
        that.editorDialog.OpenDialog();
      }
    },
    /**
     * ElementProgram.ShowDeleteForm().
     *
     * Открыть форму подтверждения удаления.
     * Форма рендерится в JQuery UI Dialog.
     */
    ShowDeleteForm: function () {
      var that = this;
      if (typeof that.deleteView === 'undefined') {
        that.deleteView = GrowCalc.ElementProgramDeleteView.create({ content: that, autoOpen: true });
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
    AddElementNutrition: function (ElementNutrition, temporary) {
      temporary = temporary || false;
      var defaults = this.get('_defaults');
      this.get('ElementNutritions').pushObject(ElementNutrition);
      if (!temporary) {
        defaults.ElementNutritions.pushObject(ElementNutrition);
      }
    },
    RemoveElementNutrition: function (ElementNutrition, temporary) {
      temporary = temporary || false;
      var defaults = this.get('_defaults');
      this.get('ElementNutritions').removeObject(ElementNutrition);
      if (!temporary) {
        defaults.ElementNutritions.removeObject(ElementNutrition);
      }
    },

    RemoveTemporaryElementNutritions: function () {
      var that = this;
      this.get('ElementNutritions').forEach(function (item) {
        if (!that.get('_defaults').ElementNutritions.contains(item)) {
          that.RemoveElementNutrition(item, true);
        }
      });
    },
    SetElementNutritionPermanent: function(ElementNutrition) {
      this.get('_defaults').Elements.pushObject(ElementNutrition);
    },
    SetElementNutritionTemporary: function(ElementNutrition) {
      this.get('_defaults').ElementNutritions.removeObject(ElementNutrition);
    },
    SaveTemporaryElementNutritions: function () {
      var that = this,
        defaults = this.get('_defaults');
      that.get('ElementNutritions').forEach(function (item) {
        if (!defaults.ElementNutritions.contains(item)) {
          that.SetElementPermanent(element);
        }
      });
    },
  });

  GrowCalc.ElementProgramsView = Ember.CollectionView.extend({
    tagName: 'ul',
    classNames: [ 'list', 'list-element-programs'],
    contentBinding: 'GrowCalc.ElementPrograms',
    itemViewClass: Ember.View.extend({
      tagName: 'li',
      content: null,
      contextBinding: 'content',
      template: Ember.Handlebars.compile(
        '{{Name}}' +
        '<ul class="element-nutritions">' +
        '{{#each view.content.ElementNutritions}}' +
        '<li>{{Name}}</li>' +
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
      $(".block-growcalc-element-program .filter").listFilter(this.$());
    },
  });
  
  GrowCalc.ElementProgramEditorDialog = JQ.Dialog.extend({
    classNames: ['element-program-editor-dialog'],
    width: 560,
    minWidth: 350,
    content: null,
    title: "",
    template: Ember.Handlebars.compile(
      '<div><label>Наименование</label>{{view Ember.TextField valueBinding="view.content.Title"}}</div>'
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
      this.set('title', 'Программа питания "' + this.content.get('Title') + '"');
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

  GrowCalc.ElementProgramDeleteView = JQ.Dialog.extend({
    classNames: ['element-program-delete-dialog'],
    width: 300,
    minWidth: 300,
    content: null,
    title: "Удалить программу питания?",
    template: Ember.Handlebars.compile('<p>Вы действительно хотите удалить программу питания "{{Title}}"?</p>'),
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

  GrowCalc.ElementProgramEditorView = Ember.View.extend({
    classNames: ['element-program-editor-dialog'],
    content: null,
    template: Ember.Handlebars.compile(
      '<div><label>Заголовок</label>{{view Ember.TextField valueBinding="view.content.Title"}}</div>' +
      '<div><label>Питания</label></div>' +
      '<ul class="element-nutritions">' +
        '{{#each item in view.content.ElementNutritions}}' +
          //'<li>{{View Ember.ContainerView currentViewBinding="item.editorView"}}</li>' +
          //'<li>{{view Ember.TextField valueBinding="item.editorView"}}</li>' +
        '{{/each}}' +
      '</ul>' +
      '<button class="btn action action-commit" {{action "Commit" target on="click"}} title="Сохранить">Сохранить</button>' +
      '<button class="btn action action-rollback" {{action "Rollback" target on="click"}} title="Отменить">Отменить</button>'
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
  });

  // Массив _всех_ программ питания, доступных пользователю.
  GrowCalc.ElementPrograms = [];

  GrowCalc.GetElementProgramsBy = function (field, value, regexp) {
    if (typeof regexp === 'undefined') regexp = false;
    regexp = regexp && new RegExp(value);

    return GrowCalc.ElementPrograms.filter(function(item, index, self) {
      if (regexp) {
        return regexp.test(item.get(field));
      } else {
        return (item.get(field) == value);
      }
    });
  };

  GrowCalc.GetElementProgramById = function (value) {
    return GrowCalc.GetElementProgramsBy('Id', value)[0];
  };

  GrowCalc.GetElementProgramByTitle = function (value) {
    return GrowCalc.GetElementProgramsBy('Title', value)[0];
  };


  GrowCalc.AddElementProgram = function(values) {
    var program = GrowCalc.GetElementProgramById(values['Id']);
    if (!program) {
      values['_defaults'] = $.extend({}, values);
      values['_defaults'].ElementNutritions = values.ElementNutritions.map(function (i) {return i;});
      program = GrowCalc.ElementProgram.create(values);

      program.editorView = GrowCalc.ElementProgramEditorView.create({ content: program });
      program.editorView.appendTo($('.element-program-editor[data-element-program="' + program.get('Id') + '"]'));

      GrowCalc.ElementPrograms.pushObject(program);
    }
    return program;
  };

  $(function() {
    var i,
      l,
      entity,
      entity_key;

    GrowCalc.elementProgramsView = GrowCalc.ElementProgramsView.create({}).appendTo('#calc-element-programs');

    if (GrowCalc.Drupal().supportLocalStorage) {
      for(i =0, l = localStorage.length; i < l; i++) {
        entity_key = localStorage.key(i);
        if (entity_key.indexOf('ElementProgram') !== -1) {
          entity = JSON.parse(localStorage[entity_key]);
          GrowCalc.AddElementProgram({
            Id: entity.id,
            Title: entity.title,
            ElementNutritions: entity.element_nutritions.map(function (item) {
              return GrowCalc.GetElementNutritionById(item);
            }),
          });
        }
      }
    }

    if (typeof Drupal.settings.growcalc !== 'undefined') {
      if (typeof Drupal.settings.growcalc.element_programs !== 'undefined') {
        for(entity_key in Drupal.settings.growcalc.element_programs) {
          if (Drupal.settings.growcalc.element_programs.hasOwnProperty(entity_key)) {
            entity = Drupal.settings.growcalc.element_programs[entity_key];
            GrowCalc.AddElementProgram({
              Id: entity.id,
              Title: entity.title,
              ElementNutritions: entity.element_nutritions.map(function (item) {
                return GrowCalc.GetElementNutritionById(item.id);
              }),
            });
          }
        }
      }
    }
  });
})(jQuery, Ember, this.GrowCalc, Drupal, this, this.document);