<?php

/**
 * This field handler aggregates operations that can be done on a growcalc_fertilizer_nutrition
 * under a single field providing a more flexible way to present them in a view
 */
class growcalc_fertilizer_nutrition_handler_operations_field extends views_handler_field {
  function construct() {
    parent::construct();

    $this->additional_fields['growcalc_fertilizer_nutrition_id'] = 'growcalc_fertilizer_nutrition_id';
  }

  function query() {
    $this->ensure_my_table();
    $this->add_additional_fields();
  }

  function render($values) {

    $links = menu_contextual_links('growcalc_fertilizer_nutrition', 'growcalc/fertilizer_nutrition', array($this->get_value($values, 'growcalc_fertilizer_nutrition_id')));
    
    if (!empty($links)) {
      return theme('links', array('links' => $links, 'attributes' => array('class' => array('links', 'inline', 'operations'))));
    }
  }
}
