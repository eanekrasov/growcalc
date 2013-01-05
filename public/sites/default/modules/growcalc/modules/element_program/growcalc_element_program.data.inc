<?php

function _growcalc_element_program_data() {
  $data = array();

  $entities = array();
  foreach($data as &$data_item) {
    $entity = growcalc_element_program_update(growcalc_entity_new('growcalc_element_program'), $data_item);
    $entities[$entity->title] = $entity;
  }

  return $entities;
}
