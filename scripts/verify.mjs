/**
 * 内容校验：把课程数据打包成 JS 后逐条检查结构、答案合法性与收益矩阵划线。
 * 运行：node scripts/verify.mjs
 */
import { build } from 'esbuild'
import { pathToFileURL } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

const root = process.cwd()
const outfile = path.join(root, '.tmp', 'content-check.mjs')
fs.mkdirSync(path.dirname(outfile), { recursive: true })

await build({
  entryPoints: [path.join(root, 'src/content/index.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile,
  logLevel: 'silent',
})

const mod = await import(pathToFileURL(outfile).href + `?t=${Date.now()}`)
const { lessons, stages } = mod

const errors = []
const warns = []
const err = (m) => errors.push(m)
const warn = (m) => warns.push(m)

const LETTERS = ['A', 'B', 'C', 'D', 'E']

if (!lessons.length) err('课程为空')

lessons.forEach((l, i) => {
  const tag = `${l.id}（${l.title}）`
  if (l.order !== i + 1) err(`${tag} order=${l.order}，应为 ${i + 1}`)
  if (!l.title || !l.subtitle || !l.chapter) err(`${tag} 标题/副标题/章节缺失`)
  if (!Number.isFinite(l.minutes) || l.minutes < 10) err(`${tag} minutes 异常`)
  if (l.objectives.length !== 3) warn(`${tag} 学习目标 ${l.objectives.length} 条（建议 3 条）`)
  if (!l.hook?.paragraphs?.length) err(`${tag} 缺少问题导入`)
  if (l.concepts.length < 4) warn(`${tag} 概念 ${l.concepts.length} 个（建议 ≥4）`)
  if (l.theory.length < 10) warn(`${tag} theory 仅 ${l.theory.length} 块（建议 ≥10）`)
  if (!l.derivation) warn(`${tag} 缺少独立数学推导节`)
  else if (l.derivation.steps.length < 4) err(`${tag} 推导步骤 ${l.derivation.steps.length} 步（应 ≥4）`)
  if (!l.model) warn(`${tag} 缺少经典模型节`)
  if (l.cases.length < 2) err(`${tag} 案例 ${l.cases.length} 个（应 ≥2）`)
  l.cases.forEach((c, ci) => {
    if (!c.body || c.body.length < 60) err(`${tag} 案例 ${ci + 1} 正文过短`)
    if (!c.caveat) err(`${tag} 案例 ${ci + 1} 缺少模型边界 caveat`)
  })
  if (l.mistakes.length < 3) err(`${tag} 常见错误 ${l.mistakes.length} 条（应 ≥3）`)
  if (l.structure.length < 5) warn(`${tag} 知识结构 ${l.structure.length} 条（建议 ≥5）`)
  if (l.summary.length < 3) err(`${tag} 总结 ${l.summary.length} 条（应 ≥3）`)
  if (l.quiz.length < 5) err(`${tag} 练习 ${l.quiz.length} 题（应 ≥5）`)

  const qids = new Set()
  let calcCount = 0
  l.quiz.forEach((q) => {
    const qt = `${tag} 题 ${q.id}`
    if (qids.has(q.id)) err(`${qt} 题号重复`)
    qids.add(q.id)
    if (!q.stem || !q.explanation) err(`${qt} 题干或解析缺失`)
    if (q.explanation.length < 15) warn(`${qt} 解析偏短`)
    if (q.type === 'single') {
      if (!q.options || q.options.length < 3) err(`${qt} 选项不足`)
      if (!LETTERS.slice(0, q.options?.length || 0).includes(q.answer)) err(`${qt} 答案 ${q.answer} 不在选项范围`)
    } else if (q.type === 'judge') {
      if (q.answer !== '对' && q.answer !== '错') err(`${qt} 判断题答案必须为 对/错`)
    } else if (q.type === 'numeric') {
      calcCount++
      if (!Number.isFinite(Number(q.answer))) err(`${qt} 数值答案无法解析：${q.answer}`)
      if (q.tol === undefined) warn(`${qt} 数值题缺少 tol`)
      if (!q.steps) warn(`${qt} 数值题缺少 steps 计算过程`)
    } else if (q.type === 'fill') {
      calcCount++
      if (!q.accepted || q.accepted.length < 1) warn(`${qt} 填空题缺少可接受变体`)
    }
  })
  if (calcCount < 2) warn(`${tag} 计算/填空类题目仅 ${calcCount} 道`)

  const checkMatrix = (spec, where) => {
    if (!spec) return
    const { rows, cols } = spec
    if (!cols?.length || !rows?.length) {
      err(`${where} 矩阵行列缺失`)
      return
    }
    rows.forEach((r) => {
      if (r.cells.length !== cols.length) err(`${where} 行「${r.label}」单元格 ${r.cells.length} 个，应为 ${cols.length}`)
    })
    if (rows.length !== 2 || cols.length !== 2) return
    // 教学用表允许两种合法留白：整张表不显示划线（让学员自己找），
    // 或只标某一方（序贯博弈、按类型分表时另一方无法逐格比较）。
    if (spec.showBR === false) return
    const hasRowBR = rows.some((r) => r.cells.some((c) => c.brRow !== undefined))
    const hasColBR = rows.some((r) => r.cells.some((c) => c.brCol !== undefined))
    const A = rows.map((r) => r.cells.map((c) => Number(c.a)))
    const B = rows.map((r) => r.cells.map((c) => Number(c.b)))
    if (A.flat().some((x) => !Number.isFinite(x)) || B.flat().some((x) => !Number.isFinite(x))) return
    if (hasRowBR) for (let c = 0; c < 2; c++) {
      const best = Math.max(A[0][c], A[1][c])
      for (let r = 0; r < 2; r++) {
        const expected = A[r][c] >= best - 1e-9
        if (!!rows[r].cells[c].brRow !== expected) {
          warn(`${where} 行最优反应划线不符：${rows[r].label}/${cols[c]}（值 ${A[r][c]}，列最大 ${best}）`)
        }
      }
    }
    if (hasColBR) for (let r = 0; r < 2; r++) {
      const best = Math.max(B[r][0], B[r][1])
      for (let c = 0; c < 2; c++) {
        const expected = B[r][c] >= best - 1e-9
        if (!!rows[r].cells[c].brCol !== expected) {
          warn(`${where} 列最优反应划线不符：${rows[r].label}/${cols[c]}（值 ${B[r][c]}，行最大 ${best}）`)
        }
      }
    }
  }

  if (l.model?.matrix) checkMatrix(l.model.matrix, `${tag} 模型矩阵`)
  l.theory.forEach((b, bi) => {
    if (b.k === 'matrix') checkMatrix(b.spec, `${tag} theory[${bi}] 矩阵`)
    if (b.k === 'tree') {
      const ids = new Set()
      const walk = (n) => {
        if (ids.has(n.id)) err(`${tag} 博弈树节点 id 重复：${n.id}`)
        ids.add(n.id)
        if (n.branches?.length) {
          if (n.player === undefined) err(`${tag} 博弈树内部节点 ${n.id} 缺少 player`)
          n.branches.forEach((b2) => walk(b2.to))
        } else if (!Array.isArray(n.payoff)) {
          err(`${tag} 博弈树终端节点 ${n.id} 缺少 payoff`)
        }
      }
      walk(b.spec.root)
    }
  })
  if (l.model?.tree) {
    const ids = new Set()
    const walk = (n) => {
      if (ids.has(n.id)) err(`${tag} 模型树节点 id 重复：${n.id}`)
      ids.add(n.id)
      if (n.branches?.length) n.branches.forEach((b) => walk(b.to))
    }
    walk(l.model.tree.root)
  }
})

// ---------- 计算内核断言：讲义、交互实验室、题目答案共用同一套公式 ----------
const gameOut = path.join(root, '.tmp', 'game-check.mjs')
await build({
  entryPoints: [path.join(root, 'src/lib/game.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: gameOut,
  logLevel: 'silent',
})
const { solve2x2, posterior } = await import(pathToFileURL(gameOut).href + `?t=${Date.now()}`)
const near = (x, y, t = 1e-6) => Number.isFinite(x) && Math.abs(x - y) < t
const assert = (ok, msg) => { if (!ok) err(msg) }

// 索引：0=上左 1=上右 2=下左 3=下右；p=行方选上的概率，q=列方选左的概率
const PD = { a: [1, 5, 0, 3], b: [1, 0, 5, 3] }
const MP = { a: [1, -1, -1, 1], b: [-1, 1, 1, -1] }
const SH = { a: [4, 0, 3, 3], b: [4, 3, 0, 3] }
const BOS = { a: [3, 0, 0, 2], b: [2, 0, 0, 3] }
const HD = { a: [-1, 4, 0, 2], b: [-1, 0, 4, 2] } // V=4、C=6 的鹰鸽博弈

const rPD = solve2x2(PD)
assert(rPD.pure.length === 1 && rPD.pure[0].row === 0 && rPD.pure[0].col === 0, 'PD 纯策略均衡应为（上, 左）')
assert(rPD.rowDominant === 'top' && rPD.colDominant === 'left', 'PD 占优策略判断错误')
assert(rPD.mixed === null, 'PD 不应存在内点混合均衡')

const rMP = solve2x2(MP)
assert(rMP.pure.length === 0, '猜硬币不应有纯策略均衡')
assert(rMP.mixed && near(rMP.mixed.p, 0.5) && near(rMP.mixed.q, 0.5), '猜硬币混合均衡应为 p = q = 1/2')

const rSH = solve2x2(SH)
assert(rSH.pure.length === 2, '猎鹿应有两个纯策略均衡')
assert(rSH.mixed && near(rSH.mixed.p, 0.75) && near(rSH.mixed.q, 0.75), '猎鹿混合均衡应为 3/4')

const rBOS = solve2x2(BOS)
assert(rBOS.pure.length === 2, '性别战应有两个纯策略均衡')
assert(rBOS.mixed && near(rBOS.mixed.p, 0.6) && near(rBOS.mixed.q, 0.4), '性别战混合均衡应为 p = 3/5、q = 2/5')

const rHD = solve2x2(HD)
assert(rHD.mixed && near(rHD.mixed.p, 2 / 3) && near(rHD.mixed.q, 2 / 3), '鹰鸽混合均衡中鹰的比例应为 V/C = 2/3')

// 无差异条件与期望收益：对手按 q 混合，行方两个纯策略收益相等；对手按 p 混合，列方两个纯策略收益相等
for (const [name, m, r] of [['猜硬币', MP, rMP], ['猎鹿', SH, rSH], ['性别战', BOS, rBOS], ['鹰鸽', HD, rHD]]) {
  const { p, q } = r.mixed
  const uTop = q * m.a[0] + (1 - q) * m.a[1]
  const uBottom = q * m.a[2] + (1 - q) * m.a[3]
  assert(near(uTop, uBottom), `${name}：行方无差异条件不成立`)
  const vLeft = p * m.b[0] + (1 - p) * m.b[2]
  const vRight = p * m.b[1] + (1 - p) * m.b[3]
  assert(near(vLeft, vRight), `${name}：列方无差异条件不成立`)
  assert(near(r.mixed.rowPayoff, uTop), `${name}：行方期望收益计算错误`)
  assert(near(r.mixed.colPayoff, vLeft), `${name}：列方期望收益计算错误`)
}

assert(near(posterior(0.4, 0.8, 0.2), 0.32 / 0.44), '贝叶斯后验计算错误（常规先验）')
assert(near(posterior(0.1, 0.9, 0.3), 0.09 / 0.36), '贝叶斯后验计算错误（低先验）')
assert(near((5 - 3) / (5 - 1), 0.5), '重复博弈临界 δ* = (T−R)/(T−P) 数值错误')
assert(3 / (1 - 0.6) > 5 + (0.6 * 1) / (1 - 0.6), 'δ = 0.6 时合作现值应大于背叛现值')
assert(3 / (1 - 0.4) < 5 + (0.4 * 1) / (1 - 0.4), 'δ = 0.4 时背叛现值应大于合作现值')

const totalQuiz = lessons.reduce((n, l) => n + l.quiz.length, 0)
const totalCases = lessons.reduce((n, l) => n + l.cases.length, 0)
console.log(`课程 ${lessons.length} 讲 · 部分 ${stages.length} 个 · 练习 ${totalQuiz} 题 · 案例 ${totalCases} 个 · 计算内核断言 24 项`)
if (warns.length) {
  console.log(`\n提示 ${warns.length} 条：`)
  warns.slice(0, 40).forEach((w) => console.log('  · ' + w))
  if (warns.length > 40) console.log(`  … 其余 ${warns.length - 40} 条省略`)
}
if (errors.length) {
  console.error(`\n错误 ${errors.length} 条：`)
  errors.forEach((e) => console.error('  ✗ ' + e))
  process.exit(1)
}
console.log('\n结构校验通过。')
