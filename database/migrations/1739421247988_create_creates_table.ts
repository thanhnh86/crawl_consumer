import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'expedia_price'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('include_breakfast').defaultTo(false).after('price')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('include_breakfast')
    })
  }
}
