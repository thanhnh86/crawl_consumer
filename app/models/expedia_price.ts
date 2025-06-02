import { DateTime } from 'luxon'
import { BaseModel, column, hasOne } from '@adonisjs/lucid/orm'
import type { HasOne } from '@adonisjs/lucid/types/relations'
import Expedia from '#models/expedia'
import ExpediaRoom from '#models/expedia_room'

export default class ExpediaPrice extends BaseModel {
  public static connection = 'mysql_expedia'

  static table = 'expedia_price'
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'expedia_id' })
  declare expediaId: number

  @column({ columnName: 'expedia_room' })
  declare expediaRoom: number

  @column()
  declare price: number

  @column({ columnName: 'include_breakfast' })
  declare includeBreakfast: boolean

  @column.date({ columnName: 'start_date' })
  declare startDate: DateTime

  @column.date({ columnName: 'end_date' })
  declare endDate: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasOne(() => Expedia, {
    localKey: 'expediaId',
    foreignKey: 'id',
  })
  declare expediaHotel: HasOne<typeof Expedia>

  @hasOne(() => ExpediaRoom, {
    localKey: 'expediaRoom',
    foreignKey: 'id',
  })
  declare expediaRoomData: HasOne<typeof ExpediaRoom>
}
