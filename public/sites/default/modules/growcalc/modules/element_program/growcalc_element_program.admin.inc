<?php

/**
 * @file
 * growcalc_element_program editing UI.
 *
 * We make very little use of the EntityAPI interface for this - preferring instead to use
 * views. That offers more flexibility to change a UI that will, more often than not,
 * be end-user facing.
 */

/**
 * Settings form for GrowCalc.
 */
function growcalc_element_program_settings() {
  $form = array();
  
  $form['create_default_element_programs'] = array('#type' => 'submit', '#value' => t('Create default element programs'),'#submit' => array('growcalc_element_program_settings_create_default_element_programs_submit'));
  $form['clear_element_programs'] = array('#type' => 'submit', '#value' => t('Clear element_programs'),'#submit' => array('growcalc_element_program_settings_clear_element_programs_submit'));

  return system_settings_form($form);
}

function growcalc_element_program_settings_create_default_element_programs_submit($form, &$form_state) {
  module_load_include('inc', 'growcalc_element_program', 'growcalc_element_program.data');
  $element_programs = _growcalc_element_program_data();
  foreach($element_programs as $element_program) {
    $uri = growcalc_element_program_uri($element_program);
    drupal_set_message(t("element_program @element_program has been created.", array('@element_program' => l($element_program->name, $uri['path']))));
  }
}

function growcalc_element_program_settings_clear_element_programs_submit($form, &$form_state) {
  $element_programs = growcalc_element_program_load_multiple(FALSE);
  foreach($element_programs as $element_program) {
    if (isset($element_program->growcalc_ions['und'])) {
      foreach($element_program->growcalc_ions['und'] as $ion) {
        entity_delete('field_collection_item', reset($ion));
      }
    }
    growcalc_element_program_delete($element_program);
  }

  db_query("truncate table {growcalc_element_program}");

  drupal_set_message("All element_programs has been deleted.");
}


/**
 * UI controller.
 */
class GrowcalcElementProgramUIController extends EntityDefaultUIController {

  /**
   * Overrides hook_menu() defaults. Main reason for doing this is that
   * parent class hook_menu() is optimized for entity type administration.
   */
  public function hook_menu() {
    
    $items = array();
    $id_count = count(explode('/', $this->path));
    $wildcard = isset($this->entityInfo['admin ui']['menu wildcard']) ? $this->entityInfo['admin ui']['menu wildcard'] : '%' . $this->entityType;

    $items[$this->path] = array(
      'title' => 'growcalc element_programs',
      'description' => 'Add edit and update growcalc_element_programs.',
      'page callback' => 'system_admin_menu_block_page',
      'access arguments' => array('access administration pages'),
      'file path' => drupal_get_path('module', 'system'),
      'file' => 'system.admin.inc',
    );
    
    // Change the overview menu type for the list of growcalc_element_programs.
    $items[$this->path]['type'] = MENU_LOCAL_TASK;
    
    // Change the add page menu to multiple types of entities
    $items['growcalc/add/element_program'] = array(
      'title' => 'Add a growcalc_element_program',
      'description' => 'Add a new growcalc_element_program',
      'page callback'  => 'growcalc_element_program_add_page',
      'access callback'  => 'growcalc_element_program_access',
      'access arguments' => array('edit'),
      'type' => MENU_NORMAL_ITEM,
      'weight' => 20,
      'file' => 'growcalc_element_program.admin.inc',
      'file path' => drupal_get_path('module', $this->entityInfo['module'])

    );
    
    // Add menu items to add each different type of entity.
    foreach (growcalc_element_program_get_types() as $type) {
      $items['growcalc/add/element_program/' . $type->type] = array(
        'title' => 'Add ' . $type->label,
        'page callback' => 'growcalc_element_program_form_wrapper',
        'page arguments' => array(growcalc_element_program_create(array('type' => $type->type))),
        'access callback' => 'growcalc_element_program_access',
        'access arguments' => array('edit', 'edit ' . $type->type),
        'file' => 'growcalc_element_program.admin.inc',
        'file path' => drupal_get_path('module', $this->entityInfo['module'])
      );
    }

    // Menu item for viewing growcalc_element_programs
    $items['growcalc/element_program/' . $wildcard] = array(
      'title callback' => 'growcalc_element_program_page_title',
      'title arguments' => array(2),
      'page callback' => 'growcalc_element_program_page_view',
      'page arguments' => array(2),
      'access callback' => 'growcalc_element_program_access',
      'access arguments' => array('view', 2),
      'type' => MENU_CALLBACK,
      'weight' => 0,
      'context' => MENU_CONTEXT_PAGE | MENU_CONTEXT_INLINE,
    );

    $items['growcalc/element_program/' . $wildcard . '/view'] = array(
      'title' => 'View',
      'type' => MENU_DEFAULT_LOCAL_TASK,
      'weight' => -10,
      'context' => MENU_CONTEXT_PAGE | MENU_CONTEXT_INLINE,
    );

    $items['growcalc/element_program/' . $wildcard . '/edit'] = array(
      'title' => 'Edit',
      'page callback' => 'growcalc_element_program_form_wrapper',
      'page arguments' => array(2),
      'access callback' => 'growcalc_element_program_access',
      'access arguments' => array('edit', 2),
      'type' => MENU_LOCAL_TASK,
      'context' => MENU_CONTEXT_PAGE | MENU_CONTEXT_INLINE,
      'weight' => 5,
      'file' => 'growcalc_element_program.admin.inc',
      'file path' => drupal_get_path('module', $this->entityInfo['module'])
    );

    
    $items['growcalc/element_program/' . $wildcard . '/delete'] = array(
      'title' => 'Delete',
      'page callback' => 'growcalc_element_program_delete_form_wrapper',
      'page arguments' => array(2),
      'access callback' => 'growcalc_element_program_access',
      'access arguments' => array('edit', 2),
      'type' => MENU_LOCAL_TASK,
      'context' => MENU_CONTEXT_INLINE,
      'weight' => 10,
      'file' => 'growcalc_element_program.admin.inc',
      'file path' => drupal_get_path('module', $this->entityInfo['module'])
    );

    return $items;
  }
  
  
  /**
   * Create the markup for the add growcalc_element_program Entities page within the class
   * so it can easily be extended/overriden.
   */ 
  public function addPage() {
    $item = menu_get_item();
    $content = system_admin_menu_block($item);

    if (count($content) == 1) {
      $item = array_shift($content);
      drupal_goto($item['href']);
    }    
        
    return theme('growcalc_element_program_add_list', array('content' => $content));
  }
  
}


