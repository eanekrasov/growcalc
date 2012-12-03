<?php

/**
 * @file
 * growcalc_fertilizer editing UI.
 *
 * We make very little use of the EntityAPI interface for this - preferring instead to use
 * views. That offers more flexibility to change a UI that will, more often than not,
 * be end-user facing.
 */

/**
 * Settings form for GrowCalc.
 */
function growcalc_fertilizer_settings() {
  $form = array();
  
  $form['create_default_fertilizers'] = array('#type' => 'submit', '#value' => t('Create default fertilizers'),'#submit' => array('growcalc_fertilizer_settings_create_default_fertilizers_submit'));
  $form['clear_fertilizers'] = array('#type' => 'submit', '#value' => t('Clear fertilizers'),'#submit' => array('growcalc_fertilizer_settings_clear_fertilizers_submit'));

  return system_settings_form($form);
}

function growcalc_fertilizer_settings_create_default_fertilizers_submit($form, &$form_state) {
  module_load_include('inc', 'growcalc_fertilizer', 'growcalc_fertilizer.data');
  $fertilizers = _growcalc_fertilizer_data();
  foreach($fertilizers as $fertilizer) {
    $uri = growcalc_fertilizer_uri($fertilizer);
    drupal_set_message(t("Fertilizer @fertilizer has been created.", array('@fertilizer' => l($fertilizer->name, $uri['path']))));
  }
}

function growcalc_fertilizer_settings_clear_fertilizers_submit($form, &$form_state) {
  $fertilizers = growcalc_fertilizer_load_multiple(FALSE);
  foreach($fertilizers as $fertilizer) {
    if (isset($fertilizer->growcalc_elements['und'])) {
      foreach($fertilizer->growcalc_elements['und'] as $element) {
        entity_delete('field_collection_item', reset($element));
      }
    }
    growcalc_fertilizer_delete($fertilizer);
  }

  db_query("truncate table {growcalc_fertilizer}");

  drupal_set_message("All fertilizers has been deleted.");
}


/**
 * UI controller.
 */
class GrowcalcFertilizerUIController extends EntityDefaultUIController {

