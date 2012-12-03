<?php


function _growcalc_fertilizer_nutrition_data() {
$data = array();

  $fertilizer_nutritions = array();
  foreach($data as &$data_item) {

    $entity = entity_get_controller('growcalc_fertilizer_nutrition')->create();
    $entity->type = 'growcalc_fertilizer_nutrition';
    $entity->name = $data_item['name'];
    $entity->description = $data_item['description'];
    $entity->status = ($data_item['status'] == True);
    growcalc_fertilizer_nutrition_save($entity);
    $fertilizer_nutritions[$entity->name] = $entity;
  }

  return $fertilizer_nutritions;
}
