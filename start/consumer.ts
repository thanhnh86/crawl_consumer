import RabbitMQConnect from '#services/rabbitmq/connect'
import { Channel, GetMessage } from 'amqplib'
import env from '#start/env'
import axios from 'axios'
import Setting from '#models/setting'
import { DateTime } from 'luxon'
import ProxySetting from '#models/proxy_setting'
import { BaseStatus } from '../app/enums/base_status_enum.js'

const proxyQuery = await ProxySetting.query()
  .select('*')
  .where('proxy_name', env.get('PROXY_NAME'))
  .first()

if (proxyQuery === null) {
  throw new Error(`No proxy_query found for ${env.get('PROXY_NAME')}`)
}

const CHANNEL_NAME = env.get('RABBITMQ_CHANNEL_NAME')
const CHANNEL_NAME2 = env.get('RABBITMQ_CHANNEL_NAME_2')
const BATCH_SIZE = env.get('RABBITMQ_PREFETCH')

const PROXY_ID: string = proxyQuery.proxyId
// const PROXY_WAIT_TIME: number = proxyQuery.proxyWaitTime
const PROXY_API_URL: string = proxyQuery.proxyApiUrl
const PROXY_TOKEN: string = proxyQuery.proxyToken

let consumer: Channel
let activeJobs = 0

process.setMaxListeners(180000)
/**
 * Initialize RabbitMQ consumer and start processing batches.
 */
async function startProcess(): Promise<void> {
  try {
    consumer = await RabbitMQConnect.connect(CHANNEL_NAME)
    await consumer.prefetch(BATCH_SIZE)
    console.log('Waiting for RabbitMQ messages...')
    await processBatch()
  } catch (error) {
    console.error('Unexpected error in process:', error)
  }
}

/**
 * Process a batch of messages before updating the proxy.
 */
async function processBatch(): Promise<void> {
  const messagePromises: Promise<void>[] = []

  // const lastProxyTime = await getLastProxyChangeTime()
  // const currentTime = Date.now()
  // if (lastProxyTime && currentTime - lastProxyTime < PROXY_WAIT_TIME) {
  //   const waitTime = PROXY_WAIT_TIME - (currentTime - lastProxyTime)
  //   console.log(
  //     `Proxy changed recently. Waiting for ${waitTime / 1000} seconds before continuing...`
  //   )
  //   await delay(waitTime)
  // }
  console.log(
    `Tien hanh cao...: ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`
  )

  for (let i = 0; i < BATCH_SIZE; i++) {
    let message = await consumer.get(CHANNEL_NAME, { noAck: false })

    // Nếu không có tin nhắn trong CHANNEL_NAME, thử lấy từ FALLBACK_CHANNEL_NAME
    if (!message) {
      console.log(`No message in ${CHANNEL_NAME}, trying ${CHANNEL_NAME2}...`)
      message = await consumer.get(CHANNEL_NAME2, { noAck: false })
    }

    if (!message) {
      console.log('No messages available in both channels. Stopping batch process.')
      break
    }

    activeJobs++
    messagePromises.push(processMessage(message))
  }

  await Promise.all(messagePromises)
  console.log('All jobs in batch finished. Changing proxy...')
  if (proxyQuery !== null && proxyQuery.isAutoChange === BaseStatus.INACTIVE) {
    console.log('Proxy ID nay can doi IP')
    await changeProxy()
  } else {
    console.log('Proxy ID khong can doi IP, tien hanh update hang doi')
  }
  await updateLastProxyChangeTime()
  await processBatch()
}

/**
 * Process a single message and execute crawling.
 * @param message - RabbitMQ message object
 */
async function processMessage(message: GetMessage): Promise<void> {
  try {
    const { default: CrawlController } = await import('#controllers/crawl_controller')
    const data = JSON.parse(message.content.toString())

    console.log('Waiting 4 seconds before crawling...')
    await delay(4000)
    const checkinDate = DateTime.fromFormat(data.checkin, 'dd-MM-yyyy')
    const today = DateTime.now().startOf('day')
    if (checkinDate < today) {
      console.log(`Checkin date: ${checkinDate} is in the past. Skipping processing.`)
    } else {
      await new CrawlController().crawl(data.url, data.checkin, data.name, CHANNEL_NAME)
    }

    activeJobs--

    consumer.ack(message)
  } catch (error) {
    console.error('Error processing message:', error)
    consumer.nack(message)
  }
}

/**
 * Update the proxy before the next batch.
 */
async function changeProxy(): Promise<void> {
  try {
    console.log('Running proxy request...')

    const response = await axios.get(
      `https://${PROXY_API_URL}/proxy/dan-cu-viet-nam/get-ip?${PROXY_ID}&location=Random`,
      {
        headers: {
          Authorization: `Bearer ${PROXY_TOKEN}`,
        },
      }
    )
    console.log('Response first status:', response.data.status)
    if (response.data.status !== 'success') {
      await delay(5000)
      await changeProxy()
    }

    console.log('Proxy changed:', response.data.status)
  } catch (error) {
    console.error('Response status:', error.response.status)
    console.error('Response body:', error.response.data)
  }
}

/**
 * Fetch the last proxy change time from the database.
 * @returns Last proxy change timestamp or null
 */
// async function getLastProxyChangeTime(): Promise<number | null> {
//   try {
//     const result = await Setting.query().where('key', PROXY_ID).select('value').first()
//
//     if (result === null) {
//       await Setting.create({
//         key: PROXY_ID,
//         value: Date.now().toString(),
//       })
//     }
//
//     return result ? Number(result.value) : null
//   } catch (error) {
//     console.error('Error fetching proxy last change time:', error)
//     return null
//   }
// }

/**
 * Update the last proxy change time in the database.
 */
async function updateLastProxyChangeTime(): Promise<void> {
  try {
    await Setting.query().where('key', PROXY_ID).update({ value: Date.now().toString() })

    console.log(
      `Updated proxy last change time: ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`
    )
  } catch (error) {
    console.error('Error updating proxy last change time:', error)
  }
}

/**
 * Delay execution for a specified time.
 * @param ms - Milliseconds to delay
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

startProcess()
