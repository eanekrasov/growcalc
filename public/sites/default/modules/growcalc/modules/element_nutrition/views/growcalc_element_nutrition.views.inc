<?php

/**
 * @file
 * Providing extra functionality for the GrowcalcElementNutrition UI via views.
 */


/**
 * Implements hook_views_data()
 */
function growcalc_element_nutrition_views_data_alter(&$data) { 
  $data['growcalc_element_nutrition']['link_growcalc_element_nutrition'] = array(
    'field' => array(
      'title' => t('Link'),
      'help' => t('Provide a link to the growcalc_element_nutrition.'),
      'handler' => 'growcalc_element_nutrition_handler_link_field',
    ),
  );
  $data['growcalc_element_nutrition']['edit_growcalc_element_nutrition'] = array(
    'field' => array(
      'title' => t('Edit Link'),
      'help' => t('Provide a link to the edit form for the growcalc_element_nutrition.'),
      'handler' => 'growcalc_element_nutrition_handler_edit_link_field',
    ),
  );
  $data['growcalc_element_nutrition']['delete_growcalc_element_nutrition'] = array(
    'field' => array(
      'title' => t('Delete Link'),
      'help' => t('Provide a link to delete the growcalc_element_nutrition.'),
      'handler' => 'growcalc_element_nutrition_handler_delete_link_field',
    ),
  );
  // This content of this field are decided based on the menu structure that
  // follows growcalc/elements/growcalc_element/%growcalc_element_id/op
  $data['growcalc_element_nutrition']['operations'] = array(
    'field' => array(
      'title' => t('Operations links'),
      'help' => t('Display all operations available for this growcalc_element_nutrition.'),
      'handler' => 'growcalc_element_nutrition_handler_element_nutrition_operations_field',
    ),
  );
}


/**
 * Implements hook_views_default_views().
 */
