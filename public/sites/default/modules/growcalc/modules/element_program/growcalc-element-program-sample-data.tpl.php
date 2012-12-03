<?php

/**
 * @file
 * Example tpl file for theming a single growcalc_element-specific theme
 *
 * Available variables:
 * - $status: The variable to theme (while only show if you tick status)
 * 
 * Helper variables:
 * - $growcalc_element: The growcalc_element object this status is derived from
 */
?>

<div class="growcalc_element-status">
  <?php print '<strong>growcalc_element Sample Data:</strong> ' . $growcalc_element_sample_data = ($growcalc_element_sample_data) ? 'Switch On' : 'Switch Off' ?>
</div>