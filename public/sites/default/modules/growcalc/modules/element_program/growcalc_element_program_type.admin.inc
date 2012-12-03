<?php

/**
 * @file
 * growcalc_element_program type editing UI.
 */

/**
 * UI controller.
 */
class GrowcalcElementProgramTypeUIController extends EntityDefaultUIController {

  /**
   * Overrides hook_menu() defaults.
   */
  public function hook_menu() {
    $items = parent::hook_menu();
		$items[$this->path]['description'] = 'Manage growcalc_element_program entity types, including adding and removing fields and the display of fields.';
    return $items;
  }
}

/**
 * Generates the growcalc_element_program type editing form.
 */
function growcalc_element_program_type_form($form, &$form_state, $growcalc_element_program_type, $op = 'edit') {

  if ($op == 'clone') {
    $growcalc_element_program_type->label .= ' (cloned)';
    $growcalc_element_program_type->type = '';
  }

  $form['label'] = array(
    '#title' => t('Label'),
    '#type' => 'textfield',
    '#default_value' => $growcalc_element_program_type->label,
    '#description' => t('The human-readable name of this growcalc_element_program type.'),
    '#required' => TRUE,
    '#size' => 30,
  );
  // Machine-readable type name.
  $form['type'] = array(
    '#type' => 'machine_name',
    '#default_value' => isset($growcalc_element_program_type->type) ? $growcalc_element_program_type->type : '',
    '#maxlength' => 32,
//    '#disabled' => $growcalc_element_program_type->isLocked() && $op != 'clone',
    '#machine_name' => array(
      'exists' => 'growcalc_element_program_get_types',
      'source' => array('label'),
    ),
    '#description' => t('A unique machine-readable name for this growcalc_element_program type. It must only contain lowercase letters, numbers, and underscores.'),
  );

  $form['data']['#tree'] = TRUE;
  /*$form['data']['sample_data'] = array(
    '#type' => 'checkbox',
    '#title' => t('An interesting growcalc_element_program switch'),
    '#default_value' => !empty($growcalc_element_program_type->data['sample_data']),
  );*/

  $form['actions'] = array('#type' => 'actions');
  $form['actions']['submit'] = array(
    '#type' => 'submit',
    '#value' => t('Save growcalc_element_program type'),
    '#weight' => 40,
  );

  //Locking not supported yet
  /*if (!$growcalc_element_program_type->isLocked() && $op != 'add') {
    $form['actions']['delete'] = array(
      '#type' => 'submit',
      '#value' => t('Delete growcalc_element_program type'),
      '#weight' => 45,
      '#limit_validation_errors' => array(),
      '#submit' => array('growcalc_element_program_type_form_submit_delete')
    );
  }*/
  return $form;
}

/**
 * Form API submit callback for the type form.
 */
function growcalc_element_program_type_form_submit(&$form, &$form_state) {
  $growcalc_element_program_type = entity_ui_form_submit_build_entity($form, $form_state);
  $growcalc_element_program_type->save();
  $form_state['redirect'] = 'admin/structure/growcalc_element_program_types';
}

/**
 * Form API submit callback for the delete button.
 */
function growcalc_element_program_type_form_submit_delete(&$form, &$form_state) {
  $form_state['redirect'] = 'admin/structure/growcalc_element_program_types/manage/' . $form_state['growcalc_element_program_type']->type . '/delete';
}
