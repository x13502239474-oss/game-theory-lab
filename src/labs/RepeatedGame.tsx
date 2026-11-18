import { useMemo, useState } from 'react';
import { LabIntro, Readout, Note } from './parts';

type Act = 'C' | 'D';
type Opp = 'alwaysC' | 'alwaysD' | 'tft' | 'grim' | 'generous';

const T = 5;
const R = 3;
const P = 1;
const S = 0;

const OPP_LABEL: Record<Opp, string> = {
  alwaysC: '永远合作',
  alwaysD: '永远背叛',
  tft: '以牙还牙',
  grim: '冷酷触发',
  generous: '宽容型',
};

function payoff(a: Act, b: Act) {
  if (a === 'D' && b === 'C') return T;
  if (a === 'D' && b === 'D') return P;
  if (a === 'C' && b === 'C') return R;
  return S;
}

interface Round {
  me: Act;
  opp: Act;
  mine: number;
  theirs: number;
}

export default function RepeatedGame() {
  const [opp, setOpp] = useState<Opp>('tft');
  const [rounds, setRounds] = useState<Round[]>([]);
  const [limit, setLimit] = useState(12);

  const oppMove = (history: Round[], strategy: Opp): Act => {
    if (history.length === 0) {
      if (strategy === 'alwaysD') return 'D';
      if (strategy === 'tft' || strategy === 'grim' || strategy === 'generous') return 'C';
      return 'C';
    }
    const last = history[history.length - 1];
    switch (strategy) {
      case 'alwaysC':
        return 'C';
      case 'alwaysD':
        return 'D';
      case 'tft':
        return last.me;
      case 'grim':
        return history.some((r) => r.me === 'D') ? 'D' : 'C';
      case 'generous':
        return last.me === 'C' || Math.random() < 0.35 ? 'C' : 'D';
      default:
        return 'C';
    }
  };

  const play = (act: Act) => {
    if (rounds.length >= limit) return;
    const o = oppMove(rounds, opp);
    setRounds((h) => [...h, { me: act, opp: o, mine: payoff(act, o), theirs: payoff(o, act) }]);
  };

  const reset = (next?: Opp) => {
    setRounds([]);
    if (next) setOpp(next);
  };

  const myTotal = rounds.reduce((a, r) => a + r.mine, 0);
  const oppTotal = rounds.reduce((a, r) => a + r.theirs, 0);
  const coopRate = rounds.length ? rounds.filter((r) => r.me === 'C').length / rounds.length : 0;

  // 累计曲线
  const W = 320;
  const H = 120;
  const cum = useMemo(() => {
    let a = 0;
    let b = 0;
    return rounds.map((r) => {
      a += r.mine;
      b += r.theirs;
      return { a, b };
    });
  }, [rounds]);
  const maxV = Math.max(10, ...cum.map((c) => Math.max(c.a, c.b)));
  const px = (i: number) => (rounds.length <= 1 ? 8 : 8 + (i / (rounds.length - 1)) * (W - 20));
  const py = (v: number) => H - 14 - (v / maxV) * (H - 26);
  const lineA = cum.map((c, i) => `${i === 0 ? 'M' : 'L'}${px(i).toFixed(1)},${py(c.a).toFixed(1)}`).join(' ');
  const lineB = cum.map((c, i) => `${i === 0 ? 'M' : 'L'}${px(i).toFixed(1)},${py(c.b).toFixed(1)}`).join(' ');

  const finished = rounds.length >= limit;

  return (
    <div>
      <LabIntro title="重复博弈" en="EXPERIMENT 03 · REPEATED GAME">
        和一个固定规则的对手反复对局。收益：双方合作各 3、互相背叛各 1、单方背叛 5/0。观察你的选择如何被对方「记账」。
      </LabIntro>

      <div className="mb-3">
        <div className="label mb-2">选择对手策略</div>
        <div className="grid grid-cols-3 gap-1.5">
          {(['alwaysC', 'alwaysD', 'tft', 'grim', 'generous'] as Opp[]).map((k) => (
            <button
              key={k}
              onClick={() => reset(k)}
              className={`border px-2 py-2 text-[11.5px] transition-colors ${
                opp === k ? 'border-navy bg-navy text-[#F6F4EE]' : 'border-line text-ink-2 hover:border-line-2'
              }`}
            >
              {OPP_LABEL[k]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-end justify-between text-[11px] text-muted">
        <span>
          第 <b className="num text-ink">{Math.min(rounds.length + (finished ? 0 : 1), limit)}</b> / {limit} 轮
        </span>
        <span>
          合作率 <b className="num text-ink">{Math.round(coopRate * 100)}%</b>
        </span>
      </div>

      <div className="mt-1 h-1 w-full bg-[#E9E5DA]">
        <div className="h-full bg-navy transition-all" style={{ width: `${(rounds.length / limit) * 100}%` }} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button className="btn btn-primary" disabled={finished} onClick={() => play('C')}>
          合作
        </button>
        <button className="btn btn-ghost" disabled={finished} onClick={() => play('D')}>
          背叛
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Readout label="我的累计收益" value={myTotal} tone="pos" />
        <Readout label="对手累计收益" value={oppTotal} />
      </div>

      {rounds.length > 0 && (
        <div className="mt-4 border border-line bg-panel p-3">
          <div className="mb-1 flex items-center justify-between text-[10.5px] text-muted">
            <span>累计收益曲线</span>
            <span>
              <span className="text-ink">— 我</span> <span className="text-copper">— 对手</span>
            </span>
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
            <line x1="8" y1={H - 14} x2={W - 10} y2={H - 14} stroke="#D3CFC3" />
            <line x1="8" y1="8" x2="8" y2={H - 14} stroke="#D3CFC3" />
            <path d={lineB} fill="none" stroke="#C69A63" strokeWidth="1.5" />
            <path d={lineA} fill="none" stroke="#14213D" strokeWidth="1.7" />
          </svg>
        </div>
      )}

      {rounds.length > 0 && (
        <div className="mt-3 border border-line">
          <div className="grid grid-cols-5 border-b border-line bg-[#F3F1EA] px-2 py-1.5 text-[9.5px] tracking-wide text-muted">
            <span>轮</span>
            <span className="text-center">我</span>
            <span className="text-center">对手</span>
            <span className="text-center">本局</span>
            <span className="text-right">累计</span>
          </div>
          <div className="max-h-52 overflow-y-auto">
            {rounds
              .map((r, i) => ({ r, i }))
              .reverse()
              .map(({ r, i }) => {
                const acc = cum[i].a;
                return (
                  <div key={i} className="grid grid-cols-5 items-center border-b border-line/70 px-2 py-1.5 text-[11.5px] last:border-0">
                    <span className="num text-muted">{i + 1}</span>
                    <span className={`text-center ${r.me === 'C' ? 'text-[#3F6B4F]' : 'text-copper'}`}>
                      {r.me === 'C' ? '合作' : '背叛'}
                    </span>
                    <span className={`text-center ${r.opp === 'C' ? 'text-[#3F6B4F]' : 'text-copper'}`}>
                      {r.opp === 'C' ? '合作' : '背叛'}
                    </span>
                    <span className="num text-center text-ink">{r.mine}</span>
                    <span className="num text-right text-muted">{acc}</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <button className="btn btn-ghost btn-sm" onClick={() => reset()}>
          重新开始
        </button>
        <select
          value={limit}
          onChange={(e) => {
            setLimit(Number(e.target.value));
            setRounds([]);
          }}
          className="border border-line bg-transparent px-2 py-1.5 text-[12px] text-ink-2 outline-none"
        >
          <option value={6}>6 轮（已知终点）</option>
          <option value={12}>12 轮（已知终点）</option>
          <option value={24}>24 轮（长期）</option>
        </select>
      </div>

      <div className="mt-4">
        {finished ? (
          <Note tone={myTotal >= oppTotal ? 'good' : 'warn'}>
            对局结束。你的累计 {myTotal}，对手 {oppTotal}。
            {opp === 'alwaysD'
              ? '面对永远背叛的对手，合作只会被剥削——最佳反应是全程背叛，双方各拿 1。'
              : opp === 'alwaysC'
                ? '面对永远合作的对手，你只要在最后一轮背叛就能多赚 2——这正是「最后一轮效应」。'
                : '注意：只要出现一次背叛，「以牙还牙」会立刻复制你的动作，关系需要时间来修复。'}
          </Note>
        ) : rounds.length === 0 ? (
          <Note>
            先选「永远合作」对手打几轮，看合作能拿多少；再换成「冷酷触发」，故意背叛一次，看之后会发生什么。
          </Note>
        ) : rounds[rounds.length - 1].me === 'D' && rounds[rounds.length - 1].opp === 'C' ? (
          <Note tone="warn">
            你刚刚占了便宜（5 比 0）。但对方的策略已经记下这一笔——看看下一轮他会怎么做。
          </Note>
        ) : (
          <Note tone="good">
            当前正在合作轨道上。累计收益 {(R * rounds.length).toFixed(0)} 是「全程合作」的参照线，你可以对比自己的实际累计。
          </Note>
        )}
      </div>
    </div>
  );
}
