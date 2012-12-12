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

  $form = system_settings_form($form);

  $form['actions']['create_default_fertilizers'] = array(
    '#type' => 'submit',
    '#value' => t('Create default fertilizers'),
    '#submit' => array('growcalc_fertilizer_settings_create_default_fertilizers_submit')
  );

  $form['actions']['clear_fertilizers'] = array(
    '#type' => 'submit',
    '#value' => t('Clear fertilizers'),
    '#submit' => array('growcalc_fertilizer_settings_clear_fertilizers_submit')
  );

  return $form;
}

/**
 * Создание удобрений из growcalc_fertilizer.data.inc.
 */
function growcalc_fertilizer_settings_create_default_fertilizers_submit($form, &$form_state) {
  module_load_include('inc', 'growcalc_fertilizer', 'growcalc_fertilizer.data');
  $fertilizers = _growcalc_fertilizer_data();
  foreach($fertilizers as $fertilizer) {
    drupal_set_message(t("Fertilizer !fertilizer has been created.", array('!fertilizer' => l($fertilizer->title, 'node/' . $fertilizer->nid))));
  }
}

/**
 * Удаление всех удобрений.
 */
function growcalc_fertilizer_settings_clear_fertilizers_submit($form, &$form_state) {
  $query = new EntityFieldQuery();

  $elements = $query->entityCondition('entity_type', 'node')         
    ->propertyCondition('type', 'growcalc_fertilizer')
    ->execute();

  foreach($elements['node'] as $fertilizer) {
    node_delete($fertilizer->nid);
  }

  drupal_set_message("All fertilizers has been deleted.");
}
