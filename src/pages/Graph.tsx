import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GRAPH_NODES, GRAPH_EDGES, GRAPH_MAP, neighbors } from '../data/graph';
import { LESSON_MAP, STAGE_MAP, STAGES } from '../data/curriculum';
import { CASE_MAP } from '../data/cases';
import { Sheet } from '../components/ui';

const BANDS = [
  { y: 45, t: '01 博弈论基础' },
  { y: 235, t: '02 静态博弈' },
  { y: 445, t: '03 动态博弈' },
  { y: 665, t: '04 重复博弈与合作' },
  { y: 905, t: '05 不完全信息' },
  { y: 1135, t: '06 现实应用' },
  { y: 1400, t: '07 演化与机制设计' },
];

export default function Graph() {
  const [sel, setSel] = useState<string | null>(null);
  const [mode, setMode] = useState<'map' | 'list'>('map');
  const node = sel ? GRAPH_MAP[sel] : null;
  const { pre, next } = sel ? neighbors(sel) : { pre: [], next: [] };

  return (
    <div className="page-wrap">
      <header>
        <div className="label-copper mb-1">KNOWLEDGE MAP</div>
        <div className="flex items-end justify-between">
          <h1 className="masthead text-[24px] leading-tight text-ink">知识图谱</h1>
          <span className="num text-[11px] text-muted">{GRAPH_NODES.length} 节点 · {GRAPH_EDGES.length} 关系</span>
        </div>
        <p className="mt-2 text-[11.5px] leading-relaxed text-muted">
          概念之间的关系图。点击任意节点，查看解释、前置与后续知识、相关案例与对应课程。
        </p>
        <div className="mt-4 rule" />
      </header>

      <div className="mt-3 flex gap-2">
        <button onClick={() => setMode('map')} className={`chip flex-1 justify-center py-2 ${mode === 'map' ? 'chip-on' : ''}`}>
          图谱
        </button>
        <button onClick={() => setMode('list')} className={`chip flex-1 justify-center py-2 ${mode === 'list' ? 'chip-on' : ''}`}>
          列表
        </button>
      </div>

      {mode === 'map' ? (
        <div className="mt-4 border border-line bg-[#FCFBF7] px-2 py-3">
          <svg viewBox="0 0 360 1580" className="w-full">
            {BANDS.map((b) => (
              <g key={b.y}>
                <line x1="10" y1={b.y - 16} x2="350" y2={b.y - 16} stroke="#E9E5DA" strokeWidth="0.8" strokeDasharray="2 3" />
                <text x="10" y={b.y} fontSize="9" fill="#9A6B33" letterSpacing="1">
                  {b.t}
                </text>
              </g>
            ))}
            {GRAPH_EDGES.map(([a, b2]) => {
              const na = GRAPH_MAP[a];
              const nb = GRAPH_MAP[b2];
              if (!na || !nb) return null;
              const dist = Math.hypot(na.x - nb.x, na.y - nb.y);
              const active = sel === a || sel === b2;
              if (!active && dist > 240) return null;
              return (
                <line
                  key={`${a}-${b2}`}
                  x1={na.x}
                  y1={na.y}
                  x2={nb.x}
                  y2={nb.y}
                  stroke={active ? '#9A6B33' : '#D9D5C9'}
                  strokeWidth={active ? 1.4 : 0.8}
                />
              );
            })}
            {GRAPH_NODES.map((n) => {
              const on = sel === n.id;
              return (
                <g key={n.id} onClick={() => setSel(n.id)} style={{ cursor: 'pointer' }}>
                  <circle cx={n.x} cy={n.y} r="18" fill="transparent" />
                  <circle cx={n.x} cy={n.y} r={on ? 6.5 : 4.6} fill={on ? '#9A6B33' : '#14213D'} />
                  <circle cx={n.x} cy={n.y} r={on ? 10 : 7.5} fill="none" stroke={on ? '#C69A63' : '#E4E1D8'} strokeWidth="1" />
                  <text
                    x={n.x}
                    y={n.y + 19}
                    textAnchor="middle"
                    fontSize="10.5"
                    fill={on ? '#9A6B33' : '#26344E'}
                    fontWeight={on ? 600 : 400}
                  >
                    {n.label}
                  </text>
                </g>
              );
            })}
          </svg>
          <div className="mt-2 flex items-center justify-between border-t border-line px-2 pt-2 text-[10px] text-muted">
            <span>点击节点查看详解 · 远处连线在选择后显示</span>
            <span>{GRAPH_NODES.length} 节点 / {GRAPH_EDGES.length} 关系</span>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {STAGES.map((s) => {
            const nodes = GRAPH_NODES.filter((n) => {
              const first = n.lessons[0] ? LESSON_MAP[n.lessons[0]] : null;
              return first?.stage === s.no;
            });
            if (!nodes.length) return null;
            return (
              <section key={s.no} className="card">
                <div className="border-b border-line px-4 py-2.5">
                  <span className="num mr-2 text-[10.5px] text-copper">0{s.no}</span>
                  <span className="text-[12.5px] font-semibold text-ink">{s.title}</span>
                </div>
                <div className="divide-y divide-line">
                  {nodes.map((n) => (
                    <button key={n.id} onClick={() => setSel(n.id)} className="block w-full px-4 py-2.5 text-left hover:bg-[#FCFBF8]">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[12.5px] text-ink">{n.label}</span>
                        <span className="text-[9px] tracking-[0.08em] text-line-2">{n.en}</span>
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-[10.5px] text-muted">{n.desc}</p>
                    </button>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <Sheet
        open={!!node}
        onClose={() => setSel(null)}
        title={
          node && (
            <div>
              <div className="text-[9.5px] tracking-[0.12em] text-copper">{node.en}</div>
              <div className="mt-0.5 text-[16px] font-semibold text-ink">{node.label}</div>
            </div>
          )
        }
      >
        {node && (
          <div>
            <p className="text-[13px] leading-[1.9] text-ink-2">{node.desc}</p>

            <div className="mt-4 border-t border-line pt-3">
              <div className="label mb-2">前置知识</div>
              <div className="flex flex-wrap gap-1.5">
                {pre.length === 0 && <span className="text-[11.5px] text-muted">无（这是起点概念）</span>}
                {pre.map((id) => (
                  <button key={id} onClick={() => setSel(id)} className="chip hover:border-line-2 hover:text-ink">
                    {GRAPH_MAP[id].label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3">
              <div className="label mb-2">后续知识</div>
              <div className="flex flex-wrap gap-1.5">
                {next.length === 0 && <span className="text-[11.5px] text-muted">无（这是终点概念）</span>}
                {next.map((id) => (
                  <button key={id} onClick={() => setSel(id)} className="chip hover:border-line-2 hover:text-ink">
                    {GRAPH_MAP[id].label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 border-t border-line pt-3">
              <div className="label mb-2">对应课程</div>
              <div className="flex flex-wrap gap-1.5">
                {node.lessons.map((lid) => {
                  const l = LESSON_MAP[lid];
                  if (!l) return null;
                  return (
                    <Link key={lid} to={`/lesson/${lid}`} className="chip hover:border-line-2 hover:text-ink">
                      L{String(l.no).padStart(2, '0')} {l.title}
                    </Link>
                  );
                })}
              </div>
            </div>

            {node.cases && node.cases.length > 0 && (
              <div className="mt-3">
                <div className="label mb-2">相关案例</div>
                <div className="flex flex-wrap gap-1.5">
                  {node.cases.map((cid) => {
                    const c = CASE_MAP[cid];
                    if (!c) return null;
                    return (
                      <Link key={cid} to={`/cases/${cid}`} className="chip hover:border-line-2 hover:text-ink">
                        {c.title}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            <p className="mt-4 text-[10px] leading-relaxed text-muted">
              所属阶段：{STAGE_MAP[LESSON_MAP[node.lessons[0]]?.stage ?? 1]?.title}
            </p>
          </div>
        )}
      </Sheet>
    </div>
  );
}
