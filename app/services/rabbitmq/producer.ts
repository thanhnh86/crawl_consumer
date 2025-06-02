import { Channel } from 'amqplib'
import RabbitMQConnect from '#services/rabbitmq/connect'

export default class Producer {
  static async sendMessage(queueName: string, data: Buffer) {
    const channel: Channel = await RabbitMQConnect.connect(queueName)
    channel.sendToQueue(queueName, data, {
      persistent: true,
    })
  }
}
