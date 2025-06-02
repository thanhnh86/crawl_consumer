// import RabbitMQConnect from '#services/rabbitmq/connect'
// import { Channel } from 'amqplib'
// import CrawlController from '#controllers/crawl_controller'
// // import env from '#start/env'
//
// const buyChannelName: string = 'daily_queue'
// const buyConsumer: Channel = await RabbitMQConnect.connect(buyChannelName)
// await buyConsumer.prefetch(10)
// buyConsumer.consume(
//   buyChannelName,
//   async (message: any) => {
//     const data = JSON.parse(message.content.toString())
//     await new CrawlController().crawl(data.url, data.checkin, data.hotelName)
//     buyConsumer.ack(message)
//   },
//   { noAck: false }
// )
