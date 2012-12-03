<?php

/**
 * @file
 * growcalc_fertilizer_nutrition editing UI.
 *
 * We make very little use of the EntityAPI interface for this - preferring instead to use
 * views. That offers more flexibility to change a UI that will, more often than not,
 * be end-user facing.
 */

/**
 * Settings form for GrowCalc.
 */
function growcalc_fertilizer_nutrition_settings() {
  $form = array();
  
  $form['create_default_fertilizer_nutritions'] = array('#type' => 'submit', '#value' => t('Create default fertilizer nutritions'),'#submit' => array('growcalc_fertilizer_nutrition_settings_create_default_fertilizer_nutritions_submit'));
  $form['clear_fertilizer_nutritions'] = array('#type' => 'submit', '#value' => t('Clear fertilizer nutritions'),'#submit' => array('growcalc_fertilizer_nutrition_settings_clear_fertilizer_nutritions_submit'));

  return system_settings_form($form);
}

function growcalc_fertilizer_nutrition_settings_create_default_fertilizer_nutritions_submit($form, &$form_state) {
  module_load_include('inc', 'growcalc_fertilizer_nutrition', 'growcalc_fertilizer_nutrition.data');
  $fertilizer_nutritions = _growcalc_fertilizer_nutrition_data();
  foreach($fertilizer_nutritions as $fertilizer_nutrition) {
    $uri = growcalc_fertilizer_nutrition_uri($fertilizer_nutrition);
    drupal_set_message(t("Fertilizer nutrition @fertilizer_nutrition has been created.", array('@fertilizer_nutrition' => l($fertilizer_nutrition->name, $uri['path']))));
  }
}

function growcalc_fertilizer_nutrition_settings_clear_fertilizer_nutritions_submit($form, &$form_state) {
  //$fertilizer_nutritions = growcalc_fertilizer_nutrition_load_multiple(FALSE);
  //foreach($fertilizer_nutritions as $fertilizer_nutrition) {
  //  if (isset($fertilizer_nutrition->growcalc_ions['und'])) {
  //    foreach($fertilizer_nutrition->growcalc_ions['und'] as $ion) {
  //      entity_delete('field_collection_item', reset($ion));
  //    }
  //  }
  //  growcalc_fertilizer_nutrition_delete($fertilizer_nutrition);
  //}

  db_query("truncate table {growcalc_fertilizer_nutrition}");

  drupal_set_message("All fertilizer nutritions has been deleted.");
}


/**
 * UI controller.
 */
class GrowcalcFertilizerNutritionUIController extends EntityDefaultUIController {

