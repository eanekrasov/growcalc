<?php

/**
 * @file
 * Contains a Views field handler to take care of displaying deletes links
 * as fields
 */


class growcalc_element_nutrition_handler_delete_link_field extends growcalc_element_nutrition_handler_link_field {
  function construct() {
    parent::construct();
    $this->additional_fields['type'] = 'type';
  }


  function render($values) {
    $type = $values->{$this->aliases['type']};
    
    //Creating a dummy growcalc_element to check access against
    $dummy_growcalc_element_nutrition = (object) array('type' => $type);
    if (!growcalc_element_nutrition_access('edit', $dummy_growcalc_element_nutrition)) {
      return;
    }
    
    $text = !empty($this->options['text']) ? $this->options['text'] : t('delete');
    $growcalc_element_nutrition_id = $values->{$this->aliases['growcalc_element_nutrition_id']};
    
    return l($text, 'admin/content/growcalc/element_nutritions/growcalc/element_nutrition/' . $growcalc_element_nutrition_id . '/delete');
  }
}
