<?php

/**
 * @file
 * Contains a Views field handler to take care of displaying links to entities
 * as fields.
 */

class growcalc_element_program_handler_link_field extends views_handler_field {
  function construct() {
    parent::construct();

    $this->additional_fields['growcalc_element_program_id'] = 'growcalc_element_program_id';
    $this->additional_fields['type'] = 'type';
  }

  function option_definition() {
    $options = parent::option_definition();

    $options['text'] = array('default' => '', 'translatable' => TRUE);

    return $options;
  }

  function options_form(&$form, &$form_state) {
    parent::options_form($form, $form_state);

    $form['text'] = array(
      '#type' => 'textfield',
      '#title' => t('Text to display'),
      '#default_value' => $this->options['text'],
    );
  }

  function query() {
    $this->ensure_my_table();
    $this->add_additional_fields();
  }

  function render($values) {
    $text = !empty($this->options['text']) ? $this->options['text'] : t('view');
    $growcalc_element_program_id = $values->{$this->aliases['growcalc_element_program_id']};

    return l($text, 'growcalc_element_program/' . $growcalc_element_program_id);
  }
}