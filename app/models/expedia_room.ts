import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class ExpediaRoom extends BaseModel {
  public static connection = 'mysql_expedia'

  static table = 'expedia_rooms'
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'expedia_id' })
  declare expediaId: number

  @column({ columnName: 'bp_room_id' })
  declare bpRoomId: number

  @column()
  declare name: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
