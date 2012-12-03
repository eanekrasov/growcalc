<?php

/**
 * @file
 * Contains a Views field handler to take care of displaying deletes links
 * as fields
 */


class growcalc_fertilizer_handler_delete_link_field extends growcalc_fertilizer_handler_link_field {
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
    
    $text = !empty($this->options['text']) ? $this->options['text'] : t('delete');
    $growcalc_fertilizer_id = $values->{$this->aliases['growcalc_fertilizer_id']};
    
    return l($text, 'admin/content/growcalc/fertilizers/growcalc_fertilizer/' . $growcalc_fertilizer_id . '/delete');
  }
}
