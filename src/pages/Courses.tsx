import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { STAGES, ALL_LESSONS } from '../data/curriculum';
import { useStore } from '../store/store';
import { Bar } from '../components/ui';

type Filter = 'all' | 'todo' | 'done' | 'fav';

export default function Courses() {
  const { state, stats } = useStore();
  const [filter, setFilter] = useState<Filter>('all');
  const [open, setOpen] = useState<number[]>([1]);

  const currentStage = useMemo(() => {
    const cur = ALL_LESSONS.find((l) => !state.lessons[l.id]?.done);
    return cur?.stage ?? 6;
  }, [state.lessons]);

  const toggle = (n: number) => setOpen((o) => (o.includes(n) ? o.filter((x) => x !== n) : [...o, n]));

  const match = (id: string) => {
    const p = state.lessons[id];
    if (filter === 'todo') return !p?.done;
    if (filter === 'done') return !!p?.done;
    if (filter === 'fav') return !!p?.fav;
    return true;
  };

  const pct = stats.doneCount / ALL_LESSONS.length;

  return (
    <div className="page-wrap">
      <header>
        <div className="label-copper mb-1">CURRICULUM</div>
        <div className="flex items-end justify-between">
          <h1 className="masthead text-[24px] leading-tight text-ink">课程体系</h1>
          <span className="num text-[12px] text-muted">
            {stats.doneCount}/{ALL_LESSONS.length}
          </span>
        </div>
        <div className="mt-3">
          <Bar value={pct} height={3} />
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-muted">
          {STAGES.length} 个阶段，{ALL_LESSONS.length} 节课。从「什么是博弈」到「如何设计规则」，每一课都配练习与可操作的实验。
        </p>
      </header>

      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
        {(
          [
            ['all', '全部'],
            ['todo', '未完成'],
            ['done', '已完成'],
            ['fav', '收藏'],
          ] as [Filter, string][]
        ).map(([k, label]) => (
          <button key={k} onClick={() => setFilter(k)} className={`chip shrink-0 ${filter === k ? 'chip-on' : ''}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {STAGES.map((s) => {
          const done = s.lessons.filter((l) => state.lessons[l.id]?.done).length;
          const items = s.lessons.filter((l) => match(l.id));
          const isOpen = open.includes(s.no) || filter !== 'all';
          const isCurrent = s.no === currentStage;
          if (items.length === 0 && filter !== 'all') return null;

          return (
            <section key={s.no} className="card">
              <button
                onClick={() => toggle(s.no)}
                className="flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="num text-[11px] text-copper">0{s.no}</span>
                    <span className="text-[10px] tracking-[0.12em] text-muted">{s.en}</span>
                    {isCurrent && done < s.lessons.length && (
                      <span className="border border-copper/40 px-1.5 py-[1px] text-[9px] text-copper">进行中</span>
                    )}
                    {done === s.lessons.length && <span className="text-[9.5px] text-[#3F6B4F]">已完成</span>}
                  </div>
                  <h2 className="mt-1 text-[15.5px] font-semibold leading-snug text-ink">{s.title}</h2>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted">{s.summary}</p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="num text-[11px] text-muted">
                    {done}/{s.lessons.length}
                  </div>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="#6E7C93"
                    strokeWidth="1.3"
                    className={`ml-auto mt-2 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  >
                    <path d="M2 4.5 6 8.5 10 4.5" />
                  </svg>
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-line">
                  {items.map((l) => {
                    const p = state.lessons[l.id];
                    return (
                      <Link
                        key={l.id}
                        to={`/lesson/${l.id}`}
                        className="flex items-center gap-3 border-b border-line/70 px-4 py-2.5 transition-colors last:border-0 hover:bg-[#FCFBF8]"
                      >
                        <span
                          className={`num w-6 shrink-0 text-[11px] ${
                            p?.done ? 'text-[#3F6B4F]' : p?.visits ? 'text-copper' : 'text-line-2'
                          }`}
                        >
                          {String(l.no).padStart(2, '0')}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={`block truncate text-[13px] ${p?.done ? 'text-muted' : 'text-ink'}`}>
                            {l.title}
                          </span>
                          <span className="mt-0.5 block truncate text-[10px] text-muted">{l.subtitle}</span>
                        </span>
                        {p?.fav && <span className="shrink-0 text-[10px] text-copper">★</span>}
                        <span className="num shrink-0 text-[10px] text-line-2">{l.minutes}′</span>
                        {p?.done ? (
                          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="#4C7A5E" strokeWidth="1.5">
                            <path d="M2.5 7.4 5.6 10.4 11.5 4" />
                          </svg>
                        ) : (
                          <span className="h-1 w-1 shrink-0 rounded-full bg-line-2" />
                        )}
                      </Link>
                    );
                  })}
                  {s.lab && (
                    <Link
                      to={`/lab/${s.lab}`}
                      className="flex items-center justify-between border-t border-line bg-[#FBFAF6] px-4 py-2.5 text-[11.5px] text-ink-2"
                    >
                      <span>配套实验 · {s.no === 2 ? '囚徒困境' : s.no === 3 ? '市场进入' : s.no === 4 ? '重复博弈' : s.no === 5 ? '信号传递' : '价格战'}</span>
                      <span className="text-copper">→</span>
                    </Link>
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2.5">
        <Link to="/cases" className="card card-hover tap p-3.5">
          <div className="label">CASE LIBRARY</div>
          <div className="mt-1.5 text-[13px] text-ink">案例研究</div>
          <div className="mt-1 text-[10.5px] text-muted">把现实问题转成模型</div>
        </Link>
        <Link to="/graph" className="card card-hover tap p-3.5">
          <div className="label">KNOWLEDGE MAP</div>
          <div className="mt-1.5 text-[13px] text-ink">知识图谱</div>
          <div className="mt-1 text-[10.5px] text-muted">看概念之间的关系</div>
        </Link>
      </div>
    </div>
  );
}
