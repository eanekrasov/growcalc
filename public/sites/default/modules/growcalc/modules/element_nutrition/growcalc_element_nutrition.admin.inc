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
  $form = system_settings_form($form);
  
  $form['actions']['create_default_element_nutritions'] = array(
    '#type' => 'submit',
    '#value' => t('Create default element nutritions'),
    '#submit' => array('growcalc_element_nutrition_settings_create_default_element_nutritions_submit')
  );

  $form['actions']['clear_element_nutritions'] = array(
    '#type' => 'submit',
    '#value' => t('Clear element nutritions'),
    '#submit' => array('growcalc_element_nutrition_settings_clear_element_nutritions_submit')
  );

  return system_settings_form($form);
}

function growcalc_element_nutrition_settings_create_default_element_nutritions_submit($form, &$form_state) {
  module_load_include('inc', 'growcalc_element_nutrition', 'growcalc_element_nutrition.data');
  $entities = _growcalc_element_nutrition_data();
  foreach($entities as $entity) {
    drupal_set_message(t("Element nutrition @element_nutrition has been created.", array('@element_nutrition' => l($entity->title, 'node/' . $entity->nid))));
  }
}

function growcalc_element_nutrition_settings_clear_element_nutritions_submit($form, &$form_state) {
  $query = new EntityFieldQuery();
  $entities = $query->entityCondition('entity_type', 'node')         
    ->propertyCondition('type', 'growcalc_element_nutrition')
    ->execute();

  foreach($entities['node'] as $entity) {
    node_delete($entity->nid);
  }

  drupal_set_message("All element nutritions has been deleted.");
}

