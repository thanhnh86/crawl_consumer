import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class CrawlResult extends BaseModel {
  public static connection = 'mysql_expedia'
  static table = 'crawl_result'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare url: string

  @column()
  declare date: Date

  @column()
  declare status: string

  @column()
  declare proxyId: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
