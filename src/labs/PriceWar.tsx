import { useMemo, useState } from 'react';
import { LabIntro, Slider, Readout, Note } from './parts';

const SENS = 2.2; // 价格敏感度：越接近 0 越接近「低者通吃」

export default function PriceWar() {
  const [cost, setCost] = useState(12);
  const [market, setMarket] = useState(200);
  const [oppPrice, setOppPrice] = useState(24);
  const [myPrice, setMyPrice] = useState(22);

  const share = (p: number, q: number) => market / (1 + Math.exp((p - q) / SENS));

  const profit = (p: number, q: number) => (p - cost) * share(p, q);
  const myProfit = profit(myPrice, oppPrice);
  const oppProfit = (oppPrice - cost) * (market - share(myPrice, oppPrice));

  const bestResponse = (q: number) => {
    let best = cost;
    let bv = -Infinity;
    for (let p = cost; p <= cost + 60; p += 0.25) {
      const v = profit(p, q);
      if (v > bv) {
        bv = v;
        best = p;
      }
    }
    return { p: best, v: bv };
  };

  const ne = useMemo(() => {
    let p = cost + 20;
    for (let i = 0; i < 80; i++) p = bestResponse(p).p;
    return p;
  }, [cost, market]);

  const br = bestResponse(oppPrice);

  // 利润曲线
  const W = 320;
  const H = 132;
  const maxP = cost + 45;
  const pts = useMemo(() => {
    const arr: { x: number; y: number; v: number }[] = [];
    let maxV = 1;
    for (let p = cost; p <= maxP; p += 0.5) {
      const v = profit(p, oppPrice);
      if (v > maxV) maxV = v;
      arr.push({ x: p, y: v, v });
    }
    return { arr, maxV };
  }, [cost, oppPrice, market]);

  const px = (p: number) => ((p - cost) / (maxP - cost)) * (W - 26) + 8;
  const py = (v: number) => H - 18 - (Math.max(0, v) / pts.maxV) * (H - 34);

  const path = pts.arr.map((d, i) => `${i === 0 ? 'M' : 'L'}${px(d.x).toFixed(1)},${py(d.y).toFixed(1)}`).join(' ');

  const gap = myPrice - oppPrice;

  return (
    <div>
      <LabIntro title="价格战" en="EXPERIMENT 02 · PRICE COMPETITION">
        两家同质企业同时定价，需求随价差流向便宜的一方。调整成本、市场规模与对手定价，观察利润曲线怎么被压平。
      </LabIntro>

      <div className="border border-line bg-panel p-4">
        <Slider label="单位成本" value={cost} min={5} max={20} onChange={(v) => { setCost(v); if (myPrice < v) setMyPrice(v); if (oppPrice < v) setOppPrice(v); }} suffix=" 元" />
        <Slider label="市场规模（潜在客户数）" value={market} min={80} max={400} step={20} onChange={setMarket} suffix=" 人" />
        <Slider label="对手定价" value={oppPrice} min={cost} max={cost + 40} onChange={setOppPrice} suffix=" 元" />
        <Slider label="我的定价" value={myPrice} min={cost} max={cost + 40} onChange={setMyPrice} suffix=" 元" />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Readout label="我的利润" value={myProfit.toFixed(0)} unit="元" tone={myProfit > 0 ? 'pos' : 'neg'} />
        <Readout label="对手利润" value={oppProfit.toFixed(0)} unit="元" tone={oppProfit > 0 ? 'pos' : 'neg'} />
      </div>

      <div className="mt-4 border border-line bg-panel p-3">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[11px] text-ink-2">我的利润随「我的定价」变化</span>
          <span className="text-[10px] text-muted">对手定价固定为 {oppPrice} 元</span>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
          <line x1="8" y1={H - 18} x2={W - 14} y2={H - 18} stroke="#D3CFC3" strokeWidth="1" />
          <line x1="8" y1="10" x2="8" y2={H - 18} stroke="#D3CFC3" strokeWidth="1" />
          <path d={path} fill="none" stroke="#14213D" strokeWidth="1.6" />
          {/* 对手价格参考线 */}
          <line x1={px(oppPrice)} y1="10" x2={px(oppPrice)} y2={H - 18} stroke="#C69A63" strokeWidth="1" strokeDasharray="3 3" />
          <text x={px(oppPrice) + 3} y="16" fontSize="8" fill="#9A6B33">对手价</text>
          {/* 当前点 */}
          <circle cx={px(myPrice)} cy={py(myProfit)} r="3" fill="#9A6B33" />
          <text x={px(cost) + 2} y={H - 6} fontSize="7.5" fill="#6E7C93">{cost} 元</text>
          <text x={px(maxP) - 14} y={H - 6} fontSize="7.5" fill="#6E7C93">{maxP} 元</text>
          <text x="10" y="16" fontSize="7.5" fill="#6E7C93">利润</text>
        </svg>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setOppPrice(Math.max(cost, Math.min(myPrice - 1, cost + 40)))}
        >
          对手比我低 1 元
        </button>
        <button className="btn btn-primary btn-sm" onClick={() => setMyPrice(br.p)}>
          按最佳反应定价（{br.p.toFixed(1)}）
        </button>
      </div>

      <div className="mt-4">
        {Math.abs(gap) < 0.6 ? (
          <Note tone="warn">
            两家价格几乎相同，市场对半分。这是最容易被打破的位置：任一方只要比对方低一点点，就能吃掉几乎全部客流——
            这就是价格战的引擎。
          </Note>
        ) : gap < 0 ? (
          <Note tone="good">
            你比对手便宜 {Math.abs(gap).toFixed(1)} 元，拿到了更多份额。但对手不会坐着不动：他会跟降。
            反复「各降 1 元」，价格会一路滑向你标注的均衡价 <b>{ne.toFixed(1)} 元</b>。
          </Note>
        ) : (
          <Note>
            你比对手贵 {gap.toFixed(1)} 元，客流正在流失。此时要么降价，要么用差异化（服务、位置、品牌）让需求不再只由价格决定。
          </Note>
        )}
      </div>

      <div className="mt-4 border border-line bg-[#FCFBF7] p-3.5">
        <div className="label mb-2">模型读到的东西</div>
        <div className="space-y-1.5 text-[12.5px] text-ink-2">
          <div className="flex justify-between">
            <span>对手定价下的最佳反应</span>
            <span className="num">{br.p.toFixed(1)} 元</span>
          </div>
          <div className="flex justify-between">
            <span>迭代最佳反应得到的均衡价</span>
            <span className="num">{ne.toFixed(1)} 元</span>
          </div>
          <div className="flex justify-between">
            <span>均衡时单件毛利</span>
            <span className="num">{(ne - cost).toFixed(1)} 元</span>
          </div>
        </div>
        <p className="mt-2.5 text-[11px] leading-relaxed text-muted">
          把「价格敏感度」想象成产品同质化程度：越同质，份额对价差越敏感，均衡价就越贴近成本。差异化能抬高均衡价——
          这是企业逃离价格战唯一可持续的路径。
        </p>
      </div>
    </div>
  );
}
