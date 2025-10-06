import Expedia from '#models/expedia'
import ExpediaRoom from '#models/expedia_room'
import ExpediaPrice from '#models/expedia_price'
import { DateTime } from 'luxon'
import BpHotel from '#models/bp_hotel'

type CrawlRow = {
  hotelName: string
  roomName: string
  price: number | null
  details: string | string[]
}

export default class CrawledPriceService {
  async handlePrice(dataCrawl: CrawlRow[], checkin: string, checkout: string, bpHotelName: string) {
    const startDate = this.fmtDate(checkin)   // yyyy-MM-dd
    const endDate   = this.fmtDate(checkout)  // yyyy-MM-dd

    // Lưu các room đã “thấy” trong lần crawl này để set giá 0 cho phần còn thiếu
    const seen: Array<{ expediaId: number; expediaRoomId: number }> = []

    // Cache nhẹ để giảm query lặp lại
    const expediaIdByName = new Map<string, number>()
    const roomIdByKey = new Map<string, number>() // key = `${expediaId}::${roomName}`

    for (const row of dataCrawl) {
      // 1) Expedia (hotel)
      const expediaId = await this.getOrCreateExpediaId(row.hotelName, bpHotelName, expediaIdByName)
      if (!expediaId) continue

      // 2) ExpediaRoom (room)
      const roomKey = `${expediaId}::${row.roomName}`
      let expediaRoomId = roomIdByKey.get(roomKey)
      if (!expediaRoomId) {
        const existedRoom = await ExpediaRoom.query()
            .where('name', row.roomName)
            .where('expedia_id', expediaId)
            .first()

        expediaRoomId = existedRoom
            ? existedRoom.id
            : (await ExpediaRoom.create({ name: row.roomName, expediaId })).id

        roomIdByKey.set(roomKey, expediaRoomId)
      }

      seen.push({ expediaId, expediaRoomId })

      // 3) ExpediaPrice (price) — chỉ cập nhật khi giá thay đổi
      const newPrice = row.price ?? 0
      const includeBreakfast = this.hasBreakfast(row.details)

      const existing = await ExpediaPrice.query()
          .where('expedia_id', expediaId)
          .where('expedia_room', expediaRoomId)
          .where('start_date', startDate)
          .where('end_date', endDate)
          .first()

      if (!existing) {
        // Chưa có bản ghi => tạo mới (chỉ khi có giá hoặc muốn mặc định 0)
        await ExpediaPrice.create({
          expediaId,
          expediaRoom: expediaRoomId,
          price: newPrice,
          includeBreakfast,
          startDate: DateTime.fromFormat(checkin, 'dd-MM-yyyy'),
          endDate: DateTime.fromFormat(checkout, 'dd-MM-yyyy'),
        })
      } else if (existing.price !== newPrice) {
        // Chỉ cập nhật khi GIÁ thay đổi
        await ExpediaPrice.query()
            .where('id', existing.id)
            .update({ price: newPrice })
      }
      // (Nếu muốn cập nhật cả includeBreakfast khi thay đổi, bật khối dưới)
      // else if (existing.includeBreakfast !== includeBreakfast) {
      //   await ExpediaPrice.query().where('id', existing.id).update({ includeBreakfast })
      // }
    }

    // 4) Đặt giá = 0 với các phòng không xuất hiện trong lần crawl này (giữ nguyên hành vi cũ)
    await this.zeroOutMissingRooms(seen, startDate, endDate)
  }

  /** Chuẩn hoá dd-MM-yyyy -> yyyy-MM-dd */
  private fmtDate(d: string) {
    return DateTime.fromFormat(d, 'dd-MM-yyyy').toFormat('yyyy-MM-dd')
  }

  /** Tìm hoặc tạo mới khách sạn, ưu tiên liên kết bpHotelId theo tên LIKE %bpHotelName% */
  private async getOrCreateExpediaId(
      hotelName: string,
      bpHotelName: string,
      cache: Map<string, number>
  ): Promise<number | null> {
    const cached = cache.get(hotelName)
    if (cached) return cached

    let expedia = await Expedia.query().where('name', hotelName).first()
    if (!expedia) {
      let bpHotelId: number | undefined
      if (bpHotelName) {
        const bp = await BpHotel.query().where('name', 'LIKE', `%${bpHotelName}%`).first()
        if (bp) bpHotelId = bp.id
      }
      expedia = await Expedia.create({ name: hotelName, ...(bpHotelId ? { bpHotelId } : {}) })
    }
    cache.set(hotelName, expedia.id)
    return expedia.id
  }

  /** Set price = 0 với các phòng có bản ghi giá nhưng không xuất hiện trong crawl lần này */
  private async zeroOutMissingRooms(
      seen: Array<{ expediaId: number; expediaRoomId: number }>,
      startDate: string,
      endDate: string
  ) {
    if (seen.length === 0) return
    const expediaId = seen[0].expediaId
    // Nếu có nhiều khách sạn trộn trong 1 lần crawl thì bỏ qua để tránh set nhầm
    if (seen.some((s) => s.expediaId !== expediaId)) return

    const seenRoomIds = new Set(seen.map((s) => s.expediaRoomId))

    const existingPrices = await ExpediaPrice.query()
        .where('expedia_id', expediaId)
        .where('start_date', startDate)
        .where('end_date', endDate)

    const toZeroIds = existingPrices
        .filter((p) => !seenRoomIds.has(p.expediaRoom))
        .map((p) => p.id)

    if (toZeroIds.length) {
      await ExpediaPrice.query().whereIn('id', toZeroIds).update({ price: 0 })
    }
  }

  /** Kiểm tra bữa sáng từ string|string[] (không phân biệt hoa/thường, có cả keyword tiếng Anh/VN) */
  private hasBreakfast(details: string | string[]): boolean {
    const text =
        Array.isArray(details) ? details.join(' | ') : (details ?? '').toString()
    const lower = text.toLowerCase()
    return (
        lower.includes('bữa sáng') ||
        lower.includes('bua sang') ||
        lower.includes('breakfast')
    )
  }
}
