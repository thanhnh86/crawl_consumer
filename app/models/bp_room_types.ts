import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class RoomTypes extends BaseModel {
  public static connection = 'mysql_bp'

  static table = 'room_types'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'hotel_id' })
  declare hotelId: string

  @column()
  declare deleted: number

  @column()
  declare name: string
}
