<?php

/**
 * @file
 *
 * @author Coder
 */

/*******************************************************************************
 * Callback Functions, Forms, and Tables
 ******************************************************************************/

/**
 * Settings form for GrowCalc.
 */
function growcalc_settings() {
  $form = array();
  
  return system_settings_form($form);
}
