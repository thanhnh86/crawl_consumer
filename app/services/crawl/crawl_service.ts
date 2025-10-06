import { autoScroll } from '../../helpers/crawl_helper.js'
import puppeteer from 'puppeteer'
import env from '#start/env'
import { DeclareType } from '#types/declare_type'
import Producer from '#services/rabbitmq/producer'
import ProxySetting from '#models/proxy_setting'

export default class CrawlService {
  async crawl(
      hotelUrl: string,
      checkin: string,
      checkout: string,
      bpHotelName: string
  ): Promise<DeclareType[]> {
    process.setMaxListeners(80000)

    const formatDate = (date: string) => {
      const [day, month, year] = date.split('-')
      return `${year}-${month}-${day}`
    }

    const randomNumber = Math.floor(Math.random() * (4000 - 2000 + 1)) + 2000
    const formattedChkIn: string = formatDate(checkin)
    const formattedChkOut: string = formatDate(checkout)

    const proxyQuery = await ProxySetting.query()
        .select('*')
        .where('proxy_name', env.get('PROXY_NAME'))
        .first()

    if (!proxyQuery) {
      throw new Error(`No proxy_query found for ${env.get('PROXY_NAME')}`)
    }

    // Try to connect to an existing Chrome instance (remote debugging port 9222)
    let browser: any = null
    let connected = false

    try {
      const REMOTE_CHROME_URL = env.get('REMOTE_CHROME_URL') || 'http://127.0.0.1:9222'

      browser = await puppeteer.connect({
        browserURL: REMOTE_CHROME_URL,
        defaultViewport: null,
      })

      connected = true
      // console.log('Connected to remote Chrome')

      const page = await browser.newPage()

      await page.authenticate({
        username: proxyQuery.proxyUserName,
        password: proxyQuery.proxyPassword,
      })

      // await page.goto('https://api.ipify.org?format=json', {
      //   waitUntil: 'networkidle2',
      // })
      //
      // const ip = await page.evaluate(() => {
      //   try {
      //     return JSON.parse(document.body.innerText).ip
      //   } catch (e) {
      //     return document.body.innerText
      //   }
      // })
      //
      // console.log('>>> Current public IP via proxy:', ip)

      // set headers
      await page.setExtraHTTPHeaders({
        'accept-language': 'en-US,en;q=0.9',
      })

      const url = this.constructUrl(hotelUrl, formattedChkIn, formattedChkOut)

      await page.goto(url, { waitUntil: 'networkidle2', timeout: 1200000 })

      const delay = (ms: any) => new Promise((resolve) => setTimeout(resolve, ms))
      await delay(randomNumber)

      await autoScroll(page)
      const result = await this.scrapeHotelData(page)

      // close the page (but don't close remote browser)
      // console.log('result 2 : ', result)
       await page.close()

      return result
    } catch (e: any) {
      const data = {
        url: hotelUrl,
        checkin: checkin,
        checkout,
        name: bpHotelName,
      }
      await Producer.sendMessage('Crawl_Expedia_Failed_Job', Buffer.from(JSON.stringify(data)))
      console.error('Error when crawling :', e?.message || e)
      return []
    } finally {
      try {
        if (connected && browser) {
          // disconnect from remote browser (do not close Chrome process)
          await browser.disconnect()
          console.log('Disconnected from remote Chrome')
        } else if (browser && typeof browser.close === 'function') {
          // fallback: if we ever launched browser locally (not in this code path), close it
          await browser.close()
        }
      } catch (err) {
        console.warn('Error when disconnecting/closing browser:', err)
      }
    }
  }

  constructUrl(hotelUrl: string, chkIn: string, chkOut: string) {
    return `${hotelUrl}?chkin=${chkIn}&chkout=${chkOut}`
  }

  async scrapeHotelData(page: { evaluate: (arg1: any) => any }): Promise<DeclareType[]> {
    return page.evaluate(() => {
      const availRoomSelector =
          '.uitk-layout-grid.uitk-layout-grid-has-auto-columns.uitk-layout-grid-has-columns-by-auto_fill.uitk-layout-grid-has-columns-using-auto-grid.uitk-layout-grid-has-space.uitk-layout-grid-display-grid.uitk-layout-grid-justify-content-start.uitk-spacing.uitk-spacing-margin-small-inline-three.uitk-spacing-margin-medium-inline-unset'
      const hotelRoomsName = Array.from(
          document.querySelectorAll(`${availRoomSelector} .uitk-heading.uitk-heading-6`)
      ).map((hotel) => hotel.textContent?.trim() || null)

      const xpathHotelName =
          '/html/body/div[2]/div[1]/div/div/main/div/div/section/div[1]/div/div/div[2]/div/div[3]/div[1]/div/div/div[1]/div/div[1]/div/h1'

      const xpathHotelName2 =
          '/html/body/div[2]/div[1]/div/div/main/div/div/section/div[1]/div/div/div[2]/div/div[3]/div[1]/div/div[1]/div[1]/div[1]/div/div/div[1]/div/h1'

      let hotelNameElement = document.evaluate(
          xpathHotelName,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
      ).singleNodeValue

      if (!hotelNameElement) {
        hotelNameElement = document.evaluate(
            xpathHotelName2,
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
        ).singleNodeValue
      }
      const hotelName = hotelNameElement ? hotelNameElement.textContent?.trim() || null : null


      const hotelRoomsPrice = Array.from(
        document.querySelectorAll(
          `${availRoomSelector} [data-stid="price-summary"] div > div:nth-child(2) .uitk-text.uitk-type-end.uitk-type-300.uitk-text-default-theme`
        )
      ).map((price) => {
        const rawPrice = price.textContent?.trim() || null
        const numericMatch = rawPrice?.match(/\d+([.,]\d+)*/)?.[0] || null
        return numericMatch ? Number.parseInt(numericMatch.replace(/[.,]/g, ''), 10) : null
      })

      const hotelRoomsDetails = Array.from(
          document.querySelectorAll(
              `${availRoomSelector} .uitk-typelist.uitk-typelist-orientation-stacked.uitk-typelist-size-2.uitk-typelist-spacing.uitk-spacing.uitk-spacing-margin-blockstart-three`
          )
      ).map((detailList) => {
        return Array.from(detailList.children)
            .map((child) => child.textContent?.trim())
            .filter(Boolean)
      })

      return hotelRoomsName.map((roomName, index) => ({
        hotelName: hotelName,
        roomName,
        price: hotelRoomsPrice[index] || null,
        details: hotelRoomsDetails[index] || null,
      }))
    })
  }
}