  /**
   * Overrides hook_menu() defaults. Main reason for doing this is that
   * parent class hook_menu() is optimized for entity type administration.
   */
  public function hook_menu() {
    
    $items = array();
    $id_count = count(explode('/', $this->path));
    $wildcard = isset($this->entityInfo['admin ui']['menu wildcard']) ? $this->entityInfo['admin ui']['menu wildcard'] : '%' . $this->entityType;

    $items[$this->path] = array(
      'title' => 'growcalc fertilizer nutritions',
      'description' => 'Add edit and update fertilizer nutritions.',
      'page callback' => 'system_admin_menu_block_page',
      'access arguments' => array('access administration pages'),
      'file path' => drupal_get_path('module', 'system'),
      'file' => 'system.admin.inc',
    );
    
    // Change the overview menu type for the list of growcalc_fertilizer_nutritions.
    $items[$this->path]['type'] = MENU_LOCAL_TASK;
    
    // Change the add page menu to multiple types of entities
    $items[$this->path . '/add'] = array(
      'title' => 'Add a growcalc_fertilizer_nutrition',
      'description' => 'Add a new growcalc_fertilizer_nutrition',
      'page callback'  => 'growcalc_fertilizer_nutrition_add_page',
      'access callback'  => 'growcalc_fertilizer_nutrition_access',
      'access arguments' => array('edit'),
      'type' => MENU_NORMAL_ITEM,
      'weight' => 20,
      'file' => 'growcalc_fertilizer_nutrition.admin.inc',
      'file path' => drupal_get_path('module', $this->entityInfo['module'])

    );
    
    // Add menu items to add each different type of entity.
    foreach (growcalc_fertilizer_nutrition_get_types() as $type) {
      $items[$this->path . '/add/' . $type->type] = array(
        'title' => 'Add ' . $type->label,
        'page callback' => 'growcalc_fertilizer_nutrition_form_wrapper',
        'page arguments' => array(growcalc_fertilizer_nutrition_create(array('type' => $type->type))),
        'access callback' => 'growcalc_fertilizer_nutrition_access',
        'access arguments' => array('edit', 'edit ' . $type->type),
        'file' => 'growcalc_fertilizer_nutrition.admin.inc',
        'file path' => drupal_get_path('module', $this->entityInfo['module'])
      );
    }

    // Loading and editing growcalc_fertilizer entities
    $items[$this->path . '/growcalc/fertilizer_nutrition/' . $wildcard] = array(
      'page callback' => 'growcalc_fertilizer_nutrition_form_wrapper',
      'page arguments' => array($id_count + 2),
      'access callback' => 'growcalc_fertilizer_nutrition_access',
      'access arguments' => array('edit', $id_count + 2),
      'weight' => 0,
      'context' => MENU_CONTEXT_PAGE | MENU_CONTEXT_INLINE,
      'file' => 'growcalc_fertilizer_nutrition.admin.inc',
      'file path' => drupal_get_path('module', $this->entityInfo['module'])
    );
    $items[$this->path . '/growcalc/fertilizer_nutrition/' . $wildcard . '/edit'] = array(
      'title' => 'Edit',
      'type' => MENU_DEFAULT_LOCAL_TASK,
      'weight' => -10,
      'context' => MENU_CONTEXT_PAGE | MENU_CONTEXT_INLINE,
    );
    
    $items[$this->path . '/growcalc/fertilizer_nutrition/' . $wildcard . '/delete'] = array(
      'title' => 'Delete',
      'page callback' => 'growcalc_fertilizer_nutrition_delete_form_wrapper',
      'page arguments' => array($id_count + 2),
      'access callback' => 'growcalc_fertilizer_nutrition_access',
      'access arguments' => array('edit', $id_count + 2),
      'type' => MENU_LOCAL_TASK,
      'context' => MENU_CONTEXT_INLINE,
      'weight' => 10,
      'file' => 'growcalc_fertilizer_nutrition.admin.inc',
      'file path' => drupal_get_path('module', $this->entityInfo['module'])
    );
    
    // Menu item for viewing growcalc_fertilizers
    $items['growcalc/fertilizer_nutrition/' . $wildcard] = array(
      //'title' => 'Title',
      'title callback' => 'growcalc_fertilizer_nutrition_page_title',
      'title arguments' => array(2),
      'page callback' => 'growcalc_fertilizer_nutrition_page_view',
      'page arguments' => array(2),
      'access callback' => 'growcalc_fertilizer_nutrition_access',
      'access arguments' => array('view', 2),
      'type' => MENU_CALLBACK,
    );
    return $items;
  }
  
  
  /**
   * Create the markup for the add growcalc_fertilizer_nutrition Entities page within the class
   * so it can easily be extended/overriden.
   */ 
  public function addPage() {
    $item = menu_get_item();
    $content = system_admin_menu_block($item);

    if (count($content) == 1) {
      $item = array_shift($content);
      drupal_goto($item['href']);
    }    
        
    return theme('growcalc_fertilizer_nutrition_add_list', array('content' => $content));
  }
  
}


/**
 * Form callback wrapper: create or edit a growcalc_fertilizer_nutrition.
 *
 * @param $growcalc_fertilizer_nutrition
 *   The growcalc_fertilizer_nutrition object being edited by this form.
 *
 * @see growcalc_fertilizer_nutrition_edit_form()
 */
function growcalc_fertilizer_nutrition_form_wrapper($growcalc_fertilizer_nutrition) {
  // Add the breadcrumb for the form's location.
  growcalc_fertilizer_nutrition_set_breadcrumb();
  return drupal_get_form('growcalc_fertilizer_nutrition_edit_form', $growcalc_fertilizer_nutrition);
}


/**
 * Form callback wrapper: delete a growcalc_fertilizer_nutrition.
 *
 * @param $growcalc_fertilizer_nutrition
 *   The growcalc_fertilizer_nutrition object being edited by this form.
 *
 * @see growcalc_fertilizer_nutrition_edit_form()
 */
function growcalc_fertilizer_nutrition_delete_form_wrapper($growcalc_fertilizer_nutrition) {
  // Add the breadcrumb for the form's location.
  //growcalc_fertilizer_nutrition_set_breadcrumb();
  return drupal_get_form('growcalc_fertilizer_nutrition_delete_form', $growcalc_fertilizer_nutrition);
}


