import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class ExpediaJob extends BaseModel {
  public static connection = 'mysql_expedia'

  static table = 'crawl_jobs'
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column({ columnName: 'bestprice_url' })
  declare bestpriceUrl: string

  @column({ columnName: 'expedia_url' })
  declare expediaUrl: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
