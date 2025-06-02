import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'expedia'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Add the new column
      table.integer('bp_hotel_id').unsigned().nullable().after('name')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      // Remove the column
      table.dropColumn('bp_hotel_id')
    })
  }
}
