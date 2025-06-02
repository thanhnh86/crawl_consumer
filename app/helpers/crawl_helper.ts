import { Page } from 'puppeteer'

function removeHtmlTags(input: string) {
  return input.replace(/<\/?[^>]+(>|$)/g, '')
}

async function autoScroll(page: Page) {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      const randomNumber = Math.floor(Math.random() * (200 - 100 + 1)) + 100
      var totalHeight = 0
      var distance = 20
      var timer = setInterval(() => {
        var scrollHeight = document.body.scrollHeight
        window.scrollBy(0, distance)
        totalHeight += distance

        if (totalHeight >= scrollHeight - window.innerHeight) {
          clearInterval(timer)
          resolve()
        }
      }, randomNumber)
    })
  })
}

export { removeHtmlTags, autoScroll }