  /**
   * Overrides hook_menu() defaults. Main reason for doing this is that
   * parent class hook_menu() is optimized for entity type administration.
   */
  public function hook_menu() {
    
    $items = array();
    $id_count = count(explode('/', $this->path));
    $wildcard = isset($this->entityInfo['admin ui']['menu wildcard']) ? $this->entityInfo['admin ui']['menu wildcard'] : '%' . $this->entityType;

    $items[$this->path] = array(
      'title' => 'growcalc fertilizers',
      'description' => 'Add edit and update growcalc_fertilizers.',
      'page callback' => 'system_admin_menu_block_page',
      'access arguments' => array('access administration pages'),
      'file path' => drupal_get_path('module', 'system'),
      'file' => 'system.admin.inc',
    );
    
    // Change the overview menu type for the list of growcalc_fertilizers.
    $items[$this->path]['type'] = MENU_LOCAL_TASK;
    
    // Change the add page menu to multiple types of entities
    $items[$this->path . '/add'] = array(
      'title' => 'Add a growcalc_fertilizer',
      'description' => 'Add a new growcalc_fertilizer',
      'page callback'  => 'growcalc_fertilizer_add_page',
      'access callback'  => 'growcalc_fertilizer_access',
      'access arguments' => array('edit'),
      'type' => MENU_NORMAL_ITEM,
      'weight' => 20,
      'file' => 'growcalc_fertilizer.admin.inc',
      'file path' => drupal_get_path('module', $this->entityInfo['module'])

    );
    
    // Add menu items to add each different type of entity.
    foreach (growcalc_fertilizer_get_types() as $type) {
      $items[$this->path . '/add/' . $type->type] = array(
        'title' => 'Add ' . $type->label,
        'page callback' => 'growcalc_fertilizer_form_wrapper',
        'page arguments' => array(growcalc_fertilizer_create(array('type' => $type->type))),
        'access callback' => 'growcalc_fertilizer_access',
        'access arguments' => array('edit', 'edit ' . $type->type),
        'file' => 'growcalc_fertilizer.admin.inc',
        'file path' => drupal_get_path('module', $this->entityInfo['module'])
      );
    }

    // Loading and editing growcalc_fertilizer entities
    $items[$this->path . '/growcalc/fertilizer/' . $wildcard] = array(
      'page callback' => 'growcalc_fertilizer_form_wrapper',
      'page arguments' => array($id_count + 2),
      'access callback' => 'growcalc_fertilizer_access',
      'access arguments' => array('edit', $id_count + 1),
      'weight' => 0,
      'context' => MENU_CONTEXT_PAGE | MENU_CONTEXT_INLINE,
      'file' => 'growcalc_fertilizer.admin.inc',
      'file path' => drupal_get_path('module', $this->entityInfo['module'])
    );
    $items[$this->path . '/growcalc/fertilizer/' . $wildcard . '/edit'] = array(
      'title' => 'Edit',
      'type' => MENU_DEFAULT_LOCAL_TASK,
      'weight' => -10,
      'context' => MENU_CONTEXT_PAGE | MENU_CONTEXT_INLINE,
    );
    
    $items[$this->path . '/growcalc/fertilizer/' . $wildcard . '/delete'] = array(
      'title' => 'Delete',
      'page callback' => 'growcalc_fertilizer_delete_form_wrapper',
      'page arguments' => array($id_count + 2),
      'access callback' => 'growcalc_fertilizer_access',
      'access arguments' => array('edit', $id_count + 1),
      'type' => MENU_LOCAL_TASK,
      'context' => MENU_CONTEXT_INLINE,
      'weight' => 10,
      'file' => 'growcalc_fertilizer.admin.inc',
      'file path' => drupal_get_path('module', $this->entityInfo['module'])
    );
    
    // Menu item for viewing growcalc_fertilizers
    $items['growcalc/fertilizer/' . $wildcard] = array(
      //'title' => 'Title',
      'title callback' => 'growcalc_fertilizer_page_title',
      'title arguments' => array(2),
      'page callback' => 'growcalc_fertilizer_page_view',
      'page arguments' => array(2),
      'access callback' => 'growcalc_fertilizer_access',
      'access arguments' => array('view', 2),
      'type' => MENU_CALLBACK,
    );
    return $items;
  }
  
  
  /**
   * Create the markup for the add growcalc_fertilizer Entities page within the class
   * so it can easily be extended/overriden.
   */ 
  public function addPage() {
    $item = menu_get_item();
    $content = system_admin_menu_block($item);

    if (count($content) == 1) {
      $item = array_shift($content);
      drupal_goto($item['href']);
    }    
        
    return theme('growcalc_fertilizer_add_list', array('content' => $content));
  }
  
}


/**
 * Form callback wrapper: create or edit a growcalc_fertilizer.
 *
 * @param $growcalc_fertilizer
 *   The growcalc_fertilizer object being edited by this form.
 *
 * @see growcalc_fertilizer_edit_form()
 */
function growcalc_fertilizer_form_wrapper($growcalc_fertilizer) {
  // Add the breadcrumb for the form's location.
  growcalc_fertilizer_set_breadcrumb();
  return drupal_get_form('growcalc_fertilizer_edit_form', $growcalc_fertilizer);
}


/**
 * Form callback wrapper: delete a growcalc_fertilizer.
 *
 * @param $growcalc_fertilizer
 *   The growcalc_fertilizer object being edited by this form.
 *
 * @see growcalc_fertilizer_edit_form()
 */
