import { BaseCommand } from '@adonisjs/core/ace'
import User from '#models/user'
import { CommandOptions } from '@adonisjs/core/types/ace'

export default class CreateUser extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'create:user'

  /**
   * Command description displayed in the "help" output
   */
  public static description = 'Create a new user'

  /**
   * Define arguments and flags
   */
  public static settings = {
    loadApp: true, // Load the application for accessing models and database
  }

  static options: CommandOptions = {
    startApp: true,
  }

  /**
   * The command's logic goes here
   */
  public async run() {
    const email = await this.prompt.ask('Enter the email address')
    const password = await this.prompt.secure('Enter the password')

    try {
      const user = await User.create({
        email,
        password,
      })

      this.logger.success(`User created successfully: ${user.email}`)
    } catch (error) {
      this.logger.error(`Failed to create user: ${error.message}`)
    }
  }
}
