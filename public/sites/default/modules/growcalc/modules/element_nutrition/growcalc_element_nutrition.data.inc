<?php


function _growcalc_element_nutrition_data() {
$data = array();

  $element_nutritions = array();
  foreach($data as &$data_item) {

    $entity = entity_get_controller('growcalc_element_nutrition')->create();
    $entity->type = 'growcalc_element_nutrition';
    $entity->name = $data_item['name'];
    $entity->description = $data_item['description'];
    $entity->status = ($data_item['status'] == True);
    growcalc_element_nutrition_save($entity);
    $element_nutritions[$entity->name] = $entity;
  }

  return $element_nutritions;
}
