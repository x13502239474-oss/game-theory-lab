#!/usr/bin/env node
/**
 * 通过 GitHub Git Data API 提交并推送。
 *
 * 为什么用 curl 而不是 fetch：本机走本地 HTTP 代理（HTTP_PROXY 环境变量），
 * Node 内置 fetch（undici）默认不读代理环境变量，请求会被拦成 404。
 * curl 会读环境变量里的代理，所以这里统一用 curl 发请求。
 *
 * 用法：
 *   node scripts/deploy.mjs pages   # 提交 dist/ 到 gh-pages（线上地址）
 *   node scripts/deploy.mjs main    # 提交源码到 main
 *
 * 凭据：优先读环境变量 GH_TOKEN，没有则读项目根目录的 .deploy.env（已 gitignore）
 *   GH_REPO   默认 x13502239474-oss/game-theory-lab
 *   GH_MSG    可选，提交信息
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

function loadEnvFile() {
  const file = path.resolve('.deploy.env')
  if (!fs.existsSync(file)) return
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const s = line.trim()
    if (!s || s.startsWith('#')) continue
    const eq = s.indexOf('=')
    if (eq < 0) continue
    const key = s.slice(0, eq).trim()
    const val = s.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[key]) process.env[key] = val
  }
}
loadEnvFile()

const TOKEN = process.env.GH_TOKEN
const REPO = process.env.GH_REPO || 'x13502239474-oss/game-theory-lab'
const TARGET = process.argv[2] || 'pages'

if (!TOKEN) {
  console.error('缺少 GH_TOKEN：请设置环境变量，或写入 .deploy.env')
  process.exit(1)
}

const API = 'https://api.github.com'
const TMP = path.resolve('.tmp')
fs.mkdirSync(TMP, { recursive: true })

// 令牌与请求头写进文件，避免出现在进程参数里被其他程序读取
const HEADER_FILE = path.join(TMP, 'gh-headers.txt')
fs.writeFileSync(
  HEADER_FILE,
  [
    `Authorization: Bearer ${TOKEN}`,
    'Accept: application/vnd.github+json',
    'X-GitHub-Api-Version: 2022-11-28',
    'User-Agent: gametheory-lab-deploy',
  ].join('\n'),
  'utf8',
)

let seq = 0

/** 调 GitHub API：body 为对象时写临时文件再提交 */
function call(method, url, body) {
  const args = ['-s', '-m', '120', '-X', method, '-H', `@${HEADER_FILE}`, '-w', '\n%{http_code}']
  if (body) {
    const bodyFile = path.join(TMP, `body-${++seq}.json`)
    fs.writeFileSync(bodyFile, JSON.stringify(body), 'utf8')
    args.push('-H', 'Content-Type: application/json', '--data-binary', `@${bodyFile}`)
  }
  args.push(API + url)
  let out
  try {
    out = execFileSync('curl', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  } catch (e) {
    throw new Error(`curl 执行失败：${e.message}`)
  }
  const nl = out.lastIndexOf('\n')
  const text = out.slice(0, nl)
  const status = Number(out.slice(nl + 1).trim())
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { raw: text.slice(0, 300) }
  }
  if (!status || status < 200 || status >= 300) {
    const err = new Error(
      `${method} ${url} → ${status || '无响应'} ${(data && data.message) || String(text).slice(0, 200)}`,
    )
    err.status = status
    throw err
  }
  return data
}

/** 源码清单：本地没有 git 仓库，用白名单遍历 */
const SOURCE_FILES = [
  'index.html',
  'package.json',
  'package-lock.json',
  'postcss.config.js',
  'tailwind.config.js',
  'tsconfig.json',
  'vite.config.ts',
  'README.md',
  '.gitignore',
]
const SOURCE_DIRS = ['public', 'scripts', 'src']

function collectSource() {
  const out = []
  for (const rel of SOURCE_FILES) {
    const abs = path.resolve(rel)
    if (fs.existsSync(abs) && fs.statSync(abs).isFile()) out.push({ path: rel, abs })
  }
  const walk = (dirRel) => {
    const abs = path.resolve(dirRel)
    if (!fs.existsSync(abs)) return
    for (const name of fs.readdirSync(abs)) {
      const rel = `${dirRel}/${name}`
      const a = path.resolve(rel)
      if (fs.statSync(a).isDirectory()) walk(rel)
      else out.push({ path: rel, abs: a })
    }
  }
  SOURCE_DIRS.forEach(walk)
  return out
}

