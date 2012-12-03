<?php

/**
 * @file
 * Providing extra functionality for the Growcalcfertilizer UI via views.
 */


/**
 * Implements hook_views_data()
 */
function growcalc_fertilizer_views_data_alter(&$data) { 
  $data['growcalc_fertilizer']['link_growcalc_fertilizer'] = array(
    'field' => array(
      'title' => t('Link'),
      'help' => t('Provide a link to the growcalc_fertilizer.'),
      'handler' => 'growcalc_fertilizer_handler_link_field',
    ),
  );
  $data['growcalc_fertilizer']['edit_growcalc_fertilizer'] = array(
    'field' => array(
      'title' => t('Edit Link'),
      'help' => t('Provide a link to the edit form for the growcalc_fertilizer.'),
      'handler' => 'growcalc_fertilizer_handler_edit_link_field',
    ),
  );
  $data['growcalc_fertilizer']['delete_growcalc_fertilizer'] = array(
    'field' => array(
      'title' => t('Delete Link'),
      'help' => t('Provide a link to delete the growcalc_fertilizer.'),
      'handler' => 'growcalc_fertilizer_handler_delete_link_field',
    ),
  );
  // This content of this field are decided based on the menu structure that
  // follows growcalc_fertilizers/growcalc_fertilizer/%growcalc_fertilizer_id/op
  $data['growcalc_fertilizer']['operations'] = array(
    'field' => array(
      'title' => t('Operations links'),
      'help' => t('Display all operations available for this growcalc_fertilizer.'),
      'handler' => 'growcalc_fertilizer_handler_fertilizer_operations_field',
    ),
  );
}


/**
 * Implements hook_views_default_views().
 */
function growcalc_fertilizer_views_default_views() {
  $views = array();

  $view = new view();
  $view->name = 'growcalc_fertilizers';
  $view->description = 'A list of all growcalc_fertilizers';
  $view->tag = 'growcalc_fertilizers';
  $view->base_table = 'growcalc_fertilizer';
  $view->human_name = 'Growcalc Fertilizers';
  $view->core = 7;
  $view->api_version = '3.0';
  $view->disabled = FALSE; /* Edit this to true to make a default view disabled initially */

  /* Display: Master */
  $handler = $view->new_display('default', 'Master', 'default');
  $handler->display->display_options['title'] = 'Growcalc fertilizers';
  $handler->display->display_options['use_more_always'] = FALSE;
  $handler->display->display_options['access']['type'] = 'perm';
  $handler->display->display_options['access']['perm'] = 'administer growcalc fertilizers';
  $handler->display->display_options['cache']['type'] = 'none';
  $handler->display->display_options['query']['type'] = 'views_query';
  $handler->display->display_options['exposed_form']['type'] = 'basic';
  $handler->display->display_options['pager']['type'] = 'full';
  $handler->display->display_options['pager']['options']['items_per_page'] = '30';
  $handler->display->display_options['style_plugin'] = 'table';
  /* Поле: Growcalc Fertilizer: Идентификатор Growcalc fertilizer */
  $handler->display->display_options['fields']['growcalc_fertilizer_id']['id'] = 'growcalc_fertilizer_id';
  $handler->display->display_options['fields']['growcalc_fertilizer_id']['table'] = 'growcalc_fertilizer';
  $handler->display->display_options['fields']['growcalc_fertilizer_id']['field'] = 'growcalc_fertilizer_id';
  $handler->display->display_options['fields']['growcalc_fertilizer_id']['label'] = '';
  $handler->display->display_options['fields']['growcalc_fertilizer_id']['element_label_colon'] = FALSE;
  /* Field: Growcalc Fertilizer: URL */
  $handler->display->display_options['fields']['url']['id'] = 'url';
  $handler->display->display_options['fields']['url']['table'] = 'views_entity_growcalc_fertilizer';
  $handler->display->display_options['fields']['url']['field'] = 'url';
  $handler->display->display_options['fields']['url']['label'] = '';
  $handler->display->display_options['fields']['url']['exclude'] = TRUE;
  $handler->display->display_options['fields']['url']['element_label_colon'] = FALSE;
  $handler->display->display_options['fields']['url']['link_to_entity'] = 0;
  /* Поле: Growcalc Fertilizer: Name */
  $handler->display->display_options['fields']['name']['id'] = 'name';
  $handler->display->display_options['fields']['name']['table'] = 'growcalc_fertilizer';
  $handler->display->display_options['fields']['name']['field'] = 'name';
  $handler->display->display_options['fields']['name']['label'] = 'Наименование';
  $handler->display->display_options['fields']['name']['alter']['make_link'] = TRUE;
  $handler->display->display_options['fields']['name']['alter']['path'] = '[url]';
  /* Поле: Growcalc Fertilizer: Description */
  $handler->display->display_options['fields']['description']['id'] = 'description';
  $handler->display->display_options['fields']['description']['table'] = 'growcalc_fertilizer';
  $handler->display->display_options['fields']['description']['field'] = 'description';
  $handler->display->display_options['fields']['description']['label'] = 'Описание';
  /* Поле: Growcalc Fertilizer: Ссылка */
  $handler->display->display_options['fields']['link_growcalc_fertilizer']['id'] = 'link_growcalc_fertilizer';
  $handler->display->display_options['fields']['link_growcalc_fertilizer']['table'] = 'growcalc_fertilizer';
  $handler->display->display_options['fields']['link_growcalc_fertilizer']['field'] = 'link_growcalc_fertilizer';
  /* Поле: Growcalc Fertilizer: Operations links */
  $handler->display->display_options['fields']['operations']['id'] = 'operations';
  $handler->display->display_options['fields']['operations']['table'] = 'growcalc_fertilizer';
  $handler->display->display_options['fields']['operations']['field'] = 'operations';
  $handler->display->display_options['fields']['operations']['label'] = '';
  $handler->display->display_options['fields']['operations']['element_label_colon'] = FALSE;

  /* Display: Page */
  $handler = $view->new_display('page', 'Page', 'growcalc_fertilizers_admin_page');
  $handler->display->display_options['defaults']['hide_admin_links'] = FALSE;
  $handler->display->display_options['path'] = 'admin/content/growcalc/fertilizers/list';
  $handler->display->display_options['menu']['type'] = 'default tab';
  $handler->display->display_options['menu']['title'] = 'List';
  $handler->display->display_options['menu']['weight'] = '0';
  $handler->display->display_options['menu']['context'] = 0;
  $handler->display->display_options['tab_options']['type'] = 'tab';
  $handler->display->display_options['tab_options']['title'] = 'Growcalc Fertilizers';
  $handler->display->display_options['tab_options']['description'] = 'Manage Growcalc Fertilizers';
  $handler->display->display_options['tab_options']['weight'] = '0';

  $views[] = $view;
  return $views;

}
