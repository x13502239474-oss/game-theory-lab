import { useMemo, useState } from 'react'
import { asFraction, fmt, solve2x2, type M2 } from '../lib/game'
import { PayoffMatrix } from '../components/PayoffMatrix'

type Preset = { id: string; name: string; hint: string; m: M2 }

const PRESETS: Preset[] = [
  {
    id: 'pd',
    name: '囚徒困境',
    hint: '背叛是严格占优策略，均衡落在双方都背叛',
    m: { a: [1, 5, 0, 3], b: [1, 0, 5, 3] },
  },
  {
    id: 'mp',
    name: '猜硬币',
    hint: '没有纯策略均衡，只有 p = q = 1/2 的混合均衡',
    m: { a: [1, -1, -1, 1], b: [-1, 1, 1, -1] },
  },
  {
    id: 'sh',
    name: '猎鹿',
    hint: '两个纯策略均衡，一个风险占优、一个收益占优',
    m: { a: [4, 0, 3, 3], b: [4, 3, 0, 3] },
  },
  {
    id: 'bos',
    name: '性别战',
    hint: '两个纯策略均衡加一个混合均衡，冲突在分配而非合作',
    m: { a: [3, 0, 0, 2], b: [2, 0, 0, 3] },
  },
  {
    id: 'coord',
    name: '协调博弈',
    hint: '双方都想选同一个，但有一个明显更好',
    m: { a: [5, 0, 0, 3], b: [5, 0, 0, 3] },
  },
]

const LABELS = {
  rows: ['上', '下'],
  cols: ['左', '右'],
}

