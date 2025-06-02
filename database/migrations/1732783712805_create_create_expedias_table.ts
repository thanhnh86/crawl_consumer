import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected expedia = 'expedia'
  protected expedia_rooms = 'expedia_rooms'
  protected expedia_price = 'expedia_price'

  async up() {
    this.schema.createTable(this.expedia, (table) => {
      table.increments('id')
      table.string('name').notNullable().collate('utf8mb4_general_ci')
      table.string('url').nullable()
      table.timestamp('created_at')
      table
        .timestamp('updated_at')
        .defaultTo(this.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'))
    })
    this.schema.createTable(this.expedia_rooms, (table) => {
      table.increments('id')
      table.integer('expedia_id').unsigned().notNullable()
      table.integer('bp_room_id').unsigned().nullable().comment('bp room types')
      table.string('name').notNullable().collate('utf8mb4_general_ci')
      table.timestamp('created_at')
      table
        .timestamp('updated_at')
        .defaultTo(this.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'))
    })
    this.schema.createTable(this.expedia_price, (table) => {
      table.increments('id')
      table.integer('expedia_id').unsigned().notNullable()
      table.integer('expedia_room').unsigned().notNullable()
      table.float('price', 12).nullable()
      table.date('start_date').notNullable()
      table.date('end_date').notNullable()
      table.timestamp('created_at')
      table
        .timestamp('updated_at')
        .defaultTo(this.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'))
    })
  }

  async down() {
    this.schema.dropTable(this.expedia)
    this.schema.dropTable(this.expedia_rooms)
    this.schema.dropTable(this.expedia_price)
  }
}
