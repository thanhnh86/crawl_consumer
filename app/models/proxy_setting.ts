import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class ProxySetting extends BaseModel {
  public static connection = 'mysql_expedia'
  static table = 'proxy_settings'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare proxyName: string

  @column()
  declare proxyUrl: string

  @column()
  declare proxyId: string

  @column()
  declare proxyUserName: string

  @column()
  declare proxyPassword: string

  @column()
  declare proxyWaitTime: number

  @column()
  declare proxyToken: string

  @column()
  declare proxyApiUrl: string

  @column()
  declare isAutoChange: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
