<?php

/**
 * @file
 * Providing extra functionality for the GrowcalcFertilizerNutrition UI via views.
 */


/**
 * Implements hook_views_data()
 */
function growcalc_fertilizer_nutrition_views_data_alter(&$data) { 
  $data['growcalc_fertilizer_nutrition']['link_growcalc_fertilizer_nutrition'] = array(
    'field' => array(
      'title' => t('Link'),
      'help' => t('Provide a link to the growcalc_fertilizer_nutrition.'),
      'handler' => 'growcalc_fertilizer_nutrition_handler_link_field',
    ),
  );
  $data['growcalc_fertilizer_nutrition']['edit_growcalc_fertilizer_nutrition'] = array(
    'field' => array(
      'title' => t('Edit Link'),
      'help' => t('Provide a link to the edit form for the fertilizer nutrition.'),
      'handler' => 'growcalc_fertilizer_nutrition_handler_edit_link_field',
    ),
  );
  $data['growcalc_fertilizer_nutrition']['delete_growcalc_fertilizer_nutrition'] = array(
    'field' => array(
      'title' => t('Delete Link'),
      'help' => t('Provide a link to delete the fertilizer nutrition.'),
      'handler' => 'growcalc_fertilizer_nutrition_handler_delete_link_field',
    ),
  );
  // This content of this field are decided based on the menu structure that
  // follows growcalc/fertilizer_nutrition/%growcalc_fertilizer_nutrition_id/op
  $data['growcalc_fertilizer_nutrition']['operations'] = array(
    'field' => array(
      'title' => t('Operations links'),
      'help' => t('Display all operations available for this fertilizer nutrition.'),
      'handler' => 'growcalc_fertilizer_nutrition_handler_operations_field',
    ),
  );
}


/**
 * Implements hook_views_default_views().
 */
