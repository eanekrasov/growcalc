<?php

function _growcalc_fertilizer_nutrition_data() {
  $data = array();

  $entities = array();
  foreach($data as &$data_item) {
    $entity = growcalc_fertilizer_nutrition_update(growcalc_entity_new('growcalc_fertilizer_nutrition'), $data_item);
    $entities[$entity->title] = $entity;
  }

  return $entities;
}
