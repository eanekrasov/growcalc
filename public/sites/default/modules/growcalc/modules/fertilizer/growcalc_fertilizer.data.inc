<?php


function _growcalc_fertilizer_data() {
$data = array(
  array(
    'name' => 'MgSO4',
    'description' => 'Сульфат магния семиводный',
    'tag' => 'Удобрениe',
    'elements' => array(
      array('element' => 'MgSO4', 'amount' => 1)
    ),
  ),
  array(
    'name' => 'KNO3',
    'description' => 'Калиевая селитра',
    'tag' => 'Удобрениe',
    'elements' => array(
      array('element' => 'KNO3', 'amount' => 1)
    ),
  ),
  array(
    'name' => 'Ca(NO3)2*4H2O',
    'description' => 'Кальциевая селитра 4-х водная',
    'tag' => 'Удобрениe',
    'elements' => array(
      array('element' => 'Ca(NO3)2', 'amount' => 1)
    ),
  ),
  array(
    'name' => 'KH2PO4',
    'description' => 'Монокалия фосфат',
    'tag' => 'Удобрениe',
    'elements' => array(
      array('element' => 'KH2PO4', 'amount' => 1)
    ),
  ),
  array(
    'name' => 'Бона форте',
    'description' => 'для декоративно-лиственных растений',
    'tag' => 'Удобрениe',
    'elements' => array(
      array('element' => 'N', 'amount' => 0.05),
      array('element' => 'P2O5', 'amount' => 0.03),
      array('element' => 'K2O', 'amount' => 0.04),
      array('element' => 'MgO', 'amount' => 0.01)
    ),
  ),
  array(
    'name' => 'Бона форте',
    'description' => 'для всех комнатных растений',
    'tag' => 'Удобрение',
    'elements' => array(
      array('element' => 'N', 'amount' => 0.06),
      array('element' => 'P2O5', 'amount' => 0.03),
      array('element' => 'K2O', 'amount' => 0.07),
      array('element' => 'MgO', 'amount' => 0.015)
    ),
  ),
);

  $fertilizers = array();
  foreach($data as &$data_item) {
    $fertilizer = growcalc_fertilizer_update(growcalc_fertilizer_new(), $data_item);
    $fertilizers[$fertilizer->title] = $fertilizer;
  }

  return $fertilizers;
}