function collect() {
  if (TARGET === 'pages') {
    const root = path.resolve('dist')
    if (!fs.existsSync(root)) throw new Error('dist/ 不存在，请先 npm run build')
    const out = []
    const walk = (dir, prefix) => {
      for (const name of fs.readdirSync(dir)) {
        const abs = path.join(dir, name)
        const rel = prefix ? `${prefix}/${name}` : name
        if (fs.statSync(abs).isDirectory()) walk(abs, rel)
        else out.push({ path: rel, abs })
      }
    }
    walk(root, '')
    // 关掉 Jekyll，避免下划线开头的资源被吞
    out.push({ path: '.nojekyll', abs: null, content: '' })
    return out
  }
  return collectSource()
}

/** 并发执行，等所有任务都结束（不因单个失败提前退出），再抛第一条错误 */
async function pool(tasks, size = 4) {
  const results = new Array(tasks.length)
  const errors = []
  let cursor = 0
  const worker = async () => {
    while (cursor < tasks.length) {
      const i = cursor++
      try {
        results[i] = await tasks[i]()
      } catch (e) {
        errors.push(e)
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(size, tasks.length) }, worker))
  if (errors.length) throw errors[0]
  return results
}

/** 带重试的调用：网络抖动或代理临时失败时多试两次 */
async function callRetry(method, url, body, times = 3) {
  let last
  for (let i = 0; i < times; i++) {
    try {
      return call(method, url, body)
    } catch (e) {
      last = e
      if (e.status && e.status >= 400 && e.status < 500 && e.status !== 429) throw e
      await new Promise((r) => setTimeout(r, 900 * (i + 1)))
    }
  }
  throw last
}

async function headSha(branch) {
  try {
    const ref = call('GET', `/repos/${REPO}/git/ref/heads/${branch}`)
    return ref.object.sha
  } catch (e) {
    if (e.status === 404) return null
    throw e
  }
}

async function main() {
  const branch = TARGET === 'pages' ? 'gh-pages' : 'main'
  const files = collect()
  const totalKB = files.reduce((n, f) => n + (f.abs ? fs.statSync(f.abs).size : 0), 0) / 1024
  console.log(`目标 ${REPO} · 分支 ${branch}：${files.length} 个文件，${totalKB.toFixed(0)} KB`)

  // 1. 建 blob
  let done = 0
  const shas = await pool(
    files.map((f) => async () => {
      const buf = f.abs ? fs.readFileSync(f.abs) : Buffer.from(f.content || '', 'utf8')
      const blob = await callRetry('POST', `/repos/${REPO}/git/blobs`, {
        content: buf.toString('base64'),
        encoding: 'base64',
      })
      done++
      if (done % 20 === 0 || done === files.length) process.stdout.write(`  blob ${done}/${files.length}\n`)
      return blob.sha
    }),
  )

  // 2. 建 tree
  const tree = call('POST', `/repos/${REPO}/git/trees`, {
    tree: files.map((f, i) => ({ path: f.path, mode: '100644', type: 'blob', sha: shas[i] })),
  })
  console.log(`  tree ${tree.sha.slice(0, 8)}`)

  // 3. 建 commit
  const parent = await headSha(branch)
  const message = process.env.GH_MSG || (TARGET === 'pages' ? 'deploy: 构建产物' : 'update: 源码')
  const commit = call('POST', `/repos/${REPO}/git/commits`, {
    message,
    tree: tree.sha,
    parents: parent ? [parent] : [],
    author: { name: 'x13502239474-oss', email: 'x13502239474@gmail.com' },
  })
  console.log(`  commit ${commit.sha.slice(0, 8)}${parent ? ` (parent ${parent.slice(0, 8)})` : ' (root)'}`)

  // 4. 更新或创建 ref
  if (parent) {
    call('PATCH', `/repos/${REPO}/git/refs/heads/${branch}`, { sha: commit.sha, force: true })
  } else {
    call('POST', `/repos/${REPO}/git/refs`, { ref: `refs/heads/${branch}`, sha: commit.sha })
  }
  console.log(`✓ ${branch} → ${commit.sha}`)
  console.log(`  https://github.com/${REPO}/tree/${branch}`)
}

main()
  .catch((e) => {
    console.error('✗', e.message)
    process.exitCode = 1
  })
  .finally(() => {
    // 清理含令牌的请求头与请求体
    try {
      fs.rmSync(HEADER_FILE, { force: true })
      for (const f of fs.readdirSync(TMP)) {
        if (f.startsWith('body-')) fs.rmSync(path.join(TMP, f), { force: true })
      }
    } catch {}
  })
