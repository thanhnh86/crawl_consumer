import { Page } from 'puppeteer'

export function removeHtmlTags(input: string) {
  return input.replace(/<\/?[^>]+(>|$)/g, '')
}

/**
 * Cuộn giống thao tác người: tốc độ chậm (px/s), cuộn theo "chặng" có easing,
 * chèn nghỉ đọc, đôi khi cuộn ngược rất nhẹ. Kết thúc khi chạm đáy và trang ổn định.
 */
export async function autoScroll(
    page: Page,
    opts?: Partial<{
      // Tốc độ cuộn trung bình (px/giây). Giảm nữa nếu muốn chậm hơn.
      minSpeed: number
      maxSpeed: number

      // Mỗi "chặng" sẽ cuộn khoảng bao nhiêu pixel rồi nghỉ một chút
      segmentMin: number
      segmentMax: number

      // Nghỉ ngắn giữa các chặng (ms)
      pauseMin: number
      pauseMax: number

      // Thỉnh thoảng nghỉ dài như người dừng đọc (ms)
      longPauseEvery: number // sau bao nhiêu chặng thì nghỉ dài
      longPauseMin: number
      longPauseMax: number

      // Xác suất và biên độ cuộn ngược rất nhẹ (tạo tự nhiên)
      upProb: number
      upMin: number
      upMax: number

      // Dừng khi gần đáy và chiều cao trang ổn định N vòng
      bottomBuffer: number
      stableRounds: number
      maxRounds: number

      // Nán lại ở đáy
      dwellBottomMin: number
      dwellBottomMax: number
    }>
) {
  const cfg = {
    minSpeed: 180,     // px/s
    maxSpeed: 320,     // px/s
    segmentMin: 280,   // px mỗi chặng
    segmentMax: 720,
    pauseMin: 220,     // ms nghỉ ngắn
    pauseMax: 520,
    longPauseEvery: 6, // sau 6 chặng nghỉ dài 1 lần
    longPauseMin: 900,
    longPauseMax: 1800,
    upProb: 0.08,
    upMin: 12,
    upMax: 42,
    bottomBuffer: 24,
    stableRounds: 8,
    maxRounds: 3000,
    dwellBottomMin: 700,
    dwellBottomMax: 1600,
    ...(opts ?? {}),
  } as const

  // helper sleep
  const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

  await page.evaluate(
      async (o) => {
        const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
        const rand = (min: number, max: number) => Math.random() * (max - min) + min
        const randInt = (min: number, max: number) => Math.floor(rand(min, max))
        const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x))

        // Easing mượt kiểu easeInOutQuad
        const easeInOutQuad = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t)

        async function animateScrollTo(targetY: number, speedPxSec: number) {
          // Tính thời gian dựa vào quãng đường và tốc độ
          const startY = window.scrollY
          const distance = targetY - startY
          if (Math.abs(distance) < 1) return

          // Tạo thời lượng theo tốc độ, thêm chút nhiễu cho tự nhiên
          const baseDuration = Math.abs(distance) / speedPxSec // s
          const duration = clamp((baseDuration + Math.random() * 0.15) * 1000, 180, 3000) // ms

          return new Promise<void>((resolve) => {
            const start = performance.now()
            function frame(now: number) {
              const t = clamp((now - start) / duration, 0, 1)
              const eased = easeInOutQuad(t)
              const y = startY + distance * eased

              // dùng scrollTo để mượt, tránh giật
              window.scrollTo(0, y)

              if (t < 1) {
                requestAnimationFrame(frame)
              } else {
                resolve()
              }
            }
            requestAnimationFrame(frame)
          })
        }

        let lastHeight =
            document.documentElement.scrollHeight || document.body.scrollHeight
        let stable = 0
        let rounds = 0
        let segments = 0

        // kích hoạt lazy component đầu trang
        if (window.scrollY === 0) {
          window.scrollBy(0, 1)
          await sleep(rand(o.pauseMin, o.pauseMax))
        }

        while (true) {
          rounds++
          if (rounds > o.maxRounds) break

          // thỉnh thoảng cuộn ngược rất nhẹ
          if (Math.random() < o.upProb) {
            const up = randInt(o.upMin, o.upMax)
            await animateScrollTo(window.scrollY - up, rand(o.minSpeed, o.maxSpeed))
            await sleep(rand(o.pauseMin, o.pauseMax))
          }

          // cuộn theo "chặng" với tốc độ chậm – mượt
          const seg = randInt(o.segmentMin, o.segmentMax)
          const speed = rand(o.minSpeed, o.maxSpeed)
          await animateScrollTo(window.scrollY + seg, speed)
          segments++

          // nghỉ ngắn giữa chặng
          await sleep(rand(o.pauseMin, o.pauseMax))

          // lâu lâu nghỉ dài (giống dừng đọc)
          if (segments % o.longPauseEvery === 0) {
            await sleep(rand(o.longPauseMin, o.longPauseMax))
          }

          const docHeight =
              document.documentElement.scrollHeight || document.body.scrollHeight
          const atBottom =
              window.scrollY + window.innerHeight >= docHeight - o.bottomBuffer

          // theo dõi ổn định của scrollHeight để biết lazy-load đã yên
          if (docHeight <= lastHeight) {
            stable++
          } else {
            stable = 0
            lastHeight = docHeight
          }

          if (atBottom && stable >= o.stableRounds) break
        }

        // nán lại dưới đáy
        await sleep(rand(o.dwellBottomMin, o.dwellBottomMax))
      },
      cfg
  )

  // chờ nhẹ ngoài context (TypeScript-safe)
  await sleep(60)
}