/**
 * Form callback wrapper: create or edit a growcalc_element_program.
 *
 * @param $growcalc_element_program
 *   The growcalc_element_program object being edited by this form.
 *
 * @see growcalc_element_program_edit_form()
 */
function growcalc_element_program_form_wrapper($growcalc_element_program) {
  // Add the breadcrumb for the form's location.
  growcalc_element_program_set_breadcrumb($growcalc_element_program);
  return drupal_get_form('growcalc_element_program_edit_form', $growcalc_element_program);
}


/**
 * Form callback wrapper: delete a growcalc_element_program.
 *
 * @param $growcalc_element_program
 *   The growcalc_element_program object being edited by this form.
 *
 * @see growcalc_element_program_edit_form()
 */
function growcalc_element_program_delete_form_wrapper($growcalc_element_program) {
  // Add the breadcrumb for the form's location.
  //growcalc_element_program_set_breadcrumb();
  return drupal_get_form('growcalc_element_program_delete_form', $growcalc_element_program);
}


/**
 * Form callback: create or edit a growcalc_element_program.
 *
 * @param $growcalc_element_program
 *   The growcalc_element_program object to edit or for a create form an empty growcalc_element_program object
 *     with only a growcalc_element_program type defined.
 */
function growcalc_element_program_edit_form($form, &$form_state, $growcalc_element_program) {
  // Add the default field element_programs.
  $form['name'] = array(
    '#type' => 'textfield',
    '#title' => t('Name'),
    '#default_value' => isset($growcalc_element_program->name) ? $growcalc_element_program->name : '',
    '#maxlength' => 255,
    '#required' => TRUE,
    '#weight' => -5,
  );

  $form['description'] = array(
    '#type' => 'textfield',
    '#title' => t('Description'),
    '#default_value' => isset($growcalc_element_program->description) ? $growcalc_element_program->description : '',
    '#maxlength' => 255,
    '#required' => TRUE,
    '#weight' => -5,
  );

  $form['status'] = array(
    '#type' => 'checkbox',
    '#title' => t('Status'),
    '#default_value' => $growcalc_element_program->status,
  );

  $form['data']['#tree'] = TRUE;
  /*$form['data']['sample_data'] = array(
    '#type' => 'textfield',
    '#title' => t('ASample data'),
    '#default_value' => isset($growcalc_element_program->data['sample_data']) ? $growcalc_element_program->data['sample_data'] : 1,
  );*/

  // Add the field related form element_programs.
  $form_state['growcalc_element_program'] = $growcalc_element_program;
  field_attach_form('growcalc_element_program', $growcalc_element_program, $form, $form_state);

  //unset($form['growcalc_element_stages']);

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
    '#value' => t('Save growcalc_element_program'),
    '#submit' => $submit + array('growcalc_element_program_edit_form_submit'),
  );
  
  if (!empty($growcalc_element_program->name)) {
    $form['actions']['delete'] = array(
      '#type' => 'submit',
      '#value' => t('Delete growcalc_element_program'),
      '#suffix' => l(t('Cancel'), 'admin/content/growcalc_element_programs'),
      '#submit' => $submit + array('growcalc_element_program_form_submit_delete'),
      '#weight' => 45,
    );
  }

  // We append the validate handler to #validate in case a form callback_wrapper
  // is used to add validate handlers earlier.
  $form['#validate'][] = 'growcalc_element_program_edit_form_validate';
  return $form;
}


