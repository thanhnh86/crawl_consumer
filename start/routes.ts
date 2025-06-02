/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
const CrawlController = () => import('#controllers/crawl_controller')

router.get('getexpedia', [CrawlController, 'crawl_test'])
// router.get('consumer', [CrawlController, 'getMessage'])
