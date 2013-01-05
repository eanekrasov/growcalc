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
  $form = system_settings_form($form);
  
  $form['actions']['create_default_element_programs'] = array(
    '#type' => 'submit',
    '#value' => t('Create default element programs'),
    '#submit' => array('growcalc_element_program_settings_create_default_element_programs_submit')
  );

  $form['actions']['clear_element_programs'] = array(
    '#type' => 'submit',
    '#value' => t('Clear element programs'),
    '#submit' => array('growcalc_element_program_settings_clear_element_programs_submit')
  );

  return system_settings_form($form);
}

function growcalc_element_program_settings_create_default_element_programs_submit($form, &$form_state) {
  module_load_include('inc', 'growcalc_element_program', 'growcalc_element_program.data');
  $entities = _growcalc_element_program_data();
  foreach($entities as $entity) {
    drupal_set_message(t("Element program @element_program has been created.", array('@element_program' => l($entity->title, 'node/' . $entity->nid))));
  }
}

function growcalc_element_program_settings_clear_element_programs_submit($form, &$form_state) {
  $query = new EntityFieldQuery();
  $entities = $query->entityCondition('entity_type', 'node')         
    ->propertyCondition('type', 'growcalc_element_program')
    ->execute();

  foreach($entities['node'] as $entity) {
    node_delete($entity->nid);
  }

  drupal_set_message("All element programs has been deleted.");
}

