import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import ExpediaRoom from '#models/expedia_room'
import type { HasMany } from '@adonisjs/lucid/types/relations'

export default class Expedia extends BaseModel {
  public static connection = 'mysql_expedia'

  static table = 'expedia'
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column({ columnName: 'bp_hotel_id' })
  declare bpHotelId: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => ExpediaRoom, {
    localKey: 'id',
    foreignKey: 'expediaId',
  })
  declare expediaRooms: HasMany<typeof ExpediaRoom>
}
