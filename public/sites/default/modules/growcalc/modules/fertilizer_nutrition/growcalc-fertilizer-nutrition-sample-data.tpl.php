<?php

/**
 * @file
 * Example tpl file for theming a single fertilizer nutrition-specific theme
 *
 * Available variables:
 * - $status: The variable to theme (while only show if you tick status)
 * 
 * Helper variables:
 * - $growcalc_fertilizer_nutrition: The fertilizer nutrition object this status is derived from
 */
?>

<div class="growcalc-fertilizer-nutrition-status">
  <?php print '<strong>Fertilizer nutrition - Sample Data:</strong> ' . $growcalc_fertilizer_nutrition_sample_data = ($growcalc_fertilizer_nutrition_sample_data) ? 'Switch On' : 'Switch Off' ?>
</div>