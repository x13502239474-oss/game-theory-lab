import { useState } from 'react'
import { fmt, posterior } from '../lib/game'

export function BayesLab() {
  const [prior, setPrior] = useState(0.4)
  const [hit, setHit] = useState(0.8)
  const [alarm, setAlarm] = useState(0.2)

  const post = posterior(prior, hit, alarm)
  const pHigh = hit * prior + alarm * (1 - prior)
  const pGoodGivenLow = (1 - hit) * prior
  const pBadGivenLow = (1 - alarm) * (1 - prior)
  const postLow = pGoodGivenLow / (pGoodGivenLow + pBadGivenLow)

  return (
    <div className="border border-line bg-surface">
      <div className="grid gap-6 p-4 sm:p-5 lg:grid-cols-[280px_1fr]">
        <div>
          <div className="eyebrow">参数</div>
          <div className="mt-3 space-y-4">
            {(
              [
                ['先验 P(高能力)', prior, setPrior, 0.05, 0.95],
                ['灵敏度 P(高信号|高能力)', hit, setHit, 0.05, 0.95],
                ['误报 P(高信号|低能力)', alarm, setAlarm, 0.05, 0.95],
              ] as [string, number, (v: number) => void, number, number][]
            ).map(([label, v, set, min, max]) => (
              <label key={label} className="block">
                <span className="flex items-baseline justify-between text-[11.5px] text-muted">
                  <span>{label}</span>
                  <span className="tabnum font-mono text-[12px] text-ink">{fmt(v, 2)}</span>
                </span>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={0.01}
                  value={v}
                  onChange={(e) => set(Number(e.target.value))}
                  className="mt-1 w-full accent-[#16324F]"
                />
              </label>
            ))}
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-muted">
            拖动滑块，看「收到高信号之后」的信念如何变化。把先验调到 0.1 附近，你会看到后验被误报率拖住。
          </p>
        </div>

        <div>
          <div className="eyebrow">贝叶斯更新</div>
          <div className="mt-2 border border-line bg-[#FBF7EE] p-3 font-mono text-[11.5px] leading-[2] text-ink">
            <div>P(高) = {fmt(prior, 2)}</div>
            <div>P(高信号) = {fmt(hit, 2)}×{fmt(prior, 2)} + {fmt(alarm, 2)}×{fmt(1 - prior, 2)} = {fmt(pHigh, 4)}</div>
            <div className="text-copper">
              P(高能力 | 高信号) = {fmt(hit, 2)}×{fmt(prior, 2)} ÷ {fmt(pHigh, 4)} = {fmt(post, 4)}
            </div>
            <div>P(高能力 | 低信号) = {fmt(postLow, 4)}</div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-[11px] text-muted">
              <span>先验 {Math.round(prior * 100)}%</span>
              <span>后验 {Math.round(post * 100)}%</span>
            </div>
            <div className="mt-1.5 flex h-7 w-full overflow-hidden border border-line">
              <div className="flex items-center justify-center bg-[#DCD3C2] text-[10px] text-ink2" style={{ width: `${prior * 100}%` }}>
                {prior > 0.12 ? '先验' : ''}
              </div>
              <div className="flex flex-1 items-center justify-center bg-surface text-[10px] text-muted">
                {1 - prior > 0.12 ? '其余' : ''}
              </div>
            </div>
            <div className="mt-1.5 flex h-7 w-full overflow-hidden border border-line">
              <div className="flex items-center justify-center bg-[#16324F] text-[10px] text-paper" style={{ width: `${post * 100}%` }}>
                {post > 0.12 ? '后验' : ''}
              </div>
              <div className="flex flex-1 items-center justify-center bg-surface text-[10px] text-muted">
                {1 - post > 0.12 ? '其余' : ''}
              </div>
            </div>
          </div>

          <p className="mt-3 text-[11.5px] leading-relaxed text-muted">
            信号有信息量，不代表后验一定很高。先验越低、误报越高，同样的信号就越不能说明问题——这就是不完全信息博弈里「信念」的分量。
          </p>
        </div>
      </div>
    </div>
  )
}
