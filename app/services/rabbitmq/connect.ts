import rabbit, { RabbitManager } from 'adonis-rabbit/build/standalone.js'
import { Channel } from 'amqplib'
import env from '#start/env'
import { RabbitMqConfig } from '#types/declare_type'

export default class RabbitMQConnect {
  static async connect(channelName: string): Promise<Channel> {
    const config: RabbitMqConfig = {
      user: env.get('RABBITMQ_USER'),
      password: env.get('RABBITMQ_PASSWORD'),
      hostname: env.get('RABBITMQ_HOSTNAME'),
      port: env.get('RABBITMQ_PORT'),
      protocol: env.get('RABBITMQ_PROTOCOL'),
    }

    const rabbitMQ: RabbitManager = new rabbit.RabbitManager(config)
    // @ts-ignore
    const channel: Channel = await rabbitMQ.getChannel()

    await channel.assertQueue(channelName, {
      durable: true,
      autoDelete: false,
    })

    return channel
  }
}
