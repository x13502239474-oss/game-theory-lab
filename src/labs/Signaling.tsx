import { useState } from 'react';
import { LabIntro, Slider, Choice, Readout, Note } from './parts';

const V_HIGH = 100;
const V_LOW = 40;
const C_HIGH = 30;
const C_LOW = 10;
const K_HIGH = 0.6;
const K_LOW = 1.4;

export default function Signaling() {
  const [role, setRole] = useState<'high' | 'low'>('high');
  const [K, setK] = useState(50);
  const [threshold, setThreshold] = useState(60);

  const signaled = K >= threshold;
  const profit = (r: 'high' | 'low', k: number, sig: boolean) => {
    const v = sig ? V_HIGH : V_LOW;
    const c = r === 'high' ? C_HIGH : C_LOW;
    const s = r === 'high' ? K_HIGH : K_LOW;
    return v - c - s * k;
  };

  const mine = profit(role, K, signaled);

  const lowMimic = profit('low', K, true);
  const lowHonest = profit('low', 0, false);
  const highSignal = profit('high', K, true);
  const highNo = profit('high', 0, false);

  const separate = lowMimic <= lowHonest && highSignal >= highNo;

  // 图：两种类型的利润随 K 变化（在「信号被相信」的前提下）
  const W = 320;
  const H = 140;
  const x = (k: number) => 10 + (k / 100) * (W - 24);
  const y = (v: number) => H - 20 - ((v + 20) / 100) * (H - 34);
  const lineH = Array.from({ length: 51 }, (_, i) => {
    const k = i * 2;
    return `${i === 0 ? 'M' : 'L'}${x(k).toFixed(1)},${y(highSignalAt(k)).toFixed(1)}`;
  }).join(' ');
  const lineL = Array.from({ length: 51 }, (_, i) => {
    const k = i * 2;
    return `${i === 0 ? 'M' : 'L'}${x(k).toFixed(1)},${y(lowMimicAt(k)).toFixed(1)}`;
  }).join(' ');

  function highSignalAt(k: number) {
    return V_HIGH - C_HIGH - K_HIGH * k;
  }
  function lowMimicAt(k: number) {
    return V_HIGH - C_LOW - K_LOW * k;
  }

  const critK = (V_HIGH - C_LOW - (V_LOW - C_LOW)) / K_LOW; // 低型模仿无利可图的临界值

  return (
    <div>
      <LabIntro title="信号传递" en="EXPERIMENT 06 · SIGNALING">
        只有你知道自己产品的真实质量。消费者看不到质量，只能看你的品牌投入 K：见到足够大的 K 才愿意付高价。
      </LabIntro>

      <div className="border border-line bg-panel p-4">
        <div className="label mb-2">你扮演的企业类型</div>
        <Choice
          options={[
            { v: 'high', label: '高质量', sub: '成本 30 / 估值 100' },
            { v: 'low', label: '低质量', sub: '成本 10 / 估值 40' },
          ]}
          value={role}
          onChange={setRole}
          size="sm"
        />
        <div className="mt-3 space-y-1">
          <Slider label="你的品牌投入 K（每单位成本：高型 0.6，低型 1.4）" value={K} min={0} max={100} step={1} onChange={setK} />
          <Slider
            label="消费者的信念门槛 K*（观察到 K ≥ K* 就认为你是高型）"
            value={threshold}
            min={0}
            max={100}
            step={1}
            onChange={setThreshold}
            hint="门槛不是外生给定的——它必须与「低型不愿意模仿」这一点相容，才是一个均衡。"
          />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Readout label={`我的利润（${role === 'high' ? '高' : '低'}型）`} value={mine.toFixed(0)} tone={mine > 0 ? 'pos' : 'neg'} />
        <Readout label="消费者愿付价格" value={signaled ? V_HIGH : V_LOW} unit="元" />
      </div>

      <div className="mt-3 border border-line bg-panel p-3">
        <div className="mb-1 flex items-center justify-between text-[10.5px] text-muted">
          <span>信号被相信时的利润曲线</span>
          <span>
            <span className="text-ink">— 高型</span> <span className="text-copper">— 低型</span>
          </span>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
          <line x1="10" y1={H - 20} x2={W - 12} y2={H - 20} stroke="#D3CFC3" />
          <line x1="10" y1="10" x2="10" y2={H - 20} stroke="#D3CFC3" />
          <path d={lineH} fill="none" stroke="#14213D" strokeWidth="1.7" />
          <path d={lineL} fill="none" stroke="#C69A63" strokeWidth="1.7" strokeDasharray="4 3" />
          <line x1={x(threshold)} y1="10" x2={x(threshold)} y2={H - 20} stroke="#7E8DA6" strokeDasharray="2 2" />
          <text x={x(threshold) + 2} y="18" fontSize="7.5" fill="#6E7C93">K*</text>
          <circle cx={x(K)} cy={y(role === 'high' ? highSignalAt(K) : lowMimicAt(K))} r="3" fill="#9A6B33" />
          <text x="12" y="18" fontSize="7.5" fill="#6E7C93">利润</text>
          <text x={W - 24} y={H - 6} fontSize="7.5" fill="#6E7C93">K</text>
        </svg>
      </div>

      <div className="mt-4 border border-line bg-[#FCFBF7] p-3.5">
        <div className="label mb-2">分离均衡检验</div>
        <div className="space-y-1.5 text-[12.5px] text-ink-2">
          <div className="flex justify-between">
            <span>低型模仿（投入 {K}）的利润</span>
            <span className="num">{lowMimic.toFixed(0)}</span>
          </div>
          <div className="flex justify-between">
            <span>低型不投入、拿低价</span>
            <span className="num">{lowHonest.toFixed(0)}</span>
          </div>
          <div className="flex justify-between">
            <span>高型投入的利润</span>
            <span className="num">{highSignal.toFixed(0)}</span>
          </div>
          <div className="flex justify-between">
            <span>高型不投入、拿低价</span>
            <span className="num">{highNo.toFixed(0)}</span>
          </div>
          <div className="mt-1 flex justify-between border-t border-line pt-1.5">
            <span>分离均衡是否成立</span>
            <span className={separate ? 'text-[#3F6B4F]' : 'text-copper'}>{separate ? '成立' : '不成立'}</span>
          </div>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-muted">
          低型不模仿的条件：{lowHonest} ≥ 90 − 1.4K → K ≥ {critK.toFixed(1)}。高型愿意投入的条件：70 − 0.6K ≥ 10 → K ≤ 100。
          所以分离区间是 K ∈ [{critK.toFixed(1)}, 100]。
        </p>
      </div>

      <div className="mt-4">
        {signaled && separate ? (
          <Note tone="good">
            K = {K} 高于门槛且落在分离区间内：消费者见到这个投入就相信你是高型，低型模仿会亏钱。
            注意——这笔投入没有提高任何质量，它唯一的作用是「让低型付不起」。
          </Note>
        ) : signaled && !separate ? (
          <Note tone="warn">
            K = {K} 虽被相信，但低型模仿仍然赚钱（{lowMimic.toFixed(0)} &gt; {lowHonest}）。这个信念撑不住：
            低型也会跟着投，信号最终失去区分力。
          </Note>
        ) : (
          <Note>
            K = {K} 低于门槛：消费者只愿付 {V_LOW}。{role === 'high' && '你是高型，被误判成了低型——这正是「劣币驱逐良币」在信号市场上的版本。'}
            {' '}试着把 K 推到 {Math.ceil(critK)} 以上，看利润怎么变。
          </Note>
        )}
      </div>
    </div>
  );
}
