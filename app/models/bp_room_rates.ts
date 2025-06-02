import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class RoomRates extends BaseModel {
  public static connection = 'mysql_bp'

  static table = 'room_rates'

  @column({ columnName: 'type_id' })
  declare typeId: string

  @column()
  declare name: string
}
