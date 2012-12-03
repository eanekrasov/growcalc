<?php

/**
 * @file
 * growcalc_element_nutrition editing UI.
 *
 * We make very little use of the EntityAPI interface for this - preferring instead to use
 * views. That offers more flexibility to change a UI that will, more often than not,
 * be end-user facing.
 */

/**
 * Settings form for GrowCalc.
 */
function growcalc_element_nutrition_settings() {
  $form = array();
  
  $form['create_default_element_nutritions'] = array('#type' => 'submit', '#value' => t('Create default element nutritions'),'#submit' => array('growcalc_element_nutrition_settings_create_default_element_nutritions_submit'));
  $form['clear_element_nutritions'] = array('#type' => 'submit', '#value' => t('Clear element nutritions'),'#submit' => array('growcalc_element_nutrition_settings_clear_element_nutritions_submit'));

  return system_settings_form($form);
}

function growcalc_element_nutrition_settings_create_default_element_nutritions_submit($form, &$form_state) {
  module_load_include('inc', 'growcalc_element', 'growcalc_element.data');
  $elements = _growcalc_element_data();
  foreach($elements as $element) {
    $uri = growcalc_element_uri($element);
    drupal_set_message(t("Element @element has been created.", array('@element' => l($element->name, $uri['path']))));
  }
}

function growcalc_element_nutrition_settings_clear_element_nutritions_submit($form, &$form_state) {
  //$element_nutritions = growcalc_element_nutrition_load_multiple(FALSE);
  //foreach($element_nutritions as $element_nutrition) {
  //  if (isset($element_nutrition->growcalc_ions['und'])) {
  //    foreach($element_nutrition->growcalc_ions['und'] as $ion) {
  //      entity_delete('field_collection_item', reset($ion));
  //    }
  //  }
  //  growcalc_element_nutrition_delete($element_nutrition);
  //}

  db_query("truncate table {growcalc_element_nutrition}");

  drupal_set_message("All element nutritions has been deleted.");
}


/**
 * UI controller.
 */
class GrowcalcElementNutritionUIController extends EntityDefaultUIController {

  /**
   * Overrides hook_menu() defaults. Main reason for doing this is that
   * parent class hook_menu() is optimized for entity type administration.
   */
  public function hook_menu() {
    
    $items = array();
    $id_count = count(explode('/', $this->path));
    $wildcard = isset($this->entityInfo['admin ui']['menu wildcard']) ? $this->entityInfo['admin ui']['menu wildcard'] : '%' . $this->entityType;

    $items[$this->path] = array(
      'title' => 'growcalc element_nutritions',
      'description' => 'Add edit and update growcalc_element_nutritions.',
      'page callback' => 'system_admin_menu_block_page',
      'access arguments' => array('access administration pages'),
      'file path' => drupal_get_path('module', 'system'),
      'file' => 'system.admin.inc',
    );
    
    // Change the overview menu type for the list of growcalc_elements.
    $items[$this->path]['type'] = MENU_LOCAL_TASK;
    
    // Change the add page menu to multiple types of entities
    $items[$this->path . '/add'] = array(
      'title' => 'Add a growcalc_element_nutrition',
      'description' => 'Add a new growcalc_element_nutrition',
      'page callback'  => 'growcalc_element_nutrition_add_page',
      'access callback'  => 'growcalc_element_nutrition_access',
      'access arguments' => array('edit'),
      'type' => MENU_NORMAL_ITEM,
      'weight' => 20,
      'file' => 'growcalc_element_nutrition.admin.inc',
      'file path' => drupal_get_path('module', $this->entityInfo['module'])

    );
    
    // Add menu items to add each different type of entity.
    foreach (growcalc_element_nutrition_get_types() as $type) {
      $items[$this->path . '/add/' . $type->type] = array(
        'title' => 'Add ' . $type->label,
        'page callback' => 'growcalc_element_nutrition_form_wrapper',
        'page arguments' => array(growcalc_element_nutrition_create(array('type' => $type->type))),
        'access callback' => 'growcalc_element_nutrition_access',
        'access arguments' => array('edit', 'edit ' . $type->type),
        'file' => 'growcalc_element_nutrition.admin.inc',
        'file path' => drupal_get_path('module', $this->entityInfo['module'])
      );
    }

    // Loading and editing growcalc_element entities
    $items[$this->path . '/growcalc/element_nutrition/' . $wildcard] = array(
      'page callback' => 'growcalc_element_nutrition_form_wrapper',
      'page arguments' => array($id_count + 2),
      'access callback' => 'growcalc_element_nutrition_access',
      'access arguments' => array('edit', $id_count + 2),
      'weight' => 0,
      'context' => MENU_CONTEXT_PAGE | MENU_CONTEXT_INLINE,
      'file' => 'growcalc_element_nutrition.admin.inc',
      'file path' => drupal_get_path('module', $this->entityInfo['module'])
    );
    $items[$this->path . '/growcalc/element_nutrition/' . $wildcard . '/edit'] = array(
      'title' => 'Edit',
      'type' => MENU_DEFAULT_LOCAL_TASK,
      'weight' => -10,
      'context' => MENU_CONTEXT_PAGE | MENU_CONTEXT_INLINE,
    );
    
    $items[$this->path . '/growcalc/element_nutrition/' . $wildcard . '/delete'] = array(
      'title' => 'Delete',
      'page callback' => 'growcalc_element_nutrition_delete_form_wrapper',
      'page arguments' => array($id_count + 2),
      'access callback' => 'growcalc_element_nutrition_access',
      'access arguments' => array('edit', $id_count + 2),
      'type' => MENU_LOCAL_TASK,
      'context' => MENU_CONTEXT_INLINE,
      'weight' => 10,
      'file' => 'growcalc_element_nutrition.admin.inc',
      'file path' => drupal_get_path('module', $this->entityInfo['module'])
    );
    
    // Menu item for viewing growcalc_elements
    $items['growcalc/element_nutrition/' . $wildcard] = array(
      //'title' => 'Title',
      'title callback' => 'growcalc_element_nutrition_page_title',
      'title arguments' => array(2),
      'page callback' => 'growcalc_element_nutrition_page_view',
      'page arguments' => array(2),
      'access callback' => 'growcalc_element_nutrition_access',
      'access arguments' => array('view', 2),
      'type' => MENU_CALLBACK,
    );
    return $items;
  }
  
  
  /**
   * Create the markup for the add growcalc_element Entities page within the class
   * so it can easily be extended/overriden.
   */ 
  public function addPage() {
    $item = menu_get_item();
    $content = system_admin_menu_block($item);

    if (count($content) == 1) {
      $item = array_shift($content);
      drupal_goto($item['href']);
    }    
        
    return theme('growcalc_element_nutrition_add_list', array('content' => $content));
  }
  
}


