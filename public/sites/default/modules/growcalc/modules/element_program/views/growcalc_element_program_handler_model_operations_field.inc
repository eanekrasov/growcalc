<?php

/**
 * This field handler aggregates operations that can be done on a growcalc_element_program
 * under a single field providing a more flexible way to present them in a view
 */
class growcalc_element_program_handler_growcalc_element_program_operations_field extends views_handler_field {
  function construct() {
    parent::construct();

    $this->additional_fields['growcalc_element_program_id'] = 'growcalc_element_program_id';
  }

  function query() {
    $this->ensure_my_table();
    $this->add_additional_fields();
  }

  function render($values) {

    $links = menu_contextual_links('growcalc_element_program', 'admin/content/growcalc_element_programs/growcalc_element_program', array($this->get_value($values, 'growcalc_element_program_id')));
    
    if (!empty($links)) {
      return theme('links', array('links' => $links, 'attributes' => array('class' => array('links', 'inline', 'operations'))));
    }
  }
}
