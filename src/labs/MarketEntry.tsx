import { useState } from 'react';
import { LabIntro, Slider, Choice, Readout, Note } from './parts';

type Step = 0 | 1 | 2;

export default function MarketEntry() {
  const [K, setK] = useState(0);
  const [step, setStep] = useState<Step>(0);
  const [entered, setEntered] = useState<boolean | null>(null);
  const [fightChoice, setFightChoice] = useState<'fight' | 'accom' | null>(null);

  const fightPay = 8 - K;
  const credible = fightPay >= 6;
  const investWorth = 10 - K > 6;

  const rationalI = credible ? 'fight' : 'accom';
  const rationalE = (credible ? -2 : 3) > 0;
  const outcome = entered === false ? { e: 0, i: 10 - K } : fightChoice === 'fight' ? { e: -2, i: fightPay } : { e: 3, i: 6 };

  const reset = () => {
    setStep(0);
    setEntered(null);
    setFightChoice(null);
  };

  const highlight = (which: 'notenter' | 'fight' | 'accom') => {
    if (which === 'notenter') return !rationalE;
    if (which === 'fight') return rationalI === 'fight';
    return rationalE && rationalI === 'accom';
  };

  const line = (x1: number, y1: number, x2: number, y2: number, on: boolean) => (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={on ? '#9A6B33' : '#C9C5BA'}
      strokeWidth={on ? 1.8 : 1}
      strokeDasharray={on ? undefined : '3 3'}
    />
  );

  return (
    <div>
      <LabIntro title="市场进入" en="EXPERIMENT 05 · MARKET ENTRY">
        潜在进入者先决定是否进入，在位者随后决定打价格战还是容纳。你可以调节在位者的「承诺投资」，看威胁何时变得可信。
      </LabIntro>

      <div className="border border-line bg-panel p-4">
        <Slider
          label="在位者的承诺投资 K（专用产能）"
          value={K}
          min={0}
          max={6}
          onChange={(v) => {
            setK(v);
            reset();
          }}
          suffix=" 单位"
          hint="投资越多，打价格战时越不吃亏（打的价格战收益 = 8 − K），但也直接扣减利润。"
        />
      </div>

      <div className="mt-4 border border-line bg-[#FCFBF7] p-3">
        <svg viewBox="0 0 320 180" className="w-full">
          {/* 根 */}
          <circle cx="18" cy="92" r="4" fill="#14213D" />
          <text x="8" y="80" fontSize="8.5" fill="#6E7C93">进入者 E</text>

          {/* 进入分支 */}
          {line(18, 92, 105, 56, false)}
          <text x="52" y="66" fontSize="8.5" fill="#33415C">进入</text>
          <circle cx="108" cy="56" r="4" fill="#14213D" />
          <text x="96" y="44" fontSize="8.5" fill="#6E7C93">在位者 I</text>

          {/* 不进入 */}
          {line(18, 92, 105, 140, highlight('notenter'))}
          <text x="46" y="130" fontSize="8.5" fill="#33415C">不进入</text>
          <rect x="104" y="132" width="74" height="17" fill={highlight('notenter') ? '#F5EBDA' : '#F3F1EA'} stroke={highlight('notenter') ? '#C69A63' : '#E4E1D8'} />
          <text x="112" y="144" fontSize="8.5" fill="#14213D">(0, {10 - K})</text>

          {/* 打 */}
          {line(108, 56, 205, 26, highlight('fight'))}
          <text x="150" y="34" fontSize="8.5" fill="#33415C">打价格战</text>
          <rect x="204" y="17" width="86" height="17" fill={highlight('fight') ? '#F5EBDA' : '#F3F1EA'} stroke={highlight('fight') ? '#C69A63' : '#E4E1D8'} />
          <text x="211" y="29" fontSize="8.5" fill="#14213D">(−2, {fightPay})</text>

          {/* 容 */}
          {line(108, 56, 205, 88, highlight('accom'))}
          <text x="152" y="80" fontSize="8.5" fill="#33415C">容纳</text>
          <rect x="204" y="79" width="86" height="17" fill={highlight('accom') ? '#F5EBDA' : '#F3F1EA'} stroke={highlight('accom') ? '#C69A63' : '#E4E1D8'} />
          <text x="211" y="91" fontSize="8.5" fill="#14213D">(3, 6)</text>

          <text x="8" y="172" fontSize="7.5" fill="#9A6B33">实线 = 逆向归纳得到的均衡路径</text>
        </svg>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Readout label="打价格战对在位者的收益" value={fightPay} tone={credible ? 'pos' : 'neg'} />
        <Readout label="容纳的收益" value={6} />
      </div>

      <div className="mt-3 border border-line bg-panel p-3.5">
        <div className="label mb-2">逆向归纳的结论</div>
        <div className="space-y-1.5 text-[12.5px] text-ink-2">
          <div className="flex justify-between">
            <span>在位者事后会选</span>
            <span className="font-medium text-ink">{rationalI === 'fight' ? '打价格战' : '容纳'}</span>
          </div>
          <div className="flex justify-between">
            <span>威胁是否可信</span>
            <span className={credible ? 'text-[#3F6B4F]' : 'text-copper'}>{credible ? '可信' : '不可信'}</span>
          </div>
          <div className="flex justify-between">
            <span>进入者的理性选择</span>
            <span className="font-medium text-ink">{rationalE ? '进入' : '不进入'}</span>
          </div>
          <div className="flex justify-between">
            <span>这笔承诺投资是否划算</span>
            <span className={investWorth ? 'text-[#3F6B4F]' : 'text-copper'}>{investWorth ? '划算' : '不划算'}</span>
          </div>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-muted">
          可信门槛：8 − K ≥ 6 → K ≤ 2。盈利门槛：10 − K &gt; 6 → K &lt; 4。当 2 &lt; K &lt; 4 时，
          投资划得来、威胁却不可信——这段区间里的钱是白花的。
        </p>
      </div>

      <div className="mt-4 border border-line bg-panel p-4">
        <div className="label mb-2">亲手走一遍</div>
        {step === 0 && (
          <>
            <p className="mb-3 text-[12.5px] text-ink-2">你是潜在进入者，决定是否进入这个市场。</p>
            <Choice
              options={[
                { v: 'in', label: '进入' },
                { v: 'out', label: '不进入' },
              ]}
              value={''}
              onChange={(v) => {
                if (v === 'in') {
                  setEntered(true);
                  setStep(1);
                } else {
                  setEntered(false);
                  setStep(2);
                }
              }}
            />
          </>
        )}

        {step === 1 && (
          <>
            <p className="mb-3 text-[12.5px] text-ink-2">
              你已进入。现在换位思考：如果你是在位者，面对这个「打收益 {fightPay}、容收益 6」的局面，你会怎么做？
            </p>
            <Choice
              options={[
                { v: 'fight', label: '打价格战', sub: `得 ${fightPay}` },
                { v: 'accom', label: '容纳', sub: '得 6' },
              ]}
              value={''}
              onChange={(v) => {
                setFightChoice(v as 'fight' | 'accom');
                setStep(2);
              }}
            />
          </>
        )}

        {step === 2 && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Readout label="你的收益" value={outcome.e} tone={outcome.e >= 0 ? 'pos' : 'neg'} />
              <Readout label="对手收益" value={outcome.i} />
            </div>
            <p className="mt-3 text-[12.5px] leading-relaxed text-ink-2">
              你的选择：{entered === false ? '不进入' : `进入，且${fightChoice === 'fight' ? '打价格战' : '容纳'}`}。
              理论上在位者会选 <b>{rationalI === 'fight' ? '打' : '容纳'}</b>
              {entered === true &&
                ((rationalI === 'fight' && fightChoice === 'fight') || (rationalI === 'accom' && fightChoice === 'accom')
                  ? '，你猜对了。'
                  : '，你的判断与均衡不一致——可能是被「威胁」吓住或忽略了事后的激励。')}
              {entered === false && rationalE && '，但按均衡他其实会容纳，不进入让你白白放弃了 3。'}
            </p>
            <button className="btn btn-ghost btn-sm mt-3" onClick={reset}>
              再走一遍
            </button>
          </>
        )}
      </div>

      <div className="mt-4">
        {K <= 2 ? (
          <Note tone="warn">
            K = {K}：打价格战对在位者划算（{fightPay} ≥ 6），威胁可信。进入者会被打，因此选择不进入——
            在位者用 {K} 单位的投资买到了垄断地位。
          </Note>
        ) : K < 4 ? (
          <Note tone="warn">
            K = {K}：投资总比不投好（{10 - K} &gt; 6），但威胁并不可信（{fightPay} &lt; 6）。结果进入者照样进入，
            在位者既花了钱又没挡住人——这就是「白花钱区间」。
          </Note>
        ) : (
          <Note>
            K = {K}：投资成本太高（{10 - K} ≤ 6），即使挡住进入者也补不回本。此时最好的策略是省钱、容纳对手。
          </Note>
        )}
      </div>
    </div>
  );
}