/**
 * Form callback wrapper: create or edit a growcalc_element.
 *
 * @param $growcalc_element
 *   The growcalc_element object being edited by this form.
 *
 * @see growcalc_element_edit_form()
 */
function growcalc_element_nutrition_form_wrapper($growcalc_element_nutrition) {
  // Add the breadcrumb for the form's location.
  growcalc_element_nutrition_set_breadcrumb();
  return drupal_get_form('growcalc_element_nutrition_edit_form', $growcalc_element_nutrition);
}


/**
 * Form callback wrapper: delete a growcalc_element.
 *
 * @param $growcalc_element
 *   The growcalc_element object being edited by this form.
 *
 * @see growcalc_element_edit_form()
 */
function growcalc_element_nutrition_delete_form_wrapper($growcalc_element_nutrition) {
  // Add the breadcrumb for the form's location.
  //growcalc_element_set_breadcrumb();
  return drupal_get_form('growcalc_element_nutrition_delete_form', $growcalc_element_nutrition);
}


/**
 * Form callback: create or edit a growcalc_element.
 *
 * @param $growcalc_element
 *   The growcalc_element object to edit or for a create form an empty growcalc_element object
 *     with only a growcalc_element type defined.
 */
function growcalc_element_nutrition_edit_form($form, &$form_state, $growcalc_element_nutrition) {
  // Add the default field elements.
  $form['name'] = array(
    '#type' => 'textfield',
    '#title' => t('Name'),
    '#default_value' => isset($growcalc_element_nutrition->name) ? $growcalc_element_nutrition->name : '',
    '#maxlength' => 255,
    '#required' => TRUE,
    '#weight' => -5,
  );

  $form['description'] = array(
    '#type' => 'textfield',
    '#title' => t('Description'),
    '#default_value' => isset($growcalc_element_nutrition->description) ? $growcalc_element_nutrition->description : '',
    '#maxlength' => 255,
    '#required' => TRUE,
    '#weight' => -5,
  );

  $form['status'] = array(
    '#type' => 'checkbox',
    '#title' => t('Status'),
    '#default_value' => $growcalc_element_nutrition->status,
  );

  $form['data']['#tree'] = TRUE;
  /*$form['data']['sample_data'] = array(
    '#type' => 'textfield',
    '#title' => t('ASample data'),
    '#default_value' => isset($growcalc_element_nutrition->data['sample_data']) ? $growcalc_element_nutrition->data['sample_data'] : 1,
  );*/

  // Add the field related form elements.
  $form_state['growcalc_element_nutrition'] = $growcalc_element_nutrition;
  field_attach_form('growcalc_element_nutrition', $growcalc_element_nutrition, $form, $form_state);

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
    '#value' => t('Save growcalc_element_nutrition'),
    '#submit' => $submit + array('growcalc_element_nutrition_edit_form_submit'),
  );
  
  if (!empty($growcalc_element_nutrition->name)) {
    $form['actions']['delete'] = array(
      '#type' => 'submit',
      '#value' => t('Delete growcalc_element_nutrition'),
      '#suffix' => l(t('Cancel'), 'admin/content/growcalc/element_nutritions'),
      '#submit' => $submit + array('growcalc_element_nutrition_form_submit_delete'),
      '#weight' => 45,
    );
  }

  // We append the validate handler to #validate in case a form callback_wrapper
  // is used to add validate handlers earlier.
  $form['#validate'][] = 'growcalc_element_nutrition_edit_form_validate';
  return $form;
}


