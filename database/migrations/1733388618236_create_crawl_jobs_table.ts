import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'crawl_jobs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name').nullable().collate('utf8mb4_general_ci')
      table.string('bestprice_url').nullable().collate('utf8mb4_general_ci')
      table.string('expedia_url').nullable().collate('utf8mb4_general_ci')
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