export function MatrixLab() {
  const [m, setM] = useState<M2>(PRESETS[0].m)
  const [preset, setPreset] = useState('pd')
  const res = useMemo(() => solve2x2(m), [m])

  const set = (who: 'a' | 'b', i: number, v: number) => {
    setM((prev) => {
      const next = [...prev[who]] as M2['a']
      next[i] = v
      return { ...prev, [who]: next }
    })
    setPreset('')
  }

  const cellIndex = (r: number, c: number) => r * 2 + c
  const spec = {
    rowPlayer: '行参与者（你）',
    colPlayer: '列参与者（对手）',
    cols: LABELS.cols,
    rows: LABELS.rows.map((label, r) => ({
      label,
      cells: LABELS.cols.map((_, c) => {
        const i = cellIndex(r, c)
        return {
          a: m.a[i],
          b: m.b[i],
          brRow: res.brRow[i],
          brCol: res.brCol[i],
          eq: res.pure.some((p) => p.row === r && p.col === c),
        }
      }),
    })),
    showBR: true,
  }

  const pureText =
    res.pure.length === 0
      ? '没有纯策略纳什均衡'
      : res.pure.map((p) => `（${LABELS.rows[p.row]}，${LABELS.cols[p.col]}）`).join('、')

  const dominantText = () => {
    const parts: string[] = []
    if (res.rowDominant) parts.push(`行参与者：${res.rowDominant === 'top' ? '上' : '下'}是严格/弱占优`)
    if (res.colDominant) parts.push(`列参与者：${res.colDominant === 'left' ? '左' : '右'}是严格/弱占优`)
    if (res.rowDominated) parts.push(`行参与者的「${res.rowDominated === 'top' ? '上' : '下'}」是严格劣势策略`)
    if (res.colDominated) parts.push(`列参与者的「${res.colDominated === 'left' ? '左' : '右'}」是严格劣势策略`)
    return parts.length ? parts.join('；') : '双方都没有（弱）占优策略'
  }

  const a = m.a
  const b = m.b
  const dq = a[0] - a[1] - a[2] + a[3]
  const dp = b[0] - b[1] - b[2] + b[3]
  const q = res.mixed?.q
  const p = res.mixed?.p

  return (
    <div className="border border-line bg-surface">
      <div className="flex flex-wrap items-center gap-1.5 border-b border-line bg-[#FBF7EE] px-4 py-2.5">
        <span className="mr-1 font-mono text-[9px] uppercase tracking-[0.16em] text-copper">Presets</span>
        {PRESETS.map((p2) => (
          <button
            key={p2.id}
            onClick={() => {
              setM(p2.m)
              setPreset(p2.id)
            }}
            className={`border px-2.5 py-1 text-[11.5px] transition-colors ${
              preset === p2.id ? 'border-navy bg-navy text-paper' : 'border-line text-muted hover:border-steel hover:text-ink'
            }`}
          >
            {p2.name}
          </button>
        ))}
      </div>

      <div className="grid gap-6 p-4 sm:p-5 lg:grid-cols-[1fr_1fr]">
        <div>
          <div className="eyebrow">编辑收益（行, 列）</div>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[300px] border-collapse text-center text-[12px]">
              <thead>
                <tr>
                  <th className="border border-line bg-[#F4EFE3] px-2 py-1.5 font-normal text-muted">上 \\ 左</th>
                  {LABELS.cols.map((c) => (
                    <th key={c} className="border border-line bg-[#F4EFE3] px-2 py-1.5 font-medium text-ink">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {LABELS.rows.map((rlab, r) => (
                  <tr key={rlab}>
                    <th className="border border-line bg-[#F4EFE3] px-2 py-1.5 font-medium text-ink">{rlab}</th>
                    {LABELS.cols.map((_, c) => {
                      const i = cellIndex(r, c)
                      return (
                        <td key={c} className="border border-line p-1.5">
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              value={a[i]}
                              onChange={(e) => set('a', i, Number(e.target.value))}
                              aria-label={`行参与者在 ${rlab}${LABELS.cols[c]} 的收益`}
                              className="w-[46px] border border-linesoft bg-[#FBF7EE] px-1 py-1 text-center tabnum text-[12px] outline-none focus:border-navy"
                            />
                            <span className="text-[10px] text-muted">,</span>
                            <input
                              type="number"
                              value={b[i]}
                              onChange={(e) => set('b', i, Number(e.target.value))}
                              aria-label={`列参与者在 ${rlab}${LABELS.cols[c]} 的收益`}
                              className="w-[46px] border border-linesoft bg-[#FBF7EE] px-1 py-1 text-center tabnum text-[12px] outline-none focus:border-navy"
                            />
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-muted">
            改任意一个数字，右侧的划线、均衡与混合概率会立即重算。预设：{PRESETS.find((x) => x.id === preset)?.hint || '自定义矩阵'}
          </p>
        </div>

        <div>
          <div className="eyebrow">当前矩阵与最优反应</div>
          <div className="mt-2 border border-line p-2">
            <PayoffMatrix spec={spec} />
          </div>
        </div>
      </div>

      <div className="grid gap-px border-t border-line bg-line sm:grid-cols-3">
        <div className="bg-[#FBF7EE] p-4">
          <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted">纯策略均衡</div>
          <div className="mt-1.5 text-[13.5px] leading-relaxed text-ink">{pureText}</div>
          <div className="mt-2 text-[11.5px] leading-relaxed text-muted">{dominantText()}</div>
        </div>
        <div className="bg-[#FBF7EE] p-4">
          <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted">混合策略均衡</div>
          {res.mixed && p !== undefined && q !== undefined ? (
            <>
              <div className="mt-1.5 text-[13px] leading-[1.9] text-ink">
                行：上 {asFraction(p) || fmt(p)}，下 {asFraction(1 - p) || fmt(1 - p)}
                <br />
                列：左 {asFraction(q) || fmt(q)}，右 {asFraction(1 - q) || fmt(1 - q)}
              </div>
              <div className="mt-1.5 text-[11.5px] text-muted">
                期望收益：行 {fmt(res.mixed.rowPayoff)}，列 {fmt(res.mixed.colPayoff)}
              </div>
            </>
          ) : (
            <div className="mt-1.5 text-[12px] leading-relaxed text-muted">
              没有内点混合均衡（存在占优策略或退化情形）
            </div>
          )}
        </div>
        <div className="bg-[#FBF7EE] p-4">
          <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted">无差异方程</div>
          <div className="mt-1.5 space-y-1 font-mono text-[11px] leading-relaxed text-ink2">
            <div>q* = ({a[3]}−{a[1]}) / ({a[0]}−{a[1]}−{a[2]}+{a[3]}) {dq !== 0 ? `= ${fmt((a[3] - a[1]) / dq)}` : '= 退化'}</div>
            <div>p* = ({b[3]}−{b[2]}) / ({b[0]}−{b[1]}−{b[2]}+{b[3]}) {dp !== 0 ? `= ${fmt((b[3] - b[2]) / dp)}` : '= 退化'}</div>
          </div>
          <div className="mt-2 text-[11px] leading-relaxed text-muted">
            谁在混合，谁就要让对手无差异。求 q*：令行参与者在「上 / 下」之间无差异；求 p*：令列参与者在「左 / 右」之间无差异。p 是行方选「上」的概率，q 是列方选「左」的概率。
          </div>
        </div>
      </div>
    </div>
  )
}