/**
 * Form API validate callback for the growcalc_element_program form
 */
function growcalc_element_program_edit_form_validate(&$form, &$form_state) {
  $growcalc_element_program = $form_state['growcalc_element_program'];
  
  // Notify field widgets to validate their data.
  field_attach_form_validate('growcalc_element_program', $growcalc_element_program, $form, $form_state);
}


/**
 * Form API submit callback for the growcalc_element_program form.
 * 
 * @todo remove hard-coded link
 */
function growcalc_element_program_edit_form_submit(&$form, &$form_state) {
  $growcalc_element_program = entity_ui_controller('growcalc_element_program')->entityFormSubmitBuildEntity($form, $form_state);
  // Save the growcalc_element_program and go back to the list of growcalc_element_programs

  dsm($growcalc_element_program->growcalc_element_stages);
  // Add in created and changed times.
  if ($growcalc_element_program->is_new = isset($growcalc_element_program->is_new) ? $growcalc_element_program->is_new : 0){
    $growcalc_element_program->created = time();
  }

  $growcalc_element_program->changed = time();
  
  $growcalc_element_program->save();
  //$form_state['redirect'] = 'admin/content/growcalc_element_programs';
}

/**
 * Form API submit callback for the delete button.
 * 
 * @todo Remove hard-coded path
 */
function growcalc_element_program_form_submit_delete(&$form, &$form_state) {
  $form_state['redirect'] = 'growcalc/element_program/' . $form_state['growcalc_element_program']->growcalc_element_program_id . '/delete';
}


/**
 * Form callback: confirmation form for deleting a growcalc_element_program.
 *
 * @param $growcalc_element_program
 *   The growcalc_element_program to delete
 *
 * @see confirm_form()
 */
function growcalc_element_program_delete_form($form, &$form_state, $growcalc_element_program) {
  $form_state['growcalc_element_program'] = $growcalc_element_program;

  $form['#submit'][] = 'growcalc_element_program_delete_form_submit';

  $form = confirm_form($form,
    t('Are you sure you want to delete growcalc_element_program %name?', array('%name' => $growcalc_element_program->name)),
    'admin/content/growcalc_element_programs/growcalc_element_program',
    '<p>' . t('This action cannot be undone.') . '</p>',
    t('Delete'),
    t('Cancel'),
    'confirm'
  );
  
  return $form;
}

/**
 * Submit callback for growcalc_element_program_delete_form
 */
function growcalc_element_program_delete_form_submit($form, &$form_state) {
  $growcalc_element_program = $form_state['growcalc_element_program'];

  growcalc_element_program_delete($growcalc_element_program);

  drupal_set_message(t('The growcalc_element_program %name has been deleted.', array('%name' => $growcalc_element_program->name)));
  watchdog('growcalc_element_program', 'Deleted growcalc_element_program %name.', array('%name' => $growcalc_element_program->name));

  $form_state['redirect'] = 'admin/content/growcalc_element_programs';
}



/**
 * Page to add growcalc_element_program Entities.
 *
 * @todo Pass this through a proper theme function
 */
function growcalc_element_program_add_page() {
  $controller = entity_ui_controller('growcalc_element_program');
  return $controller->addPage();
}


/**
 * Displays the list of available growcalc_element_program types for growcalc_element_program creation.
 *
 * @ingroup themeable
 */
function theme_growcalc_element_program_add_list($variables) {
  $content = $variables['content'];
  $output = '';
  if ($content) {
    $output = '<dl class="growcalc-element-program-type-list">';
    foreach ($content as $item) {
      $output .= '<dt>' . l($item['title'], $item['href']) . '</dt>';
      $output .= '<dd>' . filter_xss_admin($item['description']) . '</dd>';
    }
    $output .= '</dl>';
  }
  else {
    if (user_access('administer growcalc element program types')) {
      $output = '<p>' . t('growcalc_element_program Entities cannot be added because you have not created any growcalc_element_program types yet. Go to the <a href="@create-growcalc-element-program-type">growcalc_element_program type creation page</a> to add a new growcalc_element_program type.', array('@create-growcalc-element-program-type' => url('gorowcalc/add/element_program'))) . '</p>';
    }
    else {
      $output = '<p>' . t('No growcalc_element_program types have been created yet for you to use.') . '</p>';
    }
  }

  return $output;
}





/**
 * Sets the breadcrumb for administrative growcalc_element_program pages.
 */
function growcalc_element_program_set_breadcrumb($growcalc_element_program = null) {
  $breadcrumb = array(
    l(t('Home'), '<front>'),
//    l(t('Administration'), 'admin'),
//    l(t('Growcalc'), 'growcalc'),
    l($growcalc_element_program->name, 'growcalc/element_program/' . $growcalc_element_program->growcalc_element_program_id),
  );

  drupal_set_breadcrumb($breadcrumb);
}



