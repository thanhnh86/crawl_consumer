/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/

import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']),

  /*
  |----------------------------------------------------------
  | Variables for configuring database connection
  |----------------------------------------------------------
  */
  DB_HOST_BP: Env.schema.string({ format: 'host' }),
  DB_PORT_BP: Env.schema.number(),
  DB_USER_BP: Env.schema.string(),
  DB_PASSWORD_BP: Env.schema.string.optional(),
  DB_DATABASE_BP: Env.schema.string(),

  DB_HOST_CRAWL: Env.schema.string({ format: 'host' }),
  DB_PORT_CRAWL: Env.schema.number(),
  DB_USER_CRAWL: Env.schema.string(),
  DB_PASSWORD_CRAWL: Env.schema.string.optional(),
  DB_DATABASE_CRAWL: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for configuring session package
  |----------------------------------------------------------
  */
  SESSION_DRIVER: Env.schema.enum(['cookie', 'memory'] as const),

  /*
  |----------------------------------------------------------
  | Variables for configuring proxy
  |----------------------------------------------------------
  */
  PROXY_NAME: Env.schema.string(),
  /*
  |----------------------------------------------------------
  | Variables for configuring rabbitMQ
  |----------------------------------------------------------
  */
  RABBITMQ_HOSTNAME: Env.schema.string(),
  RABBITMQ_USER: Env.schema.string(),
  RABBITMQ_PASSWORD: Env.schema.string(),
  RABBITMQ_PORT: Env.schema.number(),
  RABBITMQ_PROTOCOL: Env.schema.enum(['amqp://', 'amqps://'] as const),
  RABBITMQ_PREFETCH: Env.schema.number(),
  RABBITMQ_CHANNEL_NAME: Env.schema.string(),
  RABBITMQ_CHANNEL_NAME_2: Env.schema.string(),

  REMOTE_CHROME_URL: Env.schema.string(),
})
