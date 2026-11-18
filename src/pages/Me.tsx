import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore, dayKeyOffset, todayKey } from '../store/store';
import { ALL_LESSONS, LESSON_MAP, TOTAL_QUESTIONS } from '../data/curriculum';
import { fmtMinutes } from '../lib/date';
import { SectionHead, Ring } from '../components/ui';

export default function Me() {
  const { state, stats, exportState, importState, resetAll, setName } = useStore();
  const [msg, setMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const week = useMemo(() => {
    const arr: { k: string; label: string; sec: number }[] = [];
    const labels = ['一', '二', '三', '四', '五', '六', '日'];
    for (let i = 6; i >= 0; i--) {
      const k = dayKeyOffset(-i);
      const d = new Date(k + 'T00:00:00');
      arr.push({ k, label: labels[(d.getDay() + 6) % 7], sec: state.days[k] ?? 0 });
    }
    return arr;
  }, [state.days]);

  const maxSec = Math.max(60, ...week.map((w) => w.sec));

  const notes = Object.entries(state.notes).filter(([, t]) => t.trim().length > 0);
  const favLessons = Object.entries(state.lessons).filter(([, p]) => p.fav);
  const answered = stats.answeredCount;
  const accuracy = useMemo(() => {
    const recs = Object.values(state.quiz).filter((r) => r.attempts > 0);
    if (!recs.length) return 0;
    const total = recs.reduce((a, r) => a + r.attempts, 0);
    const wrong = recs.reduce((a, r) => a + r.wrong, 0);
    return Math.round(((total - wrong) / total) * 100);
  }, [state.quiz]);

  const doExport = () => {
    const blob = new Blob([exportState()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `game-theory-lab-${todayKey()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setMsg('已导出学习数据');
    window.setTimeout(() => setMsg(''), 2400);
  };

  const doImport = async (f: File) => {
    const text = await f.text();
    const ok = importState(text);
    setMsg(ok ? '导入成功，数据已恢复' : '导入失败：文件格式不正确');
    window.setTimeout(() => setMsg(''), 3000);
  };

  const doReset = () => {
    if (!window.confirm('确定要清空全部学习记录吗？此操作不可撤销。')) return;
    if (!window.confirm('再确认一次：进度、错题、笔记都会被删除。')) return;
    resetAll();
    setMsg('已恢复初始状态');
    window.setTimeout(() => setMsg(''), 2400);
  };

  return (
    <div className="page-wrap">
      <header>
        <div className="label-copper mb-1">PROFILE</div>
        <div className="flex items-end justify-between">
          <h1 className="masthead text-[24px] leading-tight text-ink">我的</h1>
          <span className="num text-[11px] text-muted">第 {Math.ceil((stats.doneCount + 1) / 8)} 阶段进行中</span>
        </div>
        <div className="mt-3 flex items-center gap-3 border border-line bg-panel px-3.5 py-3">
          <input
            value={state.meta.name}
            onChange={(e) => setName(e.target.value)}
            placeholder="给自己起个名字（可选）"
            className="w-full bg-transparent text-[13.5px] text-ink outline-none placeholder:text-line-2"
          />
          <span className="shrink-0 text-[10px] text-muted">本机保存</span>
        </div>
      </header>

      {/* 统计 */}
      <section className="mt-6">
        <SectionHead index="01" title="学习统计" />
        <div className="card flex items-center gap-5 p-4">
          <Ring value={stats.doneCount / ALL_LESSONS.length} label={`${stats.doneCount}`} sub="已完成课" size={80} />
          <div className="grid flex-1 grid-cols-2 gap-y-3.5">
            <div>
              <div className="num text-[15px] leading-none text-ink">{stats.streak} 天</div>
              <div className="mt-1 text-[10px] text-muted">当前连续（最长 {stats.bestStreak}）</div>
            </div>
            <div>
              <div className="num text-[15px] leading-none text-ink">{fmtMinutes(stats.totalSeconds)}</div>
              <div className="mt-1 text-[10px] text-muted">累计学习</div>
            </div>
            <div>
              <div className="num text-[15px] leading-none text-ink">
                {answered}
                <span className="text-[10px] text-muted"> / {TOTAL_QUESTIONS}</span>
              </div>
              <div className="mt-1 text-[10px] text-muted">已作答题目</div>
            </div>
            <div>
              <div className="num text-[15px] leading-none text-ink">{accuracy}%</div>
              <div className="mt-1 text-[10px] text-muted">练习正确率</div>
            </div>
          </div>
        </div>
      </section>

      {/* 近七日 */}
      <section className="mt-6">
        <SectionHead index="02" title="近七日" right={<span className="text-[10px] text-muted">今日 {fmtMinutes(stats.todaySeconds)}</span>} />
        <div className="card px-4 py-4">
          <div className="flex h-24 items-end justify-between gap-2">
            {week.map((w) => {
              const h = Math.max(2, (w.sec / maxSec) * 100);
              const isToday = w.k === todayKey();
              return (
                <div key={w.k} className="flex flex-1 flex-col items-center gap-1.5">
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className={`w-full transition-all ${isToday ? 'bg-copper' : w.sec > 0 ? 'bg-navy' : 'bg-[#E9E5DA]'}`}
                      style={{ height: `${h}%` }}
                    />
                  </div>
                  <span className={`text-[9.5px] ${isToday ? 'text-copper' : 'text-muted'}`}>{w.label}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-2 border-t border-line pt-2 text-[10px] text-muted">
            单日累计超过 1 分钟计为「学习日」；连续天数据此计算。
          </div>
        </div>
      </section>

      {/* 笔记 */}
      <section className="mt-6">
        <SectionHead index="03" title="学习笔记" right={<span className="text-[10px] text-muted">{notes.length} 条</span>} />
        {notes.length === 0 ? (
          <div className="border border-dashed border-line px-4 py-8 text-center text-[11.5px] text-muted">
            还没有笔记。在课程页底部展开「学习笔记」即可记录。
          </div>
        ) : (
          <div className="card divide-y divide-line">
            {notes.map(([lid, t]) => {
              const l = LESSON_MAP[lid];
              if (!l) return null;
              return (
                <Link key={lid} to={`/lesson/${lid}`} className="block px-4 py-3 transition-colors hover:bg-[#FCFBF8]">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[12.5px] font-medium text-ink">
                      L{String(l.no).padStart(2, '0')} · {l.title}
                    </span>
                    <span className="text-[9.5px] text-muted">{t.length} 字</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[11.5px] leading-relaxed text-muted">{t}</p>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* 收藏 */}
      <section className="mt-6">
        <SectionHead index="04" title="收藏的课程" right={<span className="text-[10px] text-muted">{favLessons.length} 课</span>} />
        {favLessons.length === 0 ? (
          <div className="border border-dashed border-line px-4 py-8 text-center text-[11.5px] text-muted">
            在课程页右上角点亮星标，即可收藏重点课程。
          </div>
        ) : (
          <div className="card divide-y divide-line">
            {favLessons.map(([lid]) => {
              const l = LESSON_MAP[lid];
              if (!l) return null;
              return (
                <Link key={lid} to={`/lesson/${lid}`} className="flex items-center justify-between px-4 py-2.5 hover:bg-[#FCFBF8]">
                  <span className="text-[12.5px] text-ink">
                    L{String(l.no).padStart(2, '0')} · {l.title}
                  </span>
                  <span className="text-[10px] text-copper">★</span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* 数据 */}
      <section className="mt-6">
        <SectionHead index="05" title="数据管理" sub="所有记录保存在本机浏览器（localStorage）。" />
        <div className="card divide-y divide-line">
          <button onClick={doExport} className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-[#FCFBF8]">
            <span className="text-[12.5px] text-ink">导出学习数据</span>
            <span className="text-[10px] text-muted">JSON</span>
          </button>
          <button onClick={() => fileRef.current?.click()} className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-[#FCFBF8]">
            <span className="text-[12.5px] text-ink">导入学习数据</span>
            <span className="text-[10px] text-muted">从备份恢复</span>
          </button>
          <button onClick={doReset} className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-[#FCFBF8]">
            <span className="text-[12.5px] text-copper">清空全部记录</span>
            <span className="text-[10px] text-muted">不可撤销</span>
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) doImport(f);
            e.target.value = '';
          }}
        />
        {msg && <p className="mt-2 text-[11.5px] text-copper">{msg}</p>}
        <p className="mt-2 text-[10px] leading-relaxed text-muted">
          数据结构带有版本号与导出信封（app / exportedAt / data），便于后续接入云端同步。
        </p>
      </section>

      {/* 更多 */}
      <section className="mt-6">
        <SectionHead index="06" title="更多" />
        <div className="grid grid-cols-2 gap-2.5">
          <Link to="/cases" className="card card-hover p-3.5">
            <div className="text-[12.5px] text-ink">案例研究</div>
            <div className="mt-1 text-[10.5px] text-muted">11 个现实案例</div>
          </Link>
          <Link to="/graph" className="card card-hover p-3.5">
            <div className="text-[12.5px] text-ink">知识图谱</div>
            <div className="mt-1 text-[10.5px] text-muted">29 个概念节点</div>
          </Link>
        </div>
      </section>

      {/* 关于 */}
      <section className="mt-6 border-t border-line pt-4">
        <div className="label mb-2">关于本课程</div>
        <p className="text-[10.5px] leading-[1.85] text-muted">
          本课程的知识框架参考张维迎《博弈与社会》《博弈论与信息经济学》的问题意识与章节脉络，
          全部讲解、例题、数值与习题为自主编排，不引用原书原文、页码或具体表述。
          教材对应关系标注在每节课末尾，供延伸阅读时对照。
          课程中的数学推导均可在页面内复核；实验数值由前端实时计算。
        </p>
        <p className="mt-2 text-[10px] text-line-2">
          共 {ALL_LESSONS.length} 课 · {TOTAL_QUESTIONS} 道练习 · 6 个实验 · 移动端优先
        </p>
      </section>
    </div>
  );
}