function growcalc_element_nutrition_views_default_views() {
  $views = array();

  $view = new view();
  $view->name = 'growcalc_element_nutritions';
  $view->description = 'A list of all element nutritions';
  $view->tag = 'growcalc_element_nutritions';
  $view->base_table = 'growcalc_element_nutrition';
  $view->human_name = 'Growcalc Element Nutritions';
  $view->core = 7;
  $view->api_version = '3.0';
  $view->disabled = FALSE; /* Edit this to true to make a default view disabled initially */

  /* Display: Master */
  $handler = $view->new_display('default', 'Master', 'default');
  $handler->display->display_options['title'] = 'Element Nutritions';
  $handler->display->display_options['use_more_always'] = FALSE;
  $handler->display->display_options['access']['type'] = 'perm';
  $handler->display->display_options['access']['perm'] = 'administer growcalc element nutritions';
  $handler->display->display_options['cache']['type'] = 'none';
  $handler->display->display_options['query']['type'] = 'views_query';
  $handler->display->display_options['exposed_form']['type'] = 'basic';
  $handler->display->display_options['pager']['type'] = 'full';
  $handler->display->display_options['pager']['options']['items_per_page'] = '30';
  $handler->display->display_options['style_plugin'] = 'table';
  $handler->display->display_options['style_options']['columns'] = array(
    'name' => 'name',
    'growcalc_element_nutrition_id' => 'growcalc_element_nutrition_id',
  );
  $handler->display->display_options['style_options']['default'] = '-1';
  $handler->display->display_options['style_options']['info'] = array(
    'name' => array(
      'sortable' => 0,
      'default_sort_order' => 'asc',
      'align' => '',
      'separator' => '',
    ),
    'growcalc_element_nutrition_id' => array(
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
  $handler->display->display_options['empty']['area']['content'] = 'No Growcalc Element Nutritions have been created yet';
  /* Field: Growcalc Element Nutrition: Growcalc element nutrition ID */
  $handler->display->display_options['fields']['growcalc_element_nutrition_id']['id'] = 'growcalc_element_nutrition_id';
  $handler->display->display_options['fields']['growcalc_element_nutrition_id']['table'] = 'growcalc_element_nutrition';
  $handler->display->display_options['fields']['growcalc_element_nutrition_id']['field'] = 'growcalc_element_nutrition_id';
  $handler->display->display_options['fields']['growcalc_element_nutrition_id']['label'] = '';
  $handler->display->display_options['fields']['growcalc_element_nutrition_id']['exclude'] = TRUE;
  $handler->display->display_options['fields']['growcalc_element_nutrition_id']['element_label_colon'] = FALSE;
  /* Field: Growcalc Element Nutrition: URL */
  $handler->display->display_options['fields']['url']['id'] = 'url';
  $handler->display->display_options['fields']['url']['table'] = 'views_entity_growcalc_element_nutrition';
  $handler->display->display_options['fields']['url']['field'] = 'url';
  $handler->display->display_options['fields']['url']['label'] = '';
  $handler->display->display_options['fields']['url']['exclude'] = TRUE;
  $handler->display->display_options['fields']['url']['element_label_colon'] = FALSE;
  $handler->display->display_options['fields']['url']['link_to_entity'] = 0;
  /* Field: Growcalc Element Nutrition: Name */
  $handler->display->display_options['fields']['name']['id'] = 'name';
  $handler->display->display_options['fields']['name']['table'] = 'growcalc_element_nutrition';
  $handler->display->display_options['fields']['name']['field'] = 'name';
  $handler->display->display_options['fields']['name']['label'] = 'Наименование';
  $handler->display->display_options['fields']['name']['alter']['make_link'] = TRUE;
  $handler->display->display_options['fields']['name']['alter']['path'] = '[url]';
  /* Field: Growcalc Element Nutrition: Created */
  $handler->display->display_options['fields']['created']['id'] = 'created';
  $handler->display->display_options['fields']['created']['table'] = 'growcalc_element_nutrition';
  $handler->display->display_options['fields']['created']['field'] = 'created';
  /* Field: Growcalc Element Nutrition: Changed */
  $handler->display->display_options['fields']['changed']['id'] = 'changed';
  $handler->display->display_options['fields']['changed']['table'] = 'growcalc_element_nutrition';
  $handler->display->display_options['fields']['changed']['field'] = 'changed';
  /* Field: Growcalc Element Nutrition: Edit Link */
  $handler->display->display_options['fields']['edit_growcalc_element_nutrition']['id'] = 'edit_growcalc_element_nutrition';
  $handler->display->display_options['fields']['edit_growcalc_element_nutrition']['table'] = 'growcalc_element_nutrition';
  $handler->display->display_options['fields']['edit_growcalc_element_nutrition']['field'] = 'edit_growcalc_element_nutrition';
  /* Field: Growcalc Element Nutrition: Delete Link */
  $handler->display->display_options['fields']['delete_growcalc_element_nutrition']['id'] = 'delete_growcalc_element_nutrition';
  $handler->display->display_options['fields']['delete_growcalc_element_nutrition']['table'] = 'growcalc_element_nutrition';
  $handler->display->display_options['fields']['delete_growcalc_element_nutrition']['field'] = 'delete_growcalc_element_nutrition';

  /* Display: Page */
  $handler = $view->new_display('page', 'Page', 'growcalc_element_nutritions_admin_page');
  $handler->display->display_options['defaults']['hide_admin_links'] = FALSE;
  $handler->display->display_options['path'] = 'admin/content/growcalc/element_nutritions/list';
  $handler->display->display_options['menu']['type'] = 'tab';
  $handler->display->display_options['menu']['title'] = 'List';
  $handler->display->display_options['menu']['weight'] = '0';
  $handler->display->display_options['menu']['name'] = 'management';
  $handler->display->display_options['menu']['context'] = 0;
  $handler->display->display_options['tab_options']['type'] = 'tab';
  $handler->display->display_options['tab_options']['title'] = 'Growcalc Element Nutritions';
  $handler->display->display_options['tab_options']['description'] = 'Manage Growcalc Element Nutritions';
  $handler->display->display_options['tab_options']['weight'] = '0';

  $views[] = $view;
  return $views;

}