function growcalc_fertilizer_nutrition_views_default_views() {
  $views = array();

  $view = new view();
  $view->name = 'growcalc_fertilizer_nutritions';
  $view->description = 'A list of all fertilizer nutritions';
  $view->tag = 'growcalc_fertilizer_nutritions';
  $view->base_table = 'growcalc_fertilizer_nutrition';
  $view->human_name = 'Growcalc Fertilizer Nutritions';
  $view->core = 7;
  $view->api_version = '3.0';
  $view->disabled = FALSE; /* Edit this to true to make a default view disabled initially */

  /* Display: Master */
  $handler = $view->new_display('default', 'Master', 'default');
  $handler->display->display_options['title'] = 'Fertilizer Nutritions';
  $handler->display->display_options['use_more_always'] = FALSE;
  $handler->display->display_options['access']['type'] = 'perm';
  $handler->display->display_options['access']['perm'] = 'administer growcalc fertilizer nutritions';
  $handler->display->display_options['cache']['type'] = 'none';
  $handler->display->display_options['query']['type'] = 'views_query';
  $handler->display->display_options['exposed_form']['type'] = 'basic';
  $handler->display->display_options['pager']['type'] = 'full';
  $handler->display->display_options['pager']['options']['items_per_page'] = '30';
  $handler->display->display_options['style_plugin'] = 'table';
  $handler->display->display_options['style_options']['columns'] = array(
    'name' => 'name',
    'growcalc_fertilizer_nutrition_id' => 'growcalc_fertilizer_nutrition_id',
  );
  $handler->display->display_options['style_options']['default'] = '-1';
  $handler->display->display_options['style_options']['info'] = array(
    'name' => array(
      'sortable' => 0,
      'default_sort_order' => 'asc',
      'align' => '',
      'separator' => '',
    ),
    'growcalc_fertilizer_nutrition_id' => array(
      'sortable' => 0,
      'default_sort_order' => 'asc',
      'align' => '',
      'separator' => '',
    ),
  );
  /* No results behavior: Global: Text area */
  $handler->display->display_options['empty']['area']['id'] = 'area';
  $handler->display->display_options['empty']['area']['table'] = 'views';
  $handler->display->display_options['empty']['area']['field'] = 'area';
  $handler->display->display_options['empty']['area']['label'] = 'Empty ';
  $handler->display->display_options['empty']['area']['content'] = 'No Growcalc Fertilizer Nutritions have been created yet';
  /* Field: Growcalc Fertilizer Nutrition: Growcalc fertilizer nutrition ID */
  $handler->display->display_options['fields']['growcalc_fertilizer_nutrition_id']['id'] = 'growcalc_fertilizer_nutrition_id';
  $handler->display->display_options['fields']['growcalc_fertilizer_nutrition_id']['table'] = 'growcalc_fertilizer_nutrition';
  $handler->display->display_options['fields']['growcalc_fertilizer_nutrition_id']['field'] = 'growcalc_fertilizer_nutrition_id';
  $handler->display->display_options['fields']['growcalc_fertilizer_nutrition_id']['label'] = '';
  $handler->display->display_options['fields']['growcalc_fertilizer_nutrition_id']['exclude'] = TRUE;
  $handler->display->display_options['fields']['growcalc_fertilizer_nutrition_id']['element_label_colon'] = FALSE;
  /* Field: Growcalc Fertilizer Nutrition: URL */
  $handler->display->display_options['fields']['url']['id'] = 'url';
  $handler->display->display_options['fields']['url']['table'] = 'views_entity_growcalc_fertilizer_nutrition';
  $handler->display->display_options['fields']['url']['field'] = 'url';
  $handler->display->display_options['fields']['url']['label'] = '';
  $handler->display->display_options['fields']['url']['exclude'] = TRUE;
  $handler->display->display_options['fields']['url']['element_label_colon'] = FALSE;
  $handler->display->display_options['fields']['url']['link_to_entity'] = 0;
  /* Field: Growcalc Fertilizer Nutrition: Name */
  $handler->display->display_options['fields']['name']['id'] = 'name';
  $handler->display->display_options['fields']['name']['table'] = 'growcalc_fertilizer_nutrition';
  $handler->display->display_options['fields']['name']['field'] = 'name';
  $handler->display->display_options['fields']['name']['label'] = 'Наименование';
  $handler->display->display_options['fields']['name']['alter']['make_link'] = TRUE;
  $handler->display->display_options['fields']['name']['alter']['path'] = '[url]';
  /* Field: Growcalc Fertilizer Nutrition: Created */
  $handler->display->display_options['fields']['created']['id'] = 'created';
  $handler->display->display_options['fields']['created']['table'] = 'growcalc_fertilizer_nutrition';
  $handler->display->display_options['fields']['created']['field'] = 'created';
  /* Field: Growcalc Fertilizer Nutrition: Changed */
  $handler->display->display_options['fields']['changed']['id'] = 'changed';
  $handler->display->display_options['fields']['changed']['table'] = 'growcalc_fertilizer_nutrition';
  $handler->display->display_options['fields']['changed']['field'] = 'changed';
  /* Field: Growcalc Fertilizer Nutrition: Edit Link */
  $handler->display->display_options['fields']['edit_growcalc_fertilizer_nutrition']['id'] = 'edit_growcalc_fertilizer_nutrition';
  $handler->display->display_options['fields']['edit_growcalc_fertilizer_nutrition']['table'] = 'growcalc_fertilizer_nutrition';
  $handler->display->display_options['fields']['edit_growcalc_fertilizer_nutrition']['field'] = 'edit_growcalc_fertilizer_nutrition';
  /* Field: Growcalc Fertilizer Nutrition: Delete Link */
  $handler->display->display_options['fields']['delete_growcalc_fertilizer_nutrition']['id'] = 'delete_growcalc_fertilizer_nutrition';
  $handler->display->display_options['fields']['delete_growcalc_fertilizer_nutrition']['table'] = 'growcalc_fertilizer_nutrition';
  $handler->display->display_options['fields']['delete_growcalc_fertilizer_nutrition']['field'] = 'delete_growcalc_fertilizer_nutrition';

  /* Display: Page */
  $handler = $view->new_display('page', 'Page', 'growcalc_fertilizer_nutritions_admin_page');
  $handler->display->display_options['defaults']['hide_admin_links'] = FALSE;
  $handler->display->display_options['path'] = 'admin/content/growcalc/fertilizer_nutritions/list';
  $handler->display->display_options['menu']['type'] = 'tab';
  $handler->display->display_options['menu']['title'] = 'List';
  $handler->display->display_options['menu']['weight'] = '0';
  $handler->display->display_options['menu']['name'] = 'management';
  $handler->display->display_options['menu']['context'] = 0;
  $handler->display->display_options['tab_options']['type'] = 'tab';
  $handler->display->display_options['tab_options']['title'] = 'Growcalc Fertilizer Nutritions';
  $handler->display->display_options['tab_options']['description'] = 'Manage Growcalc Fertilizer Nutritions';
  $handler->display->display_options['tab_options']['weight'] = '0';

  $views[] = $view;
  return $views;

}
