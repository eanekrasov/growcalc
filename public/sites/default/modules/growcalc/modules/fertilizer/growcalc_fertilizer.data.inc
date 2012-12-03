<?php


function _growcalc_fertilizer_data() {
$data = array(
  array(
    'name' => 'MgSO4',
    'description' => 'Сульфат магния семиводный',
    'tag' => 'Удобрениe',
    'elements' => array('MgSO4' => 1)
  ),
  array(
    'name' => 'KNO3',
    'description' => 'Калиевая селитра',
    'tag' => 'Удобрениe',
    'elements' => array('KNO3' => 1)
  ),
  array(
    'name' => 'Ca(NO3)2*4H2O',
    'description' => 'Кальциевая селитра 4-х водная',
    'tag' => 'Удобрениe',
    'elements' => array('Ca(NO3)2' => 1)
  ),
  array(
    'name' => 'KH2PO4',
    'description' => 'Монокалия фосфат',
    'tag' => 'Удобрениe',
    'elements' => array('KH2PO4' => 1)
  ),
  array(
    'name' => 'Бона форте',
    'description' => 'для декоративно-лиственных растений',
    'tag' => 'Удобрениe',
    'elements' => array('N' => 0.05, 'P2O5' => 0.03, 'K2O' => 0.04, 'MgO' => 0.01)
  ),
  array(
    'name' => 'Бона форте',
    'description' => 'для всех комнатных растений',
    'tag' => 'Удобрение',
    'elements' => array('N' => 0.06, 'P2O5' => 0.03, 'K2O' => 0.07, 'MgO' => 0.015)
  ),
);

  $elements_data = growcalc_element_load_multiple(FALSE);
  $elements = array();
  foreach($elements_data as $el) {
    $elements[$el->name] = $el;
  }

  $fertilizers = array();
  
  foreach($data as &$data_item) {
    $entity = entity_get_controller('growcalc_fertilizer')->create();
    $entity->type = 'growcalc_fertilizer';
    $entity->name = $data_item['name'];
    $entity->description = $data_item['description'];
    $entity->status = 1;
    growcalc_fertilizer_save($entity);
    $fertilizers[$entity->name] = $entity;

    // composition
    if (count($data_item['elements']) !== 0) {
      foreach($data_item['elements'] as $element_name=>$amount) {
        if (isset($elements[$element_name])) {
          $element = entity_create('field_collection_item', array(
            'field_name'        => 'growcalc_elements',
            'amount' => array(LANGUAGE_NONE => array(array('value' => $amount))),
            'growcalc_element' => array(
              LANGUAGE_NONE => array(
                array(
                  'target_id' => $elements[$element_name]->growcalc_element_id,
                ),
              ),
            ),
          ));
          $element->setHostEntity('growcalc_fertilizer', $entity);
          $element->save();    
        }
      }
    }
  }

  return $fertilizers;
}
