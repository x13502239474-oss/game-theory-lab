import { useMemo, useState } from 'react';
import { LabIntro, Slider, Readout, Note, Math as Formula } from './parts';

type Act = 'C' | 'D';

export default function PrisonerDilemma() {
  const [T, setT] = useState(5);
  const [my, setMy] = useState<Act>('C');
  const [opp, setOpp] = useState<Act>('C');
  const [auto, setAuto] = useState(false);
  const R = 3;
  const P = 1;
  const S = 0;

  const u = (a: Act, b: Act) => {
    if (a === 'D' && b === 'C') return T;
    if (a === 'D' && b === 'D') return P;
    if (a === 'C' && b === 'C') return R;
    return S;
  };

  const isPD = T > R && R > P && P > S && 2 * R > T + S;
  const mine = u(my, opp);
  const theirs = u(opp, my);

  const bestResponse = (other: Act) => (u('D', other) >= u('C', other) ? 'D' : 'C');
  const ne = useMemo(() => ({
    CC: bestResponse('C') === 'C' && bestResponse('C') === 'C',
    DD: bestResponse('D') === 'D' && bestResponse('D') === 'D',
  }), [T]);

  const pick = (a: Act, b: Act) => {
    setMy(a);
    setOpp(auto ? (bestResponse(a) as Act) : b);
  };

  const toggleAuto = (v: boolean) => {
    setAuto(v);
    if (v) setOpp(bestResponse(my) as Act);
  };

  const cellClass = (a: Act, b: Act) => {
    const on = my === a && opp === b;
    return `relative border p-3 text-center transition-colors ${
      on ? 'border-navy bg-[#EEF1F6]' : 'border-line bg-panel hover:border-line-2 hover:bg-[#FCFBF8]'
    }`;
  };

  const Cell = ({ a, b }: { a: Act; b: Act }) => (
    <button className={cellClass(a, b)} onClick={() => pick(a, b)}>
      <div className="num text-[15px] leading-none text-ink">
        {u(a, b)}, {u(b, a)}
      </div>
      <div className="mt-1 text-[9.5px] tracking-[0.08em] text-muted">
        {a === 'C' ? '合作' : '背叛'} / {b === 'C' ? '合作' : '背叛'}
      </div>
      {((a === 'C' && b === 'C' && ne.CC) || (a === 'D' && b === 'D' && ne.DD)) && (
        <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-copper" />
      )}
    </button>
  );

  return (
    <div>
      <LabIntro title="囚徒困境" en="EXPERIMENT 01 · PRISONER'S DILEMMA">
        两个参与者同时选择合作或背叛。先把对方的策略固定住，切换自己的选项，看看「背叛永远不亏」是怎么成立的。
      </LabIntro>

      <div className="grid grid-cols-3 gap-1.5">
        <div />
        <div className="pb-1 text-center text-[10.5px] tracking-[0.1em] text-muted">对手 合作</div>
        <div className="pb-1 text-center text-[10.5px] tracking-[0.1em] text-muted">对手 背叛</div>
        <div className="flex items-center justify-end pr-2 text-[10.5px] tracking-[0.1em] text-muted">我 合作</div>
        <Cell a="C" b="C" />
        <Cell a="C" b="D" />
        <div className="flex items-center justify-end pr-2 text-[10.5px] tracking-[0.1em] text-muted">我 背叛</div>
        <Cell a="D" b="C" />
        <Cell a="D" b="D" />
      </div>

      <div className="mt-2 flex items-center justify-between text-[10px] text-muted">
        <span>每格：我的收益, 对手收益</span>
        <span className="text-copper">● 纯策略纳什均衡</span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Readout label="我的收益" value={mine} />
        <Readout label="对手收益" value={theirs} />
        <Readout label="双方合计" value={mine + theirs} />
      </div>

      <div className="mt-4 divide-y divide-line border-y border-line">
        <div className="flex items-center justify-between py-2.5">
          <span className="text-[12px] text-ink-2">对手按理性回应（自动选最佳反应）</span>
          <button
            onClick={() => toggleAuto(!auto)}
            className={`relative h-5 w-9 shrink-0 border transition-colors ${auto ? 'border-navy bg-navy' : 'border-line-2 bg-[#EFEDE6]'}`}
            aria-label="切换自动对手"
          >
            <span
              className={`absolute top-[2px] h-3.5 w-3.5 bg-paper transition-all ${auto ? 'left-[19px]' : 'left-[2px]'}`}
            />
          </button>
        </div>
        <Slider
          label={
            <>
              背叛的诱惑 <Formula>{'T'}</Formula>（合作收益固定为 3，互相背叛为 1，被占便宜为 0）
            </>
          }
          value={T}
          min={2}
          max={8}
          step={1}
          onChange={(v) => {
            setT(v);
            if (auto) setOpp((u('D', my) >= u('C', my) ? 'D' : 'C') as Act);
          }}
          hint={
            isPD
              ? '当前满足 T > R > P > S 且 2R > T+S：标准囚徒困境。'
              : '当前参数已不构成标准囚徒困境——结构变了，结论也会变。'
          }
        />
      </div>

      <div className="mt-4">
        {my === 'D' && opp === 'D' ? (
          <Note tone="warn">
            你们落在（背叛，背叛）：这是占优策略均衡。任何一方单独改回合作都会从 {P} 降到 {S}，所以谁都不动。
            但（合作，合作）能给双方各 {R}——更好的结果不稳定，这正是困境。
          </Note>
        ) : my === 'C' && opp === 'C' ? (
          <Note tone="good">
            （合作，合作）是双方合计最高的格子（{2 * R}）。但它不稳定：只要你改成背叛，收益立刻从 {R} 升到 {T}。
            {' '}把「背叛的诱惑」调到 4 以上，看看这个格子还能不能撑住。
          </Note>
        ) : (
          <Note>
            你在利用对方的合作：你拿 {Math.max(mine, theirs)}，对方拿 {Math.min(mine, theirs)}。这种不对称只在对方「还没学会」时能维持。
            打开上面的自动对手，他会立刻改选背叛。
          </Note>
        )}
      </div>

      <div className="mt-4 border border-line bg-panel p-3.5">
        <div className="label mb-2">均衡判定</div>
        <div className="space-y-1.5 text-[12.5px] text-ink-2">
          <div className="flex justify-between">
            <span>（合作，合作）是纳什均衡</span>
            <span className={ne.CC ? 'text-[#3F6B4F]' : 'text-muted'}>{ne.CC ? '是' : '否'}</span>
          </div>
          <div className="flex justify-between">
            <span>（背叛，背叛）是纳什均衡</span>
            <span className={ne.DD ? 'text-[#3F6B4F]' : 'text-muted'}>{ne.DD ? '是' : '否'}</span>
          </div>
          <div className="flex justify-between">
            <span>是否构成标准囚徒困境</span>
            <span className={isPD ? 'text-[#3F6B4F]' : 'text-copper'}>{isPD ? '是' : '否'}</span>
          </div>
        </div>
        <p className="mt-2.5 text-[11px] leading-relaxed text-muted">
          判定方法：给定对方选合作，我选背叛是否更赚（{T} vs {R}）；给定对方选背叛，我选背叛是否更赚（{P} vs {S}）。
        </p>
      </div>
    </div>
  );
}
