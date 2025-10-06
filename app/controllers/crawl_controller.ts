import CrawlService from '#services/crawl/crawl_service'
import { DeclareType } from '#types/declare_type'
import CrawledPriceService from '#services/crawl/crawled_price_service'
import Producer from '#services/rabbitmq/producer'
import ExpediaJob from '#models/expedia_job'
import { Channel } from 'amqplib'
import RabbitMQConnect from '#services/rabbitmq/connect'
import env from '#start/env'
import CrawlResult from '#models/crawl_result'
import { CrawlResultEnum } from '../enums/crawl_result_enum.js'

export default class CrawlController {
  static async formatDate(date: number | Date | undefined) {
    const formatter = new Intl.DateTimeFormat('en-GB')
    return formatter.format(date).replace(/\//g, '-')
  }

  async dailyQueue() {
    const urls = await ExpediaJob.all()

    const today = new Date()

    // Calculate the date 3 months from now
    const threeMonthsFromNow = new Date(today)
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3)

    const allData = []

    for (const urlItem of urls) {
      for (
        let currentDate = new Date(today);
        currentDate <= threeMonthsFromNow;
        currentDate.setDate(currentDate.getDate() + 1)
      ) {
        const formattedCheckin = await CrawlController.formatDate(currentDate)

        const checkoutDate = new Date(currentDate.getTime())
        checkoutDate.setDate(checkoutDate.getDate() + 1)
        const formattedCheckout = await CrawlController.formatDate(checkoutDate)

        allData.push({
          url: urlItem.expediaUrl,
          checkin: formattedCheckin,
          checkout: formattedCheckout,
          name: urlItem.name,
        })
      }
    }

    const shuffledData = allData.sort(() => Math.random() - 0.5)

    for (const data of shuffledData) {
      // console.log(data)
      await Producer.sendMessage('Crawl_Expedia_Job', Buffer.from(JSON.stringify(data)))
    }
  }

  async crawl(url: string, checkin: string, bpHotelName: string, channelName: string) {
    //max 1 minute to handle
    process.setMaxListeners(90000)
    let checkinDate = new Date(checkin.split('-').reverse().join('-'))
    checkinDate.setDate(checkinDate.getDate() + 1)
    let checkout = checkinDate.toISOString().slice(0, 10).split('-').reverse().join('-')
    //Handle Crawl
    const dataCrawl: DeclareType[] = await new CrawlService().crawl(
      url,
      checkin,
      checkout,
      bpHotelName
    )
    if (dataCrawl.length > 0) {
      await new CrawledPriceService().handlePrice(dataCrawl, checkin, checkout, bpHotelName)
      await CrawlResult.create({
        url,
        date: checkinDate,
        status: CrawlResultEnum.SUCCESS,
        proxyId: env.get('PROXY_NAME'),
      })
    } else {
      const data = {
        url,
        checkin,
        checkout,
        bpHotelName,
      }
      if (channelName === 'Crawl_Expedia_Job') {
        await Producer.sendMessage('Crawl_Expedia_Failed_Job', Buffer.from(JSON.stringify(data)))
      }
      await CrawlResult.create({
        url,
        date: checkinDate,
        status: CrawlResultEnum.FAIL,
        proxyId: env.get('PROXY_NAME'),
      })
    }
  }

  async crawl_test() {
    //max 1 minute to handle
    process.setMaxListeners(60000)
    let bpHotelName: string = "Pao's Sapa Leisure Hotel"
    let url: string =
      'https://www.expedia.com.vn/Sa-Pa-Khach-San-Paos-Sapa-Leisure-Hotel.h19562852.Thong-tin-khach-san'
    let checkin: string = '16-04-2025'
    let checkinDate = new Date(checkin.split('-').reverse().join('-'))
    checkinDate.setDate(checkinDate.getDate() + 1)
    let checkout = checkinDate.toISOString().slice(0, 10).split('-').reverse().join('-')
    //Handle Crawl
    const dataCrawl: DeclareType[] = await new CrawlService().crawl(
      url,
      checkin,
      checkout,
      bpHotelName
    )
    if (dataCrawl.length > 0) {
      await new CrawledPriceService().handlePrice(dataCrawl, checkin, checkout, bpHotelName)
      console.log('finish')
    } else {
      console.log('nothing')
    }
  }

  async getMessage() {
    const ChannelName: string = 'daily_queue'
    const Consumer: Channel = await RabbitMQConnect.connect(ChannelName)
    await Consumer.prefetch(env.get('RABBITMQ_PREFETCH'))
    Consumer.consume(
      ChannelName,
      async (message: any) => {
        const data = JSON.parse(message.content.toString())
        Consumer.ack(message)
        await this.crawl(data.url, data.checkin, data.name, 'Crawl_Expedia_Job')
      },
      { noAck: false }
    )
  }
}
