<?php

/**
 * This field handler aggregates operations that can be done on a growcalc_fertilizer
 * under a single field providing a more flexible way to present them in a view
 */
class growcalc_fertilizer_handler_operations_field extends views_handler_field {
  function construct() {
    parent::construct();

    $this->additional_fields['growcalc_fertilizer_id'] = 'growcalc_fertilizer_id';
  }

  function query() {
    $this->ensure_my_table();
    $this->add_additional_fields();
  }

  function render($values) {

    $links = menu_contextual_links('growcalc_fertilizer', 'admin/content/growcalc/fertilizers/growcalc_fertilizer', array($this->get_value($values, 'growcalc_fertilizer_id')));
    
    if (!empty($links)) {
      return theme('links', array('links' => $links, 'attributes' => array('class' => array('links', 'inline', 'operations'))));
    }
  }
}
