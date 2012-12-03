<?php

/**
 * @file
 * growcalc_element editing UI.
 *
 * We make very little use of the EntityAPI interface for this - preferring instead to use
 * views. That offers more flexibility to change a UI that will, more often than not,
 * be end-user facing.
 */

/**
 * Форма настроек модуля.
 */
function growcalc_element_settings() {
  $form = array();
  

  $form = system_settings_form($form);

  $form['actions']['create_default_elements'] = array(
    '#type' => 'submit',
    '#value' => t('Create default elements'),
    '#submit' => array('growcalc_element_settings_create_default_elements_submit')
  );

  $form['actions']['clear_elements'] = array(
    '#type' => 'submit',
    '#value' => t('Clear elements'),
    '#submit' => array('growcalc_element_settings_clear_elements_submit')
  );

  return $form;
}

/**
 * Создание элементов из growcalc_element.data.inc.
 */
function growcalc_element_settings_create_default_elements_submit($form, &$form_state) {
  module_load_include('inc', 'growcalc_element', 'growcalc_element.data');
  $elements = _growcalc_element_data();
  foreach($elements as $element) {
    drupal_set_message(t("Element !element has been created.", array('!element' => l($element->title, 'node/' + $element->nid))));
  }
}


/**
 * Удаление всех элементов.
 */
function growcalc_element_settings_clear_elements_submit($form, &$form_state) {
  $query = new EntityFieldQuery();

  $elements = $query->entityCondition('entity_type', 'node')         
    ->propertyCondition('type', 'growcalc_element')
    ->execute();

  foreach($elements['node'] as $element) {
    node_delete($element->nid);
  }

  drupal_set_message("All elements has been deleted.");
}