function growcalc_fertilizer_delete_form_wrapper($growcalc_fertilizer) {
  // Add the breadcrumb for the form's location.
  //growcalc_fertilizer_set_breadcrumb();
  return drupal_get_form('growcalc_fertilizer_delete_form', $growcalc_fertilizer);
}


/**
 * Form callback: create or edit a growcalc_fertilizer.
 *
 * @param $growcalc_fertilizer
 *   The growcalc_fertilizer object to edit or for a create form an empty growcalc_fertilizer object
 *     with only a growcalc_fertilizer type defined.
 */
function growcalc_fertilizer_edit_form($form, &$form_state, $growcalc_fertilizer) {
  // Add the default field fertilizers.
  $form['name'] = array(
    '#type' => 'textfield',
    '#title' => t('Name'),
    '#default_value' => isset($growcalc_fertilizer->name) ? $growcalc_fertilizer->name : '',
    '#maxlength' => 255,
    '#required' => TRUE,
    '#weight' => -5,
  );

  $form['description'] = array(
    '#type' => 'textfield',
    '#title' => t('Description'),
    '#default_value' => isset($growcalc_fertilizer->description) ? $growcalc_fertilizer->description : '',
    '#maxlength' => 255,
    '#required' => TRUE,
    '#weight' => -5,
  );

  $form['status'] = array(
    '#type' => 'checkbox',
    '#title' => t('Status'),
    '#default_value' => $growcalc_fertilizer->status,
  );

  $form['data']['#tree'] = TRUE;
  /*$form['data']['sample_data'] = array(
    '#type' => 'textfield',
    '#title' => t('ASample data'),
    '#default_value' => isset($growcalc_fertilizer->data['sample_data']) ? $growcalc_fertilizer->data['sample_data'] : 1,
  );*/

  // Add the field related form fertilizers.
  $form_state['growcalc_fertilizer'] = $growcalc_fertilizer;
  field_attach_form('growcalc_fertilizer', $growcalc_fertilizer, $form, $form_state);

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
    '#value' => t('Save growcalc_fertilizer'),
    '#submit' => $submit + array('growcalc_fertilizer_edit_form_submit'),
  );
  
  if (!empty($growcalc_fertilizer->name)) {
    $form['actions']['delete'] = array(
      '#type' => 'submit',
      '#value' => t('Delete growcalc_fertilizer'),
      '#suffix' => l(t('Cancel'), 'admin/content/growcalc/fertilizers'),
      '#submit' => $submit + array('growcalc_fertilizer_form_submit_delete'),
      '#weight' => 45,
    );
  }

  // We append the validate handler to #validate in case a form callback_wrapper
  // is used to add validate handlers earlier.
  $form['#validate'][] = 'growcalc_fertilizer_edit_form_validate';
  return $form;
}


/**
 * Form API validate callback for the growcalc_fertilizer form
 */
function growcalc_fertilizer_edit_form_validate(&$form, &$form_state) {
  $growcalc_fertilizer = $form_state['growcalc_fertilizer'];
  
  // Notify field widgets to validate their data.
  field_attach_form_validate('growcalc_fertilizer', $growcalc_fertilizer, $form, $form_state);
}


/**
 * Form API submit callback for the growcalc_fertilizer form.
 * 
 * @todo remove hard-coded link
 */
function growcalc_fertilizer_edit_form_submit(&$form, &$form_state) {
  
  $growcalc_fertilizer = entity_ui_controller('growcalc_fertilizer')->entityFormSubmitBuildEntity($form, $form_state);
  // Save the growcalc_fertilizer and go back to the list of growcalc_fertilizers
  
  // Add in created and changed times.
  if ($growcalc_fertilizer->is_new = isset($growcalc_fertilizer->is_new) ? $growcalc_fertilizer->is_new : 0){
    $growcalc_fertilizer->created = time();
  }

  $growcalc_fertilizer->changed = time();
  
  $growcalc_fertilizer->save();
  $form_state['redirect'] = 'admin/content/growcalc/fertilizers';
}

