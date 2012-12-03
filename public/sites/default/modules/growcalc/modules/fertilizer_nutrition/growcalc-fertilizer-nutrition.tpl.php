<?php

/**
 * @file
 * A basic template for fertilizer nutrition entities
 *
 * Available variables:
 * - $content: An array of comment items. Use render($content) to print them all, or
 *   print a subset such as render($content['field_example']). Use
 *   hide($content['field_example']) to temporarily suppress the printing of a
 *   given element.
 * - $title: The name of the fertilizer nutrition
 * - $url: The standard URL for viewing a fertilizer nutrition entity
 * - $page: TRUE if this is the main view page $url points too.
 * - $classes: String of classes that can be used to style contextually through
 *   CSS. It can be manipulated through the variable $classes_array from
 *   preprocess functions. By default the following classes are available, where
 *   the parts enclosed by {} are replaced by the appropriate values:
 *   - entity-profile
 *   - growcalc_fertilizer_nutrition-{TYPE}
 *
 * Other variables:
 * - $classes_array: Array of html class attribute values. It is flattened
 *   into a string within the variable $classes.
 *
 * @see template_preprocess()
 * @see template_preprocess_entity()
 * @see template_process()
 */

//$wrapper = entity_metadata_wrapper('growcalc_fertilizer_nutrition', $growcalc_fertilizer_nutrition)

//foreach($wrapper->growcalc_fertilizers as $fertilizer) {
//print '<li data-fertilizer-id="' . $fertilizer->growcalc_fertilizer->growcalc_fertilizer_id->value() . '" data-amount="' . $fertilizer->amount->value() . '"></li>';
//}
?>
<div class="<?php print $classes; ?> clearfix"<?php print $attributes; ?>>
  <?php if (!$page): ?>
    <h2<?php print $title_attributes; ?>>
        <a href="<?php print $url; ?>"><?php print $title; ?></a>
    </h2>
  <?php endif; ?>

  <div class="content"<?php print $content_attributes; ?>>
    <?php hide($content['growcalc_fertilizers']); ?>
    <div class="fertilizer-nutrition-editor" data-fertilizer-nutrition="<?php print $growcalc_fertilizer_nutrition->growcalc_fertilizer_nutrition_id; ?>">
      <div class="container clearfix">
        <ul class="fertilizers"></ul>
        <ul class="elements"></ul>
      </div>
    </div>
    <?php print render($content); ?>
  </div>
</div>
