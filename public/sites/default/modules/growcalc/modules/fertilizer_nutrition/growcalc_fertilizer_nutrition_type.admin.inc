<?php

/**
 * @file
 * growcalc_fertilizer_nutrition type editing UI.
 */

/**
 * UI controller.
 */
class GrowcalcFertilizerNutritionTypeUIController extends EntityDefaultUIController {

  /**
   * Overrides hook_menu() defaults.
   */
  public function hook_menu() {
    $items = parent::hook_menu();
		$items[$this->path]['description'] = 'Manage fertilizer nutrition entity types, including adding and removing fields and the display of fields.';
    return $items;
  }
}

/**
 * Generates the growcalc_fertilizer_nutrition type editing form.
 */
function growcalc_fertilizer_nutrition_type_form($form, &$form_state, $growcalc_fertilizer_nutrition_type, $op = 'edit') {

  if ($op == 'clone') {
    $growcalc_fertilizer_nutrition_type->label .= ' (cloned)';
    $growcalc_fertilizer_nutrition_type->type = '';
  }

  $form['label'] = array(
    '#title' => t('Label'),
    '#type' => 'textfield',
    '#default_value' => $growcalc_fertilizer_nutrition_type->label,
    '#description' => t('The human-readable name of this fertilizer nutrition type.'),
    '#required' => TRUE,
    '#size' => 30,
  );
  // Machine-readable type name.
  $form['type'] = array(
    '#type' => 'machine_name',
    '#default_value' => isset($growcalc_fertilizer_nutrition_type->type) ? $growcalc_fertilizer_nutrition_type->type : '',
    '#maxlength' => 32,
//    '#disabled' => $growcalc_fertilizer_nutrition_type->isLocked() && $op != 'clone',
    '#machine_name' => array(
      'exists' => 'growcalc_fertilizer_nutrition_get_types',
      'source' => array('label'),
    ),
    '#description' => t('A unique machine-readable name for this fertilizer nutrition type. It must only contain lowercase letters, numbers, and underscores.'),
  );

  $form['data']['#tree'] = TRUE;
  /*$form['data']['sample_data'] = array(
    '#type' => 'checkbox',
    '#title' => t('An interesting fertilizer nutrition switch'),
    '#default_value' => !empty($growcalc_fertilizer_nutrition_type->data['sample_data']),
  );*/

  $form['actions'] = array('#type' => 'actions');
  $form['actions']['submit'] = array(
    '#type' => 'submit',
    '#value' => t('Save fertilizer nutrition type'),
    '#weight' => 40,
  );

  //Locking not supported yet
  /*if (!$growcalc_fertilizer_nutrition_type->isLocked() && $op != 'add') {
    $form['actions']['delete'] = array(
      '#type' => 'submit',
      '#value' => t('Delete fertilizer nutrition type'),
      '#weight' => 45,
      '#limit_validation_errors' => array(),
      '#submit' => array('growcalc_fertilizer_nutrition_type_form_submit_delete')
    );
  }*/
  return $form;
}

/**
 * Form API submit callback for the type form.
 */
function growcalc_fertilizer_nutrition_type_form_submit(&$form, &$form_state) {
  $growcalc_fertilizer_nutrition_type = entity_ui_form_submit_build_entity($form, $form_state);
  $growcalc_fertilizer_nutrition_type->save();
  $form_state['redirect'] = 'admin/structure/growcalc/fertilizer_nutrition_types';
}

/**
 * Form API submit callback for the delete button.
 */
function growcalc_fertilizer_nutrition_type_form_submit_delete(&$form, &$form_state) {
  $form_state['redirect'] = 'admin/structure/growcalc/fertilizer_nutrition_types/manage/' . $form_state['growcalc_fertilizer_nutrition_type']->type . '/delete';
}
