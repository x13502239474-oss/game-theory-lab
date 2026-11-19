/** 2×2 博弈求解：占优、纯策略均衡、混合策略均衡。所有页面共用同一套计算逻辑。 */

export type M2 = {
  /** 行参与者收益 a11 a12 a21 a22（行：上/下；列：左/右） */
  a: [number, number, number, number]
  /** 列参与者收益 b11 b12 b21 b22 */
  b: [number, number, number, number]
}

export type SolveResult = {
  /** 每个单元格是否行/列最优反应，索引 = 行*2+列 */
  brRow: boolean[]
  brCol: boolean[]
  pure: { row: number; col: number }[]
  rowDominant: 'top' | 'bottom' | null
  colDominant: 'left' | 'right' | null
  rowDominated: 'top' | 'bottom' | null
  colDominated: 'left' | 'right' | null
  mixed: { p: number; q: number; rowPayoff: number; colPayoff: number } | null
  /** 混合均衡是否存在（0<p<1 且 0<q<1） */
  mixedInterior: boolean
}

const EPS = 1e-9

export function solve2x2(m: M2): SolveResult {
  const { a, b } = m
  const brRow = [
    a[0] >= a[2], // 上 vs 下，给定左
    a[1] >= a[3], // 给定右
    a[2] >= a[0],
    a[3] >= a[1],
  ]
  const brCol = [
    b[0] >= b[1], // 左 vs 右，给定上
    b[1] >= b[0],
    b[2] >= b[3], // 给定下
    b[3] >= b[2],
  ]

  const pure: { row: number; col: number }[] = []
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 2; c++) {
      const i = r * 2 + c
      if (brRow[i] && brCol[i]) pure.push({ row: r, col: c })
    }
  }

  const strictlyBetter = (x: number, y: number) => x > y + EPS
  const weaklyBetter = (x: number, y: number) => x >= y - EPS

  let rowDominant: SolveResult['rowDominant'] = null
  if (weaklyBetter(a[0], a[2]) && weaklyBetter(a[1], a[3]) && (strictlyBetter(a[0], a[2]) || strictlyBetter(a[1], a[3]))) rowDominant = 'top'
  if (weaklyBetter(a[2], a[0]) && weaklyBetter(a[3], a[1]) && (strictlyBetter(a[2], a[0]) || strictlyBetter(a[3], a[1]))) rowDominant = 'bottom'
  let rowDominated: SolveResult['rowDominated'] = null
  if (strictlyBetter(a[2], a[0]) && strictlyBetter(a[3], a[1])) rowDominated = 'top'
  if (strictlyBetter(a[0], a[2]) && strictlyBetter(a[1], a[3])) rowDominated = 'bottom'

  const colBetter = (i: number, j: number) => b[i] > b[j] + EPS
  let colDominant: SolveResult['colDominant'] = null
  if ((b[0] >= b[1] - EPS) && (b[2] >= b[3] - EPS) && (colBetter(0, 1) || colBetter(2, 3))) colDominant = 'left'
  if ((b[1] >= b[0] - EPS) && (b[3] >= b[2] - EPS) && (colBetter(1, 0) || colBetter(3, 2))) colDominant = 'right'
  let colDominated: SolveResult['colDominated'] = null
  if (colBetter(1, 0) && colBetter(3, 2)) colDominated = 'left'
  if (colBetter(0, 1) && colBetter(2, 3)) colDominated = 'right'

  // 混合均衡：行参与者以 p 概率选「上」，列参与者以 q 概率选「左」
  // 索引：0=上左 1=上右 2=下左 3=下右
  // q*：令行方在「上/下」之间无差异  q·a0+(1−q)·a1 = q·a2+(1−q)·a3
  // p*：令列方在「左/右」之间无差异  p·b0+(1−p)·b2 = p·b1+(1−p)·b3
  const denomQ = a[0] - a[1] - a[2] + a[3]
  const denomP = b[0] - b[1] - b[2] + b[3]
  const q = Math.abs(denomQ) < EPS ? NaN : (a[3] - a[1]) / denomQ
  const p = Math.abs(denomP) < EPS ? NaN : (b[3] - b[2]) / denomP
  const interior = Number.isFinite(p) && Number.isFinite(q) && p > EPS && p < 1 - EPS && q > EPS && q < 1 - EPS

  let mixed: SolveResult['mixed'] = null
  if (interior) {
    const rowPayoff = q * a[0] + (1 - q) * a[1]
    const colPayoff = p * b[0] + (1 - p) * b[2]
    mixed = { p, q, rowPayoff, colPayoff }
  }

  return {
    brRow,
    brCol,
    pure,
    rowDominant,
    colDominant,
    rowDominated,
    colDominated,
    mixed,
    mixedInterior: interior,
  }
}

/** 保留 4 位小数，去掉多余的 0，用于展示概率 */
export function fmt(x: number, digits = 4) {
  if (!Number.isFinite(x)) return '—'
  const s = x.toFixed(digits).replace(/0+$/, '').replace(/\.$/, '')
  return s === '-0' ? '0' : s
}

/** 分数近似（分母 ≤ 20），用于把 0.3333 显示成 1/3 */
export function asFraction(x: number): string | null {
  if (!Number.isFinite(x)) return null
  for (let d = 1; d <= 20; d++) {
    const n = Math.round(x * d)
    if (Math.abs(n / d - x) < 1e-6) return `${n}/${d}`
  }
  return null
}

/** 贝叶斯后验：P(类型|信号) = P(信号|类型)P(类型) / P(信号) */
export function posterior(prior: number, hit: number, falseAlarm: number) {
  const num = hit * prior
  const den = num + falseAlarm * (1 - prior)
  return den === 0 ? NaN : num / den
}