/**
 * Form callback: create or edit a growcalc_fertilizer_nutrition.
 *
 * @param $growcalc_fertilizer_nutrition
 *   The growcalc_fertilizer_nutrition object to edit or for a create form an empty growcalc_fertilizer_nutrition object
 *     with only a growcalc_fertilizer_nutrition type defined.
 */
function growcalc_fertilizer_nutrition_edit_form($form, &$form_state, $growcalc_fertilizer_nutrition) {
  // Add the default field elements.
  $form['name'] = array(
    '#type' => 'textfield',
    '#title' => t('Name'),
    '#default_value' => isset($growcalc_fertilizer_nutrition->name) ? $growcalc_fertilizer_nutrition->name : '',
    '#maxlength' => 255,
    '#required' => TRUE,
    '#weight' => -5,
  );

  $form['description'] = array(
    '#type' => 'textfield',
    '#title' => t('Description'),
    '#default_value' => isset($growcalc_fertilizer_nutrition->description) ? $growcalc_fertilizer_nutrition->description : '',
    '#maxlength' => 255,
    '#required' => TRUE,
    '#weight' => -5,
  );

  $form['status'] = array(
    '#type' => 'checkbox',
    '#title' => t('Status'),
    '#default_value' => $growcalc_fertilizer_nutrition->status,
  );

  $form['data']['#tree'] = TRUE;
  /*$form['data']['sample_data'] = array(
    '#type' => 'textfield',
    '#title' => t('ASample data'),
    '#default_value' => isset($growcalc_fertilizer_nutrition->data['sample_data']) ? $growcalc_fertilizer_nutrition->data['sample_data'] : 1,
  );*/

  // Add the field related form elements.
  $form_state['growcalc_fertilizer_nutrition'] = $growcalc_fertilizer_nutrition;
  field_attach_form('growcalc_fertilizer_nutrition', $growcalc_fertilizer_nutrition, $form, $form_state);

  $form['actions'] = array(
    '#type' => 'container',
    '#attributes' => array('class' => array('form-actions')),
    '#weight' => 400,
  );

  // We add the form's #submit array to this button along with the actual submit
  // handler to preserve any submit handlers added by a form callback_wrapper.
  $submit = array();

  if (!empty($form['#submit'])) {
    $submit += $form['#submit'];
  }

  $form['actions']['submit'] = array(
    '#type' => 'submit',
    '#value' => t('Save fertilizer nutrition'),
    '#submit' => $submit + array('growcalc_fertilizer_nutrition_edit_form_submit'),
  );
  
  if (!empty($growcalc_fertilizer_nutrition->name)) {
    $form['actions']['delete'] = array(
      '#type' => 'submit',
      '#value' => t('Delete fertilizer nutrition'),
      '#suffix' => l(t('Cancel'), 'admin/content/growcalc/fertilizer_nutritions'),
      '#submit' => $submit + array('growcalc_fertilizer_nutrition_form_submit_delete'),
      '#weight' => 45,
    );
  }

  // We append the validate handler to #validate in case a form callback_wrapper
  // is used to add validate handlers earlier.
  $form['#validate'][] = 'growcalc_fertilizer_nutrition_edit_form_validate';
  return $form;
}


/**
 * Form API validate callback for the growcalc_fertilizer_nutrition form
 */
function growcalc_fertilizer_nutrition_edit_form_validate(&$form, &$form_state) {
  $growcalc_fertilizer_nutrition = $form_state['growcalc_fertilizer_nutrition'];
  
  // Notify field widgets to validate their data.
  field_attach_form_validate('growcalc_fertilizer_nutrition', $growcalc_fertilizer_nutrition, $form, $form_state);
}


/**
 * Form API submit callback for the growcalc_fertilizer_nutrition form.
 * 
 * @todo remove hard-coded link
 */
function growcalc_fertilizer_nutrition_edit_form_submit(&$form, &$form_state) {
  
  $growcalc_fertilizer_nutrition = entity_ui_controller('growcalc_fertilizer_nutrition')->entityFormSubmitBuildEntity($form, $form_state);
  // Save the growcalc_fertilizer_nutrition and go back to the list of growcalc_fertilizer_nutritions
  
  // Add in created and changed times.
  if ($growcalc_fertilizer_nutrition->is_new = isset($growcalc_fertilizer_nutrition->is_new) ? $growcalc_fertilizer_nutrition->is_new : 0){
    $growcalc_fertilizer_nutrition->created = time();
  }

  $growcalc_fertilizer_nutrition->changed = time();
  
  $growcalc_fertilizer_nutrition->save();
  $form_state['redirect'] = 'admin/content/growcalc/fertilizer_nutritions';
}

