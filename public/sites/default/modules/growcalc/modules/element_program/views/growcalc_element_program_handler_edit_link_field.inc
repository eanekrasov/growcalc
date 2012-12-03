<?php

/**
 * @file
 * Contains a Views field handler to take care of displaying edit links
 * as fields
 */


class growcalc_element_program_handler_edit_link_field extends growcalc_element_program_handler_link_field {
  function construct() {
    parent::construct();
    $this->additional_fields['type'] = 'type';
  }


  function render($values) {
    $type = $values->{$this->aliases['type']};
    
    //Creating a dummy growcalc_element_program to check access against
    $dummy_growcalc_element_program = (object) array('type' => $type);
    if (!growcalc_element_program_access('edit', $dummy_growcalc_element_program)) {
      return;
    }
    
    $text = !empty($this->options['text']) ? $this->options['text'] : t('edit');
    $growcalc_element_program_id = $values->{$this->aliases['growcalc_element_program_id']};
    
    return l($text, 'admin/content/growcalc_element_programs/growcalc_element_program/' . $growcalc_element_program_id . '/edit');
  }
}
