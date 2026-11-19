import { useMemo, useState } from 'react'
import { fmt } from '../lib/game'

type Pay = { T: number; R: number; P: number; S: number }

const STRATS = ['始终合作', '始终背叛', '针锋相对', '冷酷触发'] as const
type Strat = (typeof STRATS)[number]

/** 单局：行为 C/D，返回 [行收益, 列收益] */
function play(x: 'C' | 'D', y: 'C' | 'D', p: Pay): [number, number] {
  if (x === 'C' && y === 'C') return [p.R, p.R]
  if (x === 'C' && y === 'D') return [p.S, p.T]
  if (x === 'D' && y === 'C') return [p.T, p.S]
  return [p.P, p.P]
}

/** 策略状态机：returns [本轮动作, nextState] */
function act(s: Strat, state: number, oppPrev: 'C' | 'D' | null): ['C' | 'D', number] {
  if (s === '始终合作') return ['C', 0]
  if (s === '始终背叛') return ['D', 0]
  if (s === '针锋相对') return [oppPrev === 'D' ? 'D' : 'C', 0]
  // 冷酷触发：一旦对手背叛，永久背叛
  if (state === 1) return ['D', 1]
  return ['C', oppPrev === 'D' ? 1 : 0]
}

function match(s1: Strat, s2: Strat, p: Pay, delta: number, rounds = 30) {
  let st1 = 0
  let st2 = 0
  let prev1: 'C' | 'D' | null = null
  let prev2: 'C' | 'D' | null = null
  let u1 = 0
  let u2 = 0
  const history: { round: number; a1: string; a2: string; u1: number }[] = []
  for (let t = 0; t < rounds; t++) {
    const [a1, n1] = act(s1, st1, prev2)
    const [a2, n2] = act(s2, st2, prev1)
    const [u1t, u2t] = play(a1, a2, p)
    u1 += Math.pow(delta, t) * u1t
    u2 += Math.pow(delta, t) * u2t
    history.push({ round: t + 1, a1, a2, u1: u1t })
    st1 = n1
    st2 = n2
    prev1 = a1
    prev2 = a2
  }
  return { u1, u2, history }
}