/**
 * Form API submit callback for the delete button.
 * 
 * @todo Remove hard-coded path
 */
function growcalc_fertilizer_nutrition_form_submit_delete(&$form, &$form_state) {
  $form_state['redirect'] = 'growcalc/fertilizer_nutrition/' . $form_state['growcalc_fertilizer_nutrition']->growcalc_fertilizer_nutrition_id . '/delete';
}


/**
 * Form callback: confirmation form for deleting a growcalc_fertilizer_nutrition.
 *
 * @param $growcalc_fertilizer_nutrition
 *   The growcalc_fertilizer_nutrition to delete
 *
 * @see confirm_form()
 */
function growcalc_fertilizer_nutrition_delete_form($form, &$form_state, $growcalc_fertilizer_nutrition) {
  $form_state['growcalc_fertilizer_nutrition'] = $growcalc_fertilizer_nutrition;

  $form['#submit'][] = 'growcalc_fertilizer_nutrition_delete_form_submit';

  $form = confirm_form($form,
    t('Are you sure you want to delete growcalc_fertilizer_nutrition %name?', array('%name' => $growcalc_fertilizer_nutrition->name)),
    'admin/content/growcalc/fertilizer_nutritions/growcalc/fertilizer_nutrition',
    '<p>' . t('This action cannot be undone.') . '</p>',
    t('Delete'),
    t('Cancel'),
    'confirm'
  );
  
  return $form;
}

/**
 * Submit callback for growcalc_fertilizer_nutrition_delete_form
 */
function growcalc_fertilizer_nutrition_delete_form_submit($form, &$form_state) {
  $growcalc_fertilizer_nutrition = $form_state['growcalc_fertilizer_nutrition'];

  growcalc_fertilizer_nutrition_delete($growcalc_fertilizer_nutrition);

  drupal_set_message(t('The growcalc_fertilizer_nutrition %name has been deleted.', array('%name' => $growcalc_fertilizer_nutrition->name)));
  watchdog('growcalc_fertilizer_nutrition', 'Deleted growcalc_fertilizer_nutrition %name.', array('%name' => $growcalc_fertilizer_nutrition->name));

  $form_state['redirect'] = 'admin/content/growcalc/fertilizer_nutritions';
}



/**
 * Page to add growcalc_fertilizer_nutrition Entities.
 *
 * @todo Pass this through a proper theme function
 */
function growcalc_fertilizer_nutrition_add_page() {
  $controller = entity_ui_controller('growcalc_fertilizer_nutrition');
  return $controller->addPage();
}


/**
 * Displays the list of available growcalc_fertilizer_nutrition types for growcalc_fertilizer_nutrition creation.
 *
 * @ingroup themeable
 */
function theme_growcalc_fertilizer_nutrition_add_list($variables) {
  $content = $variables['content'];
  $output = '';
  if ($content) {
    $output = '<dl class="growcalc-fertilizer-nutrition-type-list">';
    foreach ($content as $item) {
      $output .= '<dt>' . l($item['title'], $item['href']) . '</dt>';
      $output .= '<dd>' . filter_xss_admin($item['description']) . '</dd>';
    }
    $output .= '</dl>';
  }
  else {
    if (user_access('administer growcalc fertilizer nutrition types')) {
      $output = '<p>' . t('Fertilizer Nutrition Entities cannot be added because you have not created any fertilizer nutrition types yet. Go to the <a href="@create-growcalc-fertilizer-nutrition-type">fertilizer nutrition type creation page</a> to add a new fertilizer nutrition type.', array('@create-growcalc-fertilizer-nutrition-type' => url('admin/structure/growcalc/fertilizer_nutrition_types/add'))) . '</p>';
    }
    else {
      $output = '<p>' . t('No fertilizer nutrition types have been created yet for you to use.') . '</p>';
    }
  }

  return $output;
}





/**
 * Sets the breadcrumb for administrative growcalc_fertilizer_nutrition pages.
 */
function growcalc_fertilizer_nutrition_set_breadcrumb() {
  $breadcrumb = array(
    l(t('Home'), '<front>'),
    l(t('Administration'), 'admin'),
    l(t('Content'), 'admin/content'),
    l(t('Growcalc Fertilizer Nutritions'), 'admin/content/growcalc/fertilizer_nutritions'),
  );

  drupal_set_breadcrumb($breadcrumb);
}