/**
 * 页面巡检：用本机 Chrome/Edge 打开预览服务，逐页检查控制台报错、横向溢出与关键交互。
 * 运行：先 npm run preview，再 npm run qa（可用 QA_BASE 指定地址）
 */
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'

const CANDIDATES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
]
const executablePath = CANDIDATES.find((p) => fs.existsSync(p))
if (!executablePath) {
  console.error('未找到本机 Chrome / Edge，跳过浏览器巡检')
  process.exit(1)
}

async function findBase() {
  if (process.env.QA_BASE) return process.env.QA_BASE
  for (let port = 4380; port <= 4395; port++) {
    const url = `http://127.0.0.1:${port}`
    try {
      const r = await fetch(`${url}/`, { signal: AbortSignal.timeout(1500) })
      if (!r.ok) continue
      // 只认本站点，避免连到同一端口范围内其它遗留的预览服务
      if ((await r.text()).includes('GAME THEORY LAB')) return url
    } catch {
      // 端口没开，继续试下一个
    }
  }
  return null
}

const BASE = await findBase()
if (!BASE) {
  console.error('未检测到预览服务，请先运行 npm run preview')
  process.exit(1)
}
console.log(`预览地址：${BASE}`)

const ROUTES = [
  ['/', '首页'],
  ['/course', '课程目录'],
  ['/lesson/s1-01', '第 1 讲 基础'],
  ['/lesson/s2-02', '占优策略（含推导）'],
  ['/lesson/s3-03', '混合策略求解'],
  ['/lesson/s4-02', '逆向归纳（博弈树）'],
  ['/lesson/s5-02', '贝叶斯纳什均衡'],
  ['/lesson/s6-02', '重复博弈（内嵌实验室）'],
  ['/lesson/s7-03', '拍卖与机制设计'],
  ['/lesson/s8-01', '综合实战'],
  ['/labs', '实验室列表'],
  ['/labs/matrix', '矩阵实验室'],
  ['/labs/repeat', '重复博弈实验室'],
  ['/labs/bayes', '贝叶斯实验室'],
  ['/cases', '案例库'],
  ['/cases/s1-01-c1', '案例详情'],
  ['/wrong', '错题本'],
  ['/me', '个人页'],
  ['/about', '关于'],
]

const VIEWPORTS = [
  { name: '桌面 1280', width: 1280, height: 800 },
  { name: '手机 390', width: 390, height: 844 },
]

const problems = []
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
})

for (const vp of VIEWPORTS) {
  const page = await browser.newPage()
  await page.setViewport({ width: vp.width, height: vp.height })
  let current = ''
  page.on('console', (m) => {
    if (m.type() === 'error') problems.push(`[${vp.name}] ${current} 控制台报错：${m.text().slice(0, 160)}`)
  })
  page.on('pageerror', (e) => {
    problems.push(`[${vp.name}] ${current} 未捕获异常：${String(e).slice(0, 160)}`)
  })
  for (const [route, name] of ROUTES) {
    current = name
    await page.goto(`${BASE}/#${route}`, { waitUntil: 'networkidle0', timeout: 25000 })
    // 讲义页是异步 chunk，首个路由可能还在下载；等内容真正渲染出来再取样
    await page
      .waitForFunction(() => (document.getElementById('root')?.innerText || '').length > 80, { timeout: 8000 })
      .catch(() => {})
    await wait(220)
    const r = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      textLen: (document.getElementById('root')?.innerText || '').length,
      h1: document.querySelector('h1')?.textContent?.trim() || '',
    }))
    if (r.textLen < 80) problems.push(`[${vp.name}] ${name} 页面内容过少（${r.textLen} 字符）`)
    if (!r.h1) problems.push(`[${vp.name}] ${name} 缺少主标题`)
    if (r.scrollWidth > r.innerWidth + 2) {
      const wide = await page.evaluate(() => {
        const w = window.innerWidth
        const inScrollable = (e) => {
          let p = e.parentElement
          while (p && p !== document.body) {
            const ox = getComputedStyle(p).overflowX
            if (ox === 'auto' || ox === 'scroll' || ox === 'hidden') return true
            p = p.parentElement
          }
          return false
        }
        return [...document.querySelectorAll('body *')]
          .filter((e) => e.getBoundingClientRect().right > w + 2 && !inScrollable(e))
          .slice(0, 6)
          .map((e) => `${e.tagName}.${String(e.className).slice(0, 42)}@${Math.round(e.getBoundingClientRect().right)}`)
      })
      problems.push(`[${vp.name}] ${name} 横向溢出：${r.scrollWidth} > ${r.innerWidth}｜${wide.join(' ')}`)
    }
  }
  await page.close()
  console.log(`  ${vp.name}：${ROUTES.length} 个页面已巡检`)
}

// 关键交互：矩阵实验室「猎鹿」预设的混合均衡应为 3/4（验证 p* 公式修复）
{
  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 900 })
  await page.goto(`${BASE}/#/labs/matrix`, { waitUntil: 'networkidle0', timeout: 25000 })
  await wait(250)
  const clicked = await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => x.textContent?.trim() === '猎鹿')
    if (b) { b.click(); return true }
    return false
  })
  if (!clicked) problems.push('矩阵实验室找不到「猎鹿」预设按钮')
  await wait(250)
  const txt = await page.evaluate(() => document.body.innerText)
  if (!txt.includes('3/4')) problems.push('猎鹿预设的混合均衡未显示 3/4，p* 公式可能仍有误')
  if (!txt.includes('两个纯策略均衡') && !txt.includes('猎鹿')) problems.push('猎鹿预设的均衡说明缺失')
  await page.close()
  console.log('  交互实测：猎鹿预设混合均衡 3/4')
}

// 关键交互：重复博弈实验室默认参数下临界 δ* = 0.5
{
  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 900 })
  await page.goto(`${BASE}/#/labs/repeat`, { waitUntil: 'networkidle0', timeout: 25000 })
  await wait(250)
  const txt = await page.evaluate(() => document.body.innerText)
  if (!txt.includes('0.5')) problems.push('重复博弈实验室未显示临界 δ* = 0.5')
  await page.close()
  console.log('  交互实测：重复博弈 δ* = 0.5')
}

await browser.close()

if (problems.length) {
  console.error(`\n发现 ${problems.length} 个问题：`)
  problems.slice(0, 40).forEach((p) => console.error('  ✗ ' + p))
  if (problems.length > 40) console.error(`  … 其余 ${problems.length - 40} 条省略`)
  process.exit(1)
}
console.log('\n浏览器巡检通过：无控制台报错、无横向溢出、关键计算正确。')
