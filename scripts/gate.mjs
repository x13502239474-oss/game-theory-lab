// 答案门控专项检查：未作答前，页面不得出现答案解析文本
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'

const CANDIDATES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
]
const executablePath = CANDIDATES.find((p) => fs.existsSync(p))
const BASE = process.argv[2] || 'http://127.0.0.1:4390'

const browser = await puppeteer.launch({ executablePath, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] })
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 900 })

const LESSONS = ['#/lesson/s1-01', '#/lesson/s2-03', '#/lesson/s3-03', '#/lesson/s6-02', '#/lesson/s7-01']
let bad = 0

for (const route of LESSONS) {
  await page.goto(`${BASE}/${route}`, { waitUntil: 'networkidle0', timeout: 25000 })
  await page.waitForFunction(() => (document.getElementById('root')?.innerText || '').length > 80, { timeout: 8000 }).catch(() => {})
  await new Promise((r) => setTimeout(r, 250))
  const r = await page.evaluate(() => {
    const text = document.getElementById('root')?.innerText || ''
    return { len: text.length, has: text.includes('解析') || text.includes('易错') }
  })
  const leak = await page.evaluate(() => {
    // 查找任何已展开的讲解块（提交后才应出现的标记）
    const blocks = [...document.querySelectorAll('[data-reveal], .quiz-answer, .explanation')]
    return blocks.filter((b) => b.offsetParent !== null && (b.innerText || '').trim().length > 10).length
  })
  const status = leak === 0 ? 'OK' : `泄露 ${leak} 处`
  if (leak !== 0) bad++
  console.log(`${route.padEnd(18)} 文本 ${String(r.len).padStart(5)} 字 · 未提交讲解可见块 ${leak} → ${status}`)
}

await browser.close()
console.log(bad === 0 ? '答案门控通过：未作答前不显示答案与解析' : `答案门控存在问题：${bad} 个页面泄露`)
process.exit(bad === 0 ? 0 : 1)