/**
 * Form API submit callback for the delete button.
 * 
 * @todo Remove hard-coded path
 */
function growcalc_fertilizer_form_submit_delete(&$form, &$form_state) {
  $form_state['redirect'] = 'admin/content/growcalc/fertilizers/growcalc_fertilizer/' . $form_state['growcalc_fertilizer']->growcalc_fertilizer_id . '/delete';
}


/**
 * Form callback: confirmation form for deleting a growcalc_fertilizer.
 *
 * @param $growcalc_fertilizer
 *   The growcalc_fertilizer to delete
 *
 * @see confirm_form()
 */
function growcalc_fertilizer_delete_form($form, &$form_state, $growcalc_fertilizer) {
  $form_state['growcalc_fertilizer'] = $growcalc_fertilizer;

  $form['#submit'][] = 'growcalc_fertilizer_delete_form_submit';

  $form = confirm_form($form,
    t('Are you sure you want to delete growcalc_fertilizer %name?', array('%name' => $growcalc_fertilizer->name)),
    'admin/content/growcalc/fertilizers/growcalc_fertilizer',
    '<p>' . t('This action cannot be undone.') . '</p>',
    t('Delete'),
    t('Cancel'),
    'confirm'
  );
  
  return $form;
}

/**
 * Submit callback for growcalc_fertilizer_delete_form
 */
function growcalc_fertilizer_delete_form_submit($form, &$form_state) {
  $growcalc_fertilizer = $form_state['growcalc_fertilizer'];

  growcalc_fertilizer_delete($growcalc_fertilizer);

  drupal_set_message(t('The growcalc_fertilizer %name has been deleted.', array('%name' => $growcalc_fertilizer->name)));
  watchdog('growcalc_fertilizer', 'Deleted growcalc_fertilizer %name.', array('%name' => $growcalc_fertilizer->name));

  $form_state['redirect'] = 'admin/content/growcalc/fertilizers';
}



/**
 * Page to add growcalc_fertilizer Entities.
 *
 * @todo Pass this through a proper theme function
 */
function growcalc_fertilizer_add_page() {
  $controller = entity_ui_controller('growcalc_fertilizer');
  return $controller->addPage();
}


/**
 * Displays the list of available growcalc_fertilizer types for growcalc_fertilizer creation.
 *
 * @ingroup themeable
 */
function theme_growcalc_fertilizer_add_list($variables) {
  $content = $variables['content'];
  $output = '';
  if ($content) {
    $output = '<dl class="growcalc-fertilizer-type-list">';
    foreach ($content as $item) {
      $output .= '<dt>' . l($item['title'], $item['href']) . '</dt>';
      $output .= '<dd>' . filter_xss_admin($item['description']) . '</dd>';
    }
    $output .= '</dl>';
  }
  else {
    if (user_access('administer growcalc fertilizer types')) {
      $output = '<p>' . t('growcalc_fertilizer Entities cannot be added because you have not created any growcalc_fertilizer types yet. Go to the <a href="@create-growcalc-fertilizer-type">growcalc_fertilizer type creation page</a> to add a new growcalc_fertilizer type.', array('@create-growcalc-fertilizer-type' => url('admin/structure/growcalc/fertilizer_types/add'))) . '</p>';
    }
    else {
      $output = '<p>' . t('No growcalc_fertilizer types have been created yet for you to use.') . '</p>';
    }
  }

  return $output;
}





/**
 * Sets the breadcrumb for administrative growcalc_fertilizer pages.
 */
function growcalc_fertilizer_set_breadcrumb() {
  $breadcrumb = array(
    l(t('Home'), '<front>'),
    l(t('Administration'), 'admin'),
    l(t('Content'), 'admin/content'),
    l(t('Growcalc fertilizers'), 'admin/content/growcalc/fertilizers'),
  );

  drupal_set_breadcrumb($breadcrumb);
}