export function RepeatLab() {
  const [p, setP] = useState<Pay>({ T: 5, R: 3, P: 1, S: 0 })
  const [delta, setDelta] = useState(0.6)
  const [pair, setPair] = useState<[Strat, Strat]>(['冷酷触发', '冷酷触发'])

  const valid = p.T > p.R && p.R > p.P && p.P > p.S
  const threshold = p.T - p.P === 0 ? NaN : (p.T - p.R) / (p.T - p.P)
  const sustain = valid && delta >= threshold

  const table = useMemo(() => {
    const rows = STRATS.map((s1) => {
      let total = 0
      const cells: number[] = []
      for (const s2 of STRATS) {
        const r = match(s1, s2, p, delta, 30)
        total += r.u1
        cells.push(r.u1)
      }
      return { s1, cells, total }
    })
    return rows.sort((x, y) => y.total - x.total)
  }, [p, delta])

  const game = useMemo(() => match(pair[0], pair[1], p, delta, 12), [pair, p, delta])

  return (
    <div className="border border-line bg-surface">
      <div className="grid gap-px border-b border-line bg-line lg:grid-cols-[300px_1fr]">
        <div className="bg-[#FBF7EE] p-4">
          <div className="eyebrow">收益结构（须满足 T &gt; R &gt; P &gt; S）</div>
          <div className="mt-3 space-y-2">
            {(
              [
                ['T', '背叛诱惑 T', p.T, (v: number) => setP({ ...p, T: v })],
                ['R', '合作收益 R', p.R, (v: number) => setP({ ...p, R: v })],
                ['P', '互相背叛 P', p.P, (v: number) => setP({ ...p, P: v })],
                ['S', '被出卖 S', p.S, (v: number) => setP({ ...p, S: v })],
              ] as [string, string, number, (v: number) => void][]
            ).map(([k, label, v, onChange]) => (
              <label key={k} className="flex items-center gap-3">
                <span className="w-[92px] text-[11.5px] text-muted">{label}</span>
                <input
                  type="number"
                  value={v}
                  step={0.5}
                  onChange={(e) => onChange(Number(e.target.value))}
                  className="w-[70px] border border-linesoft bg-surface px-2 py-1 text-center tabnum text-[12px] outline-none focus:border-navy"
                />
              </label>
            ))}
          </div>
          {!valid && (
            <p className="mt-2 border-l-2 border-oxblood pl-2 text-[11px] leading-relaxed text-oxblood">
              当前数值不满足囚徒困境的排序，阈值公式失去意义。
            </p>
          )}

          <div className="mt-5">
            <div className="flex items-baseline justify-between">
              <span className="text-[11.5px] text-muted">贴现因子 δ</span>
              <span className="tabnum font-mono text-[13px] text-ink">{fmt(delta, 2)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={0.99}
              step={0.01}
              value={delta}
              onChange={(e) => setDelta(Number(e.target.value))}
              className="mt-1 w-full accent-[#16324F]"
            />
            <div className="mt-3 border border-line bg-surface p-2.5">
              <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">触发策略的临界值</div>
              <div className="mt-1 font-mono text-[12px] text-ink">
                δ* = (T−R)/(T−P) = ({fmt(p.T)}−{fmt(p.R)})/({fmt(p.T)}−{fmt(p.P)}) = {fmt(threshold)}
              </div>
              <div className={`mt-1 text-[12px] ${sustain ? 'text-moss' : 'text-oxblood'}`}>
                δ = {fmt(delta, 2)} {sustain ? '≥' : '<'} δ* ，冷酷触发下合作
                {sustain ? '可以维持' : '无法维持'}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-surface p-4">
          <div className="eyebrow">循环赛：30 轮重复、按 δ 贴现的总收益</div>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[440px] border-collapse text-center text-[11.5px]">
              <thead>
                <tr className="bg-[#F4EFE3]">
                  <th className="border border-line px-2 py-1.5 text-left font-medium">策略 ＼ 对手</th>
                  {STRATS.map((s) => (
                    <th key={s} className="border border-line px-2 py-1.5 font-normal">
                      {s}
                    </th>
                  ))}
                  <th className="border border-line px-2 py-1.5 font-medium">合计</th>
                </tr>
              </thead>
              <tbody>
                {table.map((row, i) => (
                  <tr key={row.s1} className={i === 0 ? 'bg-[#F0E7D5]' : ''}>
                    <th className="border border-line px-2 py-1.5 text-left font-medium text-ink">
                      {i === 0 && <span className="mr-1 text-copper">★</span>}
                      {row.s1}
                    </th>
                    {row.cells.map((v, j) => (
                      <td key={j} className="border border-line px-2 py-1.5 tabnum text-ink2">
                        {fmt(v, 1)}
                      </td>
                    ))}
                    <td className="border border-line px-2 py-1.5 tabnum font-medium text-ink">{fmt(row.total, 1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-muted">
            名次会随 δ 变化：δ 很低时「始终背叛」领先；δ 足够高时，「针锋相对」与「冷酷触发」反超。这正是重复博弈的核心结论。
          </p>

          <div className="mt-4 border-t border-linesoft pt-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-[52px] font-mono text-[9px] uppercase tracking-[0.14em] text-muted">行玩家</span>
              {STRATS.map((s) => (
                <button
                  key={s}
                  onClick={() => setPair((prev) => [s, prev[1]])}
                  className={`border px-2 py-0.5 text-[10.5px] ${
                    pair[0] === s ? 'border-navy bg-navy text-paper' : 'border-line text-muted hover:text-ink'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className="w-[52px] font-mono text-[9px] uppercase tracking-[0.14em] text-muted">对手</span>
              {STRATS.map((s) => (
                <button
                  key={s}
                  onClick={() => setPair((prev) => [prev[0], s])}
                  className={`border px-2 py-0.5 text-[10.5px] ${
                    pair[1] === s ? 'border-copper bg-[#F0E7D5] text-ink' : 'border-line text-muted hover:text-ink'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {game.history.map((h) => (
                <span
                  key={h.round}
                  title={`第 ${h.round} 轮：${h.a1} vs ${h.a2}，行得 ${h.u1}`}
                  className={`flex h-6 w-8 items-center justify-center border font-mono text-[9.5px] ${
                    h.a1 === 'C' && h.a2 === 'C'
                      ? 'border-moss/40 bg-[#EFF4ED] text-moss'
                      : h.a1 === 'D' && h.a2 === 'D'
                        ? 'border-oxblood/30 bg-[#F7EBE8] text-oxblood'
                        : 'border-line bg-[#F4EFE3] text-ink2'
                  }`}
                >
                  {h.a1}/{h.a2}
                </span>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] text-muted">
              对手：{pair[1]} · 行玩家 12 轮贴现总收益 {fmt(game.u1, 2)}，对手 {fmt(game.u2, 2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
