<?php


function _growcalc_element_program_data() {
  $data = array(
  );

  $element_programs = array();
  foreach($data as &$data_item) {

    $entity = entity_get_controller('growcalc_element_program')->create();
    $entity->type = 'growcalc_element_program';
    $entity->name = $data_item['name'];
    $entity->description = $data_item['description'];
    $entity->status = 1;
    growcalc_element_program_save($entity);
    $element_programs[$entity->name] = $entity;

    // TODO: components
    /*if (count($data_item['ions']) !== 0) {
      foreach($data_item['ions'] as $ion_name=>$count) {
        $ion = entity_create('field_collection_item', array(
          'field_name'        => 'growcalc_ions',
          'count' => array(LANGUAGE_NONE => array(array('value' => $count))),
          'growcalc_element_program' => array(LANGUAGE_NONE => array(array('target_id' => $element_programs[$ion_name]->growcalc_element_program_id))),
        ));
        $ion->setHostEntity('growcalc_element_program', $entity);
        $ion->save();    
      }
    }*/
  }

  return $element_programs;
}
