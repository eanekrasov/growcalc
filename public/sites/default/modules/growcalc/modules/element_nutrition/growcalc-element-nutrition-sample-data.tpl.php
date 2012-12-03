<?php

/**
 * @file
 * Example tpl file for theming a single growcalc_element_nutrition-specific theme
 *
 * Available variables:
 * - $status: The variable to theme (while only show if you tick status)
 * 
 * Helper variables:
 * - $growcalc_element_nutrition: The growcalc_element_nutrition object this status is derived from
 */
?>

<div class="growcalc-element-nutrition-status">
  <?php print '<strong>growcalc_element_nutrition Sample Data:</strong> ' . $growcalc_element_nutrition_sample_data = ($growcalc_element_nutrition_sample_data) ? 'Switch On' : 'Switch Off' ?>
</div>