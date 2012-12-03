<?php

/**
 * @file
 * Contains a Views field handler to take care of displaying edit links
 * as fields
 */


class growcalc_fertilizer_handler_edit_link_field extends growcalc_fertilizer_handler_link_field {
  function construct() {
    parent::construct();
    $this->additional_fields['type'] = 'type';
  }


  function render($values) {
    $type = $values->{$this->aliases['type']};
    
    //Creating a dummy growcalc_fertilizer to check access against
    $dummy_growcalc_fertilizer = (object) array('type' => $type);
    if (!growcalc_fertilizer_access('edit', $dummy_growcalc_fertilizer)) {
      return;
    }
    
    $text = !empty($this->options['text']) ? $this->options['text'] : t('edit');
    $growcalc_fertilizer_id = $values->{$this->aliases['growcalc_fertilizer_id']};
    
    return l($text, 'admin/content/growcalc/fertilizers/growcalc_fertilizer/' . $growcalc_fertilizer_id . '/edit');
  }
}