/**
 * Form API validate callback for the growcalc_element form
 */
function growcalc_element_nutrition_edit_form_validate(&$form, &$form_state) {
  $growcalc_element_nutrition = $form_state['growcalc_element_nutrition'];
  
  // Notify field widgets to validate their data.
  field_attach_form_validate('growcalc_element_nutrition', $growcalc_element_nutrition, $form, $form_state);
}


/**
 * Form API submit callback for the growcalc_element form.
 * 
 * @todo remove hard-coded link
 */
function growcalc_element_nutrition_edit_form_submit(&$form, &$form_state) {
  
  $growcalc_element_nutrition = entity_ui_controller('growcalc_element_nutrition')->entityFormSubmitBuildEntity($form, $form_state);
  // Save the growcalc_element and go back to the list of growcalc_elements
  
  // Add in created and changed times.
  if ($growcalc_element_nutrition->is_new = isset($growcalc_element_nutrition->is_new) ? $growcalc_element_nutrition->is_new : 0){
    $growcalc_element_nutrition->created = time();
  }

  $growcalc_element_nutrition->changed = time();
  
  $growcalc_element_nutrition->save();
  $form_state['redirect'] = 'admin/content/growcalc/element_nutritions';
}

/**
 * Form API submit callback for the delete button.
 * 
 * @todo Remove hard-coded path
 */
function growcalc_element_nutrition_form_submit_delete(&$form, &$form_state) {
  $form_state['redirect'] = 'admin/content/growcalc/element_nutritions/growcalc/element_nutrition/' . $form_state['growcalc_element_nutrition']->growcalc_element_nutrition_id . '/delete';
}


/**
 * Form callback: confirmation form for deleting a growcalc_element.
 *
 * @param $growcalc_element
 *   The growcalc_element to delete
 *
 * @see confirm_form()
 */
function growcalc_element_nutrition_delete_form($form, &$form_state, $growcalc_element_nutrition) {
  $form_state['growcalc_element_nutrition'] = $growcalc_element_nutrition;

  $form['#submit'][] = 'growcalc_element_nutrition_delete_form_submit';

  $form = confirm_form($form,
    t('Are you sure you want to delete growcalc_element_nutrition %name?', array('%name' => $growcalc_element_nutrition->name)),
    'admin/content/growcalc/element_nutritions/growcalc/element_nutrition',
    '<p>' . t('This action cannot be undone.') . '</p>',
    t('Delete'),
    t('Cancel'),
    'confirm'
  );
  
  return $form;
}

/**
 * Submit callback for growcalc_element_delete_form
 */
function growcalc_element_nutrition_delete_form_submit($form, &$form_state) {
  $growcalc_element_nutrition = $form_state['growcalc_element_nutrition'];

  growcalc_element_nutrition_delete($growcalc_element_nutrition);

  drupal_set_message(t('The growcalc_element_nutrition %name has been deleted.', array('%name' => $growcalc_element_nutrition->name)));
  watchdog('growcalc_element', 'Deleted growcalc_element_nutrition %name.', array('%name' => $growcalc_element_nutrition->name));

  $form_state['redirect'] = 'admin/content/growcalc/element_nutritions';
}



/**
 * Page to add growcalc_element Entities.
 *
 * @todo Pass this through a proper theme function
 */
function growcalc_element_nutrition_add_page() {
  $controller = entity_ui_controller('growcalc_element_nutrition');
  return $controller->addPage();
}


/**
 * Displays the list of available growcalc_element types for growcalc_element creation.
 *
 * @ingroup themeable
 */
function theme_growcalc_element_nutrition_add_list($variables) {
  $content = $variables['content'];
  $output = '';
  if ($content) {
    $output = '<dl class="growcalc-element-nutrition-type-list">';
    foreach ($content as $item) {
      $output .= '<dt>' . l($item['title'], $item['href']) . '</dt>';
      $output .= '<dd>' . filter_xss_admin($item['description']) . '</dd>';
    }
    $output .= '</dl>';
  }
  else {
    if (user_access('administer growcalc element nutrition types')) {
      $output = '<p>' . t('growcalc_element_nutrition Entities cannot be added because you have not created any growcalc_element_nutrition types yet. Go to the <a href="@create-growcalc-element_nutrition-type">growcalc_element_nutrition type creation page</a> to add a new growcalc_element_nutrition type.', array('@create-growcalc-element-nutrition-type' => url('admin/structure/growcalc/element_nutrition_types/add'))) . '</p>';
    }
    else {
      $output = '<p>' . t('No growcalc_element_nutrition types have been created yet for you to use.') . '</p>';
    }
  }

  return $output;
}





/**
 * Sets the breadcrumb for administrative growcalc_element pages.
 */
function growcalc_element_nutrition_set_breadcrumb() {
  $breadcrumb = array(
    l(t('Home'), '<front>'),
    l(t('Administration'), 'admin'),
    l(t('Content'), 'admin/content'),
    l(t('Growcalc Elements'), 'admin/content/growcalc/element_nutritions'),
  );

  drupal_set_breadcrumb($breadcrumb);
}
