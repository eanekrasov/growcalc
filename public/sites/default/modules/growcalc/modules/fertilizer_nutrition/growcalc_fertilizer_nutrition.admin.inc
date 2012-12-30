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
  $form = system_settings_form($form);

  $form['actions']['create_default_fertilizer_nutritions'] = array(
    '#type' => 'submit',
    '#value' => t('Create default fertilizer nutritions'),
    '#submit' => array('growcalc_fertilizer_nutrition_settings_create_default_fertilizer_nutritions_submit')
  );
  
  $form['actions']['clear_fertilizer_nutritions'] = array(
    '#type' => 'submit',
    '#value' => t('Clear fertilizer nutritions'),
    '#submit' => array('growcalc_fertilizer_nutrition_settings_clear_fertilizer_nutritions_submit')
  );

  return $form;
}

function growcalc_fertilizer_nutrition_settings_create_default_fertilizer_nutritions_submit($form, &$form_state) {
  module_load_include('inc', 'growcalc_fertilizer_nutrition', 'growcalc_fertilizer_nutrition.data');
  $entities = _growcalc_fertilizer_nutrition_data();
  foreach($entities as $entity) {
    drupal_set_message(t("Fertilizer nutrition @fertilizer_nutrition has been created.", array('@fertilizer_nutrition' => l($entity->title, 'node/' . $entity->nid))));
  }
}

function growcalc_fertilizer_nutrition_settings_clear_fertilizer_nutritions_submit($form, &$form_state) {
  $query = new EntityFieldQuery();
  $entities = $query->entityCondition('entity_type', 'node')         
    ->propertyCondition('type', 'growcalc_fertilizer_nutrition')
    ->execute();

  foreach($entities['node'] as $entity) {
    node_delete($entity->nid);
  }

  drupal_set_message("All fertilizer nutritions has been deleted.");
}
