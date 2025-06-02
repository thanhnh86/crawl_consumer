import env from '#start/env'
import { defineConfig } from '@adonisjs/lucid'

const dbConfig = defineConfig({
  connection: 'mysql',
  connections: {
    mysql_bp: {
      client: 'mysql2',
      connection: {
        host: env.get('DB_HOST_BP'),
        port: env.get('DB_PORT_BP'),
        user: env.get('DB_USER_BP'),
        password: env.get('DB_PASSWORD_BP'),
        database: env.get('DB_DATABASE_BP'),
      },
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
    },
    mysql_expedia: {
      client: 'mysql2',
      connection: {
        host: env.get('DB_HOST_CRAWL'),
        port: env.get('DB_PORT_CRAWL'),
        user: env.get('DB_USER_CRAWL'),
        password: env.get('DB_PASSWORD_CRAWL'),
        database: env.get('DB_DATABASE_CRAWL'),
      },
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
    },
  },
})

export default dbConfig
