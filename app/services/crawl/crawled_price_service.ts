import Expedia from '#models/expedia'
import ExpediaRoom from '#models/expedia_room'
import ExpediaPrice from '#models/expedia_price'
import { DateTime } from 'luxon'
import BpHotel from '#models/bp_hotel'

export default class CrawledPriceService {
  async handlePrice(dataCrawl: any, checkin: string, checkout: string, bpHotelName: string) {
    const expediaPrice = []
    for (const data of dataCrawl) {
      const checkAvailableHotelName: Expedia[] | null = await Expedia.query().where(
        'name',
        data.hotelName
      )
      if (checkAvailableHotelName.length === 0) {
        const bestPriceHotel = await BpHotel.query()
          .where('name', 'LIKE', `%${bpHotelName}%`)
          .first()
        if (bestPriceHotel) {
          const bpHotelId = bestPriceHotel.id
          await Expedia.create({
            name: data.hotelName,
            bpHotelId: bpHotelId,
          })
        } else {
          await Expedia.create({
            name: data.hotelName,
          })
        }
      }

      //Expedia Room
      const expedia: Expedia | null = await Expedia.query().where('name', data.hotelName).first()
      const expediaId: number | null = expedia ? expedia.id : null
      if (expediaId) {
        const checkAvailableRoom: ExpediaRoom[] = await ExpediaRoom.query()
          .where('name', data.roomName)
          .where('expedia_id', expediaId)
        if (checkAvailableRoom.length === 0) {
          await ExpediaRoom.create({
            name: data.roomName,
            expediaId,
          })
        }
      }

      //Expedia Price
      const expediaRoom: ExpediaRoom | null = await ExpediaRoom.query()
        .where('name', data.roomName)
        .first()
      const ExpediaRoomId: number | null = expediaRoom ? expediaRoom.id : null
      if (ExpediaRoomId && expediaId) {
        const checkAvailablePrice: ExpediaPrice | null = await ExpediaPrice.query()
          .where('expedia_id', expediaId)
          .where('expedia_room', ExpediaRoomId)
          .where('start_date', DateTime.fromFormat(checkin, 'dd-MM-yyyy').toFormat('yyyy-MM-dd'))
          .where('end_date', DateTime.fromFormat(checkout, 'dd-MM-yyyy').toFormat('yyyy-MM-dd'))
          .first()
        const HotelPrice: number | null = checkAvailablePrice ? checkAvailablePrice.id : null
        if (HotelPrice === null && data.price !== null) {
          await ExpediaPrice.create({
            expediaId,
            expediaRoom: ExpediaRoomId,
            price: data.price,
            includeBreakfast: await this.isHasBreakfast(data.details),
            startDate: DateTime.fromFormat(checkin, 'dd-MM-yyyy'),
            endDate: DateTime.fromFormat(checkout, 'dd-MM-yyyy'),
          })
          expediaPrice.push({
            expediaId,
            ExpediaRoomId,
            price: data.price,
          })
        } else if (HotelPrice !== null && HotelPrice !== data.price) {
          await ExpediaPrice.query()
            .where('expedia_id', expediaId)
            .where('expedia_room', ExpediaRoomId)
            .where('start_date', DateTime.fromFormat(checkin, 'dd-MM-yyyy').toFormat('yyyy-MM-dd'))
            .where('end_date', DateTime.fromFormat(checkout, 'dd-MM-yyyy').toFormat('yyyy-MM-dd'))
            .update({
              price: data.price,
            })
          expediaPrice.push({
            expediaId,
            ExpediaRoomId,
            price: data.price,
            includeBreakfast: await this.isHasBreakfast(data.details),
          })
        } else if (HotelPrice !== null && data.price === null) {
          await ExpediaPrice.query()
            .where('expedia_id', expediaId)
            .where('expedia_room', ExpediaRoomId)
            .where('start_date', DateTime.fromFormat(checkin, 'dd-MM-yyyy').toFormat('yyyy-MM-dd'))
            .where('end_date', DateTime.fromFormat(checkout, 'dd-MM-yyyy').toFormat('yyyy-MM-dd'))
            .update({
              price: 0,
            })
          expediaPrice.push({
            expediaId,
            ExpediaRoomId,
            price: data.price,
            includeBreakfast: await this.isHasBreakfast(data.details),
          })
        }
      }
    }
    //Compare and set empty price with no left crawled_data
    await this.processHotelPrices(expediaPrice, checkin, checkout)
  }

  async processHotelPrices(expediaPrice: any[], checkin: string, checkout: string) {
    const uniqueExpediaIds = [...new Set(expediaPrice.map((entry) => entry.expediaId))]
    if (uniqueExpediaIds.length !== 1) {
      // throw new Error('Entries must have a single, consistent expediaId')
      return console.log('Entries must have a single, consistent expediaId: ', uniqueExpediaIds)
    }
    const expediaId = uniqueExpediaIds[0]

    const startDate = DateTime.fromFormat(checkin, 'dd-MM-yyyy').toFormat('yyyy-MM-dd')
    const endDate = DateTime.fromFormat(checkout, 'dd-MM-yyyy').toFormat('yyyy-MM-dd')

    const existingPrices = await ExpediaPrice.query()
      .where('expedia_id', expediaId)
      .where('start_date', startDate)
      .where('end_date', endDate)

    const newEntryIds = new Set(expediaPrice.map((entry) => `${entry.ExpediaRoomId}`))

    const updatePromises = existingPrices.map(async (existingPrice) => {
      if (!newEntryIds.has(`${existingPrice.expediaRoom}`)) {
        existingPrice.price = 0
        return existingPrice.save()
      }
      return Promise.resolve()
    })

    await Promise.all(updatePromises)
  }

  async isHasBreakfast(data: string | string[]) {
    return data.includes('Bữa sáng miễn phí')
  }
}
