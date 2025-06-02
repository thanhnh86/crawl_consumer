import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import RoomTypes from '#models/bp_room_types'

export default class BpHotel extends BaseModel {
  public static connection = 'mysql_bp'

  static table = 'hotels'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @hasMany(() => RoomTypes, {
    serializeAs: 'room_types',
    localKey: 'id',
    foreignKey: 'hotelId',
  })
  declare roomTypes: HasMany<typeof RoomTypes>
}
