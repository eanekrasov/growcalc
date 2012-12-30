<?php

function _growcalc_element_nutrition_data() {
  $data = array();

  $entities = array();
  foreach($data as &$data_item) {
    $entity = growcalc_element_nutrition_update(growcalc_entity_new('growcalc_element_nutrition'), $data_item);
    $entities[$entity->title] = $entity;
  }

  return $entities;
}
