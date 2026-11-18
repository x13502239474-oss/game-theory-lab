import { useState } from 'react';
import { LabIntro, Slider, Readout, Note } from './parts';

interface LogRow {
  round: number;
  pie: number;
  who: '我' | '对手';
  offer: string;
  result: '接受' | '拒绝';
}

export default function Bargaining() {
  const [pie, setPie] = useState(100);
  const [round, setRound] = useState(1);
  const [turn, setTurn] = useState<'me' | 'ai'>('me');
  const [offer, setOffer] = useState(35); // 我分给对方的
  const [threshold, setThreshold] = useState(30); // 对手可接受的最低份额 %
  const [log, setLog] = useState<LogRow[]>([]);
  const [result, setResult] = useState<{ mine: number; opp: number } | null>(null);
  const [aiProposal, setAiProposal] = useState<{ mine: number; opp: number } | null>(null);

  const reset = () => {
    setPie(100);
    setRound(1);
    setTurn('me');
    setOffer(35);
    setLog([]);
    setResult(null);
    setAiProposal(null);
  };

  const finish = (mine: number, opp: number) => {
    setResult({ mine, opp });
    setTurn('me');
  };

  const submitOffer = () => {
    if (result) return;
    const need = Math.ceil((threshold / 100) * pie);
    const accepted = offer >= need;
    setLog((l) => [...l, { round, pie, who: '我', offer: `我 ${pie - offer} / 他 ${offer}`, result: accepted ? '接受' : '拒绝' }]);
    if (accepted) {
      finish(pie - offer, offer);
    } else {
      const nextPie = Math.round(pie * 0.9);
      setPie(nextPie);
      setRound((r) => r + 1);
      setTurn('ai');
      const mine = Math.round(nextPie * 0.38);
      setAiProposal({ mine, opp: nextPie - mine });
    }
  };

  const acceptAI = () => {
    if (!aiProposal) return;
    setLog((l) => [...l, { round, pie, who: '对手', offer: `我 ${aiProposal.mine} / 他 ${aiProposal.opp}`, result: '接受' }]);
    finish(aiProposal.mine, aiProposal.opp);
  };

  const rejectAI = () => {
    if (!aiProposal) return;
    setLog((l) => [...l, { round, pie, who: '对手', offer: `我 ${aiProposal.mine} / 他 ${aiProposal.opp}`, result: '拒绝' }]);
    const nextPie = Math.round(pie * 0.9);
    setPie(nextPie);
    setRound((r) => r + 1);
    setTurn('me');
    setAiProposal(null);
    setOffer(Math.round(nextPie * 0.35));
  };

  const need = Math.ceil((threshold / 100) * pie);

  return (
    <div>
      <LabIntro title="讨价还价" en="EXPERIMENT 04 · BARGAINING">
        两个人分配 100 单位资源，轮流提方案。被拒绝一次，蛋糕缩水 10%——拖延是有代价的。
      </LabIntro>

      <div className="border border-line bg-panel p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-[11px] tracking-[0.1em] text-muted">当前可分配总额</span>
          <span className="num text-[20px] text-ink">{pie}</span>
        </div>
        <div className="mt-2 flex h-2 w-full overflow-hidden bg-[#E9E5DA]">
          <div className="h-full bg-navy" style={{ width: `${((pie - offer) / 100) * 100}%` }} />
          <div className="h-full bg-copper" style={{ width: `${(offer / 100) * 100}%` }} />
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-muted">
          <span>我的份额</span>
          <span>对方的份额</span>
        </div>
      </div>

      <div className="mt-3">
        <Slider
          label="对手的「公平底线」（低于此比例一律拒绝）"
          value={threshold}
          min={0}
          max={50}
          onChange={setThreshold}
          suffix="%"
          hint="现实中的最后通牒实验里，这个值大约在 25%—35% 之间。调到 0 就是纯自利模型预测的世界。"
        />
      </div>

      {!result && turn === 'me' && (
        <div className="border border-line bg-panel p-4">
          <div className="label mb-2">第 {round} 轮 · 由我出价</div>
          <Slider label="我分给对方" value={offer} min={0} max={pie} onChange={setOffer} suffix={` / ${pie}`} />
          <div className="mt-1 grid grid-cols-2 gap-2">
            <Readout label="我留下" value={pie - offer} tone="pos" />
            <Readout label="对方拿到" value={offer} tone={offer >= need ? 'pos' : 'neg'} />
          </div>
          <button className="btn btn-primary mt-3 w-full" onClick={submitOffer}>
            提交方案
          </button>
          <p className="mt-2 text-[11px] text-muted">
            对方最低要求 {need}（{threshold}% × {pie}）。给少了会被拒，蛋糕变小，轮到他出价。
          </p>
        </div>
      )}

      {!result && turn === 'ai' && aiProposal && (
        <div className="border border-line bg-panel p-4">
          <div className="label mb-2">第 {round} 轮 · 对手出价</div>
          <p className="text-[13px] text-ink">
            对手提出：<b className="num">给你 {aiProposal.mine}</b>，他自己留 <b className="num">{aiProposal.opp}</b>。
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button className="btn btn-primary" onClick={acceptAI}>
              接受
            </button>
            <button className="btn btn-ghost" onClick={rejectAI}>
              拒绝
            </button>
          </div>
          <p className="mt-2 text-[11px] text-muted">拒绝后蛋糕缩为 {Math.round(pie * 0.9)}，轮到你出价。</p>
        </div>
      )}

      {result && (
        <div className="border border-line bg-panel p-4">
          <div className="label-copper mb-2">达成协议</div>
          <div className="grid grid-cols-2 gap-2">
            <Readout label="我的最终所得" value={result.mine} tone="pos" />
            <Readout label="对手最终所得" value={result.opp} />
          </div>
          <p className="mt-3 text-[12px] leading-relaxed text-ink-2">
            经过 {log.length} 轮，总额从 100 缩到 {pie}，共损失 {100 - pie}。这部分就是「拖延的成本」。
          </p>
          <button className="btn btn-ghost btn-sm mt-3" onClick={reset}>
            重新开始
          </button>
        </div>
      )}

      {log.length > 0 && (
        <div className="mt-3 border border-line">
          {log
            .slice()
            .reverse()
            .map((r, i) => (
              <div key={i} className="flex items-center justify-between border-b border-line/70 px-3 py-2 text-[11.5px] last:border-0">
                <span className="text-muted">
                  第 {r.round} 轮 · {r.who}出价 · 总额 {r.pie}
                </span>
                <span className="text-ink-2">{r.offer}</span>
                <span className={r.result === '接受' ? 'text-[#3F6B4F]' : 'text-copper'}>{r.result}</span>
              </div>
            ))}
        </div>
      )}

      <div className="mt-4">
        {result ? (
          <Note tone={result.mine >= result.opp ? 'good' : 'neutral'}>
            你拿到 {result.mine}。若在第一轮就提出「对方刚好能接受」的方案（{Math.ceil(0.3 * 100)}），你本可以拿到约 70 且不损失总额。
            这就是先出价者优势：在对方底线之上给一点点，剩下的留给自己。
          </Note>
        ) : (
          <Note>
            试试把底线调到 0：对手会接受任何正数，你可以只给 1。再调到 50：谈判几乎没有空间。现实中的对手在这两者之间。
          </Note>
        )}
      </div>
    </div>
  );
}
